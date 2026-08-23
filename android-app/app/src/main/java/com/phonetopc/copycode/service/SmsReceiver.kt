package com.phonetopc.copycode.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.phonetopc.copycode.data.CodeExtractor
import com.phonetopc.copycode.data.CodeSender
import com.phonetopc.copycode.data.Settings

/**
 * 短信接收广播（备用通道）。
 * 仅当用户授予 RECEIVE_SMS 权限时生效；App 不会成为默认短信应用。
 */
class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val settings = Settings.get()
        if (!settings.autoSend || !settings.isValid()) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        val sender = messages.firstOrNull()?.originatingAddress ?: ""
        val body = messages.joinToString("") { it.messageBody ?: "" }
        if (body.isBlank()) return

        val code = CodeExtractor.extract(body, settings.customRegex) ?: return

        val result = goAsync()
        Thread {
            CodeSender.send(
                host = settings.pcHost,
                port = settings.pcPort,
                token = settings.token,
                code = code,
                app = "短信",
                source = sender,
            )
            result.finish()
        }.start()
    }
}
