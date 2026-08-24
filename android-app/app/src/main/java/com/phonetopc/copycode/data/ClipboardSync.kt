package com.phonetopc.copycode.data

import org.json.JSONObject
import java.io.IOException
import java.net.URL
import javax.net.ssl.HttpsURLConnection

/**
 * 反向剪贴板：轮询 PC 端 /api/clipboard，把 PC 剪贴板内容同步到手机。
 * 协议：GET https://<host>:<port>/api/clipboard?rev=<lastRev>（TLS 自签证书固定）
 */
object ClipboardSyncer {

    data class PollResult(val ok: Boolean, val rev: Long, val text: String)

    fun poll(host: String, port: Int, token: String, lastRev: Long): PollResult {
        if (host.isBlank()) return PollResult(false, lastRev, "")
        return try {
            val url = URL("https://$host:$port/api/clipboard?rev=$lastRev")
            val conn = url.openConnection() as HttpsURLConnection
            try {
                conn.requestMethod = "GET"
                conn.connectTimeout = 4000
                conn.readTimeout = 4000
                conn.sslSocketFactory = Tls.sslContext().socketFactory
                conn.hostnameVerifier = Tls.hostnameVerifier
                if (token.isNotBlank()) conn.setRequestProperty("X-P2P-Token", token)
                val status = conn.responseCode
                if (status in 200..299) {
                    val body = conn.inputStream.bufferedReader().use { it.readText() }
                    val obj = try { JSONObject(body) } catch (_: Exception) { null }
                    if (obj != null && obj.optBoolean("ok", false)) {
                        PollResult(true, obj.optLong("rev", lastRev), obj.optString("text", ""))
                    } else {
                        PollResult(false, lastRev, "")
                    }
                } else {
                    PollResult(false, lastRev, "")
                }
            } finally {
                conn.disconnect()
            }
        } catch (_: IOException) {
            PollResult(false, lastRev, "")
        } catch (_: Exception) {
            PollResult(false, lastRev, "")
        }
    }
}
