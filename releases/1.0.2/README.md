<div align="center">

**🌐 选择语言 / Select Language**

[简体中文](#简体中文) · [繁體中文](#繁體中文) · [English](#english) · [Español](#español) · [Français](#français) · [العربية](#العربية) · [Русский](#русский) · [Português](#português)

</div>

> **说明 / Note**: 以简体中文为标准 · Simplified Chinese is the standard reference.

---

## 简体中文

## CodeBridge 1.0.2

| 文件 | 平台 | 类型 | 说明 |
|---|---|---|---|
| CodeBridge-1.0.2-android.apk | Android | APK | 手机端（Kotlin + Compose），正式密钥签名 |
| CodeBridge-1.0.2-windows-installer.exe | Windows x64 | 安装包 | NSIS 安装程序 |
| CodeBridge-1.0.2-windows-x64-portable.exe | Windows x64 | 便携版 | 免安装，双击运行 |

> macOS / Linux 产物需在对应平台（或 CI）构建：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

### 1.0.2 更新内容（自 1.0.1）

- 安全：验证码传输升级为 HTTPS(TLS) 加密（PC 自签证书 + 手机端证书固定），局域网防窃听
- PC 端：上岛样式配置（标题样式 / 正文来源 / 图标快捷选择）与动画预览
- PC 端：收到验证码后，若焦点位于可编辑输入框则自动输入验证码（Windows UIAutomation / macOS 辅助功能 / Linux xdotool，可配置开关）
- PC 端：验证码统计面板（今日 / 累计数量 + 来源应用分布 + 近 7 天趋势图）
- PC 端：剪贴板历史（记录本机剪贴板变化，一键回拷 / 删除 / 清空，可配置开关与保留条数）
- PC 端：多显示器支持（主窗口跟随鼠标所在屏幕或指定显示器）
- PC 端：上岛点击行为配置（点击上岛卡片复制或自动输入）
- PC 端：Web 控制台（局域网浏览器查看实时状态、最近验证码、剪贴板历史与在线设备，令牌鉴权）
- PC 端：系统通知、历史记录搜索与自动清理、自动更新检查、主题定制、多语言界面
- 手机端：支持多 PC 配置保存与切换（添加 / 删除 / 切换）
- 手机端：新增后台保活引导（电池优化白名单 / 自启动 / 锁定最近任务提示）
- 手机端：二维码扫码配对（扫描 PC 端二维码自动填入地址 / 端口 / Token）
- 手机端：桌面小组件（显示最近验证码 / 来源 / 时间，点击一键复制）
- 移除「反向剪贴板」功能（PC → 手机剪贴板同步）
- 工程：配置 GitHub Actions CI 自动化构建

### 1.0.1 更新内容（自 1.0.0）

- 手机端：通知监听改为前台服务，关闭主界面后仍在后台存活，持续转发验证码
- 手机端：自动搜索局域网内已安装 PC 客户端（按设备 ID 去重，同一台 PC 不会重复显示）
- 手机端：修复通知监听崩溃问题（跳过自身包名通知、初始化设置）
- PC 端：关闭主界面后最小化到系统托盘，局域网服务继续后台运行
- PC 端：托盘菜单支持打开主界面 / 退出；单实例运行（重复启动聚焦主窗口）
- PC 端：/health 接口返回设备唯一 ID 与主机名，供手机端搜索去重

### 1.0.0 功能回顾

- 通过局域网把手机收到的短信验证码桥接至 PC 展示
- 上岛（WinIsland 灵动岛）与一键复制、自动复制（可配置恢复剪贴板）
- 现代化玻璃拟态 UI + 动画

---

## 繁體中文

## CodeBridge 1.0.2

| 檔案 | 平台 | 類型 | 說明 |
|---|---|---|---|
| CodeBridge-1.0.2-android.apk | Android | APK | 手機端（Kotlin + Compose），正式金鑰簽名 |
| CodeBridge-1.0.2-windows-installer.exe | Windows x64 | 安裝包 | NSIS 安裝程式 |
| CodeBridge-1.0.2-windows-x64-portable.exe | Windows x64 | 攜帶版 | 免安裝，雙擊執行 |

> macOS / Linux 產物需在對應平台（或 CI）構建：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

### 1.0.2 更新內容（自 1.0.1）

- 安全：驗證碼傳輸升級為 HTTPS(TLS) 加密（PC 自簽憑證 + 手機端憑證固定），區域網路防竊聽
- PC 端：上島樣式設定（標題樣式 / 內文來源 / 圖示快速選擇）與動畫預覽
- PC 端：收到驗證碼後，若焦點位於可編輯輸入框則自動輸入驗證碼（Windows UIAutomation / macOS 輔助功能 / Linux xdotool，可設定開關）
- PC 端：驗證碼統計面板（今日 / 累計數量 + 來源應用分佈 + 近 7 天趨勢圖）
- PC 端：剪貼簿歷史（記錄本機剪貼簿變化，一鍵回拷 / 刪除 / 清空，可設定開關與保留筆數）
- PC 端：多顯示器支援（主視窗跟隨滑鼠所在螢幕或指定顯示器）
- PC 端：上島點擊行為設定（點擊上島卡片複製或自動輸入）
- PC 端：Web 主控台（區域網路瀏覽器查看即時狀態、最近驗證碼、剪貼簿歷史與線上裝置，權杖驗證）
- PC 端：系統通知、歷史記錄搜尋與自動清理、自動更新檢查、主題自訂、多語言介面
- 手機端：支援多 PC 設定儲存與切換（新增 / 刪除 / 切換）
- 手機端：新增背景保活引導（電池最佳化白名單 / 自啟動 / 鎖定最近任務提示）
- 手機端：QR Code 掃碼配對（掃描 PC 端 QR Code 自動填入位址 / 連接埠 / Token）
- 手機端：桌面小工具（顯示最近驗證碼 / 來源 / 時間，點擊一鍵複製）
- 移除「反向剪貼簿」功能（PC → 手機剪貼簿同步）
- 工程：設定 GitHub Actions CI 自動化建置

### 1.0.1 更新內容（自 1.0.0）

- 手機端：通知監聽改為前台服務，關閉主介面後仍在背景存活，持續轉發驗證碼
- 手機端：自動搜尋區域網路內已安裝 PC 用戶端（依裝置 ID 去重，同一台 PC 不會重複顯示）
- 手機端：修復通知監聽崩潰問題（跳過自身套件名稱通知、初始化設定）
- PC 端：關閉主介面後最小化到系統匣，區域網路服務繼續背景執行
- PC 端：匣選單支援開啟主介面 / 結束；單一實例執行（重複啟動聚焦主視窗）
- PC 端：/health 介面回傳裝置唯一 ID 與主機名稱，供手機端搜尋去重

### 1.0.0 功能回顧

- 透過區域網路把手機收到的簡訊驗證碼橋接至 PC 顯示
- 上島（WinIsland 動態島）與一鍵複製、自動複製（可設定還原剪貼簿）
- 現代化玻璃擬態 UI + 動畫

---

## English

## CodeBridge 1.0.2

| File | Platform | Type | Description |
|---|---|---|---|
| CodeBridge-1.0.2-android.apk | Android | APK | Mobile client (Kotlin + Compose), signed with the release key |
| CodeBridge-1.0.2-windows-installer.exe | Windows x64 | Installer | NSIS installer |
| CodeBridge-1.0.2-windows-x64-portable.exe | Windows x64 | Portable | No installation required, double-click to run |

> macOS / Linux artifacts must be built on the corresponding platform (or CI): Linux AppImage/deb require mksquashfs/fpm, and the macOS dmg must be packaged on macOS.

### 1.0.2 Changes (since 1.0.1)

- Security: verification code transfer upgraded to HTTPS (TLS) encryption (PC self-signed certificate + certificate pinning on mobile) to prevent LAN eavesdropping
- PC: island style configuration (title style / body source / quick icon picker) and animation preview
- PC: after receiving a verification code, auto-types it into the focused editable input field (Windows UIAutomation / macOS accessibility / Linux xdotool, configurable)
- PC: verification code statistics panel (today / total count + source app distribution + 7-day trend chart)
- PC: clipboard history (records local clipboard changes, one-click restore / delete / clear, configurable toggle and retention count)
- PC: multi-monitor support (main window follows the screen with the mouse or a specified display)
- PC: island click behavior configuration (click the island card to copy or auto-type)
- PC: Web console (view real-time status, recent codes, clipboard history and online devices in a LAN browser, token authentication)
- PC: system notifications, history search and auto-cleanup, update checks, theme customization, multilingual UI
- Mobile: multiple PC profiles can be saved and switched (add / delete / switch)
- Mobile: background keep-alive guidance (battery optimization whitelist / auto-start / pin-recents hint)
- Mobile: QR-code pairing (scanning the PC QR code auto-fills address / port / token)
- Mobile: desktop widget (shows the latest code / source / time, one-click copy)
- Removed the "reverse clipboard" feature (PC → phone clipboard sync)
- Engineering: GitHub Actions CI automated builds configured

### 1.0.1 Changes (since 1.0.0)

- Mobile: notification monitoring is now a foreground service — it keeps running in the background after the main UI is closed, continuously forwarding verification codes
- Mobile: auto-discovery of installed PC clients on the LAN (deduplicated by device ID, the same PC is not shown twice)
- Mobile: fixed a crash in notification monitoring (skips notifications from its own package, initializes settings)
- PC: closing the main window minimizes to the system tray while the LAN service keeps running in the background
- PC: tray menu can open the main window / quit; single-instance operation (restarting focuses the main window)
- PC: the `/health` endpoint returns the device unique ID and hostname for the mobile client to deduplicate search results

### 1.0.0 Feature Recap

- Bridges SMS verification codes received on the phone to the PC over LAN for display
- Dynamic Island push (WinIsland), one-click copy, auto-copy (configurable clipboard restore)
- Modern glassmorphism UI + animations

---

## Español

## CodeBridge 1.0.2

| Archivo | Plataforma | Tipo | Descripción |
|---|---|---|---|
| CodeBridge-1.0.2-android.apk | Android | APK | Cliente móvil (Kotlin + Compose), firmado con la clave oficial |
| CodeBridge-1.0.2-windows-installer.exe | Windows x64 | Instalador | Programa de instalación NSIS |
| CodeBridge-1.0.2-windows-x64-portable.exe | Windows x64 | Portátil | Sin instalación, doble clic para ejecutar |

> Los artefactos de macOS / Linux deben compilarse en la plataforma correspondiente (o en CI): las AppImage/deb de Linux requieren mksquashfs/fpm, y el dmg de macOS debe empaquetarse en macOS.

### Cambios en 1.0.2 (desde 1.0.1)

- Seguridad: la transferencia de códigos ahora usa cifrado HTTPS (TLS) (certificado autofirmado en el PC + fijación de certificados en el móvil) para evitar escuchas en la LAN
- PC: configuración del estilo de la isla (estilo de título / fuente del texto / selector rápido de icono) y vista previa de la animación
- PC: al recibir un código, se escribe automáticamente en el campo editable con foco (UIAutomation de Windows / accesibilidad de macOS / xdotool de Linux, con conmutador configurable)
- PC: panel de estadísticas de códigos (hoy / total acumulado + distribución por aplicación de origen + gráfico de tendencia de los últimos 7 días)
- PC: historial del portapapeles (registra los cambios del portapapeles local; restauración / borrado / vaciado con un clic; conmutador y número de entradas configurables)
- PC: compatibilidad con varios monitores (la ventana principal sigue a la pantalla donde está el ratón o a un monitor especificado)
- PC: configuración del comportamiento al hacer clic en la isla (copiar o escribir automáticamente al hacer clic en la tarjeta)
- PC: consola web (ver estado en tiempo real, códigos recientes, historial del portapapeles y dispositivos en línea desde un navegador de la LAN, con autenticación por token)
- PC: notificaciones del sistema, búsqueda y limpieza automática del historial, comprobación de actualizaciones, personalización de temas, interfaz multilingüe
- Móvil: se pueden guardar y alternar varios perfiles de PC (añadir / eliminar / alternar)
- Móvil: nueva guía para mantener el proceso en segundo plano (lista blanca de optimización de batería / inicio automático / sugerencia de fijar tareas recientes)
- Móvil: emparejamiento por código QR (escanear el QR del PC rellena automáticamente dirección / puerto / token)
- Móvil: widget de escritorio (muestra el código más reciente / origen / hora, copia con un clic)
- Se eliminó la función de «portapapeles inverso» (sincronización del portapapeles de PC → teléfono)
- Ingeniería: configurada la construcción automatizada con GitHub Actions CI

### Cambios en 1.0.1 (desde 1.0.0)

- Móvil: la supervisión de notificaciones ahora es un servicio en primer plano — sigue funcionando en segundo plano tras cerrar la interfaz principal y reenvía los códigos continuamente
- Móvil: búsqueda automática de clientes de PC instalados en la LAN (deduplicación por ID de dispositivo; el mismo PC no se muestra dos veces)
- Móvil: corregido un bloqueo de la supervisión de notificaciones (omite las notificaciones de su propio paquete, inicializa los ajustes)
- PC: al cerrar la ventana principal minimiza a la bandeja del sistema y el servicio LAN sigue en segundo plano
- PC: el menú de la bandeja permite abrir la ventana principal / salir; instancia única (al reiniciar se enfoca la ventana principal)
- PC: el endpoint `/health` devuelve el ID único del dispositivo y el nombre de host para que el móvil deduplique la búsqueda

### Resumen de funciones 1.0.0

- Transfiere al PC, por la red local, los códigos de verificación SMS recibidos en el teléfono para mostrarlos
- Isla dinámica (WinIsland), copia con un clic y copia automática (restauración del portapapeles configurable)
- Interfaz de vidrio esmerilado moderna + animaciones

---

## Français

## CodeBridge 1.0.2

| Fichier | Plateforme | Type | Description |
|---|---|---|---|
| CodeBridge-1.0.2-android.apk | Android | APK | Client mobile (Kotlin + Compose), signé avec la clé officielle |
| CodeBridge-1.0.2-windows-installer.exe | Windows x64 | Installateur | Programme d'installation NSIS |
| CodeBridge-1.0.2-windows-x64-portable.exe | Windows x64 | Portable | Aucune installation requise, double-cliquez pour exécuter |

> Les artefacts macOS / Linux doivent être compilés sur la plateforme correspondante (ou en CI) : les AppImage/deb Linux nécessitent mksquashfs/fpm, et le dmg macOS doit être empaqueté sur macOS.

### Changements de la 1.0.2 (depuis la 1.0.1)

- Sécurité : le transfert des codes passe au chiffrement HTTPS (TLS) (certificat auto-signé sur PC + épinglage de certificat sur mobile) pour empêcher toute écoute sur le réseau local
- PC : configuration du style de l'île (style de titre / source du texte / sélecteur d'icône rapide) et aperçu des animations
- PC : après réception d'un code, saisie automatique dans le champ éditable qui a le focus (UIAutomation Windows / accessibilité macOS / xdotool Linux, interrupteur configurable)
- PC : panneau de statistiques des codes (aujourd'hui / total cumulé + répartition par application source + graphique de tendance sur 7 jours)
- PC : historique du presse-papiers (enregistre les changements locaux ; restauration / suppression / vidage en un clic ; activation et nombre d'entrées configurables)
- PC : support multi-écrans (la fenêtre principale suit l'écran où se trouve la souris ou un écran précis)
- PC : configuration du comportement au clic sur l'île (copier ou saisir automatiquement en cliquant sur la carte)
- PC : console web (consulter l'état en temps réel, les codes récents, l'historique du presse-papiers et les appareils en ligne depuis un navigateur du réseau local, authentification par jeton)
- PC : notifications système, recherche et nettoyage automatique de l'historique, vérification des mises à jour, personnalisation des thèmes, interface multilingue
- Mobile : plusieurs profils PC peuvent être enregistrés et commutés (ajout / suppression / commutation)
- Mobile : nouvel accompagnement pour le maintien en arrière-plan (liste blanche d'optimisation de la batterie / démarrage automatique / astuce d'épinglage des tâches récentes)
- Mobile : appairage par QR code (le scan du QR du PC remplit automatiquement l'adresse / le port / le jeton)
- Mobile : widget de bureau (affiche le dernier code / la source / l'heure, copie en un clic)
- Suppression de la fonction « presse-papiers inversé » (synchronisation du presse-papiers PC → téléphone)
- Ingénierie : construction automatisée configurée via GitHub Actions CI

### Changements de la 1.0.1 (depuis la 1.0.0)

- Mobile : l'écoute des notifications est désormais un service de premier plan — il reste actif en arrière-plan après la fermeture de l'interface principale et relaie les codes en continu
- Mobile : recherche automatique des clients PC installés sur le réseau local (déduplication par ID d'appareil ; le même PC n'apparaît pas deux fois)
- Mobile : correction d'un plantage de l'écoute des notifications (ignore les notifications de son propre paquet, initialise les réglages)
- PC : la fermeture de la fenêtre principale minimise dans la zone de notification système et le service réseau local continue en arrière-plan
- PC : le menu de la zone de notification permet d'ouvrir la fenêtre principale / de quitter ; instance unique (un redémarrage ramène au premier plan la fenêtre principale)
- PC : l'endpoint `/health` renvoie l'ID unique de l'appareil et le nom d'hôte pour que le mobile déduplique la recherche

### Récapitulatif des fonctionnalités 1.0.0

- Relaie vers le PC via le réseau local les codes de vérification SMS reçus sur le téléphone pour les afficher
- Île dynamique (WinIsland), copie en un clic et copie automatique (restauration du presse-papiers configurable)
- Interface glassmorphism moderne + animations

---

## العربية

## CodeBridge 1.0.2

| الملف | النظام الأساسي | النوع | الوصف |
|---|---|---|---|
| CodeBridge-1.0.2-android.apk | Android | APK | تطبيق الهاتف (Kotlin + Compose)، موقّع بالمفتاح الرسمي |
| CodeBridge-1.0.2-windows-installer.exe | Windows x64 | مثبّت | برنامج التثبيت NSIS |
| CodeBridge-1.0.2-windows-x64-portable.exe | Windows x64 | محمول | بدون تثبيت، انقر نقرًا مزدوجًا للتشغيل |

> يجب بناء إصدارات macOS / Linux على النظام الأساسي المقابل (أو في بيئة CI): تتطلب AppImage/deb الخاصة بنظام لينكس أداتي mksquashfs/fpm، ويجب تعبئة ملف dmg الخاص بنظام macOS على نظام macOS.

### تغييرات الإصدار 1.0.2 (منذ 1.0.1)

- الأمان: ترقية نقل رموز التحقق إلى تشفير HTTPS (TLS) (شهادة موقّعة ذاتيًا على الكمبيوتر + تثبيت الشهادة على الهاتف) لمنع التنصت على الشبكة المحلية
- الكمبيوتر: إعدادات تخصيص شكل الجزيرة (نمط العنوان / مصدر النص / منتقي الأيقونات السريع) ومعاينة الحركة
- الكمبيوتر: بعد استلام رمز التحقق، يتم إدخاله تلقائيًا في حقل الإدخال القابل للتحرير الذي يملك التركيز (Windows UIAutomation / تسهيلات الوصول في macOS / xdotool في لينكس، مع مفتاح تشغيل/إيقاف قابل للتهيئة)
- الكمبيوتر: لوحة إحصائيات رموز التحقق (اليوم / العدد الإجمالي + توزيع التطبيقات المصدر + رسم بياني لاتجاه آخر 7 أيام)
- الكمبيوتر: سجل الحافظة (يسجل تغييرات الحافظة المحلية، إعادة نسخ / حذف / مسح بنقرة واحدة، مع مفتاح تشغيل/إيقاف وعدد عناصر قابلين للتهيئة)
- الكمبيوتر: دعم الشاشات المتعددة (النافذة الرئيسية تتبع الشاشة التي يوجد بها الماوس أو شاشة محددة)
- الكمبيوتر: إعداد سلوك النقر على الجزيرة (النقر على بطاقة الجزيرة للنسخ أو الإدخال التلقائي)
- الكمبيوتر: وحدة تحكم ويب (عرض الحالة الفورية وأحدث الرموز وسجل الحافظة والأجهزة المتصلة في متصفح الشبكة المحلية، مع التحقق عبر رمز مميز)
- الكمبيوتر: إشعارات النظام، البحث في السجل والتنظيف التلقائي، فحص التحديثات، تخصيص السمة، واجهة متعددة اللغات
- تطبيق الهاتف: دعم حفظ وتبديل إعدادات أجهزة كمبيوتر متعددة (إضافة / حذف / تبديل)
- تطبيق الهاتف: إضافة إرشادات إبقاء التطبيق نشطًا في الخلفية (القائمة البيضاء لتحسين البطارية / التشغيل التلقائي / تلميح تثبيت التطبيقات الأخيرة)
- تطبيق الهاتف: الاقتران عبر مسح رمز QR (مسح رمز QR على الكمبيوتر يملأ العنوان / المنفذ / الرمز تلقائيًا)
- تطبيق الهاتف: عنصر واجهة على سطح المكتب (يعرض أحدث رمز / المصدر / الوقت، نسخ بنقرة واحدة عند النقر)
- إزالة ميزة «الحافظة العكسية» (مزامنة الحافظة من الكمبيوتر إلى الهاتف)
- الهندسة: إعداد بناء آلي عبر GitHub Actions CI

### تغييرات الإصدار 1.0.1 (منذ 1.0.0)

- تطبيق الهاتف: أصبحت مراقبة الإشعارات خدمة في المقدمة — تستمر في العمل بالخلفية بعد إغلاق الواجهة الرئيسية وتواصل نقل رموز التحقق
- تطبيق الهاتف: إضافة البحث التلقائي عن عملاء الكمبيوتر المثبتين على الشبكة المحلية (إزالة التكرار حسب معرف الجهاز؛ لا يظهر نفس الكمبيوتر مرتين)
- تطبيق الهاتف: إصلاح انهيار مراقبة الإشعارات (تخطي إشعارات الحزمة الخاصة بها، تهيئة الإعدادات)
- الكمبيوتر: إغلاق النافذة الرئيسية يقلّص التطبيق إلى علبة النظام مع استمرار خدمة الشبكة المحلية في الخلفية
- الكمبيوتر: قائمة العلبة تدعم فتح النافذة الرئيسية / الخروج؛ تشغيل بمثيل واحد (إعادة التشغيل تستعيد النافذة الرئيسية)
- الكمبيوتر: نقطة النهاية `/health` ترجع المعرّف الفريد للجهاز واسم المضيف لإزالة التكرار عند البحث من الهاتف

### ملخص ميزات 1.0.0

- نقل رموز التحقق من الرسائل النصية المستلمة على الهاتف إلى الكمبيوتر عبر الشبكة المحلية لعرضها
- الجزيرة الديناميكية (WinIsland)، والنسخ بنقرة واحدة والنسخ التلقائي (مع إمكانية استعادة الحافظة)
- واجهة زجاجية حديثة + رسوم متحركة

---

## Русский

## CodeBridge 1.0.2

| Файл | Платформа | Тип | Описание |
|---|---|---|---|
| CodeBridge-1.0.2-android.apk | Android | APK | Клиент для телефона (Kotlin + Compose), подписан официальным ключом |
| CodeBridge-1.0.2-windows-installer.exe | Windows x64 | Установщик | Установщик NSIS |
| CodeBridge-1.0.2-windows-x64-portable.exe | Windows x64 | Портативная версия | Без установки, запуск двойным щелчком |

> Сборки для macOS / Linux нужно выполнять на соответствующей платформе (или в CI): для Linux AppImage/deb нужны mksquashfs/fpm, а dmg для macOS собирается на macOS.

### Изменения в 1.0.2 (с 1.0.1)

- Безопасность: передача кодов подтверждения переведена на шифрование HTTPS (TLS) (самоподписанный сертификат на ПК + пиннинг сертификата на телефоне) — защита от прослушивания в локальной сети
- PC: настройка стиля острова (стиль заголовка / источник текста / быстрый выбор иконки) и предпросмотр анимации
- PC: после получения кода он автоматически вводится в сфокусированное редактируемое поле (Windows UIAutomation / специальные возможности macOS / xdotool в Linux, настраиваемый переключатель)
- PC: панель статистики кодов (сегодня / всего + распределение по приложениям-источникам + график тренда за последние 7 дней)
- PC: история буфера обмена (записывает изменения локального буфера, возврат / удаление / очистка в один клик, настраиваемый переключатель и количество хранимых записей)
- PC: поддержка нескольких мониторов (главное окно следует за экраном, где находится мышь, или за указанным дисплеем)
- PC: настройка поведения клика по острову (клик по карточке острова копирует или вводит код автоматически)
- PC: веб-консоль (просмотр состояния в реальном времени, последних кодов, истории буфера обмена и онлайн-устройств в браузере локальной сети, авторизация по токену)
- PC: системные уведомления, поиск по истории и автоматическая очистка, проверка обновлений, настройка темы, многоязычный интерфейс
- Телефон: поддержка сохранения и переключения нескольких конфигураций ПК (добавление / удаление / переключение)
- Телефон: добавлены подсказки по поддержанию работы в фоне (белый список оптимизации батареи / автозапуск / подсказка о закреплении в недавних задачах)
- Телефон: сопряжение по QR-коду (сканирование QR-кода с ПК автоматически заполняет адрес / порт / токен)
- Телефон: виджет на рабочем столе (показывает последний код / источник / время, копирование в один клик)
- Удалена функция «обратный буфер обмена» (синхронизация буфера обмена с ПК на телефон)
- Инженерия: настроена автоматическая сборка GitHub Actions CI

### Изменения в 1.0.1 (с 1.0.0)

- Телефон: мониторинг уведомлений стал сервисом переднего плана — продолжает работать в фоне после закрытия главного окна и непрерывно пересылает коды
- Телефон: добавлен автоматический поиск установленных PC-клиентов в локальной сети (дедупликация по ID устройства; один и тот же ПК не показывается дважды)
- Телефон: исправлено падение мониторинга уведомлений (пропуск уведомлений собственного пакета, инициализация настроек)
- PC: после закрытия главного окна сворачивается в системный трей, а служба локальной сети продолжает работать в фоне
- PC: меню трея позволяет открыть главное окно / выйти; одиночный экземпляр (повторный запуск восстанавливает главное окно)
- PC: эндпоинт `/health` возвращает уникальный ID устройства и имя хоста для дедупликации поиска на телефоне

### Обзор возможностей 1.0.0

- Передача SMS-кодов подтверждения с телефона на ПК по локальной сети для отображения
- Динамический остров (WinIsland), копирование в один клик и автоматическое копирование (восстановление буфера обмена настраивается)
- Современный стеклянный интерфейс + анимации

---

## Português

## CodeBridge 1.0.2

| Arquivo | Plataforma | Tipo | Descrição |
|---|---|---|---|
| CodeBridge-1.0.2-android.apk | Android | APK | Cliente móvel (Kotlin + Compose), assinado com a chave oficial |
| CodeBridge-1.0.2-windows-installer.exe | Windows x64 | Instalador | Instalador NSIS |
| CodeBridge-1.0.2-windows-x64-portable.exe | Windows x64 | Portátil | Sem instalação, duplo clique para executar |

> Os artefatos de macOS / Linux precisam ser compilados na plataforma correspondente (ou em CI): AppImage/deb do Linux exigem mksquashfs/fpm, e o dmg do macOS precisa ser empacotado no macOS.

### Mudanças na 1.0.2 (desde a 1.0.1)

- Segurança: a transferência de códigos de verificação foi atualizada para criptografia HTTPS (TLS) (certificado autoassinado no PC + fixação de certificado no celular) para evitar espionagem na rede local
- PC: configuração do estilo da ilha (estilo do título / fonte do texto / seletor rápido de ícone) e prévia da animação
- PC: após receber um código, ele é digitado automaticamente no campo de entrada editável com foco (Windows UIAutomation / acessibilidade do macOS / xdotool no Linux, interruptor configurável)
- PC: painel de estatísticas de códigos (hoje / total + distribuição por aplicativo de origem + gráfico de tendência dos últimos 7 dias)
- PC: histórico da área de transferência (registra alterações locais, recopiar / excluir / limpar com um clique, interruptor e número de registros retidos configuráveis)
- PC: suporte a vários monitores (a janela principal acompanha a tela onde está o mouse ou um monitor especificado)
- PC: configuração do comportamento de clique na ilha (clicar no cartão da ilha copia ou digita o código automaticamente)
- PC: console web (veja o status em tempo real, códigos recentes, histórico da área de transferência e dispositivos online no navegador da rede local, autenticação por token)
- PC: notificações do sistema, pesquisa no histórico e limpeza automática, verificação de atualizações, personalização de tema, interface em vários idiomas
- Celular: suporte para salvar e alternar várias configurações de PC (adicionar / excluir / alternar)
- Celular: novo guia de manutenção em segundo plano (lista de permissões de otimização de bateria / iniciar automaticamente / dica de fixar em recentes)
- Celular: pareamento por QR code (escaneando o QR code do PC, endereço / porta / token são preenchidos automaticamente)
- Celular: widget da área de trabalho (mostra o código mais recente / origem / hora, cópia com um clique)
- Removido o recurso "área de transferência reversa" (sincronização do PC para o celular)
- Engenharia: compilação automatizada configurada no GitHub Actions CI

### Mudanças na 1.0.1 (desde a 1.0.0)

- Celular: o monitoramento de notificações agora é um serviço em primeiro plano — continua rodando em segundo plano após fechar a interface principal, reencaminhando os códigos continuamente
- Celular: nova busca automática de clientes de PC instalados na rede local (deduplicação por ID do dispositivo; o mesmo PC não aparece duas vezes)
- Celular: corrigido um travamento do monitoramento de notificações (ignora notificações do próprio pacote, inicializa as configurações)
- PC: fechar a janela principal minimiza para a bandeja do sistema e o serviço de rede local continua em segundo plano
- PC: o menu da bandeja permite abrir a janela principal / sair; instância única (reiniciar restaura a janela principal)
- PC: o endpoint `/health` retorna o ID exclusivo do dispositivo e o nome do host para o celular deduplicar a busca

### Resumo de recursos 1.0.0

- Transfere os códigos de verificação SMS recebidos no celular para o PC pela rede local para exibição
- Ilha dinâmica (WinIsland), cópia com um clique e cópia automática (restauração da área de transferência configurável)
- Interface de vidro fosco moderna + animações

---

