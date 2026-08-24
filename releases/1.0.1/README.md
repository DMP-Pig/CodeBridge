# CodeBridge 1.0.1（正式版）
| 文件 | 平台 | 类型 | 说明 |
|---|---|---|---|
| CodeBridge-1.0.1-android.apk | Android | APK | 手机端（Kotlin + Compose），已用正式密钥签名（v1+v2+v3） |
| CodeBridge-1.0.1-windows-installer.exe | Windows x64 | 安装包 | NSIS 安装程序 |
| CodeBridge-1.0.1-windows-x64-portable.exe | Windows x64 | 便携版 | 免安装，双击运行 |

> macOS / Linux 产物需在对应平台（或 CI）构建：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

## 1.0.1 更新内容
- 手机端：通知监听改为前台服务，关闭主界面后仍在后台存活，持续转发验证码
- 手机端：新增自动搜索局域网内已安装 PC 客户端（按设备 ID 去重，同一台 PC 不会重复显示）
- 手机端：修复通知监听崩溃问题（跳过自身包名通知、初始化设置）
- PC 端：关闭主界面后最小化到系统托盘，局域网服务继续后台运行
- PC 端：托盘菜单支持打开主界面 / 退出；单实例运行（重复启动恢复主窗口）
- PC 端：/health 接口返回设备唯一 ID 与主机名，供手机端搜索去重

## 1.0.0 功能回顾
- 通过局域网把手机收到的短信验证码桥接至 PC 展示
- 上岛（WinIsland 灵动岛）与一键复制、自动复制（可配恢复剪贴板）
- 现代化玻璃拟态 UI + 动画
