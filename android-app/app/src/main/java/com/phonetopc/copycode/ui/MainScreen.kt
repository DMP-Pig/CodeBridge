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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.phonetopc.copycode.R
import com.phonetopc.copycode.data.AutoDiscover
import com.phonetopc.copycode.data.PcConfig
import com.phonetopc.copycode.data.FoundPc
import com.phonetopc.copycode.data.Settings as AppSettings
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
    var bootAutoStart by remember { mutableStateOf(settings.bootAutoStart) }
    var cacheOffline by remember { mutableStateOf(settings.cacheOffline) }
    var pushAll by remember { mutableStateOf(settings.pushToAll) }
    var relayEnabled by remember { mutableStateOf(settings.relayEnabled) }
    var relayUrl by remember { mutableStateOf(settings.relayUrl) }
    var relayRoom by remember { mutableStateOf(settings.relayRoom) }
    var relayToken by remember { mutableStateOf(settings.relayToken) }
    var e2eKey by remember { mutableStateOf(settings.e2eKey) }
    var customRegex by remember { mutableStateOf(settings.customRegex) }
    var onlySmsApps by remember { mutableStateOf(settings.onlySmsApps) }
    var statusMsg by remember { mutableStateOf(context.getString(R.string.status_ready)) }
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
                statusMsg = context.getString(R.string.status_qr_not_found)
                statusOk = false
                return@rememberLauncherForActivityResult
            }
            try {
                val obj = JSONObject(text)
                val h = obj.optString("host").trim()
                val appTag = obj.optString("app")
                // 防御旧版本 PC 二维码：host 必须是有效 IP/主机名，不能是对象序列化出来的字符串
                val hostInvalid = h.isBlank() || h.startsWith("{") || !h.matches(Regex("[0-9A-Za-z._:,-]+"))
                if (hostInvalid || (appTag.isNotBlank() && appTag != "CodeBridge")) {
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
                statusMsg = context.getString(R.string.status_qr_ok, "$h:$p")
                statusOk = true
            } catch (e: Exception) {
                statusMsg = context.getString(R.string.status_qr_invalid)
                statusOk = false
            }
        } else {
            statusMsg = context.getString(R.string.status_qr_canceled)
            statusOk = false
        }
    }

    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            scanLauncher.launch(Intent(context, QrScanActivity::class.java))
        } else {
            statusMsg = context.getString(R.string.status_camera_needed)
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
                    Text(stringResource(R.string.app_title), color = TextPrimary, fontSize = 26.sp, fontWeight = FontWeight.Bold)
                    Text(stringResource(R.string.app_subtitle), color = TextFaint, fontSize = 13.sp)
                }
                GlassPill(
                    text = stringResource(if (listenerEnabled) R.string.status_listening else R.string.status_not_listening),
                    color = if (listenerEnabled) Ok else Warn,
                )
            }

            // 服务配置卡片
            GlassCard {
                CardHeader(Icons.Default.Settings, stringResource(R.string.card_pc_receiver))

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
                                    statusMsg = context.getString(R.string.status_switched, if (cfg.name.isNotBlank()) cfg.name else cfg.host)
                                    statusOk = true
                                }
                                .padding(horizontal = 12.dp, vertical = 7.dp),
                        ) {
                            Text(
                                text = if (cfg.name.isNotBlank()) cfg.name else (cfg.host.ifBlank { context.getString(R.string.unnamed_pc) }),
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
                        text = stringResource(R.string.add_config),
                        icon = Icons.Default.Add,
                        modifier = Modifier.weight(1f),
                    ) {
                        val (h, p) = parseHostPort(host, port.toIntOrNull() ?: AppSettings.DEFAULT_PORT)
                        if (h.isBlank()) {
                            statusMsg = context.getString(R.string.status_fill_host)
                            statusOk = false
                        } else {
                            settings.addConfig(PcConfig("PC ${configs.size + 1}", h, p, token.trim()))
                            configs = settings.pcConfigs()
                            activeIdx = settings.activeIndex()
                            host = settings.pcHost
                            port = settings.pcPort.toString()
                            token = settings.token
                            statusMsg = context.getString(R.string.status_config_added)
                            statusOk = true
                        }
                    }
                    GlassButton(
                        text = stringResource(R.string.delete_current),
                        icon = Icons.Default.Delete,
                        modifier = Modifier.weight(1f),
                    ) {
                        if (configs.size <= 1) {
                            statusMsg = context.getString(R.string.status_keep_one)
                            statusOk = false
                        } else {
                            val ok = settings.removeActiveConfig()
                            configs = settings.pcConfigs()
                            activeIdx = settings.activeIndex()
                            host = settings.pcHost
                            port = settings.pcPort.toString()
                            token = settings.token
                            statusMsg = if (ok) context.getString(R.string.status_config_deleted) else context.getString(R.string.status_keep_one)
                            statusOk = ok
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    GlassTextField(
                        value = host,
                        onValueChange = { host = it },
                        label = stringResource(R.string.pc_address_label),
                        placeholder = "192.168.1.100:9841",
                        modifier = Modifier.weight(1f),
                    )
                    GlassButton(
                        text = stringResource(R.string.search),
                        icon = Icons.Default.Search,
                        modifier = Modifier.width(84.dp),
                    ) {
                        statusMsg = context.getString(R.string.status_searching)
                        statusOk = true
                        scope.launch {
                            val searchPort = port.toIntOrNull() ?: AppSettings.DEFAULT_PORT
                            val foundList = withContext(Dispatchers.IO) {
                                AutoDiscover.discoverAll(searchPort)
                            }
                            if (foundList.isEmpty()) {
                                statusMsg = context.getString(R.string.status_not_found)
                                statusOk = false
                            } else if (foundList.size == 1) {
                                applyFoundHost(foundList[0].ip, searchPort)
                                statusMsg = context.getString(R.string.status_found, foundList[0].ip)
                                statusOk = true
                            } else {
                                lastSearchPort = searchPort
                                foundHosts = foundList
                                statusMsg = context.getString(R.string.status_found_multi, foundList.size)
                                statusOk = true
                            }
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
                GlassButton(
                    text = stringResource(R.string.qr_pair),
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
                        label = stringResource(R.string.port_label),
                        placeholder = "9841",
                        modifier = Modifier.weight(1f),
                    )
                    GlassTextField(
                        value = token,
                        onValueChange = { token = it },
                        label = stringResource(R.string.token_label),
                        placeholder = stringResource(R.string.token_placeholder),
                        modifier = Modifier.weight(1.6f),
                    )
                }
                Spacer(Modifier.height(6.dp))
                ToggleRow(
                    title = stringResource(R.string.title_auto_forward),
                    desc = stringResource(R.string.desc_auto_forward),
                    checked = autoSend,
                    onCheckedChange = { autoSend = it },
                )
                ToggleRow(
                    title = stringResource(R.string.title_only_sms),
                    desc = stringResource(R.string.desc_only_sms),
                    checked = onlySmsApps,
                    onCheckedChange = { onlySmsApps = it },
                )
                ToggleRow(
                    title = stringResource(R.string.title_boot_start),
                    desc = stringResource(R.string.desc_boot_start),
                    checked = bootAutoStart,
                    onCheckedChange = { bootAutoStart = it },
                )
                ToggleRow(
                    title = stringResource(R.string.title_cache_offline),
                    desc = stringResource(R.string.desc_cache_offline),
                    checked = cacheOffline,
                    onCheckedChange = { cacheOffline = it },
                )

                ToggleRow(
                    title = stringResource(R.string.title_push_all),
                    desc = stringResource(R.string.desc_push_all),
                    checked = pushAll,
                    onCheckedChange = { pushAll = it },
                )
                ToggleRow(
                    title = stringResource(R.string.title_relay),
                    desc = stringResource(R.string.desc_relay),
                    checked = relayEnabled,
                    onCheckedChange = { relayEnabled = it },
                )
                if (relayEnabled) {
                    GlassTextField(
                        value = relayUrl,
                        onValueChange = { relayUrl = it },
                        label = stringResource(R.string.relay_url_label),
                        placeholder = "https://relay.example.com",
                    )
                    Spacer(Modifier.height(6.dp))
                    GlassTextField(
                        value = relayRoom,
                        onValueChange = { relayRoom = it },
                        label = stringResource(R.string.relay_room_label),
                        placeholder = "myroom",
                    )
                    Spacer(Modifier.height(6.dp))
                    GlassTextField(
                        value = relayToken,
                        onValueChange = { relayToken = it },
                        label = stringResource(R.string.relay_token_label),
                        placeholder = "123456",
                    )
                }
                if (e2eKey.isNotEmpty() || relayEnabled) {
                    GlassTextField(
                        value = e2eKey,
                        onValueChange = { e2eKey = it },
                        label = stringResource(R.string.e2e_key_label),
                        placeholder = "optional",
                    )
                }
                ToggleRow(
                    title = stringResource(R.string.title_custom_regex),
                    desc = stringResource(R.string.desc_custom_regex),
                    checked = customRegex.isNotEmpty(),
                    onCheckedChange = { if (it) customRegex = "\\d{6}" else customRegex = "" },
                )
                if (customRegex.isNotEmpty()) {
                    GlassTextField(
                        value = customRegex,
                        onValueChange = { customRegex = it },
                        label = stringResource(R.string.regex_label),
                        placeholder = "\\d{6}",
                    )
                }
                // 搜索结果：多台 PC 时弹出选择
                foundHosts?.let { hosts ->
                    AlertDialog(
                        onDismissRequest = { foundHosts = null },
                        title = { Text(stringResource(R.string.select_pc), color = TextPrimary) },
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
                                                statusMsg = context.getString(R.string.status_pc_selected, pc.ip)
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
                                            stringResource(if (pc.isUsb) R.string.usb else R.string.lan),
                                            color = if (pc.isUsb) Warn else Ok,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                        )
                                    }
                                }
                            }
                        },
                        confirmButton = {
                            TextButton(onClick = { foundHosts = null }) { Text(stringResource(R.string.cancel), color = Accent) }
                        },
                        containerColor = Color(0xFF16203A),
                        shape = RoundedCornerShape(18.dp),
                    )
                }
                Spacer(Modifier.height(14.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    GlassButton(
                        text = stringResource(R.string.save),
                        icon = Icons.Default.Check,
                        accent = true,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        val (saveHost, savePort) = parseHostPort(host, port.toIntOrNull() ?: AppSettings.DEFAULT_PORT)
                        host = saveHost
                        port = savePort.toString()
                        settings.applyActive(saveHost, savePort, token)
                        settings.autoSend = autoSend
                        settings.onlySmsApps = onlySmsApps
                        settings.bootAutoStart = bootAutoStart
                        settings.cacheOffline = cacheOffline
                        settings.pushToAll = pushAll
                        settings.relayEnabled = relayEnabled
                        settings.relayUrl = relayUrl
                        settings.relayRoom = relayRoom
                        settings.relayToken = relayToken
                        settings.e2eKey = e2eKey
                        settings.customRegex = customRegex
                        settings.floatBubble = floatBubble
                        settings.bubbleSeconds = bubbleSeconds.toIntOrNull() ?: 15
                        configs = settings.pcConfigs()
                        activeIdx = settings.activeIndex()
                        statusMsg = if (settings.isValid()) context.getString(R.string.status_saved) else context.getString(R.string.status_fill_host)
                        statusOk = settings.isValid()
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
                CardHeader(Icons.Default.Notifications, stringResource(R.string.card_permissions))
                PermissionRow(
                    title = stringResource(R.string.notification_access),
                    desc = stringResource(if (listenerEnabled) R.string.desc_na_enabled else R.string.desc_na_disabled),
                    enabled = listenerEnabled,
                ) {
                    openNotificationAccessSettings(context)
                }
                Spacer(Modifier.height(8.dp))
                PermissionRow(
                    title = stringResource(R.string.sms_permission),
                    desc = stringResource(if (smsGranted) R.string.desc_sms_granted else R.string.desc_sms_denied),
                    enabled = smsGranted,
                ) {
                    val perms = mutableListOf(android.Manifest.permission.RECEIVE_SMS)
                    if (Build.VERSION.SDK_INT >= 33) perms.add(android.Manifest.permission.POST_NOTIFICATIONS)
                    permissionLauncher.launch(perms.toTypedArray())
                }
            }

            // 后台保活卡片
            GlassCard {
                CardHeader(Icons.Default.PowerSettingsNew, stringResource(R.string.card_keepalive))
                PermissionRow(
                    title = stringResource(R.string.ignore_battery),
                    desc = stringResource(if (batteryWhitelisted) R.string.desc_battery_whitelisted else R.string.desc_battery_not),
                    enabled = batteryWhitelisted,
                ) {
                    openBatteryOptimizationSettings(context)
                }
                Spacer(Modifier.height(8.dp))
                PermissionRow(
                    title = stringResource(R.string.auto_start_row),
                    desc = stringResource(R.string.desc_auto_start_row),
                    enabled = false,
                ) {
                    openAppDetailsSettings(context)
                }
                Spacer(Modifier.height(10.dp))
                Text(
                    text = stringResource(R.string.tip_keepalive),
                    color = TextDim,
                    fontSize = 12.sp,
                    lineHeight = 18.sp,
                )
            }

            // 使用说明
            // Floating bubble settings
            GlassCard {
                CardHeader(Icons.Default.Notifications, stringResource(R.string.card_bubble))
                ToggleRow(
                    title = stringResource(R.string.float_bubble_title),
                    desc = stringResource(R.string.desc_float_bubble),
                    checked = floatBubble,
                    onCheckedChange = { floatBubble = it },
                )
                if (floatBubble && !overlayGranted) {
                    Spacer(Modifier.height(6.dp))
                    PermissionRow(
                        title = stringResource(R.string.overlay_permission),
                        desc = stringResource(R.string.desc_overlay),
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
                    label = stringResource(R.string.bubble_seconds_label),
                    placeholder = "15",
                )
            }
            GlassCard {
                CardHeader(Icons.Default.Sms, stringResource(R.string.card_steps))
                Text(
                    text = stringResource(R.string.steps_text),
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
            text = stringResource(if (enabled) R.string.enabled else R.string.go_enable),
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
