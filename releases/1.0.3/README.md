# CodeBridge 1.0.3

| 文件 | 平台 | 类型 | 说明 |
|---|---|---|---|
| CodeBridge-1.0.3-android.apk | Android | APK | 手机端（Kotlin + Compose），正式密钥签名 |
| CodeBridge-1.0.3-windows-installer.exe | Windows x64 | 安装包 | NSIS 安装程序 |
| CodeBridge-1.0.3-windows-x64-portable.exe | Windows x64 | 便携版 | 免安装，双击运行 |

> macOS / Linux 产物需在对应平台（或 CI）构建：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

## 1.0.3 更新内容（自 1.0.2）
- 修复：自动清理旧版本遗留的断线缓存测试码，不再恢复连接后反复补发 123456
- 调整：默认只转发系统短信验证码（新增「仅短信验证码」开关），不再转发微信/QQ 等应用通知；仅在关闭该开关后才按关键词转发应用通知
- 修复：扫码配对二维码 host 取到对象导致手机连不上（改用 address 并优先局域网网段），二维码提示显示 IP 地址、生成失败提示
- 手机端扫码配对严格校验 host、相机打开失败提示
- 多 PC 推送：同时推送至所有已配置 PC，可在手机端设置中开关
- 连接健康面板（实时连接状态、最近心跳、设备信息）
- 验证码类型识别与上岛样式（登录 / 支付 / 注册 / 解锁，每种类型独立上岛样式）
- 平台模板库（淘宝 / 支付宝 / 微信 / 银行 / Steam / 微博，快速匹配平台文案与样式）
- 历史按天分组（今日 / 昨天 / 更早）、周报 / 月报统计、一键复制摘要分享