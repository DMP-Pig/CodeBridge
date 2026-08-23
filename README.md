# PhoneToPCCopyCode · 手机验证码 → PC 桥接

手机收到短信验证码后，通过**局域网**自动传送到 PC，PC 端以液态玻璃风格界面展示，
并可一键「上岛」（推送到 WinIsland 灵动岛）或「复制到剪贴板」。所有行为均可配置。

## 客户端

| 平台 | 技术栈 | 目录 |
|---|---|---|
| Windows / macOS / Linux | Electron | `pc-client/` |
| Android (APK) | Kotlin + Jetpack Compose | `android-app/` |

## 快速开始（PC 端）

```bash
cd pc-client
npm install
npm start
```

首次运行后在「设置」中查看局域网地址（如 `http://192.168.1.100:9841`），
在手机端填写该地址即可。

## 快速开始（手机端）

用 Android Studio 打开 `android-app/`，构建 APK 安装到手机。
在 App 内开启「通知监听」权限（用于读取短信验证码通知），
填写 PC 的局域网地址与 Token 后即可自动转发。

## 当前状态（0.1.0beta1）

- PC 端已在本机验证：局域网服务、验证码展示、剪贴板复制（手动/自动/灵动岛按钮）、WinIsland 上岛推送均通过实测。
- 手机端为完整 Android Studio 工程源码，需在装有 Android SDK 的机器上构建 APK（本环境无法联网下载 Android 依赖）。
- 测试方法：`cd pc-client && npm start`，然后 `curl -X POST http://127.0.0.1:9841/api/code -H "Content-Type: application/json" -d '{"code":"123456"}'`。

## 与 WinIsland 联动

PC 端「上岛」按钮会调用 WinIsland 的上岛 API（默认 `http://127.0.0.1:9840`），
把验证码以灵动岛卡片形式展示。需先在 WinIsland 设置中启用「上岛 API」并配置 Token。

## 版本

当前版本：`0.1.0beta1`（Beta / 迭代版本，不上传远端，仅本地保留）。
发布产物统一存放于 `releases/<版本号>/`，命名规则见《通用文件管理要求》。

