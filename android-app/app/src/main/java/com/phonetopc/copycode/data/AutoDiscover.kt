package com.phonetopc.copycode.data

import java.util.Collections
import org.json.JSONObject
import java.net.Inet4Address
import java.net.NetworkInterface
import java.net.URL
import javax.net.ssl.HttpsURLConnection
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/** 找到的一台 PC */
data class FoundPc(
    val ip: String,
    val id: String,
    val hostname: String,
    /** 临时授权码（功能 17）：PC 端生成、30 秒内有效；为空表示当前没有激活的授权码 */
    val pairCode: String = "",
    /** 配对时返回的访问令牌 */
    val pairToken: String = "",
    /** 配对时返回的服务端口（0 表示使用搜索端口） */
    val pairPort: Int = 0,
) {
    /** 是否为 USB/ADB 反向转发通道（127.0.0.1） */
    val isUsb: Boolean get() = ip == "127.0.0.1"
}

/**
 * 自动搜索局域网内的 CodeBridge PC 端。
 * 命中条件：目标 https://<ip>:<port>/health 返回 JSON 且 name == "CodeBridge"（TLS 证书固定）。
 * 同一台 PC（相同 device id）只保留一条记录，优先显示局域网地址（非 127.0.0.1）。
 */
object AutoDiscover {

    private const val TIMEOUT_MS = 800
    private const val MAX_THREADS = 24
    private const val WAIT_SECONDS = 20L

    /**
     * 同步扫描（需在 IO 线程调用），返回所有命中的 PC（按 device id 去重）。
     * 顺序：局域网 PC 在前，USB 通道（127.0.0.1）在后。
     */
    fun discoverAll(port: Int): List<FoundPc> {
        val candidates = buildCandidates()
        if (candidates.isEmpty()) return emptyList()
        val byId = Collections.synchronizedMap(mutableMapOf<String, FoundPc>())
        val pool = Executors.newFixedThreadPool(MAX_THREADS)
        val pend = CountDownLatch(candidates.size)
        for (ip in candidates) {
            pool.execute {
                try {
                    val pc = healthCheck(ip, port) ?: return@execute
                    synchronized(byId) {
                        val exist = byId[pc.id]
                        if (exist == null) {
                            byId[pc.id] = pc
                        } else if (exist.isUsb && !pc.isUsb) {
                            // 同一台 PC 同时通过 USB 与局域网发现时，优先局域网
                            byId[pc.id] = pc
                        }
                    }
                } finally {
                    pend.countDown()
                }
            }
        }
        pool.shutdown()
        try {
            pend.await(WAIT_SECONDS, TimeUnit.SECONDS)
        } catch (_: InterruptedException) {
            Thread.currentThread().interrupt()
        } finally {
            pool.shutdownNow()
        }
        return byId.values.sortedBy { if (it.isUsb) 1 else 0 }
    }

    private fun buildCandidates(): List<String> {
        val list = mutableListOf("127.0.0.1")
        try {
            val ifaces = NetworkInterface.getNetworkInterfaces()
            while (ifaces.hasMoreElements()) {
                val ni = ifaces.nextElement()
                if (!ni.isUp || ni.isLoopback) continue
                for (addr in ni.inetAddresses) {
                    if (addr is Inet4Address && !addr.isLoopbackAddress) {
                        val host = addr.hostAddress ?: continue
                        val prefix = host.substringBeforeLast('.')
                        if (prefix.contains('.')) {
                            for (i in 1..254) list.add("$prefix.$i")
                        }
                    }
                }
            }
        } catch (_: Exception) {
            // 忽略：拿不到网段时仅保留 127.0.0.1
        }
        return list.distinct().filter { it.isNotBlank() }
    }

    private fun healthCheck(ip: String, port: Int): FoundPc? {
        return try {
            val url = URL("https://$ip:$port/health")
            val conn = url.openConnection() as HttpsURLConnection
            try {
                conn.connectTimeout = TIMEOUT_MS
                conn.readTimeout = TIMEOUT_MS
                conn.requestMethod = "GET"
                conn.sslSocketFactory = Tls.sslContext().socketFactory
                conn.hostnameVerifier = Tls.hostnameVerifier
                if (conn.responseCode == 200) {
                    val body = conn.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(body)
                    if (json.optString("name") == "CodeBridge") {
                        FoundPc(
                            ip = ip,
                            id = json.optString("id").ifBlank { "ip:$ip" },
                            hostname = json.optString("hostname").ifBlank { "" },
                            pairCode = json.optString("pairCode", ""),
                            pairToken = json.optString("pairToken", ""),
                            pairPort = json.optInt("pairPort", 0),
                        )
                    } else null
                } else null
            } finally {
                conn.disconnect()
            }
        } catch (_: Exception) {
            null
        }
    }
}
