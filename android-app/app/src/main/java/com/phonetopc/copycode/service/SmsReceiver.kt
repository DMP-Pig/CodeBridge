package com.phonetopc.copycode.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.phonetopc.copycode.data.CodeClassifier
import com.phonetopc.copycode.data.CodeExtractor
import com.phonetopc.copycode.data.CodeSender
import com.phonetopc.copycode.data.CodeValidity
import com.phonetopc.copycode.data.Settings
import com.phonetopc.copycode.data.Tls
import com.phonetopc.copycode.R
import com.phonetopc.copycode.widget.CodeWidgetProvider

/**
 * 短信接收广播（备用通道）。
 * 仅当用户授予 RECEIVE_SMS 权限时生效；App 不会成为默认短信应用。
 */
class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        Tls.init(context)
        CodeSender.init(context)
        val settings = try {
            Settings.get()
        } catch (_: IllegalStateException) {
            Settings.init(context)
        }
        if (!settings.autoSend || !settings.isValid()) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        val sender = messages.firstOrNull()?.originatingAddress ?: ""
        val body = messages.joinToString("") { it.messageBody ?: "" }
        if (body.isBlank()) return

        // 运营商/银行服务短号（10086 等）不作为验证码来源
        if (CodeExtractor.isServiceSender(sender)) return

        val code = CodeExtractor.extract(body, settings.customRegex) ?: return
        CodeBubble.show(context, code, context.getString(R.string.app_sms))
        CodeWidgetProvider.notifyNewCode(context, code, context.getString(R.string.app_sms))

        // 有效期与类型识别：随 /api/code 一并上报给 PC 端
        val expireSeconds = CodeValidity.parseExpireSeconds(body)
        val codeType = CodeClassifier.classify(body)

        val result = goAsync()
        Thread {
            CodeSender.sendToAll(
                code = code,
                app = context.getString(R.string.app_sms),
                source = sender,
                expireSeconds = expireSeconds,
                codeType = codeType,
            )
            result.finish()
        }.start()
    }
}