<div align="center">

**🌐 选择语言 / Select Language**

[简体中文](#简体中文) · [繁體中文](#繁體中文) · [English](#english) · [Español](#español) · [Français](#français) · [العربية](#العربية) · [Русский](#русский) · [Português](#português)

</div>

> **说明 / Note**: 以简体中文为标准 · Simplified Chinese is the standard reference.

---

## 简体中文

## CodeBridge 1.0.4

| 文件 | 平台 | 类型 | 说明 |
|---|---|---|---|
| CodeBridge-1.0.4-android.apk | Android | APK | 手机端（Kotlin + Compose），正式密钥签名，versionCode 13 |
| CodeBridge-1.0.4-windows-installer.exe | Windows x64 | 安装包 | NSIS 安装程序 |
| CodeBridge-1.0.4-windows-x64-portable.exe | Windows x64 | 便携版 | 免安装，双击运行 |

> macOS / Linux 产物需在对应平台（或 CI）构建：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

## 1.0.4 更新内容

### 新增功能
- **手动转发**：手机端新增「手动发送验证码」，输入任意验证码可立即推送到 PC（测试 / 补发）
- **记录设备名**：PC 接收入口记录发送设备的名称与 ID，历史中可区分是哪台手机发送
- **扫码配对增强**：PC 二维码携带主机名，扫码后自动作为该 PC 配置的名称
- **常驻通知显示最新验证码**：手机常驻服务通知 / 锁屏卡片显示最近一条验证码（可在设置中关闭）
- **统计导出 CSV**：PC 端周报 / 月报新增「导出报告 CSV」，保存为带统计汇总的 CSV 文件
- **主题模式**：PC 与手机端支持「跟随系统 / 深色 / 浅色」，手机端默认跟随系统
- **历史显示来源设备**：PC 端历史记录显示验证码来自哪台手机（设备名）
- **开机自启默认关闭**：避免默认开机自启，用户可在设置中按需开启
- **局域网设备白名单**（默认关闭，手机端是主导）：开启后只向白名单内的 PC 推送验证码，白名单支持 PC 名称或地址
- **临时授权码配对**：PC 端一键生成 6 位授权码（30 秒有效），手机端输入授权码后自动搜索局域网并完成配对

### 修复
- **修复：运营商短信不再误当验证码**：10086 / 10010 / 10000 等运营商、106 短信通道、95/96 银行服务号均被过滤；独立数字串必须同时出现「验证码 / 校验码 / 动态码 / 登录码」等上下文关键词才会被采纳
- **修复：只推送最新验证码**：同一来源同一验证码在 60 秒窗口内去重；短信应用把多条短信合并进同一通知时只取正文中最后（最新）一条验证码，旧通知未划走也不会把旧验证码重复推送
- 版本号：Android versionCode 13 / versionName 1.0.4

---

## 繁體中文

## CodeBridge 1.0.4

| 檔案 | 平台 | 類型 | 說明 |
|---|---|---|---|
| CodeBridge-1.0.4-android.apk | Android | APK | 手機端（Kotlin + Compose），正式金鑰簽名，versionCode 13 |
| CodeBridge-1.0.4-windows-installer.exe | Windows x64 | 安裝包 | NSIS 安裝程式 |
| CodeBridge-1.0.4-windows-x64-portable.exe | Windows x64 | 可攜版 | 免安裝，雙擊執行 |

> macOS / Linux 產物需在對應平台（或 CI）建置：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

## 1.0.4 更新內容

### 新增功能
- **手動轉發**：手機端新增「手動傳送驗證碼」，輸入任意驗證碼可立即推送到 PC（測試 / 補發）
- **記錄裝置名稱**：PC 接收入口記錄傳送裝置的名稱與 ID，歷史中可區分是哪台手機傳送
- **掃碼配對增強**：PC 的 QR Code 攜帶主機名稱，掃碼後自動作為該 PC 設定的名稱
- **常駐通知顯示最新驗證碼**：手機常駐服務通知 / 鎖定畫面卡片顯示最近一筆驗證碼（可在設定中關閉）
- **統計匯出 CSV**：PC 端週報 / 月報新增「匯出報告 CSV」，儲存為含統計彙總的 CSV 檔案
- **主題模式**：PC 與手機端支援「跟隨系統 / 深色 / 淺色」，手機端預設跟隨系統
- **歷史顯示來源裝置**：PC 端歷史記錄顯示驗證碼來自哪台手機（裝置名稱）
- **開機自啟預設關閉**：避免預設開機自啟，使用者可在設定中依需求開啟
- **區域網路裝置白名單**（預設關閉，手機端為主導）：開啟後只向白名單內的 PC 推送驗證碼，白名單支援 PC 名稱或位址
- **臨時授權碼配對**：PC 端一鍵產生 6 位授權碼（30 秒有效），手機端輸入授權碼後自動搜尋區域網路並完成配對

### 修復
- **修復：電信業者簡訊不再誤判為驗證碼**：10086 / 10010 / 10000 等電信業者、106 簡訊通道、95/96 銀行服務號皆會被過濾；獨立數字串必須同時出現「驗證碼 / 校驗碼 / 動態碼 / 登入碼」等上下文關鍵字才會被採用
- **修復：只推送最新驗證碼**：同一來源同一驗證碼在 60 秒視窗內去重；簡訊應用程式將多則簡訊合併至同一通知時，只取內文中最後（最新）一則驗證碼，舊通知未滑掉也不會重複推送舊驗證碼
- 版本號：Android versionCode 13 / versionName 1.0.4

---

## English

## CodeBridge 1.0.4

| File | Platform | Type | Description |
|---|---|---|---|
| CodeBridge-1.0.4-android.apk | Android | APK | Mobile client (Kotlin + Compose), signed with the release key, versionCode 13 |
| CodeBridge-1.0.4-windows-installer.exe | Windows x64 | Installer | NSIS installer |
| CodeBridge-1.0.4-windows-x64-portable.exe | Windows x64 | Portable | No installation required, double-click to run |

> macOS / Linux build artifacts must be built on the corresponding platform (or CI): Linux AppImage/deb requires mksquashfs/fpm, and the macOS dmg must be packaged on macOS.

## What's New in 1.0.4

### New Features
- **Manual forwarding**: The mobile client adds "Manually send verification code"; entering any verification code pushes it to the PC immediately (testing / resending)
- **Device name recording**: The PC receiving end records the sending device's name and ID, so history can tell which phone sent it
- **Enhanced QR-code pairing**: The PC's QR code carries the hostname; after scanning, it is automatically used as the name of that PC's configuration
- **Persistent notification shows the latest verification code**: The phone's persistent service notification / lock-screen card shows the most recent verification code (can be turned off in settings)
- **CSV statistics export**: PC weekly reports / monthly reports add "Export report CSV", saved as a CSV file with a statistics summary
- **Theme mode**: PC and the mobile client support "Follow system / Dark / Light"; the mobile client follows the system by default
- **History shows the source device**: PC history shows which phone the verification code came from (device name)
- **Startup auto-launch off by default**: avoids starting automatically at boot by default; users can turn it on in settings as needed
- **LAN device whitelist** (off by default; the mobile client is the controlling side): when enabled, verification codes are only pushed to PCs in the whitelist; the whitelist supports PC names or addresses
- **Temporary authorization-code pairing**: The PC generates a 6-digit authorization code with one click (valid for 30 seconds); after entering it in the mobile client, it automatically searches the LAN and completes the pairing

### Fixes
- **Fix: carrier SMS is no longer mistaken for verification codes**: Operators such as 10086 / 10010 / 10000, the 106 SMS channel, and 95/96 bank service numbers are all filtered out; a standalone numeric string is only accepted when it also contains contextual keywords such as "verification code / check code / dynamic code / login code"
- **Fix: only the latest verification code is pushed**: The same verification code from the same source is deduplicated within a 60-second window; when an SMS app merges multiple messages into a single notification, only the last (latest) verification code in the body is taken, and an old notification that hasn't been swiped away won't push the old verification code again
- Version: Android versionCode 13 / versionName 1.0.4

---

## Español

## CodeBridge 1.0.4

| Archivo | Plataforma | Tipo | Descripción |
|---|---|---|---|
| CodeBridge-1.0.4-android.apk | Android | APK | Cliente móvil (Kotlin + Compose), firmado con la clave de lanzamiento, versionCode 13 |
| CodeBridge-1.0.4-windows-installer.exe | Windows x64 | Instalador | Instalador NSIS |
| CodeBridge-1.0.4-windows-x64-portable.exe | Windows x64 | Portátil | Sin instalación, doble clic para ejecutar |

> Los artefactos de macOS / Linux deben compilarse en la plataforma correspondiente (o CI): el AppImage/deb de Linux requiere mksquashfs/fpm, y el dmg de macOS debe empaquetarse en macOS.

## Novedades de la versión 1.0.4

### Nuevas funciones
- **Reenvío manual**: el cliente móvil incorpora «Enviar código de verificación manualmente»; al ingresar cualquier código de verificación, este se envía inmediatamente al PC (pruebas / reenvío)
- **Registro del nombre del dispositivo**: la entrada de recepción del PC registra el nombre y el ID del dispositivo emisor, de modo que el historial permite distinguir qué teléfono lo envió
- **Emparejamiento por código QR mejorado**: el código QR del PC incluye el nombre de host; tras escanearlo, se usa automáticamente como nombre de la configuración de ese PC
- **La notificación persistente muestra el último código de verificación**: la notificación del servicio persistente / la tarjeta de pantalla de bloqueo del teléfono muestran el código de verificación más reciente (se puede desactivar en los ajustes)
- **Exportación de estadísticas CSV**: los informes semanales / mensuales del PC incorporan «Exportar informe CSV», que se guarda como un archivo CSV con resumen estadístico
- **Modo de tema**: el PC y el cliente móvil admiten «Seguir sistema / Oscuro / Claro»; el cliente móvil sigue el sistema por defecto
- **El historial muestra el dispositivo de origen**: el historial del PC muestra de qué teléfono proviene el código de verificación (nombre del dispositivo)
- **Inicio automático desactivado por defecto**: evita el inicio automático al arrancar por defecto; el usuario puede activarlo en los ajustes según sea necesario
- **Lista blanca de dispositivos de red local** (desactivada por defecto; el cliente móvil es el lado dominante): al activarla, los códigos de verificación solo se envían a los PC incluidos en la lista blanca; la lista blanca admite nombres o direcciones de PC
- **Emparejamiento con código de autorización temporal**: el PC genera un código de autorización de 6 dígitos con un clic (válido durante 30 segundos); al ingresarlo en el cliente móvil, este busca automáticamente la red local y completa el emparejamiento

### Correcciones
- **Corrección: los SMS de operador ya no se confunden con códigos de verificación**: los operadores 10086 / 10010 / 10000, el canal de SMS 106 y los números de servicio bancario 95/96 se filtran; una cadena numérica independiente solo se acepta si también contiene palabras clave de contexto como «código de verificación / código de comprobación / código dinámico / código de inicio de sesión»
- **Corrección: solo se envía el último código de verificación**: el mismo código de verificación de la misma fuente se deduplica dentro de una ventana de 60 segundos; cuando la aplicación de SMS combina varios mensajes en una misma notificación, solo se toma el último (más reciente) código de verificación del texto, y una notificación antigua que no se haya deslizado no reenviará el código antiguo
- Versión: Android versionCode 13 / versionName 1.0.4

---

## Français

## CodeBridge 1.0.4

| Fichier | Plateforme | Type | Description |
|---|---|---|---|
| CodeBridge-1.0.4-android.apk | Android | APK | Client mobile (Kotlin + Compose), signé avec la clé officielle, versionCode 13 |
| CodeBridge-1.0.4-windows-installer.exe | Windows x64 | Installateur | Installateur NSIS |
| CodeBridge-1.0.4-windows-x64-portable.exe | Windows x64 | Portable | Sans installation, double-clic pour lancer |

> Les artefacts macOS / Linux doivent être construits sur la plateforme correspondante (ou en CI) : l'AppImage/deb Linux nécessite mksquashfs/fpm, et le dmg macOS doit être empaqueté sur macOS.

## Nouveautés de la version 1.0.4

### Nouvelles fonctionnalités
- **Transfert manuel** : le client mobile ajoute « Envoyer un code de vérification manuellement » ; saisissez n'importe quel code de vérification et il est immédiatement transmis au PC (test / renvoi)
- **Enregistrement du nom de l'appareil** : l'entrée de réception du PC enregistre le nom et l'ID de l'appareil émetteur, afin que l'historique permette de distinguer quel téléphone a envoyé le code
- **Appairage par code QR amélioré** : le code QR du PC contient le nom d'hôte ; après le scan, il est automatiquement utilisé comme nom de la configuration de ce PC
- **La notification persistante affiche le dernier code de vérification** : la notification du service persistant / la carte d'écran de verrouillage du téléphone affichent le code de vérification le plus récent (désactivable dans les paramètres)
- **Export des statistiques CSV** : les rapports hebdomadaires / mensuels du PC ajoutent « Exporter le rapport CSV », enregistré sous forme de fichier CSV avec un résumé statistique
- **Mode de thème** : le PC et le client mobile prennent en charge « Suivre le système / Sombre / Clair » ; le client mobile suit le système par défaut
- **L'historique affiche l'appareil source** : l'historique du PC affiche de quel téléphone provient le code de vérification (nom de l'appareil)
- **Démarrage automatique désactivé par défaut** : évite le démarrage automatique au démarrage par défaut ; l'utilisateur peut l'activer dans les paramètres selon ses besoins
- **Liste blanche des appareils du réseau local** (désactivée par défaut ; le client mobile est le côté dominant) : une fois activée, les codes de vérification ne sont envoyés qu'aux PC de la liste blanche ; la liste blanche accepte les noms ou les adresses de PC
- **Appairage par code d'autorisation temporaire** : le PC génère un code d'autorisation à 6 chiffres en un clic (valable 30 secondes) ; après l'avoir saisi sur le client mobile, celui-ci recherche automatiquement le réseau local et termine l'appairage

