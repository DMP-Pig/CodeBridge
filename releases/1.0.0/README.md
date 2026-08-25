# CodeBridge 1.0.0

| 文件 | 平台 | 类型 | 说明 |
|---|---|---|---|
| CodeBridge-1.0.0-android.apk | Android | APK | 手机端（Kotlin + Compose），正式密钥签名 |
| CodeBridge-1.0.0-windows-installer.exe | Windows x64 | 安装包 | NSIS 安装程序 |
| CodeBridge-1.0.0-windows-x64-portable.exe | Windows x64 | 便携版 | 免安装，双击运行 |

> macOS / Linux 产物需在对应平台（或 CI）构建：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

## 1.0.0 功能回顾
- 通过局域网把手机收到的短信验证码桥接至 PC 展示
- 上岛（WinIsland 灵动岛）与一键复制、自动复制（可配置恢复剪贴板）
- 现代化玻璃拟态 UI + 动画
