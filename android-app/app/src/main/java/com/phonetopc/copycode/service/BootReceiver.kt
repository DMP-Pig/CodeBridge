package com.phonetopc.copycode.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.service.notification.NotificationListenerService
import com.phonetopc.copycode.data.CodeSender
import com.phonetopc.copycode.data.Settings
import com.phonetopc.copycode.R
import com.phonetopc.copycode.data.Tls

/**
 * 开机自启：系统启动完成后自动恢复转发。
 * 需要 RECEIVE_BOOT_COMPLETED 权限；仅在用户开启「开机自启」、已配置 PC 且开启自动转发时生效。
 * 通过 requestRebind 请系统重新绑定通知监听服务（用户已授予通知使用权时）。
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_LOCKED_BOOT_COMPLETED &&
            action != "android.intent.action.QUICKBOOT_POWERON"
        ) return
        try {
            val appCtx = context.applicationContext
            Settings.init(appCtx)
            Tls.init(appCtx)
            CodeSender.init(appCtx)
            val s = Settings.get()
            if (!s.bootAutoStart || !s.autoSend || !s.isValid()) return
            // 请求系统重新绑定通知监听服务（公开 API：NotificationListenerService.requestRebind）
            try {
                NotificationListenerService.requestRebind(
                    ComponentName(appCtx, SmsNotificationListener::class.java)
                )
            } catch (_: Exception) {
            }
            notifyBootStarted(appCtx)
        } catch (_: Exception) {
            // 开机阶段初始化失败不阻塞系统
        }
    }

    private fun notifyBootStarted(context: Context) {
        try {
            val channelId = "codebridge_boot"
            if (Build.VERSION.SDK_INT >= 26) {
                val chan = NotificationChannel(
                    channelId, context.getString(R.string.channel_boot_name),
                    NotificationManager.IMPORTANCE_LOW,
                ).apply { description = context.getString(R.string.channel_boot_desc) }
                context.getSystemService(NotificationManager::class.java).createNotificationChannel(chan)
            }
            val notif = Notification.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setContentTitle(context.getString(R.string.notif_boot_title))
                .setContentText(context.getString(R.string.notif_boot_text))
                .setAutoCancel(true)
                .build()
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.notify(1002, notif)
        } catch (_: Exception) {
        }
    }
}