### Corrections
- **Correctif : les SMS d'opérateur ne sont plus confondus avec les codes de vérification** : les opérateurs 10086 / 10010 / 10000, le canal SMS 106 et les numéros de service bancaire 95/96 sont tous filtrés ; une chaîne de chiffres isolée n'est acceptée que si elle contient également des mots-clés contextuels tels que « code de vérification / code de contrôle / code dynamique / code de connexion »
- **Correctif : seul le dernier code de vérification est envoyé** : le même code de vérification provenant de la même source est dédupliqué dans une fenêtre de 60 secondes ; lorsque l'application SMS fusionne plusieurs messages dans une même notification, seul le dernier (le plus récent) code de vérification du corps est retenu, et une ancienne notification non balayée ne renverra pas l'ancien code
- Version : Android versionCode 13 / versionName 1.0.4

---

## العربية

## CodeBridge 1.0.4

| الملف | النظام الأساسي | النوع | الوصف |
|---|---|---|---|
| CodeBridge-1.0.4-android.apk | Android | APK | تطبيق الهاتف (Kotlin + Compose)، موقّع بالمفتاح الرسمي، versionCode 13 |
| CodeBridge-1.0.4-windows-installer.exe | Windows x64 | حزمة تثبيت | مُثبِّت NSIS |
| CodeBridge-1.0.4-windows-x64-portable.exe | Windows x64 | إصدار محمول | بدون تثبيت، انقر نقرًا مزدوجًا للتشغيل |

