<div align="center">

**🌐 选择语言 / Select Language**

[简体中文](#简体中文) · [繁體中文](#繁體中文) · [English](#english) · [Español](#español) · [Français](#français) · [العربية](#العربية) · [Русский](#русский) · [Português](#português)

</div>

> **说明 / Note**: 以简体中文为标准 · Simplified Chinese is the standard reference.

---

## 简体中文

## CodeBridge

> 🌐 官网: [https://codebridge.judekwong.com](https://codebridge.judekwong.com)

> 通过局域网将手机验证码桥接至 PC。展示、一键复制、全功能可配置。现代化玻璃拟态 UI。

当手机收到短信验证码后，CodeBridge 通过局域网实时转发到 PC。PC 端以液态玻璃（玻璃拟态）风格界面展示，支持推送到 WinIsland 灵动岛、一键/自动复制到剪贴板，所有行为均可配置。

## 功能特性

- 手机 → PC 局域网实时转发
- 液态玻璃拟态 UI（圆角 + 动画）
- 一键复制、自动复制、**自动复制后 N 秒恢复原剪贴板**
- 推送到 WinIsland 灵动岛（自动/手动），单行紧凑显示，不影响灵动岛宽度
- 全部可配置：PC 地址、端口、Token、自动转发、自动复制、自动上岛、恢复时长、图标、正则
- 验证码 HTTPS 加密传输（PC 自签证书 + 手机端证书固定，防局域网窃听）
- 自动搜索局域网 PC 客户端、多 PC 配置保存切换、二维码扫码配对
- 多 PC 推送：同时推送至**所有已配置 PC**（可开关）
- 验证码类型识别（登录/支付/注册/解锁）上岛样式与单独项设置
- 平台模板库（淘宝/支付宝/微信/银行/Steam/微博）
- 连接健康面板（实时状态）
- 历史按天分组（今日/昨天/更早）、周报/月报统计、一键复制摘要分享
- 后台保活：Android 前台服务、PC 最小化到系统托盘
- 统计面板、剪贴板历史、Web 控制台、手机桌面小组件
- PC 端支持 Windows / macOS / Linux，手机端为 Android APK

## 目录结构（PC 端与手机端代码分离）

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

## PC 端快速开始

```bash
cd pc-client
npm install
npm start
```

打开**设置**查看局域网地址（如 `http://192.168.1.100:9841`），然后在手机端填写该地址。

## 手机端快速开始

1. 构建 APK（见 `docs/构建指南.md`）或使用预构建的发布版本。
2. 在应用中授予**通知使用权**——读取短信验证码通知所必需。
3. 填写 PC 局域网地址和 Token，然后开启自动转发。
4. PC 端：按需在设置中开启自动复制 / 自动上岛 / 剪贴板恢复。

## 与 WinIsland 联动

PC 端「上岛」会调用 WinIsland 的上岛 API（默认 `http://127.0.0.1:9840`），把验证码以灵动岛卡片展示。需先在 WinIsland 设置中启用「上岛 API」并配置 Token。协议说明见 `docs/协议说明.md`。

## 疑难排查

- 部分定制 ROM 上手机无法安装任何 APK（`INSTALL_FAILED_VERIFICATION_FAILURE`）：见 `docs/手机端疑难排查.md`——设置 `adb shell setprop persist.sys.whitelistapp false`。
- 手机无法连接 PC（`Cleartext HTTP traffic ... not permitted`）：应用已启用明文 HTTP。

## 版本

当前版本：`1.0.4`（最新正式版）。

### 1.0.4
- 新增：手机端手动转发验证码、临时授权码配对（6 位 / 30 秒有效）、局域网设备白名单（默认关闭，手机端主导）、主题「跟随系统 / 深色 / 浅色」（PC + 手机端）、常驻通知显示最新验证码、周报/月报导出 CSV、历史记录显示来源设备、扫码配对携带 PC 主机名、PC 收码记录设备名
- 调整：开机自启默认关闭（可在设置中开启）
- 修复：10086 / 10010 / 10000 等运营商、106 短信通道、95/96 银行服务号不再被当作验证码；独立数字串须带验证码上下文关键词才采纳
- 修复：只推送最新验证码——同来源同验证码 60 秒内去重，合并短信只取正文最后（最新）一条，旧通知未划走也不会重复推送旧验证码
- 版本号：Android versionCode 13 / versionName 1.0.4

### 1.0.3
- 移除「自动输入到输入框」功能（收到验证码后自动键入到焦点输入框）；保留自动复制 / 复制后恢复剪贴板，上岛按钮点击恒为复制
- 修复：移除手机端「发送测试码 / 测试气泡」按钮，彻底解决 PC 反复弹「测试：123456」的问题
- 修复：自动清理旧版本遗留的断线缓存测试码，不再恢复连接后反复补发 123456
- 调整：默认只转发系统短信验证码（新增「仅短信验证码」开关），不再转发微信/QQ 等应用通知；仅在关闭该开关后才按关键词转发应用通知
- 修复：PC 主界面支持鼠标滚轮滚动（子卡片防压缩、历史列表自适应高度）
- 修复：扫码配对二维码 host 取到对象导致手机连不上（改用 address 并优先局域网网段），二维码提示显示 IP 地址、生成失败提示
- 手机端扫码配对严格校验 host、相机打开失败提示
- 多 PC 推送：同时推送至所有已配置 PC，可在手机端设置中开关
- 连接健康面板、验证码类型上岛样式、平台模板库
- 历史按天分组（今日/昨天/更早）、周报/月报、历史摘要分享
- PC 反向剪贴板已移除
- 版本号升级：Android versionCode 12 / versionName 1.0.3

### 1.0.2
- 新增剪贴板自动恢复：收到验证码自动复制，N 秒后恢复为原剪贴板内容（可配置）
- 主界面支持鼠标滚轮滚动、扫码配对优化、自动搜索局域网 PC 并去重
- 新增 Web 控制台、桌面小组件、统计面板、剪贴板历史

## 许可

MIT

---

## 繁體中文

## CodeBridge

> 🌐 官網: [https://codebridge.judekwong.com](https://codebridge.judekwong.com)

> 透過區域網路將手機驗證碼橋接至 PC。展示、一鍵複製、全功能可設定。現代化玻璃擬態 UI。

當手機收到簡訊驗證碼後，CodeBridge 會透過區域網路即時轉發到 PC。PC 端以液態玻璃（玻璃擬態）風格介面展示，支援推送到 WinIsland 動態島、一鍵/自動複製到剪貼簿，所有行為均可設定。

## 功能特性

- 手機 → PC 區域網路即時轉發
- 液態玻璃擬態 UI（圓角 + 動畫）
- 一鍵複製、自動複製、**自動複製後 N 秒還原原剪貼簿**
- 推送到 WinIsland 動態島（自動/手動），單行緊湊顯示，不影響動態島寬度
- 全部可設定：PC 位址、連接埠、Token、自動轉發、自動複製、自動上島、還原時長、圖示、正規表示式
- 驗證碼 HTTPS 加密傳輸（PC 自簽憑證 + 手機端憑證固定，防止區域網路竊聽）
- 自動搜尋區域網路 PC 用戶端、多 PC 設定儲存切換、QR Code 掃碼配對
- 多 PC 推送：同時推送至**所有已設定的 PC**（可開關）
- 驗證碼類型辨識（登入/支付/註冊/解鎖）上島樣式與單獨項目設定
- 平台範本庫（淘寶/支付寶/微信/銀行/Steam/微博）
- 連線健康面板（即時狀態）
- 歷史按天分組（今日/昨天/更早）、週報/月報統計、一鍵複製摘要分享
- 背景保活：Android 前景服務、PC 最小化到系統匣
- 統計面板、剪貼簿歷史、Web 主控台、手機桌面小工具
- PC 端支援 Windows / macOS / Linux，手機端為 Android APK

## 目錄結構（PC 端與手機端程式碼分離）

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

## PC 端快速開始

```bash
cd pc-client
npm install
npm start
```

開啟**設定**查看區域網路位址（如 `http://192.168.1.100:9841`），然後在手機端填寫該位址。

## 手機端快速開始

1. 建置 APK（見 `docs/构建指南.md`）或使用預先建置好的發行版本。
2. 在應用程式中授予**通知使用權**——讀取簡訊驗證碼通知所必需。
3. 填寫 PC 區域網路位址與 Token，然後開啟自動轉發。
4. PC 端：依需求在設定中開啟自動複製 / 自動上島 / 剪貼簿還原。

## 與 WinIsland 聯動

PC 端的「上島」動作會呼叫 WinIsland 的上島 API（預設 `http://127.0.0.1:9840`），將驗證碼以動態島卡片展示。需先在 WinIsland 設定中啟用「上島 API」並設定 Token。協定說明請見 `docs/协议说明.md`。

## 疑難排解

- 部分自訂 ROM 上手機無法安裝任何 APK（`INSTALL_FAILED_VERIFICATION_FAILURE`）：請見 `docs/手机端疑难排查.md`——設定 `adb shell setprop persist.sys.whitelistapp false`。
- 手機無法連線到 PC（`Cleartext HTTP traffic ... not permitted`）：應用程式已啟用明文 HTTP。

## 版本

目前版本：`1.0.4`（最新正式版）。

### 1.0.4
- 新增：手機端手動轉發驗證碼、臨時授權碼配對（6 位數 / 30 秒有效）、區域網路裝置白名單（預設關閉，由手機端主導）、主題「跟隨系統 / 深色 / 淺色」（PC + 手機端）、常駐通知顯示最新驗證碼、週報/月報匯出 CSV、歷史記錄顯示來源裝置、掃碼配對攜帶 PC 主機名稱、PC 收碼記錄裝置名稱
- 調整：開機自動啟動預設關閉（可在設定中開啟）
- 修復：10086 / 10010 / 10000 等電信業者、106 簡訊通道、95/96 銀行服務號不再被視為驗證碼；獨立數字字串須帶有驗證碼上下文關鍵詞才採用
- 修復：只推送最新驗證碼——同來源同驗證碼 60 秒內去重，合併簡訊只取內文最後（最新）一則，舊通知未滑掉也不會重複推送舊驗證碼
- 版本號碼：Android versionCode 13 / versionName 1.0.4

### 1.0.3
- 移除「自動輸入到輸入框」功能（收到驗證碼後自動輸入到焦點輸入框）；保留自動複製 / 複製後還原剪貼簿，上島按鈕點擊恆為複製
- 修復：移除手機端「傳送測試碼 / 測試氣泡」按鈕，徹底解決 PC 反覆彈出「測試：123456」的問題
- 修復：自動清理舊版本遺留的斷線快取測試碼，不再於恢復連線後反覆補發 123456
- 調整：預設只轉發系統簡訊驗證碼（新增「僅簡訊驗證碼」開關），不再轉發微信/QQ 等應用程式通知；僅在關閉該開關後才依關鍵詞轉發應用程式通知
- 修復：PC 主介面支援滑鼠滾輪捲動（子卡片防止壓縮、歷史列表自動調整高度）
- 修復：掃碼配對 QR Code 的 host 取成物件導致手機連不上（改用 address 並優先區域網路網段），QR Code 提示顯示 IP 位址、產生失敗提示
- 手機端掃碼配對嚴格驗證 host、相機開啟失敗提示
- 多 PC 推送：同時推送至所有已設定的 PC，可在手機端設定中開關
- 連線健康面板、驗證碼類型上島樣式、平台範本庫
- 歷史按天分組（今日/昨天/更早）、週報/月報、歷史摘要分享
- PC 反向剪貼簿已移除
- 版本號碼升級：Android versionCode 12 / versionName 1.0.3

### 1.0.2
- 新增剪貼簿自動還原：收到驗證碼自動複製，N 秒後還原為原剪貼簿內容（可設定）
- 主介面支援滑鼠滾輪捲動、掃碼配對最佳化、自動搜尋區域網路 PC 並去重
- 新增 Web 主控台、桌面小工具、統計面板、剪貼簿歷史

## 授權

MIT

---

## English

## CodeBridge

> 🌐 Website: [https://codebridge.judekwong.com](https://codebridge.judekwong.com)

> Bridge SMS verification codes from your phone to PC over LAN. Display, one-click copy, fully configurable. Modern glassmorphism UI.

When your phone receives an SMS verification code, CodeBridge forwards it to your PC over the local network in real time. The PC client shows it in a modern glassmorphism UI with rounded corners and animations, and can push it to the WinIsland Dynamic Island or copy it to the clipboard — all fully configurable.

## Features

- Real-time forwarding of SMS codes from phone to PC over LAN
- Glassmorphism UI with rounded corners and animations
- One-click copy, auto-copy, and **auto-restore clipboard** after N seconds
- Push to WinIsland Dynamic Island (auto / manual), single-line compact display, does not widen the island
- Fully configurable: PC host, port, token, auto-forward, auto-copy, auto-island, restore duration, icon, regex
- End-to-end TLS encryption (HTTPS + certificate pinning) — PC self-signed certificate + mobile certificate pinning, prevents LAN eavesdropping
- Auto-search PC clients on LAN, multi-PC profiles, QR-code pairing
- Push codes to **all configured PCs** at once (toggleable)
- Code-type recognition (login / payment / register / unlock) with per-type island styling and per-item settings
- Platform template library (Taobao / Alipay / WeChat / banks / Steam / Weibo)
- Connection health panel with live status
- History grouped by day (today / yesterday / earlier), weekly & monthly reports, one-click summary sharing
- Background keep-alive: Android foreground service / PC minimizes to system tray
- Statistics panel, clipboard history, web console, desktop widget
- Desktop clients for Windows / macOS / Linux, mobile client as Android APK

## Directory Structure (PC and mobile code are separated)

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

## Quick Start (PC)

```bash
cd pc-client
npm install
npm start
```

Open **Settings** to view the LAN address (e.g. `http://192.168.1.100:9841`), then fill it in on the phone app.

## Quick Start (Android)

1. Build the APK (see `docs/构建指南.md`) or use a prebuilt release.
2. Grant **Notification access** in the app — required to read SMS-code notifications.
3. Fill in the PC LAN address and Token, then enable auto-forward.
4. PC client: enable auto-copy / auto-island / clipboard-restore in Settings as needed.

## WinIsland Integration

The PC client's “island push” action calls WinIsland's push API (default `http://127.0.0.1:9840`), showing the code as a Dynamic Island card. Enable “Island Push API” in WinIsland settings and configure the Token first. See `docs/协议说明.md` for the protocol.

## Troubleshooting

- Phone cannot install any APK (`INSTALL_FAILED_VERIFICATION_FAILURE`) on some custom ROMs: see `docs/手机端疑难排查.md` — set `adb shell setprop persist.sys.whitelistapp false`.
- Phone cannot reach PC (`Cleartext HTTP traffic ... not permitted`): the app already enables cleartext HTTP.

## Version

Current version: `1.0.4` (latest release).

### 1.0.4
- New: manual forwarding of verification codes in the mobile client, temporary authorization-code pairing (6 digits / valid for 30 seconds), LAN device whitelist (off by default, managed from the mobile client), theme “follow system / dark / light” (PC + mobile client), persistent notification showing the latest verification code, weekly/monthly report export to CSV, history shows the source device, QR-code pairing carries the PC hostname, PC records the device name when receiving codes
- Changed: auto-start on boot is off by default (can be enabled in Settings)
- Fix: carriers such as 10086 / 10010 / 10000, the 106 SMS channel, and 95/96 bank service numbers are no longer treated as verification codes; standalone numeric strings are adopted only when they contain verification-code context keywords
- Fix: only the latest verification code is pushed — deduplication within 60 seconds for the same source and the same code, merged SMS only takes the last (latest) message body, and old notifications that are not swiped away will not re-push old codes
- Version: Android versionCode 13 / versionName 1.0.4

### 1.0.3
- Removed the “auto-type into input field” feature (auto-typing the code into the focused input field after receipt); kept auto-copy / clipboard restore after copy, and clicking the island button always copies
- Fix: removed the “send test code / test bubble” button from the mobile client, completely resolving the issue of the PC repeatedly popping up “Test: 123456”
- Fix: automatically cleans up leftover offline-cached test codes from older versions; no longer repeatedly re-sends 123456 after reconnecting
- Changed: by default only system SMS verification codes are forwarded (new “SMS codes only” toggle); app notifications such as WeChat/QQ are no longer forwarded; app notifications are forwarded by keyword only when this toggle is off
- Fix: PC main window supports mouse-wheel scrolling (sub-cards protected from compression, history list auto-adapts its height)
- Fix: QR-pairing QR code host resolved to an object, preventing the phone from connecting (switched to address, preferring the LAN subnet); QR hint shows the IP address and generation-failure hints
- Mobile client strictly validates host during QR pairing, shows a camera-open failure hint
- Multi-PC push: push to all configured PCs at once, toggleable in mobile settings
- Connection health panel, per-code-type island styling, platform template library
- History grouped by day (today / yesterday / earlier), weekly & monthly reports, history summary sharing
- PC reverse clipboard removed
- Version bump: Android versionCode 12 / versionName 1.0.3

### 1.0.2
- Added automatic clipboard restore: auto-copy the code on receipt, then restore the original clipboard content after N seconds (configurable)
- Main window supports mouse-wheel scrolling, QR-pairing improvements, auto-search LAN PCs with deduplication
- Added web console, desktop widget, statistics panel, clipboard history

## License

MIT

---

## Español

## CodeBridge

> 🌐 Sitio web: [https://codebridge.judekwong.com](https://codebridge.judekwong.com)

> Puentea los códigos de verificación por SMS del teléfono al PC a través de la LAN. Visualización, copia con un clic, totalmente configurable. UI de vidrio esmerilado moderna.

Cuando el teléfono recibe un código de verificación por SMS, CodeBridge lo reenvía al PC a través de la red local en tiempo real. El cliente de PC lo muestra en una interfaz moderna de vidrio esmerilado (glassmorphism) con esquinas redondeadas y animaciones, y puede enviarlo a la Isla Dinámica de WinIsland o copiarlo al portapapeles — todo totalmente configurable.

## Características

- Reenvío en tiempo real de códigos SMS del teléfono al PC a través de la LAN
- UI de glassmorphism con esquinas redondeadas y animaciones
- Copia con un clic, copia automática y **restauración automática del portapapeles** después de N segundos
- Envío a la Isla Dinámica de WinIsland (automático / manual), visualización compacta de una sola línea, no ensancha la isla
- Totalmente configurable: dirección del PC, puerto, Token, reenvío automático, copia automática, isla automática, duración de la restauración, icono, regex
- Cifrado TLS de extremo a extremo (HTTPS + fijación de certificados): certificado autofirmado del PC + fijación de certificados en el cliente móvil, evita la escucha en la LAN
- Búsqueda automática de clientes de PC en la LAN, perfiles de varios PC, emparejamiento con código QR
- Envío a **todos los PC configurados** a la vez (activable/desactivable)
- Reconocimiento del tipo de código (inicio de sesión / pago / registro / desbloqueo) con estilos de isla por tipo y ajustes por elemento
- Biblioteca de plantillas de plataformas (Taobao / Alipay / WeChat / bancos / Steam / Weibo)
- Panel de salud de la conexión con estado en tiempo real
- Historial agrupado por día (hoy / ayer / anterior), informes semanales y mensuales, uso compartido del resumen con un clic
- Mantenimiento en segundo plano: servicio en primer plano de Android, el PC se minimiza a la bandeja del sistema
- Panel de estadísticas, historial del portapapeles, consola web, widget de escritorio del teléfono
- Clientes de escritorio para Windows / macOS / Linux, cliente móvil como APK de Android

## Estructura (el código de PC y móvil está separado)

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

## Inicio rápido (PC)

```bash
cd pc-client
npm install
npm start
```

Abre **Ajustes** para ver la dirección de la LAN (p. ej. `http://192.168.1.100:9841`) y luego complétala en la aplicación del teléfono.

## Inicio rápido (Android)

1. Compila el APK (consulta `docs/构建指南.md`) o usa una versión precompilada.
2. Concede **Acceso a notificaciones** en la aplicación: necesario para leer las notificaciones de los códigos por SMS.
3. Completa la dirección LAN del PC y el Token, y activa el reenvío automático.
4. Cliente de PC: activa en Ajustes la copia automática / isla automática / restauración del portapapeles según sea necesario.

## Integración con WinIsland

La acción de «subir a la isla» del cliente de PC llama a la API de envío de WinIsland (por defecto `http://127.0.0.1:9840`) y muestra el código como una tarjeta de la Isla Dinámica. Primero habilita la «API de isla» en los ajustes de WinIsland y configura el Token. Consulta `docs/协议说明.md` para ver el protocolo.

## Solución de problemas

- El teléfono no puede instalar ningún APK (`INSTALL_FAILED_VERIFICATION_FAILURE`) en algunas ROMs personalizadas: consulta `docs/手机端疑难排查.md` — ejecuta `adb shell setprop persist.sys.whitelistapp false`.
- El teléfono no puede alcanzar el PC (`Cleartext HTTP traffic ... not permitted`): la aplicación ya habilita el tráfico HTTP en claro.

## Versión

Versión actual: `1.0.4` (última versión publicada).

### 1.0.4
- Nuevo: reenvío manual de los códigos de verificación en el cliente móvil, emparejamiento con código de autorización temporal (6 dígitos / válido 30 segundos), lista blanca de dispositivos de la LAN (desactivada por defecto, gestionada desde el cliente móvil), tema «seguir el sistema / oscuro / claro» (PC + cliente móvil), notificación persistente que muestra el último código de verificación, exportación de los informes semanales/mensuales a CSV, historial con el dispositivo de origen, emparejamiento por QR que incluye el nombre de host del PC, el PC registra el nombre del dispositivo al recibir códigos
- Ajuste: el inicio automático al encender está desactivado por defecto (se puede activar en Ajustes)
- Corrección: los operadores como 10086 / 10010 / 10000, el canal de SMS 106 y los números de servicio bancario 95/96 ya no se tratan como códigos de verificación; las cadenas numéricas aisladas solo se adoptan si incluyen palabras clave de contexto de código de verificación
- Corrección: solo se envía el último código de verificación: deduplicación en 60 segundos para el mismo origen y el mismo código, los SMS combinados solo toman el último mensaje, y las notificaciones antiguas no deslizadas no vuelven a enviar códigos antiguos
- Número de versión: Android versionCode 13 / versionName 1.0.4

### 1.0.3
- Se eliminó la función de «escritura automática en el campo de entrada» (teclear automáticamente el código en el campo enfocado al recibirlo); se mantienen la copia automática / restauración del portapapeles tras la copia, y hacer clic en el botón de la isla siempre copia
- Corrección: se eliminó el botón de «enviar código de prueba / burbuja de prueba» del cliente móvil, lo que resuelve por completo el problema de que el PC mostrara repetidamente «Prueba: 123456»
- Corrección: limpieza automática de los códigos de prueba en caché de desconexión dejados por versiones antiguas; ya no se vuelve a enviar 123456 tras restablecer la conexión
- Ajuste: por defecto solo se reenvían los códigos de verificación SMS del sistema (nuevo interruptor «solo códigos SMS»); ya no se reenvían las notificaciones de aplicaciones como WeChat/QQ; las notificaciones de aplicaciones solo se reenvían por palabra clave si se desactiva este interruptor
- Corrección: la ventana principal del PC admite el desplazamiento con la rueda del ratón (las sub-tarjetas no se comprimen, la lista de historial adapta su altura)
- Corrección: el host del código QR de emparejamiento se resolvía como un objeto e impedía que el teléfono se conectara (se usa address y se prioriza la subred de la LAN); el aviso del QR muestra la dirección IP y avisos de error de generación
- El cliente móvil valida estrictamente el host en el emparejamiento por QR y muestra un aviso si falla la cámara
- Envío a varios PC: envío simultáneo a todos los PC configurados, activable desde los ajustes del móvil
- Panel de salud de la conexión, estilos de isla por tipo de código, biblioteca de plantillas de plataformas
- Historial agrupado por día (hoy / ayer / anterior), informes semanales/mensuales, uso compartido del resumen del historial
- Se eliminó el portapapeles inverso del PC
- Actualización de versión: Android versionCode 12 / versionName 1.0.3

### 1.0.2
- Nueva restauración automática del portapapeles: copia automática al recibir el código y restauración del contenido original del portapapeles tras N segundos (configurable)
- La ventana principal admite el desplazamiento con la rueda del ratón, mejoras en el emparejamiento por QR y búsqueda automática de PC en la LAN con deduplicación
- Se añadieron la consola web, el widget de escritorio, el panel de estadísticas y el historial del portapapeles

## Licencia

MIT

---

## Français

## CodeBridge

> 🌐 Site web : [https://codebridge.judekwong.com](https://codebridge.judekwong.com)

> Relaie les codes de vérification par SMS du téléphone vers le PC via le réseau local. Affichage, copie en un clic, entièrement configurable. Interface glassmorphism moderne.

Lorsque votre téléphone reçoit un code de vérification par SMS, CodeBridge le transmet en temps réel à votre PC via le réseau local. Le client PC l'affiche dans une interface glassmorphism moderne (effet verre dépoli) avec des coins arrondis et des animations, et peut l'envoyer vers l'Île dynamique de WinIsland ou le copier dans le presse-papiers — le tout entièrement configurable.

## Fonctionnalités

- Transfert en temps réel des codes SMS du téléphone vers le PC via le réseau local
- Interface glassmorphism (effet verre dépoli) avec coins arrondis et animations
- Copie en un clic, copie automatique et **restauration automatique du presse-papiers** après N secondes
- Envoi vers l'Île dynamique de WinIsland (automatique / manuel), affichage compact sur une seule ligne, n'élargit pas l'île
- Entièrement configurable : adresse du PC, port, Token, transfert automatique, copie automatique, île automatique, durée de restauration, icône, regex
- Chiffrement TLS de bout en bout (HTTPS + épinglage de certificat) : certificat auto-signé du PC + épinglage de certificat côté client mobile, protège contre l'écoute sur le réseau local
- Recherche automatique des clients PC sur le réseau local, profils multi-PC, appairage par code QR
- Envoi à **tous les PC configurés** en même temps (activable)
- Reconnaissance du type de code (connexion / paiement / inscription / déverrouillage) avec styles d'île par type et réglages par élément
- Bibliothèque de modèles de plateformes (Taobao / Alipay / WeChat / banques / Steam / Weibo)
- Panneau de santé de la connexion avec statut en temps réel
- Historique groupé par jour (aujourd'hui / hier / plus ancien), rapports hebdomadaires et mensuels, partage du résumé en un clic
- Maintien en arrière-plan : service au premier plan Android, le PC se réduit dans la barre d'état système
- Panneau de statistiques, historique du presse-papiers, console web, widget de bureau du téléphone
- Clients de bureau pour Windows / macOS / Linux, client mobile sous forme d'APK Android

## Structure (le code PC et mobile sont séparés)

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

## Démarrage rapide (PC)

```bash
cd pc-client
npm install
npm start
```

Ouvrez **Réglages** pour afficher l'adresse du réseau local (p. ex. `http://192.168.1.100:9841`), puis saisissez-la dans l'application du téléphone.

## Démarrage rapide (Android)

1. Compilez l'APK (voir `docs/构建指南.md`) ou utilisez une version précompilée.
2. Accordez l'**accès aux notifications** dans l'application — nécessaire pour lire les notifications de codes SMS.
3. Saisissez l'adresse LAN du PC et le Token, puis activez le transfert automatique.
4. Client PC : activez la copie automatique / l'île automatique / la restauration du presse-papiers dans les réglages selon vos besoins.

## Intégration WinIsland

L'action « monter sur l'île » du client PC appelle l'API d'envoi de WinIsland (par défaut `http://127.0.0.1:9840`) et affiche le code sous forme de carte de l'Île dynamique. Activez d'abord l'« API d'île » dans les réglages de WinIsland et configurez le Token. Voir `docs/协议说明.md` pour le protocole.

## Dépannage

- Sur certaines ROM personnalisées, le téléphone ne peut installer aucun APK (`INSTALL_FAILED_VERIFICATION_FAILURE`) : voir `docs/手机端疑难排查.md` — définissez `adb shell setprop persist.sys.whitelistapp false`.
- Le téléphone ne peut pas joindre le PC (`Cleartext HTTP traffic ... not permitted`) : l'application active déjà le trafic HTTP en clair.

## Version

Version actuelle : `1.0.4` (dernière version publiée).

### 1.0.4
- Nouveautés : transfert manuel des codes de vérification sur le client mobile, appairage par code d'autorisation temporaire (6 chiffres / valable 30 secondes), liste blanche d'appareils du réseau local (désactivée par défaut, gérée depuis le client mobile), thème « suivre le système / sombre / clair » (PC + client mobile), notification persistante affichant le dernier code de vérification, export hebdomadaire/mensuel en CSV, historique indiquant l'appareil source, appairage par QR incluant le nom d'hôte du PC, le PC enregistre le nom de l'appareil à la réception des codes
- Ajustement : le démarrage automatique au démarrage est désactivé par défaut (activable dans les réglages)
- Correction : les opérateurs tels que 10086 / 10010 / 10000, le canal SMS 106 et les numéros de service bancaire 95/96 ne sont plus traités comme des codes de vérification ; les chaînes numériques isolées ne sont adoptées que si elles contiennent des mots-clés contextuels de code de vérification
- Correction : seul le dernier code de vérification est envoyé — déduplication à 60 secondes pour la même source et le même code, les SMS fusionnés ne prennent que le dernier message, et les anciennes notifications non balayées ne renvoient pas d'anciens codes
- Numéro de version : Android versionCode 13 / versionName 1.0.4

### 1.0.3
- Suppression de la fonction « saisie automatique dans le champ de saisie » (saisie automatique du code dans le champ focalisé à la réception) ; la copie automatique / la restauration du presse-papiers après copie sont conservées, et cliquer sur le bouton d'île copie toujours
- Correction : suppression du bouton « envoyer un code de test / bulle de test » du client mobile, ce qui résout complètement le problème des fenêtres répétées « Test : 123456 » sur le PC
- Correction : nettoyage automatique des codes de test en cache de déconnexion laissés par les anciennes versions ; 123456 n'est plus renvoyé après la reconnexion
- Ajustement : par défaut, seuls les codes de vérification SMS système sont transférés (nouvel interrupteur « codes SMS uniquement ») ; les notifications d'applications comme WeChat/QQ ne sont plus transférées ; les notifications d'applications ne sont transférées par mot-clé que si cet interrupteur est désactivé
- Correction : la fenêtre principale du PC prend en charge le défilement à la molette de la souris (les sous-cartes ne sont pas compressées, la liste d'historique s'adapte à la hauteur)
- Correction : le host du QR d'appairage était résolu en un objet, empêchant le téléphone de se connecter (utilisation de address en privilégiant le sous-réseau LAN) ; l'indication du QR affiche l'adresse IP et les erreurs de génération
- Le client mobile valide strictement le host lors de l'appairage par QR et affiche une erreur si la caméra ne s'ouvre pas
- Envoi multi-PC : envoi simultané à tous les PC configurés, activable dans les réglages du mobile
- Panneau de santé de la connexion, styles d'île par type de code, bibliothèque de modèles de plateformes
- Historique groupé par jour (aujourd'hui / hier / plus ancien), rapports hebdomadaires/mensuels, partage du résumé de l'historique
- Presse-papiers inversé du PC supprimé
- Mise à jour de version : Android versionCode 12 / versionName 1.0.3

### 1.0.2
- Nouvelle restauration automatique du presse-papiers : copie automatique à la réception, restauration du contenu d'origine du presse-papiers après N secondes (configurable)
- La fenêtre principale prend en charge le défilement à la molette, améliorations de l'appairage par QR et recherche automatique des PC sur le réseau local avec déduplication
- Ajout de la console web, du widget de bureau, du panneau de statistiques et de l'historique du presse-papiers

## Licence

MIT

---

## العربية

## CodeBridge

> 🌐 الموقع الرسمي: [https://codebridge.judekwong.com](https://codebridge.judekwong.com)

> يربط CodeBridge رموز التحقق من الرسائل النصية بين هاتفك والكمبيوتر عبر الشبكة المحلية. عرض، نسخ بنقرة واحدة، قابل للتكوين بالكامل. واجهة زجاجية مصنفرة حديثة.

عندما يتلقى هاتفك رمز تحقق عبر رسالة نصية، يقوم CodeBridge بإعادة توجيهه إلى الكمبيوتر عبر الشبكة المحلية في الوقت الفعلي. يعرضه تطبيق الكمبيوتر بواجهة زجاجية مصنفرة حديثة ذات زوايا دائرية ورسوم متحركة، ويمكنه دفعه إلى الجزيرة الديناميكية في WinIsland أو نسخه إلى الحافظة — كل ذلك قابل للتكوين بالكامل.

## الميزات

- إعادة توجيه رموز الرسائل النصية من الهاتف إلى الكمبيوتر عبر الشبكة المحلية في الوقت الفعلي
- واجهة بتأثير الزجاج المصنفر (glassmorphism) بزوايا دائرية ورسوم متحركة
- نسخ بنقرة واحدة، نسخ تلقائي، و**استعادة تلقائية للحافظة** بعد N ثانية
- الدفع إلى الجزيرة الديناميكية في WinIsland (تلقائي / يدوي)، عرض مضغوط بسطر واحد، لا يوسّع الجزيرة
- قابل للتكوين بالكامل: عنوان الكمبيوتر، المنفذ، Token، إعادة التوجيه التلقائية، النسخ التلقائي، الدفع التلقائي إلى الجزيرة، مدة الاستعادة، الأيقونة، regex
- تشفير TLS من طرف إلى طرف (HTTPS + تثبيت الشهادة): شهادة موقّعة ذاتيًا من الكمبيوتر + تثبيت الشهادة في تطبيق الهاتف، يمنع التنصت على الشبكة المحلية
- البحث التلقائي عن عملاء الكمبيوتر في الشبكة المحلية، ملفات تعريف لعدة أجهزة كمبيوتر، الإقران بمسح رمز QR
- دفع الرموز إلى **جميع أجهزة الكمبيوتر المكوّنة** دفعة واحدة (قابل للتفعيل/الإيقاف)
- التعرف على نوع الرمز (تسجيل الدخول / الدفع / التسجيل / فتح القفل) مع أنماط الجزيرة حسب النوع وإعدادات لكل عنصر
- مكتبة قوالب المنصات (Taobao / Alipay / WeChat / البنوك / Steam / Weibo)
- لوحة صحة الاتصال مع حالة مباشرة
- سجل مجمّع حسب اليوم (اليوم / أمس / قبل ذلك)، تقارير أسبوعية وشهرية، مشاركة الملخص بنقرة واحدة
- البقاء في الخلفية: خدمة أمامية في Android، تصغير الكمبيوتر إلى علبة النظام
- لوحة الإحصائيات، سجل الحافظة، وحدة التحكم على الويب، أداة سطح المكتب
- عملاء سطح المكتب لأنظمة Windows / macOS / Linux، وتطبيق الهاتف كملف APK لنظام Android

## هيكل المشروع (كود الكمبيوتر والهاتف منفصلان)

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

## بدء سريع (الكمبيوتر)

```bash
cd pc-client
npm install
npm start
```

افتح **الإعدادات** لعرض عنوان الشبكة المحلية (مثل `http://192.168.1.100:9841`)، ثم أدخله في تطبيق الهاتف.

## بدء سريع (أندرويد)

1. قم ببناء ملف APK (انظر `docs/构建指南.md`) أو استخدم نسخة مبنية مسبقًا.
2. امنح **إذن الوصول إلى الإشعارات** في التطبيق — مطلوب لقراءة إشعارات رموز الرسائل النصية.
3. أدخل عنوان الشبكة المحلية للكمبيوتر وToken، ثم فعّل إعادة التوجيه التلقائية.
4. تطبيق الكمبيوتر: فعّل في الإعدادات النسخ التلقائي / الدفع التلقائي إلى الجزيرة / استعادة الحافظة حسب الحاجة.

## التكامل مع WinIsland

إجراء «الدفع إلى الجزيرة» في تطبيق الكمبيوتر يستدعي واجهة برمجة التطبيقات للدفع إلى الجزيرة في WinIsland (الافتراضي `http://127.0.0.1:9840`)، ويعرض الرمز كبطاقة للجزيرة الديناميكية. يجب أولاً تفعيل «Island Push API» في إعدادات WinIsland وتكوين Token. راجع `docs/协议说明.md` لمعرفة البروتوكول.

## استكشاف الأخطاء وإصلاحها

- لا يمكن للهاتف تثبيت أي ملف APK (`INSTALL_FAILED_VERIFICATION_FAILURE`) على بعض أنظمة ROM المخصصة: راجع `docs/手机端疑难排查.md` — نفّذ `adb shell setprop persist.sys.whitelistapp false`.
- لا يستطيع الهاتف الوصول إلى الكمبيوتر (`Cleartext HTTP traffic ... not permitted`): التطبيق يفعّل بالفعل حركة HTTP غير المشفرة (cleartext).

## الإصدار

الإصدار الحالي: `1.0.4` (أحدث إصدار رسمي).

### 1.0.4
- جديد: إعادة توجيه يدوية لرموز التحقق في تطبيق الهاتف، إقران برمز تفويض مؤقت (6 أرقام / صالح لمدة 30 ثانية)، قائمة بيضاء لأجهزة الشبكة المحلية (مغلقة افتراضيًا ويديرها تطبيق الهاتف)، سمة «اتباع النظام / داكن / فاتح» (الكمبيوتر + تطبيق الهاتف)، إشعار دائم يعرض أحدث رمز تحقق، تصدير التقارير الأسبوعية/الشهرية إلى CSV، عرض جهاز المصدر في السجل، الإقران بمسح رمز QR يحمل اسم مضيف الكمبيوتر، يسجل الكمبيوتر اسم الجهاز عند استلام الرموز
- تعديل: التشغيل التلقائي عند الإقلاع مغلق افتراضيًا (يمكن تفعيله في الإعدادات)
- إصلاح: أرقام مشغلي الاتصالات مثل 10086 / 10010 / 10000، وقناة الرسائل 106، وأرقام الخدمات المصرفية 95/96 لم تعد تُعتبر رموز تحقق؛ لا تُعتمد السلاسل الرقمية المستقلة إلا إذا تضمنت كلمات مفتاحية لسياق رمز التحقق
- إصلاح: يتم دفع أحدث رمز تحقق فقط — إزالة التكرار خلال 60 ثانية لنفس المصدر ونفس الرمز، والرسائل المدمجة لا تأخذ سوى آخر (أحدث) رسالة، والإشعارات القديمة غير الممسوحة لن تعيد دفع الرموز القديمة
- رقم الإصدار: Android versionCode 13 / versionName 1.0.4

### 1.0.3
- إزالة ميزة «الإدخال التلقائي في حقل الإدخال» (إدخال الرمز تلقائيًا في الحقل المركّز بعد الاستلام)؛ مع الإبقاء على النسخ التلقائي / استعادة الحافظة بعد النسخ، والنقر على زر الجزيرة ينسخ دائمًا
- إصلاح: إزالة زر «إرسال رمز اختبار / فقاعة الاختبار» من تطبيق الهاتف، ما يحل نهائيًا مشكلة ظهور «اختبار: 123456» المتكرر على الكمبيوتر
- إصلاح: تنظيف تلقائي لرموز الاختبار المخزنة مؤقتًا من الإصدارات القديمة بعد انقطاع الاتصال؛ لن يعاد إرسال 123456 بشكل متكرر بعد استعادة الاتصال
- تعديل: افتراضيًا لا تُعاد توجيه سوى رموز التحقق النصية للنظام (مفتاح جديد «رموز SMS فقط»)؛ لم تعد إشعارات التطبيقات مثل WeChat/QQ تُعاد توجيهها؛ لا تُعاد توجيه إشعارات التطبيقات حسب الكلمات المفتاحية إلا عند إيقاف هذا المفتاح
- إصلاح: تدعم النافذة الرئيسية للكمبيوتر التمرير بعجلة الفأرة (حماية البطاقات الفرعية من الانضغاط، وقائمة السجل تضبط ارتفاعها تلقائيًا)
- إصلاح: كان host رمز QR للإقران يُحل إلى كائن ما منع الهاتف من الاتصال (يُستخدم الآن address مع تفضيل الشبكة الفرعية للشبكة المحلية)؛ يعرض تلميح رمز QR عنوان IP وتلميحات فشل الإنشاء
- يتحقق تطبيق الهاتف بدقة من host عند الإقران بمسح رمز QR ويعرض تلميحًا عند فشل فتح الكاميرا
- الدفع إلى عدة أجهزة كمبيوتر: دفع متزامن إلى جميع أجهزة الكمبيوتر المكوّنة، قابل للتفعيل من إعدادات الهاتف
- لوحة صحة الاتصال، أنماط الجزيرة حسب نوع الرمز، مكتبة قوالب المنصات
- السجل مجمّع حسب اليوم (اليوم / أمس / قبل ذلك)، تقارير أسبوعية/شهرية، مشاركة ملخص السجل
- تمت إزالة الحافظة العكسية للكمبيوتر
- ترقية رقم الإصدار: Android versionCode 12 / versionName 1.0.3

### 1.0.2
- إضافة الاستعادة التلقائية للحافظة: نسخ الرمز تلقائيًا عند الاستلام، ثم استعادة محتوى الحافظة الأصلي بعد N ثانية (قابل للتكوين)
- النافذة الرئيسية تدعم التمرير بعجلة الفأرة، تحسينات على الإقران بمسح رمز QR، بحث تلقائي عن أجهزة كمبيوتر في الشبكة المحلية مع إزالة التكرار
- إضافة وحدة التحكم على الويب، وأداة سطح المكتب، ولوحة الإحصائيات، وسجل الحافظة

## الترخيص

MIT

---

## Русский

## CodeBridge

> 🌐 Официальный сайт: [https://codebridge.judekwong.com](https://codebridge.judekwong.com)

> CodeBridge пересылает SMS-коды подтверждения с телефона на ПК по локальной сети. Отображение, копирование в один клик, полная настройка. Современный интерфейс в стиле стеклянного морфизма.

Когда телефон получает SMS-код подтверждения, CodeBridge в реальном времени пересылает его на ПК по локальной сети. ПК-клиент отображает код в современном интерфейсе в стиле стеклянного морфизма (glassmorphism) со скруглёнными углами и анимациями, а также может отправить его на динамический остров WinIsland или скопировать в буфер обмена — все действия полностью настраиваются.

## Возможности

- Пересылка SMS-кодов с телефона на ПК по локальной сети в реальном времени
- Интерфейс в стиле стеклянного морфизма (glassmorphism) со скруглёнными углами и анимациями
- Копирование в один клик, автоматическое копирование и **автоматическое восстановление буфера обмена** через N секунд
- Отправка на динамический остров WinIsland (автоматически / вручную), компактное отображение в одну строку без расширения острова
- Полная настройка: адрес ПК, порт, Token, автоматическая пересылка, автоматическое копирование, автоматическая отправка на остров, длительность восстановления, значок, regex
- Сквозное TLS-шифрование (HTTPS + закрепление сертификата): самоподписанный сертификат ПК + закрепление сертификата в мобильном клиенте для защиты от прослушивания в локальной сети
- Автоматический поиск ПК-клиентов в локальной сети, профили нескольких ПК, сопряжение по QR-коду
- Отправка кодов на **все настроенные ПК** одновременно (можно отключить)
- Распознавание типа кода (вход / оплата / регистрация / разблокировка / другое) со стилями острова по типу и отдельными настройками
- Библиотека шаблонов платформ (Taobao / Alipay / WeChat / банки / Steam / Weibo)
- Панель здоровья соединения (статус в реальном времени)
- История, сгруппированная по дням (сегодня / вчера / раньше), еженедельные и ежемесячные отчёты, публикация сводки в один клик
- Работа в фоне: служба переднего плана Android, сворачивание ПК в системный трей
- Панель статистики, история буфера обмена, Web-консоль, виджет рабочего стола
- ПК-клиенты для Windows / macOS / Linux, мобильный клиент — APK для Android

## Структура (код ПК и мобильного клиента разделён)

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

## Быстрый старт (ПК)

```bash
cd pc-client
npm install
npm start
```

Откройте **Настройки**, чтобы увидеть адрес локальной сети (например, `http://192.168.1.100:9841`), затем введите его в приложении на телефоне.

## Быстрый старт (Android)

1. Соберите APK (см. `docs/构建指南.md`) или используйте готовую сборку из релиза.
2. Предоставьте **доступ к уведомлениям** в приложении — это требуется для чтения уведомлений с кодами подтверждения.
3. Введите адрес локальной сети ПК и Token, затем включите автоматическую пересылку.
4. ПК-клиент: при необходимости включите в настройках автоматическое копирование / автоматическую отправку на остров / восстановление буфера обмена.

## Интеграция с WinIsland

Действие «отправить на остров» в ПК-клиенте вызывает API отправки на остров WinIsland (по умолчанию `http://127.0.0.1:9840`) и отображает код в виде карточки динамического острова. Сначала включите «API отправки на остров» в настройках WinIsland и настройте Token. Протокол описан в `docs/协议说明.md`.

## Устранение неполадок

- На некоторых кастомных прошивках телефон не может установить ни один APK (`INSTALL_FAILED_VERIFICATION_FAILURE`): см. `docs/手机端疑难排查.md` — выполните `adb shell setprop persist.sys.whitelistapp false`.
- Телефон не может подключиться к ПК (`Cleartext HTTP traffic ... not permitted`): приложение уже разрешает незашифрованный HTTP-трафик (cleartext).

## Версия

Текущая версия: `1.0.4` (последняя официальная версия).

### 1.0.4
- Новое: ручная пересылка кодов в мобильном клиенте, сопряжение по временному коду авторизации (6 цифр / действует 30 секунд), белый список устройств в локальной сети (по умолчанию выключен, управляется мобильным клиентом), тема «как в системе / тёмная / светлая» (ПК + мобильный клиент), постоянное уведомление с последним кодом, экспорт еженедельных/ежемесячных отчётов в CSV, отображение устройства-источника в истории, QR-код сопряжения содержит имя хоста ПК, ПК записывает имя устройства при получении кодов
- Изменение: автозапуск при включении системы по умолчанию выключен (можно включить в настройках)
- Исправлено: номера операторов 10086 / 10010 / 10000, SMS-канал 106 и банковские сервисные номера 95/96 больше не считаются кодами подтверждения; отдельные цифровые строки принимаются только при наличии ключевых слов контекста кода
- Исправлено: отправляется только последний код — одинаковый код от одного источника дедуплицируется в течение 60 секунд, в объединённых SMS берётся только последняя (самая новая) часть сообщения, а старые неубранные уведомления не приводят к повторной отправке старых кодов
- Номер версии: Android versionCode 13 / versionName 1.0.4

### 1.0.3
- Удалена функция «автоматический ввод в поле ввода» (автоматический ввод кода в поле с фокусом после получения); сохранены автоматическое копирование / восстановление буфера обмена после копирования; нажатие кнопки отправки на остров всегда копирует
- Исправлено: удалена кнопка «Отправить тестовый код / тестовый пузырь» в мобильном клиенте, что окончательно устраняет проблему повторного появления «Тест: 123456» на ПК
- Исправлено: автоматическая очистка кэшированных тестовых кодов старых версий после разрыва соединения; 123456 больше не отправляется повторно после восстановления соединения
- Изменение: по умолчанию пересылаются только системные SMS-коды подтверждения (новый переключатель «Только SMS-коды»); уведомления приложений (WeChat / QQ и др.) больше не пересылаются; только при выключенном переключателе уведомления приложений пересылаются по ключевым словам
- Исправлено: главное окно ПК поддерживает прокрутку колёсиком мыши (защита дочерних карточек от сжатия, высота списка истории подстраивается автоматически)
- Исправлено: host в QR-коде сопряжения получал объект, из-за чего телефон не мог подключиться (теперь используется address с приоритетом подсети локальной сети); подсказка QR-кода показывает IP-адрес и сообщения об ошибках генерации
- Мобильный клиент строго проверяет host при сопряжении по QR-коду и показывает сообщение при ошибке открытия камеры
- Отправка на несколько ПК: одновременная отправка на все настроенные ПК, включается/выключается в настройках мобильного клиента
- Панель здоровья соединения, стили острова по типу кода, библиотека шаблонов платформ
- История, сгруппированная по дням (сегодня / вчера / раньше), еженедельные/ежемесячные отчёты, публикация сводки истории
- Обратный буфер обмена ПК удалён
- Обновление номера версии: Android versionCode 12 / versionName 1.0.3

### 1.0.2
- Добавлено автоматическое восстановление буфера обмена: после получения код автоматически копируется, а через N секунд восстанавливается исходное содержимое буфера (настраивается)
- Главное окно поддерживает прокрутку колёсиком мыши, улучшено сопряжение по QR-коду, автоматический поиск ПК в локальной сети с удалением дубликатов
- Добавлены Web-консоль, виджет рабочего стола, панель статистики и история буфера обмена

## Лицензия

MIT

---

## Português

## CodeBridge

> 🌐 Site oficial: [https://codebridge.judekwong.com](https://codebridge.judekwong.com)

> O CodeBridge conecta os códigos de verificação por SMS do seu telefone ao PC pela rede local. Exibição, cópia com um clique, totalmente configurável. Interface moderna em vidro fosco.

Quando o seu telefone recebe um código de verificação por SMS, o CodeBridge o encaminha para o PC pela rede local em tempo real. O cliente para PC o exibe em uma interface moderna em vidro fosco (glassmorphism), com cantos arredondados e animações, e pode enviá-lo para a Ilha Dinâmica do WinIsland ou copiá-lo para a área de transferência — tudo totalmente configurável.

## Recursos

- Encaminhamento em tempo real de códigos SMS do telefone para o PC pela rede local
- Interface em vidro fosco (glassmorphism) com cantos arredondados e animações
- Cópia com um clique, cópia automática e **restauração automática da área de transferência** após N segundos
- Envio para a Ilha Dinâmica do WinIsland (automático / manual), exibição compacta em uma única linha, sem alargar a ilha
- Totalmente configurável: endereço do PC, porta, Token, encaminhamento automático, cópia automática, envio automático para a ilha, duração da restauração, ícone, regex
- Criptografia TLS de ponta a ponta (HTTPS + fixação de certificado): certificado autoassinado gerado pelo PC + fixação de certificado no cliente móvel, protegendo contra espionagem na rede local
- Busca automática de clientes PC na rede local, perfis de vários PCs, pareamento por QR code
- Envio de códigos para **todos os PCs configurados** de uma só vez (ativável/desativável)
- Reconhecimento do tipo de código (login / pagamento / registro / desbloqueio / outro) com estilos de ilha por tipo e configurações individuais
- Biblioteca de modelos de plataformas (Taobao / Alipay / WeChat / bancos / Steam / Weibo)
- Painel de saúde da conexão com status em tempo real
- Histórico agrupado por dia (hoje / ontem / anteriores), relatórios semanais e mensais, compartilhamento de resumo com um clique
- Manutenção em segundo plano: serviço em primeiro plano no Android, PC minimizado para a bandeja do sistema
- Painel de estatísticas, histórico da área de transferência, console web, widget de área de trabalho
- Clientes de desktop para Windows / macOS / Linux; cliente móvel como APK para Android

## Estrutura (código do PC e do cliente móvel separados)

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

## Início rápido (PC)

```bash
cd pc-client
npm install
npm start
```

Abra as **Configurações** para ver o endereço da rede local (por exemplo, `http://192.168.1.100:9841`) e preencha-o no aplicativo do celular.

## Início rápido (Android)

1. Compile o APK (veja `docs/构建指南.md`) ou use uma versão pré-compilada de um release.
2. Conceda **acesso às notificações** no aplicativo — necessário para ler as notificações de códigos SMS.
3. Preencha o endereço de rede local do PC e o Token e ative o encaminhamento automático.
4. Cliente PC: ative nas Configurações a cópia automática / envio automático para a ilha / restauração da área de transferência, conforme necessário.

## Integração com WinIsland

A ação «enviar para a ilha» do cliente PC chama a API de envio para a ilha do WinIsland (padrão `http://127.0.0.1:9840`), exibindo o código como um cartão da Ilha Dinâmica. Ative a «API de envio para a ilha» nas configurações do WinIsland e configure o Token primeiro. Consulte `docs/协议说明.md` para o protocolo.

## Solução de problemas

- O telefone não consegue instalar nenhum APK (`INSTALL_FAILED_VERIFICATION_FAILURE`) em algumas ROMs personalizadas: consulte `docs/手机端疑难排查.md` — defina `adb shell setprop persist.sys.whitelistapp false`.
- O telefone não consegue acessar o PC (`Cleartext HTTP traffic ... not permitted`): o aplicativo já permite tráfego HTTP sem criptografia (cleartext).

## Versão

Versão atual: `1.0.4` (última versão oficial).

### 1.0.4
- Novidades: encaminhamento manual de códigos no cliente móvel, pareamento por código de autorização temporário (6 dígitos / válido por 30 segundos), lista de permissões de dispositivos da rede local (desativada por padrão, gerenciada pelo cliente móvel), tema «seguir o sistema / escuro / claro» (PC + cliente móvel), notificação permanente exibindo o código mais recente, exportação de relatórios semanais/mensais em CSV, exibição do dispositivo de origem no histórico, pareamento por QR code com o nome do host do PC, o PC registra o nome do dispositivo ao receber códigos
- Ajuste: inicialização automática desativada por padrão (pode ser ativada nas configurações)
- Correção: operadoras como 10086 / 10010 / 10000, o canal SMS 106 e os números de serviço bancário 95/96 não são mais tratados como códigos de verificação; sequências numéricas isoladas só são aceitas se incluírem palavras-chave de contexto de código
- Correção: apenas o código mais recente é enviado — deduplicação de 60 segundos para a mesma origem e o mesmo código, mensagens combinadas usam apenas o último (mais recente) trecho e notificações antigas não dispensadas não reenviam códigos antigos
- Número da versão: Android versionCode 13 / versionName 1.0.4

### 1.0.3
- Removida a função «inserir automaticamente no campo de entrada» (digitar o código automaticamente no campo em foco após o recebimento); mantidas a cópia automática / restauração da área de transferência após copiar; o botão de enviar para a ilha sempre copia ao ser clicado
- Correção: removido o botão «enviar código de teste / balão de teste» do cliente móvel, resolvendo definitivamente o problema do PC exibir repetidamente «Teste: 123456»
- Correção: limpeza automática dos códigos de teste em cache deixados por versões antigas após a queda da conexão; o 123456 não é mais reenviado repetidamente depois que a conexão é restabelecida
- Ajuste: por padrão, apenas códigos de verificação por SMS do sistema são encaminhados (novo interruptor «somente códigos SMS»); notificações de aplicativos como WeChat/QQ não são mais encaminhadas; somente com o interruptor desativado as notificações de aplicativos são encaminhadas por palavras-chave
- Correção: a janela principal do PC suporta rolagem com a roda do mouse (os subcartões são protegidos contra compressão e a lista de histórico ajusta a altura automaticamente)
- Correção: o host do QR code de pareamento era resolvido como um objeto, impedindo o celular de conectar (agora usa address com prioridade para o segmento da rede local); o aviso do QR code exibe o endereço IP e mensagens de falha na geração
- O cliente móvel valida rigorosamente o host no pareamento por QR code e mostra um aviso quando a câmera falha ao abrir
- Envio para vários PCs: envio simultâneo para todos os PCs configurados, ativável/desativável nas configurações do cliente móvel
- Painel de saúde da conexão, estilos de ilha por tipo de código, biblioteca de modelos de plataformas
- Histórico agrupado por dia (hoje / ontem / anteriores), relatórios semanais/mensais, compartilhamento de resumo do histórico
- Área de transferência reversa do PC removida
- Atualização do número da versão: Android versionCode 12 / versionName 1.0.3

### 1.0.2
- Nova restauração automática da área de transferência: o código é copiado automaticamente ao ser recebido e, após N segundos, o conteúdo original da área de transferência é restaurado (configurável)
- A janela principal suporta rolagem com a roda do mouse, aprimoramentos no pareamento por QR code e busca automática de PCs na rede local com remoção de duplicatas
- Novos console web, widget de área de trabalho, painel de estatísticas e histórico da área de transferência

## Licença

MIT

---

