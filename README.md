# CodeBridge

> Bridge SMS verification codes from your phone to PC over LAN. Display, one-click copy, fully configurable. Modern glassmorphism UI.
>
> 通过局域网将手机验证码桥接至 PC。展示、一键复制、全功能可配置。现代化玻璃拟态 UI。

When your phone receives an SMS verification code, CodeBridge forwards it to your PC over the local network in real time. The PC client shows it in a modern glassmorphism UI with rounded corners and animations, and can push it to the WinIsland dynamic island or copy it to the clipboard — all fully configurable.

手机收到短信验证码后，CodeBridge 通过局域网实时转发到 PC。PC 端以液态玻璃（玻璃拟态）风格界面展示，支持推送到 WinIsland 灵动岛、一键/自动复制到剪贴板，所有行为均可配置。

## Features / 功能

- Real-time forwarding of SMS codes from phone to PC over LAN / 手机 → PC 局域网实时转发
- Glassmorphism UI with rounded corners and animations / 液态玻璃拟态 UI（圆角 + 动画）
- One-click copy, auto-copy, and **auto-restore clipboard** after N seconds / 一键复制、自动复制、自动复制后 N 秒恢复原剪贴板
- Push to WinIsland dynamic island (auto / manual), single-line compact display, does not widen the island / 推送到 WinIsland 灵动岛（自动/手动），单行紧凑显示，不影响灵动岛宽度
- Fully configurable: PC host, port, token, auto-forward, auto-copy, auto-island, restore duration, icon, regex / 全部可配置：PC 地址、端口、Token、自动转发、自动复制、自动上岛、恢复时长、图标、正则
- End-to-end TLS encryption (HTTPS + certificate pinning) / 验证码 HTTPS 加密传输（PC 自签证书 + 手机端证书固定，防局域网窃听）
- Auto-type the code into a focused input after receiving / 收到验证码后自动输入到当前焦点输入框
- Auto-search PC clients on LAN, multi-PC profiles, QR-code pairing / 自动搜索局域网 PC 客户端、多 PC 配置保存切换、二维码扫码配对
- Push codes to **all configured PCs** at once (toggleable) / 多 PC 推送：同时推送至所有已配置 PC（可开关）
- Code-type recognition (login / payment / register / unlock / other) with per-type island styling / 验证码类型识别（登录/支付/注册/解锁）上岛样式与单独项设置
- Platform template library (Taobao / Alipay / WeChat / banks / Steam / Weibo) / 平台模板库（淘宝/支付宝/微信/银行/Steam/微博）
- Connection health panel with live status / 连接健康面板（实时状态）
- History grouped by day (today / yesterday / earlier), weekly & monthly reports, one-click summary sharing / 历史按天分组（今日/昨天/更早）、周报/月报统计、一键复制摘要分享
- Background survival: Android foreground service / PC system tray / 后台保活：Android 前台服务、PC 最小化到系统托盘
- Statistics panel, clipboard history, Web console, desktop widget / 统计面板、剪贴板历史、Web 控制台、手机桌面小组件
- Desktop clients for Windows / macOS / Linux, mobile client as Android APK / PC 端支持 Windows / macOS / Linux，手机端为 Android APK

## Structure / 目录结构（PC 端与手机端代码分离）

```
CodeBridge/
├── pc-client/        PC 客户端（Windows / macOS / Linux，Electron）
│   ├── src/main/     主进程：局域网服务、上岛、剪贴板、设置
│   └── src/renderer/ 玻璃拟态 UI（index.html / styles.css / app.js）
├── android-app/      手机客户端（Android APK，Kotlin + Jetpack Compose）
│   └── app/src/main/java/com/phonetopc/copycode/
│       ├── data/     设置、验证码提取、发送
│       ├── service/  通知监听、短信广播
│       └── ui/       Compose 界面
├── docs/             文档（架构 / 协议 / 构建）
├── releases/<version>/  发布产物（APK、PC 安装包等）
└── README.md
```

## Quick Start (PC) / PC 端快速开始

```bash
cd pc-client
npm install
npm start
```

Open **Settings** to view the LAN address (e.g. `http://192.168.1.100:9841`), then fill it in on the phone app.
在「设置」中查看局域网地址（如 `http://192.168.1.100:9841`），然后在手机端填写该地址。

## Quick Start (Android) / 手机端快速开始

1. Build the APK (see `docs/构建指南.md`) or use a prebuilt release.
2. Grant **Notification access** (通知使用权) in the app — required to read SMS-code notifications.
3. Fill in the PC LAN address and Token, then enable auto-forward.
4. PC client: enable auto-copy / auto-island / clipboard-restore in Settings as needed.

## WinIsland Integration / 与 WinIsland 联动

The PC client's “上岛” action calls WinIsland's push API (default `http://127.0.0.1:9840`),
showing the code as a dynamic-island card. Enable “上岛 API” in WinIsland settings and configure the Token first.
See `docs/协议说明.md` for the protocol.

PC 端「上岛」会调用 WinIsland 的上岛 API（默认 `http://127.0.0.1:9840`），把验证码以灵动岛卡片展示。需先在 WinIsland 设置中启用「上岛 API」并配置 Token。

## Troubleshooting / 疑难排查

- Phone cannot install any APK (`INSTALL_FAILED_VERIFICATION_FAILURE`) on some custom ROMs:
  see `docs/手机端疑难排查.md` — set `adb shell setprop persist.sys.whitelistapp false`.
- Phone cannot reach PC (`Cleartext HTTP traffic ... not permitted`): the app already enables cleartext HTTP.

## Version / 版本

Current version: `1.0.3beta` (local beta, not published to GitHub).
当前版本：`1.0.3beta`（本地 Beta，未上传 GitHub）。

### 1.0.3beta
- 修复：移除手机端「发送测试码 / 测试气泡」按钮，彻底解决 PC 反复弹「测试：123456」的问题
- 修复：自动清理旧版本遗留的断线缓存测试码，不再恢复连接后反复补发 123456
- 调整：默认只转发系统短信验证码（新增「仅短信验证码」开关），不再转发微信/QQ 等应用通知；仅在关闭该开关后才按关键词转发应用通知
- 版本号升级：Android versionCode 11 / versionName 1.0.3beta

### 1.0.3
- 修复：PC 主界面支持鼠标滚轮滚动（子卡片防压缩、历史列表自适应高度）
- 修复：扫码配对二维码 host 取到对象导致手机连不上（改用 address 并优先局域网网段），二维码提示显示 IP 地址、生成失败提示
- 手机端扫码配对严格校验 host、相机打开失败提示
- 多 PC 推送：同时推送至所有已配置 PC，可在手机端设置中开关
- 连接健康面板、验证码类型上岛样式、平台模板库
- 历史按天分组（今日/昨天/更早）、周报/月报、历史摘要分享
- 引导选中输入框后自动输入验证码、PC 反向剪贴板已移除

### 1.0.2
- 新增剪贴板自动恢复：收到验证码自动复制，N 秒后恢复为原剪贴板内容（可配置）
- 主界面支持鼠标滚轮滚动、扫码配对优化、自动搜索局域网 PC 并去重
- 新增 Web 控制台、桌面小组件、统计面板、剪贴板历史

## License / 许可

MIT