> يجب بناء نواتج macOS / Linux على النظام الأساسي المقابل (أو في CI): يتطلب AppImage/deb من Linux أداتي mksquashfs/fpm، ويجب تعبئة dmg من macOS على macOS.

## محتوى تحديث 1.0.4

### وظائف جديدة
- **إعادة توجيه يدوية**: أضاف تطبيق الهاتف خيار «إرسال رمز التحقق يدويًا»؛ يمكن إدخال أي رمز تحقق ليتم إرساله فورًا إلى الكمبيوتر (اختبار / إعادة إرسال)
- **تسجيل اسم الجهاز**: يسجّل مدخل الاستقبال في الكمبيوتر اسم الجهاز المُرسِل ومعرّفه، ويمكن تمييز الهاتف الذي أرسل الرمز من السجل
- **تحسين الاقتران عبر رمز QR**: يحمل رمز QR الخاص بالكمبيوتر اسم المضيف، وبعد المسح يُستخدم تلقائيًا كاسم لإعدادات هذا الكمبيوتر
- **إشعار دائم يعرض أحدث رمز تحقق**: يعرض إشعار الخدمة الدائم / بطاقة شاشة القفل في الهاتف أحدث رمز تحقق (يمكن إيقافه من الإعدادات)
- **تصدير الإحصائيات CSV**: يضيف التقرير الأسبوعي / الشهري في الكمبيوتر خيار «تصدير تقرير CSV»، ويُحفظ كملف CSV يتضمن ملخصًا إحصائيًا
- **وضع المظهر**: يدعم الكمبيوتر وتطبيق الهاتف «اتباع النظام / داكن / فاتح»، ويتبع تطبيق الهاتف النظام افتراضيًا
- **عرض الجهاز المصدر في السجل**: يعرض سجل الكمبيوتر الهاتف الذي جاء منه رمز التحقق (اسم الجهاز)
- **إيقاف التشغيل التلقائي عند بدء التشغيل افتراضيًا**: تجنبًا للتشغيل التلقائي عند بدء التشغيل افتراضيًا، يمكن للمستخدم تفعيله من الإعدادات عند الحاجة
- **القائمة البيضاء لأجهزة الشبكة المحلية** (مغلقة افتراضيًا، وتطبيق الهاتف هو الطرف المهيمن): عند تفعيلها، يُرسل رمز التحقق فقط إلى أجهزة الكمبيوتر الموجودة في القائمة البيضاء، وتدعم القائمة البيضاء أسماء أو عناوين أجهزة الكمبيوتر
- **الاقتران برمز تفويض مؤقت**: يولّد الكمبيوتر رمز تفويض من 6 أرقام بنقرة واحدة (صالح لمدة 30 ثانية)؛ وبعد إدخال رمز التفويض في تطبيق الهاتف، يبحث تلقائيًا في الشبكة المحلية ويكمل الاقتران

