package com.phonetopc.copycode.data

/**
 * 从短信文本中提取验证码。
 * 优先使用用户自定义正则；否则按常见中文短信句式匹配；
 * 独立数字串仅当短信中出现验证码上下文关键词时才会被采用，
 * 且会排除 10086 等运营商服务号码，避免把余额/推广短信误当验证码。
 * 多个候选时取最后（最新）一个，保证只推送最新找到的验证码。
 */
object CodeExtractor {

    private val CONTEXT_PATTERNS = listOf(
        Regex("""(?:验证码|校验码|动态码|安全码|确认码|code|Code|验证密码|动态密码)[^\d]{0,6}(\d{4,8})"""),
        Regex("""(\d{4,8})[^\d]{0,6}(?:是|为)(?:你|您|你的|您的)?(?:本次)?(?:登录|注册|验证)?验证码"""),
        Regex("""(\d{4,8})[^\d]{0,4}(?:valid|code|Code)"""),
        Regex("""\[?(\d{4,8})\]?[^\d]{0,4}(?:为|是)(?:你|您)?的验证码"""),
    )

    private val STANDALONE = Regex("""(?<![\d.])(\d{4,8})(?![\d.])""")

    /** 独立数字串可被当作验证码时，短信中必须出现的关键词 */
    private val GATE_KEYWORDS = listOf(
        "验证码", "校验码", "动态码", "动态密码", "安全码", "确认码", "一次性",
        "登录码", "注册码", "短信验证", "验证密码", "验证", "授权码", "密码",
        "otp", "verification", "verify", "code", "密码为", "密码是",
    )

    /** 常见运营商/银行服务号码：即使出现在正文也不会被当作验证码 */
    private val SERVICE_NUMBERS = setOf(
        "10086", "10010", "10000", "10001",
        "95588", "95555", "95533", "95595", "95599", "95566", "95568", "95559",
    )

    /**
     * @param text        短信全文（标题 + 正文）
     * @param customRegex 用户自定义正则，空串则忽略
     * @return 提取到的验证码，未找到返回 null
     */
    fun extract(text: String, customRegex: String? = null): String? {
        if (text.isBlank()) return null

        // 1) 自定义正则（用户显式指定，直接信任）
        val custom = customRegex?.trim()
        if (!custom.isNullOrEmpty()) {
            runCatching { Regex(custom) }
                .getOrNull()
                ?.let { re -> re.find(text)?.value?.trim() }
                ?.takeIf { it.isNotEmpty() }
                ?.let { return it }
        }

        // 2) 上下文句式匹配：收集全部候选，取正文中最后出现（最新）的一个；
        //    短信应用常把多条短信合并进一条通知，取最后一个可避免把旧验证码一并推送
        val contextCandidates = ArrayList<Pair<Int, String>>()
        for (pattern in CONTEXT_PATTERNS) {
            for (m in pattern.findAll(text)) {
                val v = m.groupValues.getOrNull(1) ?: continue
                if (v.length in 4..8 && v !in SERVICE_NUMBERS) {
                    contextCandidates.add(m.range.first to v)
                }
            }
        }
        if (contextCandidates.isNotEmpty()) {
            return contextCandidates.maxByOrNull { it.first }?.second
        }

        // 3) 关键词门控回退：只有短信中出现验证码上下文关键词时，
        //    才允许把独立数字串当作验证码（避免把 10086 等余额/通知数字误识别）
        if (!GATE_KEYWORDS.any { text.contains(it, ignoreCase = true) }) return null
        val standalone = STANDALONE.findAll(text)
            .map { it.groupValues[1] }
            .filter { it !in SERVICE_NUMBERS }
            .toList()
        return standalone.lastOrNull { it.length == 6 }
            ?: standalone.lastOrNull()
    }

    /** 是否为运营商/银行服务短号发件人（10086/10010/10000/106 通道等） */
    fun isServiceSender(sender: String?): Boolean {
        val s = (sender ?: "").trim()
        if (s.isEmpty()) return false
        if (s in SERVICE_NUMBERS) return true
        if (s.length in 10..14 && s.all { it.isDigit() } && s.startsWith("106")) return true
        if (s.length == 5 && s.all { it.isDigit() } && (s.startsWith("95") || s.startsWith("96"))) return true
        return false
    }
}
