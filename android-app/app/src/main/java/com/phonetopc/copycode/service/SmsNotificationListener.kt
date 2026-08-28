package com.phonetopc.copycode.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.phonetopc.copycode.data.CodeClassifier
import com.phonetopc.copycode.data.CodeExtractor
import com.phonetopc.copycode.data.CodeSender
import com.phonetopc.copycode.data.CodeValidity
import com.phonetopc.copycode.data.Settings
import com.phonetopc.copycode.data.Tls
import com.phonetopc.copycode.R
import com.phonetopc.copycode.widget.CodeWidgetProvider
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

/**
 * 通知监听服务：读取短信类通知（验证码），提取验证码并转发到 PC。
 * 无需成为默认短信应用；需用户在系统设置中开启「通知使用权」。
 *
 * 只推送最新验证码：同一发件人的同一验证码在 60 秒窗口内只推一次（通知重发/旧通知
 * 未划走时不会重复推送）；通知包含多条短信时取最后（最新）一条验证码。
 */
class SmsNotificationListener : NotificationListenerService() {

    /** 去重记录：key = 包名|发件人，value = 最近一次推送的验证码与时间 */
    private data class LastSend(val code: String, val at: Long)

    private val lastSent = ConcurrentHashMap<String, LastSend>()
    private val handler = Handler(Looper.getMainLooper())
    private val heartbeatStarted = AtomicBoolean(false)
    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            try {
                val s = Settings.get()
                if (s.autoSend && s.isValid() && !s.testMode) {
                    CodeSender.init(applicationContext)
                    Thread {
                        val hb = CodeSender.heartbeat(s.pcHost, s.pcPort, s.token)
                        if (hb.ok) {
                            // 心跳成功 = 已连上 PC，补发断线期间缓存的验证码
                            CodeSender.flushCache(s.pcHost, s.pcPort, s.token)
                        }
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
                    channelId, getString(R.string.channel_listener_name),
                    NotificationManager.IMPORTANCE_LOW,
                ).apply { description = getString(R.string.channel_listener_desc) }
                getSystemService(NotificationManager::class.java).createNotificationChannel(chan)
            }
            val notif = buildForegroundNotification(null, "")
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(1001, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
            } else {
                startForeground(1001, notif)
            }
        } catch (_: Exception) {
            // 前台通知失败不影响通知监听本身
        }
    }

    private fun buildForegroundNotification(code: String?, source: String): Notification {
        val channelId = "codebridge_listener"
        val showCode = code != null && code.isNotBlank()
        return Notification.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentTitle(getString(R.string.notif_listener_title))
            .setContentText(
                if (showCode) getString(R.string.notif_listener_latest, code, source)
                else getString(R.string.notif_listener_text)
            )
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_SERVICE)
            .build()
    }

    /** 常驻通知/锁屏卡片：把最新验证码显示在常驻通知上（功能 7，可在设置中关闭） */
    private fun updateForeground(code: String, source: String) {
        try {
            val s = Settings.get()
            if (!s.noticeLatest) return
            val nm = getSystemService(NotificationManager::class.java)
            nm.notify(1001, buildForegroundNotification(code, source))
        } catch (_: Exception) {
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

        // 默认仅处理系统短信验证码，减少误报；关闭「仅短信验证码」后才处理应用通知
        if (!looksLikeSms(title, text, bigText, sbn.packageName, settings.onlySmsApps)) return

        val source = title.ifBlank { sbn.packageName }

        // 运营商/银行服务短号（10086/10010/10000/106 通道等）不作为验证码来源
        if (CodeExtractor.isServiceSender(source)) return

        val code = CodeExtractor.extract(full, settings.customRegex) ?: return

        // 去重：同一 包名+发件人+验证码 在 60 秒窗口内只推一次；
        // 旧短信通知未划走被系统/短信应用重发时，不会再次推送
        val key = "${sbn.packageName}|$source"
        val now = System.currentTimeMillis()
        val prev = lastSent[key]
        if (prev != null && prev.code == code && now - prev.at < DEDUP_WINDOW_MS) return
        lastSent[key] = LastSend(code, now)
        pruneLastSent(now)

        // 常驻通知/锁屏卡片：显示最新验证码（可在设置中关闭）
        updateForeground(code, source)

        // Floating bubble: show the code on the phone screen (tap to copy)
        CodeBubble.show(applicationContext, code, friendlyAppName(sbn.packageName))
        CodeWidgetProvider.notifyNewCode(applicationContext, code, friendlyAppName(sbn.packageName))

        val expireSeconds = CodeValidity.parseExpireSeconds(full)
        val codeType = CodeClassifier.classify(full)
        Thread {
            val result = CodeSender.sendToAll(
                code = code,
                app = friendlyAppName(sbn.packageName),
                source = source,
                expireSeconds = expireSeconds,
                codeType = codeType,
            )
            if (!result.ok) {
                // 失败后清除去重，允许重试
                lastSent.remove(key)
            }
        }.start()
    }

    private fun pruneLastSent(now: Long) {
        if (lastSent.size <= 300) return
        val it = lastSent.entries.iterator()
        while (it.hasNext()) {
            if (now - it.next().value.at > DEDUP_WINDOW_MS) it.remove()
        }
    }

    private fun looksLikeSms(title: String?, text: String?, bigText: String?, pkg: String, smsOnly: Boolean): Boolean {
        // 仅转发系统短信：先按短信应用包名匹配
        if (pkg in SMS_PACKAGES) return true
        // 默认不再转发微信/QQ 等应用通知；只有关闭「仅短信验证码」后才按关键词匹配应用通知
        if (smsOnly) return false
        val joined = "$title $text $bigText"
        val keywords = listOf("验证码", "校验码", "动态码", "安全码", "确认码", "登录码", "短信", "SMSCode", "verification", "code")
        return keywords.any { joined.contains(it, ignoreCase = true) }
    }

    private fun friendlyAppName(pkg: String): String = when (pkg) {
        "com.android.mms", "com.google.android.apps.messaging", "com.android.messaging" -> getString(R.string.app_sms)
        "com.tencent.mm" -> getString(R.string.app_wechat)
        "com.tencent.mobileqq" -> getString(R.string.app_qq)
        "com.alibaba.android.rimet" -> getString(R.string.app_dingtalk)
        "com.ss.android.lark" -> getString(R.string.app_lark)
        else -> pkg.substringAfterLast('.').ifBlank { pkg }
    }

    companion object {
        private const val HEARTBEAT_MS = 30_000L
        private const val DEDUP_WINDOW_MS = 60_000L
        private val SMS_PACKAGES = setOf(
            "com.android.mms",                       // AOSP / MIUI / ColorOS / OriginOS
            "com.android.messaging",                 // AOSP 旧版 / LineageOS
            "com.google.android.apps.messaging",     // Google Messages
            "com.samsung.android.messaging",         // Samsung Messages
            "com.huawei.mms",                        // 华为信息
            "com.hihonor.mms",                       // 荣耀信息
            "com.oneplus.mms",                       // OnePlus 信息
        )
    }
}