### الإصلاحات
- **إصلاح: لم تعد رسائل المشغّل النصية تُعامل خطأً على أنها رموز تحقق**: يتم تصفية مشغّلي 10086 / 10010 / 10000، وقناة الرسائل النصية 106، وأرقام خدمة البنك 95/96؛ ولا يُقبل سلسلة الأرقام المستقلة إلا إذا تضمنت في الوقت نفسه كلمات سياقية مثل «رمز التحقق / رمز الفحص / الرمز الديناميكي / رمز الدخول»
- **إصلاح: إرسال أحدث رمز تحقق فقط**: تتم إزالة تكرار رمز التحقق نفسه من المصدر نفسه ضمن نافذة 60 ثانية؛ وعندما يدمج تطبيق الرسائل النصية عدة رسائل في إشعار واحد، يؤخذ آخر (أحدث) رمز تحقق في النص فقط، ولن تتم إعادة إرسال الرمز القديم حتى لو لم تتم إزالة الإشعار القديم
- رقم الإصدار: Android versionCode 13 / versionName 1.0.4

---

## Русский

## CodeBridge 1.0.4

| Файл | Платформа | Тип | Описание |
|---|---|---|---|
| CodeBridge-1.0.4-android.apk | Android | APK | Мобильный клиент (Kotlin + Compose), подписан официальным ключом, versionCode 13 |
| CodeBridge-1.0.4-windows-installer.exe | Windows x64 | Установщик | Установщик NSIS |
| CodeBridge-1.0.4-windows-x64-portable.exe | Windows x64 | Портативная версия | Без установки: двойной щелчок для запуска |

