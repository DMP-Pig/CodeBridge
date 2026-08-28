package com.phonetopc.copycode.ui.theme

import androidx.compose.ui.graphics.Color

/** 颜色色板：液态玻璃深色 / 浅色两套主题（功能 13） */
data class Palette(
    val background: Color,       // 页面主背景（渐变起点）
    val bgA: Color,              // 背景渐变第 2 色
    val bgB: Color,              // 背景渐变第 3 色
    val card: Color,             // 玻璃卡片
    val cardStrong: Color,       // 玻璃卡片（渐变起点，更实）
    val border: Color,           // 玻璃描边
    val highlight: Color,        // 高亮
    val accent: Color,
    val accentDeep: Color,
    val ok: Color,
    val warn: Color,
    val danger: Color,
    val textPrimary: Color,
    val textDim: Color,
    val textFaint: Color,
    val dialog: Color,           // 对话框底色
)

// 液态玻璃深色主题色板
val DarkPalette = Palette(
    background = Color(0xFF0B1020),
    bgA = Color(0xFF0D1326),
    bgB = Color(0xFF0A0E1C),
    card = Color(0x14FFFFFF),
    cardStrong = Color(0x1FFFFFFF),
    border = Color(0x29FFFFFF),
    highlight = Color(0x33FFFFFF),
    accent = Color(0xFF6EA8FF),
    accentDeep = Color(0xFF5A78FF),
    ok = Color(0xFF5EE6A0),
    warn = Color(0xFFFFB86B),
    danger = Color(0xFFFF7A85),
    textPrimary = Color(0xFFF2F5FB),
    textDim = Color(0x9EF2F5FB),
    textFaint = Color(0x66F2F5FB),
    dialog = Color(0xFF16203A),
)

// 液态玻璃浅色主题色板
val LightPalette = Palette(
    background = Color(0xFFE8EDF6),
    bgA = Color(0xFFF2F5FB),
    bgB = Color(0xFFE3E9F3),
    card = Color(0xA6FFFFFF),
    cardStrong = Color(0xE6FFFFFF),
    border = Color(0x3D8CA3C7),
    highlight = Color(0x66FFFFFF),
    accent = Color(0xFF3B6FFF),
    accentDeep = Color(0xFF4A56E8),
    ok = Color(0xFF17A05B),
    warn = Color(0xFFD97706),
    danger = Color(0xFFE5484D),
    textPrimary = Color(0xFF18202F),
    textDim = Color(0xCC18202F),
    textFaint = Color(0x8A18202F),
    dialog = Color(0xFFF4F6FC),
)

/** 当前生效的主题色板：由 MainScreen 根据设置（system/dark/light）切换 */
object ThemePalette {
    @Volatile
    var current: Palette = DarkPalette
}

// ---- 兼容旧引用：顶层取值始终读取当前主题色板 ----
val GlassBackground: Color get() = ThemePalette.current.background
val GlassCard: Color get() = ThemePalette.current.card
val GlassCardStrong: Color get() = ThemePalette.current.cardStrong
val GlassBorder: Color get() = ThemePalette.current.border
val GlassHighlight: Color get() = ThemePalette.current.highlight
val Accent: Color get() = ThemePalette.current.accent
val AccentDeep: Color get() = ThemePalette.current.accentDeep
val Ok: Color get() = ThemePalette.current.ok
val Warn: Color get() = ThemePalette.current.warn
val Danger: Color get() = ThemePalette.current.danger
val TextPrimary: Color get() = ThemePalette.current.textPrimary
val TextDim: Color get() = ThemePalette.current.textDim
val TextFaint: Color get() = ThemePalette.current.textFaint
val DialogBg: Color get() = ThemePalette.current.dialog