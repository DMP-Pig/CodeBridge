package com.phonetopc.copycode.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.phonetopc.copycode.data.CodeExtractor
import com.phonetopc.copycode.data.CodeSender
import com.phonetopc.copycode.data.Settings
import com.phonetopc.copycode.data.Tls
import java.util.Collections
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

/**
 * 通知监听服务：读取短信类通知（验证码），提取验证码并转发到 PC。
 * 无需成为默认短信应用；需用户在系统设置中开启「通知使用权」。
 */
class SmsNotificationListener : NotificationListenerService() {

    private val recent = Collections.newSetFromMap(ConcurrentHashMap<String, Boolean>())
    private val handler = Handler(Looper.getMainLooper())
    private val heartbeatStarted = AtomicBoolean(false)
    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            try {
                val s = Settings.get()
                if (s.autoSend && s.isValid() && !s.testMode) {
                    CodeSender.init(applicationContext)
                    Thread {
                        CodeSender.heartbeat(s.pcHost, s.pcPort, s.token)
                    }.start()
                }
            } catch (_: Exception) {
                // 心跳失败不影响下轮
            }
            handler.postDelayed(this, HEARTBEAT_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        // 服务可能单独启动（未经过 MainActivity），必须先初始化设置
        Settings.init(applicationContext)
        Tls.init(applicationContext)
        CodeSender.init(applicationContext)
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        startAsForeground()
        startHeartbeat()
    }

    /** 前台服务：App 主界面关闭后仍在后台存活，防止进程被系统回收 */
    private fun startAsForeground() {
        try {
            val channelId = "codebridge_listener"
            if (Build.VERSION.SDK_INT >= 26) {
                val chan = NotificationChannel(
                    channelId, "验证码桥接监听",
                    NotificationManager.IMPORTANCE_LOW,
                ).apply { description = "在后台监听短信验证码并转发到 PC" }
                getSystemService(NotificationManager::class.java).createNotificationChannel(chan)
            }
            val notif = Notification.Builder(this, channelId)
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setContentTitle("CodeBridge 正在后台运行")
                .setContentText("收到短信验证码将自动转发到 PC")
                .setOngoing(true)
                .setCategory(Notification.CATEGORY_SERVICE)
                .build()
            startForeground(1001, notif)
        } catch (_: Exception) {
            // 前台通知失败不影响通知监听本身
        }
    }

    private fun startHeartbeat() {
        if (heartbeatStarted.compareAndSet(false, true)) {
            handler.post(heartbeatRunnable)
        }
    }

    override fun onDestroy() {
        handler.removeCallbacks(heartbeatRunnable)
        super.onDestroy()
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)
        // 跳过自己的前台服务通知，避免自触发处理
        if (sbn.packageName == packageName) return
        val settings = try {
            Settings.get()
        } catch (_: IllegalStateException) {
            Settings.init(applicationContext)
        }
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

        // Floating bubble: show the code on the phone screen (tap to copy)
        CodeBubble.show(applicationContext, code, friendlyAppName(sbn.packageName))

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
        private const val HEARTBEAT_MS = 30_000L
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