> Сборки macOS / Linux должны создаваться на соответствующей платформе (или в CI): для Linux AppImage/deb нужны mksquashfs/fpm, а dmg для macOS нужно упаковывать на macOS.

## Что нового в 1.0.4

### Новые функции
- **Ручная пересылка**: в мобильный клиент добавлена функция «Отправить код подтверждения вручную» — можно ввести любой код подтверждения, и он будет немедленно отправлен на ПК (тестирование / повторная отправка)
- **Запись имени устройства**: принимающая сторона на ПК записывает имя и ID отправляющего устройства, поэтому в истории можно отличить, с какого телефона отправлен код
- **Улучшенное сопряжение по QR-коду**: QR-код ПК содержит имя хоста; после сканирования оно автоматически используется как имя конфигурации этого ПК
- **Постоянное уведомление показывает последний код подтверждения**: уведомление постоянного сервиса / карточка на экране блокировки телефона показывают последний код подтверждения (можно отключить в настройках)
- **Экспорт статистики CSV**: в еженедельных / ежемесячных отчётах ПК добавлен пункт «Экспорт отчёта CSV» — сохраняется CSV-файл со статистической сводкой
- **Режим темы**: ПК и мобильный клиент поддерживают «Как в системе / Тёмная / Светлая»; мобильный клиент по умолчанию следует за системой
- **В истории видно устройство-источник**: история ПК показывает, с какого телефона получен код подтверждения (имя устройства)
- **Автозапуск отключён по умолчанию**: чтобы избежать автозапуска при включении по умолчанию, пользователь может включить его в настройках при необходимости
- **Белый список устройств локальной сети** (отключён по умолчанию; ведущая сторона — мобильный клиент): после включения коды подтверждения отправляются только на ПК из белого списка; белый список поддерживает имена или адреса ПК
- **Сопряжение по временному коду авторизации**: ПК создаёт 6-значный код авторизации одним кликом (действителен 30 секунд); после ввода кода авторизации в мобильном клиенте он автоматически ищет локальную сеть и завершает сопряжение

