# releases/0.1.0beta1 · 迭代版本（仅本地）

> 依据《通用文件管理要求》：Beta / 迭代版本不上传远端，仅本地保留。
> 发布二进制不进入版本库（见 `.gitignore`），如需重新生成见 `docs/构建指南.md`。

## 已构建产物（本目录）

| 文件 | 平台 | 类型 | 大小 |
|---|---|---|---|
| `PhoneToPCCopyCode-0.1.0beta1-android.apk` | Android | APK（debug，可直接安装） | 17 MB |
| `PhoneToPCCopyCode-0.1.0beta1-windows-installer.exe` | Windows x64 | NSIS 安装包 | 75 MB |
| `PhoneToPCCopyCode-0.1.0beta1-windows-x64-portable.exe` | Windows x64 | 便携版（免安装） | 75 MB |

## 重新构建

- PC 端：`cd pc-client && npm run dist`（设置 `ELECTRON_BUILDER_BINARIES_MIRROR` 镜像后可在国内网络构建）。
- 手机端：用 Android Studio 打开 `android-app/` 构建；或按 `docs/构建指南.md` 用命令行 Gradle 构建。