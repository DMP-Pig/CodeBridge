package com.phonetopc.copycode.data

import android.content.Context
import android.os.Build
import org.json.JSONObject
import java.io.IOException
import java.net.URL
import javax.net.ssl.HttpsURLConnection

/**
 * 通过局域网把验证码发送到 PC 端，并定期上报心跳让 PC 显示设备在线状态。
 * 协议：POST https://<host>:<port>/api/code 、/api/heartbeat（TLS 自签证书固定，Token 加密传输）
 * Body:  { "code": "...", "app": "...", "source": "...", "token": "...", "deviceId": "...", "name": "...", "platform": "android", "hostname": "..." }
 */
object CodeSender {

    data class SendResult(val ok: Boolean, val message: String)

    @Volatile
    private var deviceId: String = ""
    @Volatile
    private var deviceName: String = ""
    @Volatile
    private var hostname: String = ""
    private val lock = Any()

    /** 初始化设备身份（稳定唯一标识，避免重复显示同一台手机） */
    fun init(context: Context) {
        if (deviceId.isNotBlank() && deviceName.isNotBlank()) return
        synchronized(lock) {
            if (deviceId.isNotBlank()) return
            try {
                val appCtx = context.applicationContext
                val sp = appCtx.getSharedPreferences("p2p_device", Context.MODE_PRIVATE)
                deviceId = sp.getString("device_id", "") ?: ""
                if (deviceId.isBlank()) {
                    val aid = android.provider.Settings.Secure.getString(
                        appCtx.contentResolver,
                        android.provider.Settings.Secure.ANDROID_ID,
                    )
                    deviceId = (aid ?: (Build.MODEL + "-" + System.currentTimeMillis()))
                    sp.edit().putString("device_id", deviceId).apply()
                }
            } catch (_: Exception) {
                deviceId = (Build.MODEL + "-" + System.currentTimeMillis())
            }
            val maker = Build.MANUFACTURER
            deviceName = buildString {
                if (!maker.isNullOrBlank() && maker != "unknown" && maker != Build.UNKNOWN) {
                    append(maker).append(' ')
                }
                append(Build.MODEL)
            }.trim().ifBlank { "Android" }
            hostname = Build.MODEL
        }
    }

    private fun deviceMeta(): JSONObject =
        JSONObject()
            .put("deviceId", deviceId)
            .put("name", deviceName)
            .put("platform", "android")
            .put("hostname", hostname)

    fun send(
        host: String,
        port: Int,
        token: String,
        code: String,
        app: String,
        source: String,
    ): SendResult {
        if (host.isBlank()) return SendResult(false, "未配置 PC 地址")
        if (code.isBlank()) return SendResult(false, "验证码为空")

        return try {
            val url = URL("https://$host:$port/api/code")
            val conn = url.openConnection() as HttpsURLConnection
            try {
                conn.requestMethod = "POST"
                conn.connectTimeout = 5000
                conn.readTimeout = 5000
                conn.doOutput = true
                conn.sslSocketFactory = Tls.sslContext().socketFactory
                conn.hostnameVerifier = Tls.hostnameVerifier
                conn.setRequestProperty("Content-Type", "application/json")
                if (token.isNotBlank()) conn.setRequestProperty("X-P2P-Token", token)

                val body = deviceMeta()
                    .put("code", code)
                    .put("app", app)
                    .put("source", source)
                    .put("token", token)
                    .toString()
                conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }

                val status = conn.responseCode
                if (status in 200..299) {
                    SendResult(true, "已发送 (HTTP $status)")
                } else {
                    val err = conn.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                    SendResult(false, "PC 返回 HTTP $status：${err.take(120)}")
                }
            } finally {
                conn.disconnect()
            }
        } catch (e: IOException) {
            SendResult(false, "连接失败：${e.message ?: e.javaClass.simpleName}")
        } catch (e: Exception) {
            SendResult(false, "异常：${e.message ?: e.javaClass.simpleName}")
        }
    }

    /** 轻量心跳：周期上报，PC 端用于判断设备在线/离线 */
    fun heartbeat(
        host: String,
        port: Int,
        token: String,
    ): SendResult {
        if (host.isBlank()) return SendResult(false, "未配置 PC 地址")
        return try {
            val url = URL("https://$host:$port/api/heartbeat")
            val conn = url.openConnection() as HttpsURLConnection
            try {
                conn.requestMethod = "POST"
                conn.connectTimeout = 5000
                conn.readTimeout = 5000
                conn.doOutput = true
                conn.sslSocketFactory = Tls.sslContext().socketFactory
                conn.hostnameVerifier = Tls.hostnameVerifier
                conn.setRequestProperty("Content-Type", "application/json")
                if (token.isNotBlank()) conn.setRequestProperty("X-P2P-Token", token)

                val body = deviceMeta().put("token", token).toString()
                conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }

                val status = conn.responseCode
                if (status in 200..299) {
                    SendResult(true, "心跳 OK")
                } else {
                    SendResult(false, "PC 返回 HTTP $status")
                }
            } finally {
                conn.disconnect()
            }
        } catch (e: IOException) {
            SendResult(false, "连接失败：${e.message ?: e.javaClass.simpleName}")
        } catch (e: Exception) {
            SendResult(false, "异常：${e.message ?: e.javaClass.simpleName}")
        }
    }
}