### Исправления
- **Исправлено: SMS оператора связи больше не принимаются ошибочно за код подтверждения**: операторы 10086 / 10010 / 10000, SMS-канал 106 и банковские сервисные номера 95/96 отфильтровываются; отдельная числовая строка принимается только при одновременном наличии контекстных ключевых слов, таких как «код подтверждения / проверочный код / динамический код / код входа»
- **Исправлено: отправляется только последний код подтверждения**: один и тот же код подтверждения из одного источника дедуплицируется в 60-секундном окне; когда SMS-приложение объединяет несколько сообщений в одно уведомление, берётся только последний (самый новый) код подтверждения из текста, и старое уведомление, не убранное свайпом, не приведёт к повторной отправке старого кода
- Номер версии: Android versionCode 13 / versionName 1.0.4

---

## Português

## CodeBridge 1.0.4

| Arquivo | Plataforma | Tipo | Descrição |
|---|---|---|---|
| CodeBridge-1.0.4-android.apk | Android | APK | Aplicativo móvel (Kotlin + Compose), assinado com a chave oficial, versionCode 13 |
| CodeBridge-1.0.4-windows-installer.exe | Windows x64 | Instalador | Instalador NSIS |
| CodeBridge-1.0.4-windows-x64-portable.exe | Windows x64 | Portátil | Sem instalação, clique duas vezes para executar |

> Os artefatos de macOS / Linux precisam ser compilados na plataforma correspondente (ou em CI): o AppImage/deb do Linux exige mksquashfs/fpm, e o dmg do macOS precisa ser empacotado no macOS.

## Novidades da versão 1.0.4

### Novos recursos
- **Encaminhamento manual**: o aplicativo móvel ganhou o recurso «Enviar código de verificação manualmente»; insira qualquer código de verificação e ele será enviado imediatamente ao PC (teste / reenvio)
- **Registro do nome do dispositivo**: a entrada de recebimento no PC registra o nome e o ID do dispositivo remetente, permitindo distinguir na história qual celular enviou
- **Pareamento por QR code aprimorado**: o QR code do PC contém o nome do host; após a leitura, ele é usado automaticamente como nome da configuração desse PC
- **Notificação persistente mostra o código de verificação mais recente**: a notificação do serviço persistente / o cartão da tela de bloqueio do celular exibem o código de verificação mais recente (pode ser desativado nas configurações)
- **Exportação de estatísticas CSV**: os relatórios semanais / mensais do PC ganharam o item «Exportar relatório CSV», salvo como um arquivo CSV com resumo estatístico
- **Modo de tema**: o PC e o aplicativo móvel oferecem suporte a «Seguir o sistema / Escuro / Claro»; o aplicativo móvel segue o sistema por padrão
- **Histórico mostra o dispositivo de origem**: o histórico do PC mostra de qual celular veio o código de verificação (nome do dispositivo)
- **Inicialização automática desativada por padrão**: evita a inicialização automática por padrão; o usuário pode ativá-la nas configurações conforme necessário
- **Lista de permissões de dispositivos da rede local** (desativada por padrão; o aplicativo móvel é o lado dominante): quando ativada, os códigos de verificação são enviados apenas aos PCs da lista de permissões; a lista aceita nomes ou endereços de PC
- **Pareamento com código de autorização temporário**: o PC gera um código de autorização de 6 dígitos com um clique (válido por 30 segundos); após inserir o código de autorização no aplicativo móvel, ele pesquisa automaticamente a rede local e conclui o pareamento

### Correções
- **Correção: SMS de operadora não é mais confundido com código de verificação**: operadoras como 10086 / 10010 / 10000, o canal de SMS 106 e os números de serviço bancário 95/96 são todos filtrados; uma string numérica isolada só é aceita se também contiver palavras-chave de contexto como «código de verificação / código de validação / código dinâmico / código de login»
- **Correção: apenas o código de verificação mais recente é enviado**: o mesmo código de verificação da mesma fonte é deduplicado em uma janela de 60 segundos; quando o app de SMS mescla várias mensagens em uma única notificação, apenas o último (mais recente) código de verificação do texto é considerado, e uma notificação antiga que não foi descartada não reenviará o código antigo
- Versão: Android versionCode 13 / versionName 1.0.4

---

