# CodeBridge 1.0.3beta（本地审核版）

> 本目录为 **1.0.3beta 本地审核产物**（未上传 GitHub）。审核通过后，将作为 **1.0.3 正式版** 上传 GitHub。
> 审核重点：① PC 不再反复弹「测试：123456」；② 默认只转发系统短信验证码，不再转发微信/QQ 等应用通知。

| 文件 | 平台 | 类型 | 说明 |
|---|---|---|---|
| CodeBridge-1.0.3beta-android.apk | Android | APK | 手机端（Kotlin + Compose），正式密钥签名，versionCode 11 / versionName 1.0.3beta |
| CodeBridge-1.0.3beta-windows-installer.exe | Windows x64 | 安装包 | NSIS 安装程序 |
| CodeBridge-1.0.3beta-windows-x64-portable.exe | Windows x64 | 便携版 | 免安装，双击运行 |

> macOS / Linux 产物需在对应平台（或 CI）构建：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

## 本版更新内容（1.0.3beta，自 1.0.3）
- 修复：移除手机端「发送测试码 / 测试气泡」按钮，彻底解决 PC 反复弹「测试：123456」的问题
- 修复：自动清理旧版本遗留的断线缓存测试码，不再恢复连接后每 30 秒心跳反复补发 123456
- 调整：默认只转发系统短信验证码（新增「仅短信验证码」开关，默认开启），不再转发微信/QQ 等应用通知；仅在关闭该开关后才按关键词转发应用通知
- 手机端版本号升级：Android versionCode 11 / versionName 1.0.3beta

## 本地审核清单
- [ ] 手机端 APK 安装后，PC 不再反复弹出「测试：123456」
- [ ] 手机端设置新增「仅短信验证码」开关（默认开），开启时微信/QQ 等应用通知不再上送 PC
- [ ] 收到真实短信验证码时，PC 正常展示 / 复制 / 上岛
- [ ] PC 安装包 / 便携版可正常安装运行

## 若审核通过
- 版本号改为 1.0.3（Android versionCode 12）
- 更新根 README 与 releases/1.0.3 发布文档与产物
- 上传 GitHub Release 1.0.3
