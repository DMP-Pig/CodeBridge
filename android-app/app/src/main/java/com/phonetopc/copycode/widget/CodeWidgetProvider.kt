package com.phonetopc.copycode.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ClipData
import android.content.ClipboardManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.Toast
import com.phonetopc.copycode.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Desktop widget: shows the latest verification code extracted by the app.
 * Tap the widget or the copy button to copy the code to the clipboard.
 */
class CodeWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        updateAll(context, copied = false)
    }

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            ACTION_COPY -> {
                val code = prefs(context).getString(KEY_CODE, "") ?: ""
                if (code.isNotBlank()) {
                    try {
                        val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        cm.setPrimaryClip(ClipData.newPlainText("CodeBridge", code))
                        Toast.makeText(context, context.getString(R.string.widget_toast_copied, code), Toast.LENGTH_SHORT).show()
                    } catch (_: Exception) {
                    }
                }
                updateAll(context, copied = true)
                Thread {
                    try { Thread.sleep(2200) } catch (_: InterruptedException) { }
                    updateAll(context, copied = false)
                }.start()
            }
            ACTION_REFRESH -> updateAll(context, copied = false)
            else -> super.onReceive(context, intent)
        }
    }

    private fun updateAll(context: Context, copied: Boolean) {
        try {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val provider = ComponentName(context, CodeWidgetProvider::class.java)
            appWidgetManager.updateAppWidget(provider, buildViews(context, copied))
        } catch (_: Exception) {
        }
    }

    private fun buildViews(context: Context, copied: Boolean): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_code)
        val p = prefs(context)
        val code = p.getString(KEY_CODE, "") ?: ""
        val app = p.getString(KEY_APP, "") ?: ""
        val time = p.getLong(KEY_TIME, 0L)
        views.setTextViewText(R.id.tv_widget_time, fmtTime(time))
        if (code.isBlank()) {
            views.setTextViewText(R.id.tv_widget_code, context.getString(R.string.widget_waiting))
            views.setTextColor(R.id.tv_widget_code, 0xFF8FA3BF.toInt())
            views.setTextViewText(R.id.tv_widget_meta, context.getString(R.string.widget_meta_empty))
        } else {
            views.setTextViewText(R.id.tv_widget_code, code)
            views.setTextColor(R.id.tv_widget_code, 0xFFFFFFFF.toInt())
            val meta = if (app.isBlank()) context.getString(R.string.app_sms) else app
            views.setTextViewText(R.id.tv_widget_meta, meta + " \u00b7 " + fmtTime(time))
        }
        views.setTextViewText(R.id.tv_widget_copy, if (copied) context.getString(R.string.widget_copied) else context.getString(R.string.copy))
        views.setOnClickPendingIntent(R.id.tv_widget_copy, pendingBroadcast(context, ACTION_COPY, 1001))
        views.setOnClickPendingIntent(R.id.widget_root, pendingBroadcast(context, ACTION_COPY, 1002))
        return views
    }

    private fun pendingBroadcast(context: Context, action: String, requestCode: Int): PendingIntent {
        val intent = Intent(context, CodeWidgetProvider::class.java).setAction(action)
        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun fmtTime(ms: Long): String = try {
        if (ms <= 0) "" else SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(ms))
    } catch (_: Exception) { "" }

    companion object {
        private const val ACTION_COPY = "com.phonetopc.copycode.widget.ACTION_COPY"
        private const val ACTION_REFRESH = "com.phonetopc.copycode.widget.ACTION_REFRESH"
        private const val PREFS = "p2p_widget"
        private const val KEY_CODE = "latest_code"
        private const val KEY_APP = "latest_app"
        private const val KEY_TIME = "latest_time"

        private fun prefs(context: Context) =
            context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

        /** Called when a new code is extracted: saves it and refreshes all widgets. */
        fun notifyNewCode(context: Context, code: String, app: String) {
            val p = prefs(context)
            p.edit()
                .putString(KEY_CODE, code)
                .putString(KEY_APP, app)
                .putLong(KEY_TIME, System.currentTimeMillis())
                .apply()
            val refresh = Intent(context, CodeWidgetProvider::class.java).setAction(ACTION_REFRESH)
            context.sendBroadcast(refresh)
        }
    }
}
