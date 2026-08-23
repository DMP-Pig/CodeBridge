package com.phonetopc.copycode.data

/**
 * 从短信文本中提取验证码。
 * 优先使用用户自定义正则；否则按常见中文短信句式匹配，
 * 最后回退到独立数字串。
 */
object CodeExtractor {

    private val CONTEXT_PATTERNS = listOf(
        Regex("""(?:验证码|校验码|动态码|安全码|确认码|code|Code)[^\d]{0,6}(\d{4,8})"""),
        Regex("""(\d{4,8})[^\d]{0,6}(?:是|为)(?:你|您|你的|您的)?(?:本次)?(?:登录|注册|验证)?验证码"""),
        Regex("""(\d{4,8})[^\d]{0,4}(?:valid|code|Code)"""),
        Regex("""\[?(\d{4,8})\]?[^\d]{0,4}(?:为|是)(?:你|您)?的验证码"""),
    )

    private val STANDALONE = Regex("""(?<![\d.])(\d{4,8})(?![\d.])""")

    /**
     * @param text        短信全文（标题 + 正文）
     * @param customRegex 用户自定义正则，空串则忽略
     * @return 提取到的验证码，未找到返回 null
     */
    fun extract(text: String, customRegex: String? = null): String? {
        if (text.isBlank()) return null

        // 1) 自定义正则
        val custom = customRegex?.trim()
        if (!custom.isNullOrEmpty()) {
            runCatching { Regex(custom) }
                .getOrNull()
                ?.let { re -> re.find(text)?.value?.trim() }
                ?.takeIf { it.isNotEmpty() }
                ?.let { return it }
        }

        // 2) 常见句式
        for (pattern in CONTEXT_PATTERNS) {
            pattern.find(text)?.groupValues?.get(1)?.let { return it }
        }

        // 3) 回退：独立数字串（优先 6 位，再其他长度）
        val candidates = STANDALONE.findAll(text).map { it.groupValues[1] }.toList()
        return candidates.firstOrNull { it.length == 6 }
            ?: candidates.firstOrNull { it.length in 4..8 }
    }
}
