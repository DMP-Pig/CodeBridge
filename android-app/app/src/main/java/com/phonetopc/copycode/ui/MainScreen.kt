package com.phonetopc.copycode.ui

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import android.content.Intent
import android.app.Activity
import android.content.pm.PackageManager
import android.provider.Settings
import org.json.JSONObject
import android.os.Build
import android.os.PowerManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PowerSettingsNew
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Sms
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.phonetopc.copycode.data.AutoDiscover
import com.phonetopc.copycode.data.PcConfig
import com.phonetopc.copycode.data.FoundPc
import com.phonetopc.copycode.data.CodeSender
import com.phonetopc.copycode.data.Settings as AppSettings
import com.phonetopc.copycode.service.CodeBubble
import com.phonetopc.copycode.ui.theme.*
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * 主界面：液态玻璃风格 + 服务配置 + 权限状态。
 */
@Composable
fun MainScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val settings = remember { AppSettings.get() }

    // 表单状态
    var host by remember { mutableStateOf(settings.pcHost) }
    var port by remember { mutableStateOf(settings.pcPort.toString()) }
    var token by remember { mutableStateOf(settings.token) }
    var autoSend by remember { mutableStateOf(settings.autoSend) }
    var customRegex by remember { mutableStateOf(settings.customRegex) }
    var statusMsg by remember { mutableStateOf("就绪") }
    var statusOk by remember { mutableStateOf(true) }
    var foundHosts by remember { mutableStateOf<List<FoundPc>?>(null) }
    var lastSearchPort by remember { mutableStateOf(AppSettings.DEFAULT_PORT) }
    var configs by remember { mutableStateOf(settings.pcConfigs()) }
    var activeIdx by remember { mutableStateOf(settings.activeIndex()) }

    var listenerEnabled by remember { mutableStateOf(isNotificationAccessEnabled(context)) }
    var smsGranted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECEIVE_SMS) ==
                PackageManager.PERMISSION_GRANTED
        )
    }
    var batteryWhitelisted by remember { mutableStateOf(isIgnoringBatteryOptimizations(context)) }
    var floatBubble by remember { mutableStateOf(settings.floatBubble) }
    var bubbleSeconds by remember { mutableStateOf(settings.bubbleSeconds.toString()) }
    var clipboardSync by remember { mutableStateOf(settings.clipboardSync) }
    var overlayGranted by remember { mutableStateOf(Settings.canDrawOverlays(context)) }

    // 从系统设置页返回时刷新权限 / 保活状态
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                listenerEnabled = isNotificationAccessEnabled(context)
                smsGranted =
                    ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECEIVE_SMS) ==
                        PackageManager.PERMISSION_GRANTED
                batteryWhitelisted = isIgnoringBatteryOptimizations(context)
                overlayGranted = Settings.canDrawOverlays(context)
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { }

    // 扫码配对：扫描 PC 端二维码后自动填入地址 / 端口 / Token
    val scanLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val text = result.data?.getStringExtra(QrScanActivity.EXTRA_RESULT)
            if (text.isNullOrBlank()) {
                statusMsg = "未识别到二维码"
                statusOk = false
                return@rememberLauncherForActivityResult
            }
            try {
                val obj = JSONObject(text)
                val h = obj.optString("host").trim()
                val appTag = obj.optString("app")
                if (h.isBlank() || (appTag.isNotBlank() && appTag != "CodeBridge")) {
                    throw IllegalArgumentException("not CodeBridge payload")
                }
                val p = obj.optInt("port", AppSettings.DEFAULT_PORT).coerceIn(1, 65535)
                val tk = obj.optString("token")
                host = h
                port = p.toString()
                token = tk
                settings.applyActive(h, p, tk)
                configs = settings.pcConfigs()
                activeIdx = settings.activeIndex()
                statusMsg = "扫码配对成功：$h:$p"
                statusOk = true
            } catch (e: Exception) {
                statusMsg = "二维码内容无效，请扫描 CodeBridge 配对码"
                statusOk = false
            }
        } else {
            statusMsg = "已取消扫码"
            statusOk = false
        }
    }

    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            scanLauncher.launch(Intent(context, QrScanActivity::class.java))
        } else {
            statusMsg = "需要相机权限才能扫码配对"
            statusOk = false
        }
    }

    // 背景光斑动画
    val transition = rememberInfiniteTransition(label = "blob")
    val drift1 by transition.animateFloat(
        initialValue = -80f, targetValue = 80f,
        animationSpec = infiniteRepeatable(tween(7000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "drift1",
    )
    val drift2 by transition.animateFloat(
        initialValue = 60f, targetValue = -70f,
        animationSpec = infiniteRepeatable(tween(9000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "drift2",
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF0A0F1F), Color(0xFF0D1326), Color(0xFF0A0E1C))
                )
            )
    ) {
        // 光斑
        Box(
            Modifier
                .offset(x = drift1.dp, y = (-80).dp)
                .size(340.dp)
                .align(Alignment.TopStart)
                .background(
                    Brush.radialGradient(
                        listOf(Color(0x66608CFF), Color.Transparent),
                        radius = 340f,
                    ),
                    CircleShape,
                )
        )
        Box(
            Modifier
                .offset(x = drift2.dp, y = 120.dp)
                .size(320.dp)
                .align(Alignment.TopEnd)
                .background(
                    Brush.radialGradient(
                        listOf(Color(0x55AA6EFF), Color.Transparent),
                        radius = 320f,
                    ),
                    CircleShape,
                )
        )
        Box(
            Modifier
                .offset(x = 0.dp, y = drift1.dp)
                .size(380.dp)
                .align(Alignment.BottomCenter)
                .background(
                    Brush.radialGradient(
                        listOf(Color(0x4028D2DC), Color.Transparent),
                        radius = 380f,
                    ),
                    CircleShape,
                )
        )

        fun applyFoundHost(ip: String, p: Int) {
            val (h, pp) = parseHostPort("$ip:$p", p)
            host = h
            port = pp.toString()
            settings.applyActive(h, pp, settings.token)
            configs = settings.pcConfigs()
            activeIdx = settings.activeIndex()
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // 标题
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("验证码桥接", color = TextPrimary, fontSize = 26.sp, fontWeight = FontWeight.Bold)
                    Text("手机 → PC · 局域网实时转发", color = TextFaint, fontSize = 13.sp)
                }
                GlassPill(
                    text = if (listenerEnabled) "监听中" else "未监听",
                    color = if (listenerEnabled) Ok else Warn,
                )
            }

            // 服务配置卡片
            GlassCard {
                CardHeader(Icons.Default.Settings, "PC 接收端")

                // 多 PC 配置：切换 / 添加 / 删除
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    configs.forEachIndexed { idx, cfg ->
                        val selected = idx == activeIdx
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(if (selected) Accent.copy(alpha = 0.30f) else Color(0x14FFFFFF))
                                .border(
                                    BorderStroke(1.dp, if (selected) Accent.copy(alpha = 0.75f) else GlassBorder),
                                    RoundedCornerShape(999.dp),
                                )
                                .clickable {
                                    activeIdx = idx
                                    settings.switchTo(idx)
                                    host = settings.pcHost
                                    port = settings.pcPort.toString()
                                    token = settings.token
                                    statusMsg = "已切换到 ${if (cfg.name.isNotBlank()) cfg.name else cfg.host}"
                                    statusOk = true
                                }
                                .padding(horizontal = 12.dp, vertical = 7.dp),
                        ) {
                            Text(
                                text = if (cfg.name.isNotBlank()) cfg.name else (cfg.host.ifBlank { "未命名 PC" }),
                                color = if (selected) TextPrimary else TextDim,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    GlassButton(
                        text = "添加配置",
                        icon = Icons.Default.Add,
                        modifier = Modifier.weight(1f),
                    ) {
                        val (h, p) = parseHostPort(host, port.toIntOrNull() ?: AppSettings.DEFAULT_PORT)
                        if (h.isBlank()) {
                            statusMsg = "请先填写 PC 地址"
                            statusOk = false
                        } else {
                            settings.addConfig(PcConfig("PC ${configs.size + 1}", h, p, token.trim()))
                            configs = settings.pcConfigs()
                            activeIdx = settings.activeIndex()
                            host = settings.pcHost
                            port = settings.pcPort.toString()
                            token = settings.token
                            statusMsg = "已添加新配置"
                            statusOk = true
                        }
                    }
                    GlassButton(
                        text = "删除当前",
                        icon = Icons.Default.Delete,
                        modifier = Modifier.weight(1f),
                    ) {
                        if (configs.size <= 1) {
                            statusMsg = "至少保留一个配置"
                            statusOk = false
                        } else {
                            val ok = settings.removeActiveConfig()
                            configs = settings.pcConfigs()
                            activeIdx = settings.activeIndex()
                            host = settings.pcHost
                            port = settings.pcPort.toString()
                            token = settings.token
                            statusMsg = if (ok) "已删除当前配置" else "至少保留一个配置"
                            statusOk = ok
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    GlassTextField(
                        value = host,
                        onValueChange = { host = it },
                        label = "PC 地址（IP 或主机名）",
                        placeholder = "192.168.1.100:9841",
                        modifier = Modifier.weight(1f),
                    )
                    GlassButton(
                        text = "搜索",
                        icon = Icons.Default.Search,
                        modifier = Modifier.width(84.dp),
                    ) {
                        statusMsg = "正在搜索 PC…"
                        statusOk = true
                        scope.launch {
                            val searchPort = port.toIntOrNull() ?: AppSettings.DEFAULT_PORT
                            val foundList = withContext(Dispatchers.IO) {
                                AutoDiscover.discoverAll(searchPort)
                            }
                            if (foundList.isEmpty()) {
                                statusMsg = "未找到 PC，请确认手机与电脑在同一网络或已连接 USB"
                                statusOk = false
                            } else if (foundList.size == 1) {
                                applyFoundHost(foundList[0].ip, searchPort)
                                statusMsg = "已找到 PC：${foundList[0].ip}"
                                statusOk = true
                            } else {
                                lastSearchPort = searchPort
                                foundHosts = foundList
                                statusMsg = "找到 ${foundList.size} 台 PC，请选择"
                                statusOk = true
                            }
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
                GlassButton(
                    text = "扫码配对",
                    icon = Icons.Default.QrCodeScanner,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    val ctx = context
                    if (ContextCompat.checkSelfPermission(ctx, android.Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        scanLauncher.launch(Intent(ctx, QrScanActivity::class.java))
                    } else {
                        cameraPermissionLauncher.launch(android.Manifest.permission.CAMERA)
                    }
                }
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    GlassTextField(
                        value = port,
                        onValueChange = { v -> port = v.filter { it.isDigit() }.take(5) },
                        label = "端口",
                        placeholder = "9841",
                        modifier = Modifier.weight(1f),
                    )
                    GlassTextField(
                        value = token,
                        onValueChange = { token = it },
                        label = "Token（可留空）",
                        placeholder = "与 PC 端一致",
                        modifier = Modifier.weight(1.6f),
                    )
                }
                Spacer(Modifier.height(6.dp))
                ToggleRow(
                    title = "自动转发",
                    desc = "收到验证码后自动发送到 PC",
                    checked = autoSend,
                    onCheckedChange = { autoSend = it },
                )
                ToggleRow(
                    title = "自定义正则（可选）",
                    desc = "留空使用内置中文短信规则",
                    checked = customRegex.isNotEmpty(),
                    onCheckedChange = { if (it) customRegex = "\\d{6}" else customRegex = "" },
                )
                if (customRegex.isNotEmpty()) {
                    GlassTextField(
                        value = customRegex,
                        onValueChange = { customRegex = it },
                        label = "验证码正则",
                        placeholder = "\\d{6}",
                    )
                }
                ToggleRow(
                    title = "\u540c\u6b65 PC \u526a\u8d34\u677f",
                    desc = "PC \u526a\u8d34\u677f\u53d8\u5316\u65f6\u81ea\u52a8\u540c\u6b65\u5230\u624b\u673a",
                    checked = clipboardSync,
                    onCheckedChange = { clipboardSync = it },
                )

                // 搜索结果：多台 PC 时弹出选择
                foundHosts?.let { hosts ->
                    AlertDialog(
                        onDismissRequest = { foundHosts = null },
                        title = { Text("选择要推送的 PC", color = TextPrimary) },
                        text = {
                            Column {
                                hosts.forEach { pc ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(10.dp))
                                            .clickable {
                                                applyFoundHost(pc.ip, lastSearchPort)
                                                foundHosts = null
                                                statusMsg = "已选择 PC：${pc.ip}"
                                                statusOk = true
                                            }
                                            .padding(horizontal = 10.dp, vertical = 12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Box(
                                            Modifier
                                                .size(8.dp)
                                                .clip(CircleShape)
                                                .background(Ok)
                                        )
                                        Spacer(Modifier.width(10.dp))
                                        Column {
                                            Text(
                                                "${pc.ip}:$lastSearchPort",
                                                color = TextPrimary,
                                                fontSize = 14.sp,
                                                fontWeight = FontWeight.Medium,
                                            )
                                            if (pc.hostname.isNotBlank()) {
                                                Text(
                                                    pc.hostname,
                                                    color = TextFaint,
                                                    fontSize = 11.sp,
                                                )
                                            }
                                        }
                                        Spacer(Modifier.weight(1f))
                                        Text(
                                            if (pc.isUsb) "USB" else "局域网",
                                            color = if (pc.isUsb) Warn else Ok,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                        )
                                    }
                                }
                            }
                        },
                        confirmButton = {
                            TextButton(onClick = { foundHosts = null }) { Text("取消", color = Accent) }
                        },
                        containerColor = Color(0xFF16203A),
                        shape = RoundedCornerShape(18.dp),
                    )
                }
                Spacer(Modifier.height(14.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    GlassButton(
                        text = "保存",
                        icon = Icons.Default.Check,
                        accent = true,
                        modifier = Modifier.weight(1f),
                    ) {
                        val (saveHost, savePort) = parseHostPort(host, port.toIntOrNull() ?: AppSettings.DEFAULT_PORT)
                        host = saveHost
                        port = savePort.toString()
                        settings.applyActive(saveHost, savePort, token)
                        settings.autoSend = autoSend
                        settings.customRegex = customRegex
                        settings.floatBubble = floatBubble
                        settings.bubbleSeconds = bubbleSeconds.toIntOrNull() ?: 15
                        settings.clipboardSync = clipboardSync
                        configs = settings.pcConfigs()
                        activeIdx = settings.activeIndex()
                        statusMsg = if (settings.isValid()) "设置已保存" else "请填写 PC 地址"
                        statusOk = settings.isValid()
                    }
                    GlassButton(
                        text = "发送测试码",
                        icon = Icons.Default.Send,
                        modifier = Modifier.weight(1f),
                    ) {
                        val (sendHost, sendPort) = parseHostPort(host, port.toIntOrNull() ?: AppSettings.DEFAULT_PORT)
                        host = sendHost
                        port = sendPort.toString()
                        settings.pcHost = sendHost
                        settings.pcPort = sendPort
                        settings.token = token
                        if (!settings.isValid()) {
                            statusMsg = "请先填写 PC 地址"
                            statusOk = false
                            return@GlassButton
                        }
                        statusMsg = "发送中…"
                        scope.launch {
                            val result = withContext(Dispatchers.IO) {
                                CodeSender.send(settings.pcHost, settings.pcPort, settings.token, "123456", "测试", "0000")
                            }
                            statusMsg = result.message
                            statusOk = result.ok
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
                Text(
                    text = if (statusOk) "✓ $statusMsg" else "✗ $statusMsg",
                    color = if (statusOk) Ok else Danger,
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Medium,
                )
            }

            // 权限卡片
            GlassCard {
                CardHeader(Icons.Default.Notifications, "权限与监听")
                PermissionRow(
                    title = "通知使用权",
                    desc = if (listenerEnabled) "已开启，可读取短信验证码通知" else "用于读取短信验证码通知",
                    enabled = listenerEnabled,
                ) {
                    openNotificationAccessSettings(context)
                }
                Spacer(Modifier.height(8.dp))
                PermissionRow(
                    title = "短信权限（备用）",
                    desc = if (smsGranted) "已授予" else "未授予（可选，通知监听足够时可不授）",
                    enabled = smsGranted,
                ) {
                    val perms = mutableListOf(android.Manifest.permission.RECEIVE_SMS)
                    if (Build.VERSION.SDK_INT >= 33) perms.add(android.Manifest.permission.POST_NOTIFICATIONS)
                    permissionLauncher.launch(perms.toTypedArray())
                }
            }

            // 后台保活卡片
            GlassCard {
                CardHeader(Icons.Default.PowerSettingsNew, "后台保活")
                PermissionRow(
                    title = "忽略电池优化",
                    desc = if (batteryWhitelisted) "已加入白名单，后台不易被系统回收" else "允许后台驻留，避免收不到验证码",
                    enabled = batteryWhitelisted,
                ) {
                    openBatteryOptimizationSettings(context)
                }
                Spacer(Modifier.height(8.dp))
                PermissionRow(
                    title = "自启动 / 后台运行",
                    desc = "在系统设置中允许自启动、后台运行（不同品牌入口不同）",
                    enabled = false,
                ) {
                    openAppDetailsSettings(context)
                }
                Spacer(Modifier.height(10.dp))
                Text(
                    text = "提示：在最近任务中下拉本应用卡片可锁定；开启「通知使用权」后应用会在后台驻留监听验证码。",
                    color = TextDim,
                    fontSize = 12.sp,
                    lineHeight = 18.sp,
                )
            }

            // 使用说明
            // Floating bubble settings
            GlassCard {
                CardHeader(Icons.Default.Notifications, "悬浮气泡")
                ToggleRow(
                    title = "悬浮气泡",
                    desc = "收到验证码后在屏幕上方弹出气泡，点击可复制",
                    checked = floatBubble,
                    onCheckedChange = { floatBubble = it },
                )
                if (floatBubble && !overlayGranted) {
                    Spacer(Modifier.height(6.dp))
                    PermissionRow(
                        title = "悬浮窗权限",
                        desc = "用于在屏幕上显示验证码气泡",
                        enabled = false,
                    ) {
                        val intent = Intent(
                            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:" + context.packageName)
                        )
                        context.startActivity(intent)
                    }
                }
                Spacer(Modifier.height(8.dp))
                GlassTextField(
                    value = bubbleSeconds,
                    onValueChange = { v -> bubbleSeconds = v.filter { it.isDigit() }.take(3) },
                    label = "显示时长（秒）",
                    placeholder = "15",
                )
                Spacer(Modifier.height(10.dp))
                GlassButton(
                    text = "测试气泡",
                    icon = Icons.Default.Notifications,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    CodeBubble.show(context, "123456", "测试")
                    statusMsg = "已弹出测试气泡"
                    statusOk = true
                }
            }
            GlassCard {
                CardHeader(Icons.Default.Sms, "使用步骤")
                Text(
                    text = "1. 在 PC 端打开 CodeBridge 设置中的「扫码配对」二维码\n" +
                        "2. 在本页点「扫码配对」扫一扫（或手动填写地址/端口/Token）\n" +
                        "3. 开启「通知使用权」，授予短信权限\n" +
                        "4. 保持「自动转发」开启，收到验证码即自动上送",
                    color = TextDim,
                    fontSize = 13.sp,
                    lineHeight = 20.sp,
                )
            }
        }
    }
}

/* ---------------- 组件 ---------------- */

@Composable
private fun GlassCard(content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(18.dp, RoundedCornerShape(28.dp), clip = false)
            .clip(RoundedCornerShape(28.dp))
            .background(
                Brush.linearGradient(
                    listOf(GlassCardStrong, GlassCard),
                    start = androidx.compose.ui.geometry.Offset.Zero,
                    end = androidx.compose.ui.geometry.Offset(400f, 400f),
                )
            )
            .border(BorderStroke(1.dp, GlassBorder), RoundedCornerShape(28.dp))
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp),
        content = content,
    )
}

@Composable
private fun CardHeader(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 12.dp)) {
        Box(
            Modifier
                .size(30.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0x2E6EA8FF)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, null, tint = Accent, modifier = Modifier.size(16.dp))
        }
        Spacer(Modifier.width(10.dp))
        Text(title, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun GlassTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth(),
        label = { Text(label, fontSize = 12.sp) },
        placeholder = { Text(placeholder, color = TextFaint, fontSize = 12.sp) },
        singleLine = true,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Accent,
            unfocusedBorderColor = GlassBorder,
            focusedLabelColor = Accent,
            unfocusedLabelColor = TextFaint,
            cursorColor = Accent,
            focusedTextColor = TextPrimary,
            unfocusedTextColor = TextPrimary,
            focusedContainerColor = Color(0x0FFFFFFF),
            unfocusedContainerColor = Color(0x0FFFFFFF),
        ),
        shape = RoundedCornerShape(14.dp),
        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.5.sp),
    )
}

