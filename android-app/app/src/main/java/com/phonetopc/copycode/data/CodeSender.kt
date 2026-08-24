package com.phonetopc.copycode.data

import org.json.JSONObject
import java.io.IOException
import java.net.URL
import javax.net.ssl.HttpsURLConnection

/**
 * 通过局域网把验证码发送到 PC 端。
 * 协议：POST https://<host>:<port>/api/code（TLS 自签证书固定，Token 加密传输）
 * Body:  { "code": "...", "app": "...", "source": "...", "token": "..." }
 */
object CodeSender {

    data class SendResult(val ok: Boolean, val message: String)

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

                val body = JSONObject()
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
}
