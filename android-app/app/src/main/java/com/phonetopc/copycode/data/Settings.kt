package com.phonetopc.copycode.data

import android.content.Context
import android.content.SharedPreferences

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

    fun isValid(): Boolean = pcHost.isNotBlank()

    companion object {
        private const val PREFS = "p2p_settings"
        private const val KEY_HOST = "pc_host"
        private const val KEY_PORT = "pc_port"
        private const val KEY_TOKEN = "token"
        private const val KEY_AUTO_SEND = "auto_send"
        private const val KEY_REGEX = "code_regex"
        private const val KEY_TEST_MODE = "test_mode"
        const val DEFAULT_PORT = 9841

        @Volatile
        private var instance: Settings? = null

        fun init(context: Context): Settings =
            instance ?: synchronized(this) {
                instance ?: Settings(context.applicationContext).also { instance = it }
            }

        fun get(): Settings = checkNotNull(instance) { "Settings.init() 尚未调用" }
    }
}