@Composable
private fun ToggleRow(
    title: String,
    desc: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(title, color = TextPrimary, fontSize = 13.5.sp, fontWeight = FontWeight.Medium)
            Text(desc, color = TextFaint, fontSize = 11.sp, modifier = Modifier.padding(top = 2.dp))
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = Accent,
                uncheckedThumbColor = Color.White,
                uncheckedTrackColor = Color(0x33FFFFFF),
                uncheckedBorderColor = GlassBorder,
            ),
        )
    }
}

@Composable
private fun PermissionRow(
    title: String,
    desc: String,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0x0FFFFFFF))
            .border(BorderStroke(1.dp, Color(0x14FFFFFF)), RoundedCornerShape(14.dp))
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(if (enabled) Ok else Warn),
        )
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(title, color = TextPrimary, fontSize = 13.5.sp, fontWeight = FontWeight.Medium)
            Text(desc, color = TextFaint, fontSize = 11.sp, modifier = Modifier.padding(top = 2.dp))
        }
        Text(
            text = if (enabled) "已开启" else "去开启",
            color = if (enabled) Ok else Accent,
            fontSize = 12.5.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier
                .clip(RoundedCornerShape(999.dp))
                .background(if (enabled) Color(0x1F5EE6A0) else Color(0x2E6EA8FF))
                .clickable(onClick = onClick)
                .padding(horizontal = 12.dp, vertical = 6.dp),
        )
    }
}

