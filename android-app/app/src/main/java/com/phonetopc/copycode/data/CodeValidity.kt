package com.phonetopc.copycode.data

import java.util.Calendar

/**
 * 从短信文本中识别验证码有效期（如「5分钟内有效」「30秒有效」「有效期至 23:59」）。
 * 返回剩余有效秒数；无法识别时返回 0（表示未知，由 PC 端使用默认有效期）。
 */
object CodeValidity {

    fun parseExpireSeconds(text: String): Int {
        if (text.isBlank()) return 0

        // 中文：N 分钟(内)有效 / N 分有效
        Regex("""(\d+)\s*(?:分钟|分)\s*(?:以?内)?\s*有效""").find(text)?.let {
            val n = it.groupValues[1].toIntOrNull() ?: return@let
            if (n > 0) return (n * 60).coerceAtMost(24 * 3600)
        }
        // 中文：N 秒(内)有效
        Regex("""(\d+)\s*秒\s*(?:以?内)?\s*有效""").find(text)?.let {
            val n = it.groupValues[1].toIntOrNull() ?: return@let
            if (n > 0) return n.coerceAtMost(24 * 3600)
        }
        // 中文：有效期至/到/为 HH:mm（按今天计算，若已过按明天）
        Regex("""有效期(?:至|到|为)\s*(\d{1,2})[:：](\d{2})""").find(text)?.let {
            val hh = it.groupValues[1].toIntOrNull() ?: return@let
            val mm = it.groupValues[2].toIntOrNull() ?: return@let
            if (hh in 0..23 && mm in 0..59) {
                val cal = Calendar.getInstance()
                cal.set(Calendar.HOUR_OF_DAY, hh)
                cal.set(Calendar.MINUTE, mm)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                var diff = (cal.timeInMillis - System.currentTimeMillis()) / 1000
                if (diff <= 0) {
                    cal.add(Calendar.DAY_OF_YEAR, 1)
                    diff = (cal.timeInMillis - System.currentTimeMillis()) / 1000
                }
                return diff.toInt().coerceAtMost(24 * 3600)
            }
        }
        // 中文：请在/请于 N 分钟内输入/完成
        Regex("""(?:请[于在]|请)\s*(\d+)\s*分钟\s*内""").find(text)?.let {
            val n = it.groupValues[1].toIntOrNull() ?: return@let
            if (n > 0) return (n * 60).coerceAtMost(24 * 3600)
        }
        // English: valid for / expires in N minutes/seconds/hours
        Regex("""(?:valid\s+for|expires?\s+in)\s+(\d+)\s*(minute|min|second|sec|hour)s?""", RegexOption.IGNORE_CASE)
            .find(text)?.let {
                val n = it.groupValues[1].toIntOrNull() ?: return@let
                val unit = it.groupValues[2].lowercase()
                if (n > 0) {
                    return when {
                        unit.startsWith("hour") -> (n * 3600).coerceAtMost(24 * 3600)
                        unit.startsWith("min") -> (n * 60).coerceAtMost(24 * 3600)
                        else -> n.coerceAtMost(24 * 3600)
                    }
                }
            }
        return 0
    }
}