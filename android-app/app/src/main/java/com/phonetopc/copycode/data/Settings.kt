package com.phonetopc.copycode.data

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * 一条已保存的 PC 接收端配置。
 */
data class PcConfig(
    val name: String,
    val host: String,
    val port: Int,
    val token: String,
)


/**
 * 应用设置（SharedPreferences 持久化）。
 */
class Settings private constructor(context: Context) {

    private val sp: SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** PC 端局域网地址（IP 或主机名） */
    var pcHost: String
        get() = sp.getString(KEY_HOST, "") ?: ""
        set(v) = sp.edit().putString(KEY_HOST, v.trim()).apply()

    /** PC 端监听端口 */
    var pcPort: Int
        get() = sp.getInt(KEY_PORT, DEFAULT_PORT)
        set(v) = sp.edit().putInt(KEY_PORT, v.coerceIn(1, 65535)).apply()

    /** 访问令牌（与 PC 端一致，可留空） */
    var token: String
        get() = sp.getString(KEY_TOKEN, "") ?: ""
        set(v) = sp.edit().putString(KEY_TOKEN, v.trim()).apply()

    /** 收到验证码后自动转发 */
    var autoSend: Boolean
        get() = sp.getBoolean(KEY_AUTO_SEND, true)
        set(v) = sp.edit().putBoolean(KEY_AUTO_SEND, v).apply()

    /** 自定义验证码正则（留空使用内置规则） */
    var customRegex: String
        get() = sp.getString(KEY_REGEX, "") ?: ""
        set(v) = sp.edit().putString(KEY_REGEX, v.trim()).apply()

    /** 测试模式：不实际发送，仅本地校验 */
    var testMode: Boolean
        get() = sp.getBoolean(KEY_TEST_MODE, false)
        set(v) = sp.edit().putBoolean(KEY_TEST_MODE, v).apply()

    /** Floating bubble: show code in an overlay on the phone screen */
    var floatBubble: Boolean
        get() = sp.getBoolean(KEY_FLOAT_BUBBLE, true)
        set(v) = sp.edit().putBoolean(KEY_FLOAT_BUBBLE, v).apply()

    /** Bubble display duration in seconds */
    var bubbleSeconds: Int
        get() = sp.getInt(KEY_BUBBLE_SECONDS, 15)
        set(v) = sp.edit().putInt(KEY_BUBBLE_SECONDS, v.coerceIn(5, 120)).apply()

    /** Reverse clipboard: pull PC clipboard to phone */
    var clipboardSync: Boolean
        get() = sp.getBoolean(KEY_CLIPBOARD_SYNC, false)
        set(v) = sp.edit().putBoolean(KEY_CLIPBOARD_SYNC, v).apply()

    // ---------------- 多 PC 配置 ----------------

