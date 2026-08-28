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

    /** 仅转发系统短信验证码（不转发微信/QQ 等应用通知） */
    var onlySmsApps: Boolean
        get() = sp.getBoolean(KEY_SMS_ONLY, true)
        set(v) = sp.edit().putBoolean(KEY_SMS_ONLY, v).apply()

    /** 开机自启：系统启动完成后自动恢复转发 */
    var bootAutoStart: Boolean
        get() = sp.getBoolean(KEY_BOOT_AUTO_START, false)
        set(v) = sp.edit().putBoolean(KEY_BOOT_AUTO_START, v).apply()
    /** 断线缓存：发送失败时先缓存到本地，恢复连接后自动补发 */
    var cacheOffline: Boolean
        get() = sp.getBoolean(KEY_CACHE_OFFLINE, true)
        set(v) = sp.edit().putBoolean(KEY_CACHE_OFFLINE, v).apply()

    /** 公网加密中继：手机与 PC 不在同一局域网时，经中继转发验证码 */
    var relayEnabled: Boolean
        get() = sp.getBoolean(KEY_RELAY_ENABLED, false)
        set(v) = sp.edit().putBoolean(KEY_RELAY_ENABLED, v).apply()

    /** 中继服务器地址，如 https://relay.example.com */
    var relayUrl: String
        get() = sp.getString(KEY_RELAY_URL, "") ?: ""
        set(v) = sp.edit().putString(KEY_RELAY_URL, v.trim()).apply()

    /** 房间名（两端一致） */
    var relayRoom: String
        get() = sp.getString(KEY_RELAY_ROOM, "") ?: ""
        set(v) = sp.edit().putString(KEY_RELAY_ROOM, v.trim()).apply()

    /** 中继密钥（两端一致；仅发送其 SHA-256 给中继） */
    var relayToken: String
        get() = sp.getString(KEY_RELAY_TOKEN, "") ?: ""
        set(v) = sp.edit().putString(KEY_RELAY_TOKEN, v.trim()).apply()

    /** 端到端加密密钥（可选）：与 PC 端填写相同后，局域网消息 AES-256-GCM 端到端加密 */
    var e2eKey: String
        get() = sp.getString(KEY_E2E_KEY, "") ?: ""
        set(v) = sp.edit().putString(KEY_E2E_KEY, v.trim()).apply()

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

    /** 多 PC 推送：同时推送至所有已配置的 PC 接收端 */
    var pushToAll: Boolean
        get() = sp.getBoolean(KEY_PUSH_ALL, true)
        set(v) = sp.edit().putBoolean(KEY_PUSH_ALL, v).apply()

    /** 常驻通知/锁屏卡片：把最新验证码显示在常驻服务通知上（功能 7，默认开启） */
    var noticeLatest: Boolean
        get() = sp.getBoolean(KEY_NOTICE_LATEST, true)
        set(v) = sp.edit().putBoolean(KEY_NOTICE_LATEST, v).apply()

    /** 主题模式：system | dark | light（功能 13，默认跟随系统） */
    var themeMode: String
        get() = sp.getString(KEY_THEME_MODE, "system") ?: "system"
        set(v) = sp.edit().putString(KEY_THEME_MODE, if (v in setOf("system", "dark", "light")) v else "system").apply()

    /** 局域网设备白名单开关（功能 16，默认关闭；手机端是主导） */
    var whitelistEnabled: Boolean
        get() = sp.getBoolean(KEY_WHITELIST_ENABLED, false)
        set(v) = sp.edit().putBoolean(KEY_WHITELIST_ENABLED, v).apply()

    /** 白名单内容：PC 配置名或地址，逗号/换行分隔；开启后只向这些 PC 推送 */
    var whitelistDevices: String
        get() = sp.getString(KEY_WHITELIST_DEVICES, "") ?: ""
        set(v) = sp.edit().putString(KEY_WHITELIST_DEVICES, v).apply()


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

    fun isValid(): Boolean = pcConfigs().any { it.host.isNotBlank() }

    companion object {
        private const val PREFS = "p2p_settings"
        private const val KEY_HOST = "pc_host"
        private const val KEY_PORT = "pc_port"
        private const val KEY_TOKEN = "token"
        private const val KEY_AUTO_SEND = "auto_send"
        private const val KEY_SMS_ONLY = "sms_only"
        private const val KEY_BOOT_AUTO_START = "boot_auto_start"
        private const val KEY_CACHE_OFFLINE = "cache_offline"
        private const val KEY_RELAY_ENABLED = "relay_enabled"
        private const val KEY_RELAY_URL = "relay_url"
        private const val KEY_RELAY_ROOM = "relay_room"
        private const val KEY_RELAY_TOKEN = "relay_token"
        private const val KEY_E2E_KEY = "e2e_key"
        private const val KEY_REGEX = "code_regex"
        private const val KEY_TEST_MODE = "test_mode"
        private const val KEY_CONFIGS = "pc_configs"
        private const val KEY_ACTIVE = "pc_active"
        private const val KEY_PUSH_ALL = "push_all"
        private const val KEY_NOTICE_LATEST = "notice_latest"
        private const val KEY_THEME_MODE = "theme_mode"
        private const val KEY_WHITELIST_ENABLED = "whitelist_enabled"
        private const val KEY_WHITELIST_DEVICES = "whitelist_devices"
        const val DEFAULT_PORT = 9841
        private const val KEY_FLOAT_BUBBLE = "float_bubble"
        private const val KEY_BUBBLE_SECONDS = "bubble_seconds"

        @Volatile
        private var instance: Settings? = null

        fun init(context: Context): Settings =
            instance ?: synchronized(this) {
                instance ?: Settings(context.applicationContext).also { instance = it }
            }

        fun get(): Settings = checkNotNull(instance) { "Settings.init() 尚未调用" }
    }
}
