package com.phonetopc.copycode.service

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.phonetopc.copycode.data.CodeExtractor
import com.phonetopc.copycode.data.CodeSender
import com.phonetopc.copycode.data.Settings
import java.util.Collections
import java.util.concurrent.ConcurrentHashMap

/**
 * 通知监听服务：读取短信类通知（验证码），提取验证码并转发到 PC。
 * 无需成为默认短信应用；需用户在系统设置中开启「通知使用权」。
 */
class SmsNotificationListener : NotificationListenerService() {

    private val recent = Collections.newSetFromMap(ConcurrentHashMap<String, Boolean>())

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)
        val settings = Settings.get()
        if (!settings.autoSend) return
        if (!settings.isValid()) return

        val extras = sbn.notification?.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
        val full = "$title\n$text\n$bigText"

        // 仅处理可能包含验证码的通知，减少误报
        if (!looksLikeSms(title, text, bigText, sbn.packageName)) return

        val code = CodeExtractor.extract(full, settings.customRegex) ?: return

        // 去重：相同 包名+验证码+正文 短时间内只发一次
        val dedupKey = "${sbn.packageName}|$code|${full.hashCode()}"
        if (!recent.add(dedupKey)) return
        if (recent.size > 500) recent.clear()

        val source = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: sbn.packageName
        Thread {
            val result = CodeSender.send(
                host = settings.pcHost,
                port = settings.pcPort,
                token = settings.token,
                code = code,
                app = friendlyAppName(sbn.packageName),
                source = source,
            )
            if (!result.ok) {
                // 失败后清除去重，允许重试
                recent.remove(dedupKey)
            }
        }.start()
    }

    private fun looksLikeSms(title: String?, text: String?, bigText: String?, pkg: String): Boolean {
        val joined = "$title $text $bigText"
        val keywords = listOf("验证码", "校验码", "动态码", "安全码", "确认码", "登录码", "短信", "SMSCode", "verification", "code")
        if (keywords.any { joined.contains(it, ignoreCase = true) }) return true
        return pkg in SMS_PACKAGES
    }

    private fun friendlyAppName(pkg: String): String = when (pkg) {
        "com.android.mms", "com.google.android.apps.messaging", "com.android.messaging" -> "短信"
        "com.tencent.mm" -> "微信"
        "com.tencent.mobileqq" -> "QQ"
        "com.alibaba.android.rimet" -> "钉钉"
        "com.ss.android.lark" -> "飞书"
        else -> pkg.substringAfterLast('.').ifBlank { pkg }
    }

    companion object {
        private val SMS_PACKAGES = setOf(
            "com.android.mms",
            "com.android.messaging",
            "com.google.android.apps.messaging",
            "com.tencent.mm",
            "com.tencent.mobileqq",
            "com.alibaba.android.rimet",
            "com.ss.android.lark",
            "com.whatsapp",
            "org.thoughtcrime.securesms",
        )
    }
}

