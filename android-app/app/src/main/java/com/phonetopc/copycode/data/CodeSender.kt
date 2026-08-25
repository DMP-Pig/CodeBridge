package com.phonetopc.copycode.data

import android.content.Context
import com.phonetopc.copycode.R
import android.os.Build
import android.util.Base64
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
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
    @Volatile
    private var appContext: Context? = null
    private val lock = Any()
    // ---------------- 断线缓存补发 ----------------
    private const val CACHE_PREFS = "p2p_cache"
    private const val CACHE_KEY = "pending"
    private const val CACHE_MAX = 50
    private const val CACHE_TTL_MS = 24L * 60 * 60 * 1000


    /** 文案资源：优先按系统语言取字符串（未初始化时回退中文文案） */
    private fun str(resId: Int, vararg args: Any?): String {
        val c = appContext
        return if (c != null) c.getString(resId, *args)
        else String.format(java.util.Locale.CHINA, FALLBACK[resId] ?: "", *args)
    }

    private val FALLBACK: Map<Int, String> = mapOf(
        R.string.send_no_host to "未配置 PC 地址",
        R.string.send_no_code to "验证码为空",
        R.string.send_ok to "已发送 (HTTP %1\$d)",
        R.string.send_http_err to "PC 返回 HTTP %1\$d：%2\$s",
        R.string.send_conn_fail to "连接失败：%1\$s",
        R.string.send_exception to "异常：%1\$s",
        R.string.heartbeat_ok to "心跳 OK",
        R.string.send_http_err_short to "PC 返回 HTTP %1\$d",
    )

    /** 初始化设备身份（稳定唯一标识，避免重复显示同一台手机） */
    fun init(context: Context) {
        if (appContext == null) appContext = context.applicationContext
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
        expireSeconds: Int = 0,
        codeType: String = "",
        originalTime: Long = 0,
        cacheSent: Boolean = false,
    ): SendResult {
        if (code.isBlank()) return SendResult(false, str(R.string.send_no_code))

        // 公网加密中继优先：配置齐全时走中继，无需局域网
        try {
            val s = Settings.get()
            if (s.relayEnabled && s.relayUrl.isNotBlank() && s.relayRoom.isNotBlank() && s.relayToken.isNotBlank()) {
                return sendViaRelay(s, code, app, source, expireSeconds, codeType, originalTime)
            }
        } catch (_: Exception) {
        }

        if (host.isBlank()) return SendResult(false, str(R.string.send_no_host))

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

                val inner = deviceMeta()
                    .put("code", code)
                    .put("app", app)
                    .put("source", source)
                    .put("expireSeconds", expireSeconds)
                    .put("codeType", codeType)
                    .put("originalTime", originalTime)
                    .put("cacheSent", cacheSent)
                val bodyText: String
                val e2e = try { Settings.get().e2eKey.trim() } catch (_: Exception) { "" }
                if (e2e.isNotEmpty()) {
                    // 端到端加密：把消息平文加密后放入 payload，token 保留在外层
                    bodyText = JSONObject()
                        .put("token", token)
                        .put("e2e", true)
                        .put("payload", encryptPayload(inner.toString(), sha256("codebridge:e2e:" + e2e)))
                        .toString()
                } else {
                    bodyText = inner.put("token", token).toString()
                }
                conn.outputStream.use { it.write(bodyText.toByteArray(Charsets.UTF_8)) }

                val status = conn.responseCode
                if (status in 200..299) {
                    SendResult(true, str(R.string.send_ok, status))
                } else {
                    val err = conn.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                    // 服务端 5xx 可重试，入缓存等待补发
                    if (status >= 500 && !cacheSent) maybeEnqueue(code, app, source, expireSeconds, codeType)
                    SendResult(false, str(R.string.send_http_err, status, err.take(120)))
                }
            } finally {
                conn.disconnect()
            }
        } catch (e: IOException) {
            // 连接失败/超时：入缓存，恢复连接后自动补发
            if (!cacheSent) maybeEnqueue(code, app, source, expireSeconds, codeType)
            SendResult(false, str(R.string.send_conn_fail, e.message ?: e.javaClass.simpleName))
        } catch (e: Exception) {
            if (!cacheSent) maybeEnqueue(code, app, source, expireSeconds, codeType)
            SendResult(false, str(R.string.send_exception, e.message ?: e.javaClass.simpleName))
        }
    }

    /**
     * 多 PC 推送：遍历所有已配置的 PC 接收端并发送。
     * 公网中继优先；未启用多 PC 时仅发送当前激活配置。
     */
    fun sendToAll(
        code: String,
        app: String,
        source: String,
        expireSeconds: Int = 0,
        codeType: String = "",
        originalTime: Long = 0,
        cacheSent: Boolean = false,
    ): SendResult {
        if (code.isBlank()) return SendResult(false, str(R.string.send_no_code))
        try {
            val s = Settings.get()
            // 公网加密中继优先：配置齐全时走中继，无需局域网
            if (s.relayEnabled && s.relayUrl.isNotBlank() && s.relayRoom.isNotBlank() && s.relayToken.isNotBlank()) {
                return sendViaRelay(s, code, app, source, expireSeconds, codeType, originalTime)
            }
            if (!s.pushToAll) {
                val active = s.pcConfigs().getOrNull(s.activeIndex())
                if (active == null || active.host.isBlank()) return SendResult(false, str(R.string.send_no_host))
                return send(active.host, active.port, active.token, code, app, source, expireSeconds, codeType, originalTime, cacheSent)
            }
            val targets = s.pcConfigs().filter { it.host.isNotBlank() }
            if (targets.isEmpty()) return SendResult(false, str(R.string.send_no_host))
            var okCount = 0
            var firstErr = ""
            val seen = HashSet<String>()
            for (t in targets) {
                val key = t.host + ":" + t.port
                if (!seen.add(key)) continue
                val r = send(t.host, t.port, t.token, code, app, source, expireSeconds, codeType, originalTime, cacheSent)
                if (r.ok) okCount++ else if (firstErr.isBlank()) firstErr = r.message
            }
            return when {
                okCount == targets.size -> SendResult(true, str(R.string.send_all_ok, okCount))
                okCount > 0 -> SendResult(true, str(R.string.send_all_partial, okCount, targets.size))
                else -> SendResult(false, if (firstErr.isBlank()) str(R.string.send_no_host) else str(R.string.send_all_fail, firstErr))
            }
        } catch (e: Exception) {
            return SendResult(false, str(R.string.send_exception, e.message ?: e.javaClass.simpleName))
        }
    }

    /** 轻量心跳：周期上报，PC 端用于判断设备在线/离线 */
    fun heartbeat(
        host: String,
        port: Int,
        token: String,
    ): SendResult {
        if (host.isBlank()) return SendResult(false, str(R.string.send_no_host))
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
                    SendResult(true, str(R.string.heartbeat_ok))
                } else {
                    SendResult(false, str(R.string.send_http_err_short, status))
                }
            } finally {
                conn.disconnect()
            }
        } catch (e: IOException) {
            SendResult(false, str(R.string.send_conn_fail, e.message ?: e.javaClass.simpleName))
        } catch (e: Exception) {
            SendResult(false, str(R.string.send_exception, e.message ?: e.javaClass.simpleName))
        }
    }
    // ---------------- 断线缓存补发 ----------------

    /** 待补发数量（可用于 UI 提示） */
    fun pendingCount(): Int {
        return try {
            cacheList().length()
        } catch (_: Exception) {
            0
        }
    }

    /** 发送失败时写入缓存队列（按 code+app+source 去重，TTL 24h，最多 50 条） */
    private fun maybeEnqueue(code: String, app: String, source: String, expireSeconds: Int, codeType: String) {
        try {
            if (code.isBlank()) return
            val s = Settings.get()
            if (!s.cacheOffline) return
            val o = JSONObject()
                .put("code", code)
                .put("app", app)
                .put("source", source)
                .put("expireSeconds", expireSeconds)
                .put("codeType", codeType)
                .put("originalTime", System.currentTimeMillis())
            enqueue(o)
        } catch (_: Exception) {
        }
    }

    private fun cacheList(): JSONArray {
        val c = appContext ?: return JSONArray()
        return try {
            val raw = c.getSharedPreferences(CACHE_PREFS, Context.MODE_PRIVATE)
                .getString(CACHE_KEY, "") ?: ""
            val parsed = JSONArray(raw)
            // 清理旧版本「发送测试码」按钮遗留的缓存（防止恢复连接后反复补发 123456 测试码）
            val filtered = JSONArray()
            for (i in 0 until parsed.length()) {
                val o = parsed.optJSONObject(i) ?: continue
                if (isTestEntry(o)) continue
                filtered.put(o)
            }
            if (filtered.length() != parsed.length()) saveCache(filtered)
            filtered
        } catch (_: Exception) {
            JSONArray()
        }
    }

    /** 判断是否为历史测试码（旧版「发送测试码」按钮产生的缓存条目） */
    private fun isTestEntry(o: JSONObject): Boolean {
        val app = o.optString("app")
        val code = o.optString("code")
        val source = o.optString("source")
        return app == "测试" || app == "Test" || (code == "123456" && source == "0000")
    }

    private fun saveCache(list: JSONArray) {
        val c = appContext ?: return
        try {
            c.getSharedPreferences(CACHE_PREFS, Context.MODE_PRIVATE)
                .edit().putString(CACHE_KEY, list.toString()).apply()
        } catch (_: Exception) {
        }
    }

    private fun enqueue(o: JSONObject) {
        try {
            val list = cacheList()
            for (i in 0 until list.length()) {
                val old = list.optJSONObject(i) ?: continue
                if (old.optString("code") == o.optString("code") &&
                    old.optString("app") == o.optString("app") &&
                    old.optString("source") == o.optString("source")
                ) return
            }
            list.put(o)
            val now = System.currentTimeMillis()
            val filtered = JSONArray()
            for (i in 0 until list.length()) {
                val item = list.optJSONObject(i) ?: continue
                val t = item.optLong("originalTime", 0)
                if (t > 0 && now - t > CACHE_TTL_MS) continue
                filtered.put(item)
                if (filtered.length() >= CACHE_MAX) break
            }
            saveCache(filtered)
        } catch (_: Exception) {
        }
    }

    /** 补发缓存队列：按顺序重试，遇失败即停止等待下次心跳；返回成功补发条数 */
    fun flushCache(host: String, port: Int, token: String): Int {
        if (host.isBlank()) return 0
        val list = cacheList()
        if (list.length() == 0) return 0
        val remain = JSONArray()
        var flushed = 0
        for (i in 0 until list.length()) {
            val o = list.optJSONObject(i) ?: continue
            val r = send(
                host = host,
                port = port,
                token = token,
                code = o.optString("code"),
                app = o.optString("app"),
                source = o.optString("source"),
                expireSeconds = o.optInt("expireSeconds", 0),
                codeType = o.optString("codeType"),
                originalTime = o.optLong("originalTime", 0),
                cacheSent = true,
            )
            if (r.ok) flushed++
            else {
                remain.put(o)
                break
            }
        }
        saveCache(remain)
        return flushed
    }

    // ---------------- 公网加密中继 ----------------

    /** 通过公网加密中继发送：AES-256-GCM 加密，密钥两端本地派生，中继无法解密 */
    private fun sendViaRelay(
        s: Settings,
        code: String,
        app: String,
        source: String,
        expireSeconds: Int,
        codeType: String,
        originalTime: Long,
    ): SendResult {
        return try {
            val base = deviceMeta()
                .put("code", code)
                .put("app", app)
                .put("source", source)
                .put("token", s.token)
                .put("expireSeconds", expireSeconds)
                .put("codeType", codeType)
                .put("originalTime", if (originalTime > 0) originalTime else System.currentTimeMillis())
            val key = sha256("codebridge:${s.relayRoom}:${s.relayToken}")
            val payload = encryptPayload(base.toString(), key)
            val body = JSONObject()
                .put("room", s.relayRoom)
                .put("tokenHash", sha256Hex(s.relayToken))
                .put("payload", payload)
                .toString()

            val url = URL(s.relayUrl + "/relay/push")
            val conn = if (url.protocol == "https") {
                val c = url.openConnection() as HttpsURLConnection
                c.sslSocketFactory = Tls.sslContext().socketFactory
                c.hostnameVerifier = Tls.hostnameVerifier
                c
            } else {
                url.openConnection() as HttpURLConnection
            }
            try {
                conn.requestMethod = "POST"
                conn.connectTimeout = 8000
                conn.readTimeout = 8000
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json")
                conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
                val status = conn.responseCode
                if (status in 200..299) {
                    SendResult(true, str(R.string.relay_sent))
                } else {
                    val err = conn.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                    SendResult(false, str(R.string.send_http_err, status, err.take(120)))
                }
            } finally {
                conn.disconnect()
            }
        } catch (e: Exception) {
            SendResult(false, str(R.string.relay_fail, e.message ?: e.javaClass.simpleName))
        }
    }

    private fun sha256(input: String): ByteArray =
        MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))

    private fun sha256Hex(input: String): String =
        sha256(input).joinToString("") { "%02x".format(it) }

    private fun encryptPayload(plain: String, key: ByteArray): JSONObject {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"))
        val all = cipher.doFinal(plain.toByteArray(Charsets.UTF_8))
        val tagLen = 16
        val ct = all.copyOfRange(0, all.size - tagLen)
        val tag = all.copyOfRange(all.size - tagLen, all.size)
        return JSONObject()
            .put("iv", Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
            .put("ct", Base64.encodeToString(ct, Base64.NO_WRAP))
            .put("tag", Base64.encodeToString(tag, Base64.NO_WRAP))
    }

}