@Composable
private fun GlassPill(text: String, color: Color) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(color.copy(alpha = 0.16f))
            .border(BorderStroke(1.dp, color.copy(alpha = 0.4f)), RoundedCornerShape(999.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp),
    ) {
        Box(Modifier.size(6.dp).clip(CircleShape).background(color))
        Spacer(Modifier.width(6.dp))
        Text(text, color = color, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun GlassButton(
    text: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    accent: Boolean = false,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(48.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (accent) Accent else Color(0x1FFFFFFF),
            contentColor = TextPrimary,
        ),
        border = BorderStroke(1.dp, if (accent) Color(0x40FFFFFF) else GlassBorder),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 6.dp),
    ) {
        Icon(icon, null, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(text, fontSize = 13.5.sp, fontWeight = FontWeight.SemiBold)
    }
}


fun isNotificationAccessEnabled(context: Context): Boolean {
    val flat = android.provider.Settings.Secure.getString(
        context.contentResolver,
        "enabled_notification_listeners",
    ) ?: return false
    val cn = ComponentName(context, com.phonetopc.copycode.service.SmsNotificationListener::class.java)
    return flat.split(':').any { ComponentName.unflattenFromString(it) == cn }
}

private fun openNotificationAccessSettings(context: Context) {
    try {
        context.startActivity(Intent(android.provider.Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
    } catch (_: Exception) {
        context.startActivity(Intent(android.provider.Settings.ACTION_SETTINGS))
    }
}

/** 是否已加入电池优化白名单 */
private fun isIgnoringBatteryOptimizations(context: Context): Boolean {
    val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return false
    return pm.isIgnoringBatteryOptimizations(context.packageName)
}

/** 引导加入电池优化白名单；不支持时退回电池设置页 */
private fun openBatteryOptimizationSettings(context: Context) {
    try {
        if (Build.VERSION.SDK_INT >= 23) {
            context.startActivity(
                Intent(
                    Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:${context.packageName}"),
                )
            )
            return
        }
    } catch (_: Exception) {
        // 部分系统不支持直接请求，退回通用设置页
    }
    try {
        context.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
    } catch (_: Exception) {
        context.startActivity(Intent(Settings.ACTION_SETTINGS))
    }
}

/** 打开应用详情页：自启动 / 后台运行等品牌化入口一般在该页附近 */
private fun openAppDetailsSettings(context: Context) {
    try {
        context.startActivity(
            Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:${context.packageName}"),
            )
        )
    } catch (_: Exception) {
        context.startActivity(Intent(Settings.ACTION_SETTINGS))
    }
}



/**
 * 智能解析 PC 地址：支持 "IP" / "IP:端口" / "http://IP:端口"。
 * 例如 "192.168.31.77:9841" -> host=192.168.31.77, port=9841
 */
private fun parseHostPort(input: String, defaultPort: Int): Pair<String, Int> {
    var t = input.trim()
    if (t.startsWith("http://")) t = t.removePrefix("http://")
    if (t.startsWith("https://")) t = t.removePrefix("https://")
    val slash = t.indexOf('/')
    if (slash >= 0) t = t.substring(0, slash)
    val idx = t.lastIndexOf(':')
    if (idx > 0) {
        val maybePort = t.substring(idx + 1).trim()
        val p = maybePort.toIntOrNull()
        if (p != null && p in 1..65535) {
            return t.substring(0, idx).ifBlank { "127.0.0.1" } to p
        }
    }
    return t.ifBlank { "" } to defaultPort
}