    /** 已保存的 PC 配置列表（首次使用时会用旧字段迁移出 1 条） */
    fun pcConfigs(): List<PcConfig> {
        val arr = configsArray()
        val list = ArrayList<PcConfig>(arr.length())
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            list.add(
                PcConfig(
                    name = o.optString("name", ""),
                    host = o.optString("host", ""),
                    port = o.optInt("port", DEFAULT_PORT),
                    token = o.optString("token", ""),
                )
            )
        }
        if (list.isNotEmpty()) return list
        val seed = if (pcHost.isBlank()) {
            listOf(PcConfig("PC 1", "", DEFAULT_PORT, ""))
        } else {
            listOf(PcConfig("PC 1", pcHost, pcPort, token))
        }
        saveConfigs(seed, 0)
        return seed
    }

    /** 当前激活的配置下标 */
    fun activeIndex(): Int = sp.getInt(KEY_ACTIVE, 0).coerceIn(0, maxOf(0, pcConfigs().lastIndex))

    /** 整表保存配置并激活指定下标，同时把激活项同步到当前连接字段 */
    fun saveConfigs(configs: List<PcConfig>, active: Int) {
        val safe = configs.ifEmpty { listOf(PcConfig("PC 1", "", DEFAULT_PORT, "")) }
        val idx = active.coerceIn(0, safe.lastIndex)
        writeConfigs(safe)
        sp.edit().putInt(KEY_ACTIVE, idx).apply()
        val c = safe[idx]
        sp.edit()
            .putString(KEY_HOST, c.host)
            .putInt(KEY_PORT, c.port)
            .putString(KEY_TOKEN, c.token)
            .apply()
    }

    /** 追加一条新配置并切换过去 */
    fun addConfig(config: PcConfig) {
        val list = pcConfigs().toMutableList()
        list.add(config)
        saveConfigs(list, list.lastIndex)
    }

    /** 删除当前激活配置；至少保留一条，返回是否删除成功 */
    fun removeActiveConfig(): Boolean {
        val list = pcConfigs().toMutableList()
        if (list.size <= 1) return false
        val idx = activeIndex()
        list.removeAt(idx)
        saveConfigs(list, (idx - 1).coerceAtLeast(0))
        return true
    }

    /** 切换到指定配置，并把该配置写入当前连接字段 */
    fun switchTo(index: Int) {
        val list = pcConfigs()
        if (index !in list.indices) return
        val c = list[index]
        sp.edit()
            .putInt(KEY_ACTIVE, index)
            .putString(KEY_HOST, c.host)
            .putInt(KEY_PORT, c.port)
            .putString(KEY_TOKEN, c.token)
            .apply()
    }

    /** 更新当前激活配置的连接信息（同步 flat 字段与配置列表） */
    fun applyActive(host: String, port: Int, token: String) {
        val h = host.trim()
        val t = token.trim()
        val edit = sp.edit()
            .putString(KEY_HOST, h)
            .putInt(KEY_PORT, port)
            .putString(KEY_TOKEN, t)
        val arr = configsArray()
        if (arr.length() > 0) {
            val idx = sp.getInt(KEY_ACTIVE, 0).coerceIn(0, arr.length() - 1)
            val o = arr.optJSONObject(idx)
            if (o != null) {
                o.put("host", h)
                o.put("port", port)
                o.put("token", t)
            }
            edit.putString(KEY_CONFIGS, arr.toString())
        }
        edit.apply()
    }

    private fun configsArray(): JSONArray {
        val raw = sp.getString(KEY_CONFIGS, "") ?: ""
        return try {
            JSONArray(raw)
        } catch (_: Exception) {
            JSONArray()
        }
    }

    private fun writeConfigs(configs: List<PcConfig>) {
        val arr = JSONArray()
        configs.forEach { c ->
            arr.put(
                JSONObject()
                    .put("name", c.name)
                    .put("host", c.host)
                    .put("port", c.port)
                    .put("token", c.token)
            )
        }
        sp.edit().putString(KEY_CONFIGS, arr.toString()).apply()
    }

    fun isValid(): Boolean = pcHost.isNotBlank()

    companion object {
        private const val PREFS = "p2p_settings"
        private const val KEY_HOST = "pc_host"
        private const val KEY_PORT = "pc_port"
        private const val KEY_TOKEN = "token"
        private const val KEY_AUTO_SEND = "auto_send"
        private const val KEY_REGEX = "code_regex"
        private const val KEY_TEST_MODE = "test_mode"
        private const val KEY_CONFIGS = "pc_configs"
        private const val KEY_ACTIVE = "pc_active"
        const val DEFAULT_PORT = 9841
        private const val KEY_FLOAT_BUBBLE = "float_bubble"
        private const val KEY_BUBBLE_SECONDS = "bubble_seconds"
        private const val KEY_CLIPBOARD_SYNC = "clipboard_sync"

        @Volatile
        private var instance: Settings? = null

        fun init(context: Context): Settings =
            instance ?: synchronized(this) {
                instance ?: Settings(context.applicationContext).also { instance = it }
            }

        fun get(): Settings = checkNotNull(instance) { "Settings.init() 尚未调用" }
    }
}
