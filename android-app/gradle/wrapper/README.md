# Gradle Wrapper

本目录的 `gradle-wrapper.jar` 需在首次构建时生成（本环境无法联网下载 Gradle 发行版）。

两种方式任选其一：

1. 用 Android Studio 打开 `android-app/`，按提示「Add Gradle Wrapper / Sync」自动生成。
2. 命令行（本机装有 Gradle ≥ 8.7）：
   ```bash
   cd android-app
   gradle wrapper --gradle-version 8.10.2
   ```

`gradle-wrapper.properties` 使用 `distributionUrl=https\://services.gradle.org/distributions/gradle-8.10.2-bin.zip`。
