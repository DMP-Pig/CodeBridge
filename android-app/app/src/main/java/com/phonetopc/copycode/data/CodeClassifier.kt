package com.phonetopc.copycode.data

/**
 * 验证码类型识别：根据短信文本自动判断 登录/注册/支付/解封/其他。
 * 类型会随 /api/code 的 codeType 字段传给 PC，PC 端上岛卡片按类型差异化展示。
 */
object CodeClassifier {

    const val LOGIN = "login"
    const val REGISTER = "register"
    const val PAYMENT = "payment"
    const val UNLOCK = "unlock"
    const val OTHER = "other"

    fun classify(text: String): String {
        if (text.isBlank()) return OTHER
        val s = text.lowercase()
        return when {
            // 解封 / 解锁 / 解冻
            s.contains("解封") || s.contains("解锁") || s.contains("解除限制") ||
                s.contains("解冻") || s.contains("unlock") || s.contains("unfreeze") -> UNLOCK
            // 支付 / 消费 / 交易
            s.contains("支付") || s.contains("付款") || s.contains("消费") ||
                s.contains("交易") || s.contains("转账") || s.contains("退款") ||
                s.contains("订单") || s.contains("扣款") || s.contains("pay") ||
                s.contains("payment") || s.contains("purchase") || s.contains("refund") -> PAYMENT
            // 注册 / 新用户
            s.contains("注册") || s.contains("新用户") || s.contains("开通") ||
                s.contains("register") || s.contains("sign up") || s.contains("signup") -> REGISTER
            // 登录 / 安全验证
            s.contains("登录") || s.contains("登陆") || s.contains("安全验证") ||
                s.contains("身份验证") || s.contains("login") || s.contains("sign in") ||
                s.contains("signin") || s.contains("verification") -> LOGIN
            else -> OTHER
        }
    }
}