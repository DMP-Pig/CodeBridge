# releases/1.0.0beta1 · 迭代版本（仅本地）

> 依据《通用文件管理要求》：Beta / 迭代版本不上传远端，仅本地保留。
> 发布二进制不进入版本库（见 `.gitignore`），如需重新生成见 `docs/构建指南.md`。

## 已构建产物（本目录，全部为最新）

| 文件 | 平台 | 类型 | 大小 |
|---|---|---|---|
| `PhoneToPCCopyCode-1.0.0beta1-android.apk` | Android | APK（debug，可直接安装） | 17 MB |
| `PhoneToPCCopyCode-1.0.0beta1-windows-installer.exe` | Windows x64 | NSIS 安装包 | 75 MB |
| `PhoneToPCCopyCode-1.0.0beta1-windows-x64-portable.exe` | Windows x64 | 便携版（免安装） | 75 MB |

## 1.0.0beta1 变更

- 版本号从 0.1.0beta1 升为 1.0.0beta1（用户要求主版本 1.0.0）。
- 上岛卡片改为单行：验证码直接显示在标题（如「验证码 820346」），正文单行无换行，
  按钮标签缩短为「复制」；内容宽度估算 133px，不触发 WinIsland 灵动岛加宽（阈值 180px）。
- 上岛图标修复：`\uXXXX` 转义解码为真实字形字符（U+E8D6）发送。
- 设置新增「上岛图标」配置项。

## 重新构建

- PC 端：`cd pc-client && npm run dist`（设置 `ELECTRON_BUILDER_BINARIES_MIRROR` 镜像）。
- 手机端：用 Android Studio 打开 `android-app/` 构建；或按 `docs/构建指南.md` 命令行构建。