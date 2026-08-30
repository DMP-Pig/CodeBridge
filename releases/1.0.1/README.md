<div align="center">

**🌐 选择语言 / Select Language**

[简体中文](#简体中文) · [繁體中文](#繁體中文) · [English](#english) · [Español](#español) · [Français](#français) · [العربية](#العربية) · [Русский](#русский) · [Português](#português)

</div>

> **说明 / Note**: 以简体中文为标准 · Simplified Chinese is the standard reference.

---

## 简体中文

## CodeBridge 1.0.1

| 文件 | 平台 | 类型 | 说明 |
|---|---|---|---|
| CodeBridge-1.0.1-android.apk | Android | APK | 手机端（Kotlin + Compose），正式密钥签名 |
| CodeBridge-1.0.1-windows-installer.exe | Windows x64 | 安装包 | NSIS 安装程序 |
| CodeBridge-1.0.1-windows-x64-portable.exe | Windows x64 | 便携版 | 免安装，双击运行 |

> macOS / Linux 产物需在对应平台（或 CI）构建：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

### 1.0.1 更新内容（自 1.0.0）

- 手机端：通知监听改为前台服务，关闭 App 主界面后仍在后台存活，持续转发验证码
- 手机端：新增自动搜索局域网内已安装 PC 客户端（按设备唯一 ID 去重，同一台 PC 不会重复显示；同一设备同时通过 USB 与局域网被发现时优先局域网）
- 手机端：修复通知监听崩溃问题（跳过自身包名通知、初始化设置）
- PC 端：关闭主界面后最小化到系统托盘，局域网服务继续后台运行
- PC 端：托盘菜单支持打开主界面 / 退出；单实例运行（重复启动自动恢复主窗口）
- PC 端：/health 接口返回设备唯一 ID 与主机名，供手机端搜索去重

### 1.0.0 功能回顾

- 通过局域网把手机收到的短信验证码桥接至 PC 展示
- 上岛（WinIsland 灵动岛）与一键复制、自动复制（可配置恢复剪贴板）
- 现代化玻璃拟态 UI + 动画

---

## 繁體中文

## CodeBridge 1.0.1

| 檔案 | 平台 | 類型 | 說明 |
|---|---|---|---|
| CodeBridge-1.0.1-android.apk | Android | APK | 手機端（Kotlin + Compose），正式金鑰簽名 |
| CodeBridge-1.0.1-windows-installer.exe | Windows x64 | 安裝包 | NSIS 安裝程式 |
| CodeBridge-1.0.1-windows-x64-portable.exe | Windows x64 | 攜帶版 | 免安裝，雙擊執行 |

> macOS / Linux 產物需在對應平台（或 CI）構建：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

### 1.0.1 更新內容（自 1.0.0）

- 手機端：通知監聽改為前台服務，關閉 App 主介面後仍在背景存活，持續轉發驗證碼
- 手機端：新增自動搜尋區域網路內已安裝 PC 用戶端（依裝置唯一 ID 去重，同一台 PC 不會重複顯示；同一裝置同時透過 USB 與區域網路被發現時優先區域網路）
- 手機端：修復通知監聽崩潰問題（跳過自身套件名稱通知、初始化設定）
- PC 端：關閉主介面後最小化到系統匣，區域網路服務繼續背景執行
- PC 端：匣選單支援開啟主介面 / 結束；單一實例執行（重複啟動自動還原主視窗）
- PC 端：/health 介面回傳裝置唯一 ID 與主機名稱，供手機端搜尋去重

### 1.0.0 功能回顧

- 透過區域網路把手機收到的簡訊驗證碼橋接至 PC 顯示
- 上島（WinIsland 動態島）與一鍵複製、自動複製（可設定還原剪貼簿）
- 現代化玻璃擬態 UI + 動畫

---

## English

## CodeBridge 1.0.1

| File | Platform | Type | Description |
|---|---|---|---|
| CodeBridge-1.0.1-android.apk | Android | APK | Mobile client (Kotlin + Compose), signed with the release key |
| CodeBridge-1.0.1-windows-installer.exe | Windows x64 | Installer | NSIS installer |
| CodeBridge-1.0.1-windows-x64-portable.exe | Windows x64 | Portable | No installation required, double-click to run |

> macOS / Linux artifacts must be built on the corresponding platform (or CI): Linux AppImage/deb require mksquashfs/fpm, and the macOS dmg must be packaged on macOS.

### 1.0.1 Changes (since 1.0.0)

- Mobile: notification monitoring is now a foreground service — it keeps running in the background after the main UI is closed, continuously forwarding verification codes
- Mobile: auto-discovery of installed PC clients on the LAN (deduplicated by the device unique ID, so the same PC is not shown twice; when the same device is found via both USB and LAN, LAN is preferred)
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

## CodeBridge 1.0.1

| Archivo | Plataforma | Tipo | Descripción |
|---|---|---|---|
| CodeBridge-1.0.1-android.apk | Android | APK | Cliente móvil (Kotlin + Compose), firmado con la clave oficial |
| CodeBridge-1.0.1-windows-installer.exe | Windows x64 | Instalador | Programa de instalación NSIS |
| CodeBridge-1.0.1-windows-x64-portable.exe | Windows x64 | Portátil | Sin instalación, doble clic para ejecutar |

> Los artefactos de macOS / Linux deben compilarse en la plataforma correspondiente (o en CI): las AppImage/deb de Linux requieren mksquashfs/fpm, y el dmg de macOS debe empaquetarse en macOS.

### Cambios en 1.0.1 (desde 1.0.0)

- Móvil: la supervisión de notificaciones ahora es un servicio en primer plano — sigue funcionando en segundo plano tras cerrar la interfaz principal y reenvía los códigos de verificación continuamente
- Móvil: nueva búsqueda automática de clientes de PC instalados en la LAN (deduplicación por ID único de dispositivo; el mismo PC no se muestra dos veces; si un dispositivo se encuentra a la vez por USB y por LAN, se prefiere la LAN)
- Móvil: corregido un bloqueo de la supervisión de notificaciones (omite las notificaciones de su propio paquete, inicializa los ajustes)
- PC: al cerrar la ventana principal minimiza a la bandeja del sistema y el servicio LAN sigue en segundo plano
- PC: el menú de la bandeja permite abrir la ventana principal / salir; instancia única (al reiniciar se restaura la ventana principal)
- PC: el endpoint `/health` devuelve el ID único del dispositivo y el nombre de host para que el móvil deduplique la búsqueda

### Resumen de funciones 1.0.0

- Transfiere al PC, por la red local, los códigos de verificación SMS recibidos en el teléfono para mostrarlos
- Isla dinámica (WinIsland), copia con un clic y copia automática (restauración del portapapeles configurable)
- Interfaz de vidrio esmerilado moderna + animaciones

---

## Français

## CodeBridge 1.0.1

| Fichier | Plateforme | Type | Description |
|---|---|---|---|
| CodeBridge-1.0.1-android.apk | Android | APK | Client mobile (Kotlin + Compose), signé avec la clé officielle |
| CodeBridge-1.0.1-windows-installer.exe | Windows x64 | Installateur | Programme d'installation NSIS |
| CodeBridge-1.0.1-windows-x64-portable.exe | Windows x64 | Portable | Aucune installation requise, double-cliquez pour exécuter |

> Les artefacts macOS / Linux doivent être compilés sur la plateforme correspondante (ou en CI) : les AppImage/deb Linux nécessitent mksquashfs/fpm, et le dmg macOS doit être empaqueté sur macOS.

### Changements de la 1.0.1 (depuis la 1.0.0)

- Mobile : l'écoute des notifications est désormais un service de premier plan — il reste actif en arrière-plan après la fermeture de l'interface principale et relaie les codes en continu
- Mobile : nouvelle recherche automatique des clients PC installés sur le réseau local (déduplication par ID unique d'appareil ; le même PC n'apparaît pas deux fois ; si un appareil est détecté à la fois par USB et par le réseau local, le réseau local est prioritaire)
- Mobile : correction d'un plantage de l'écoute des notifications (ignore les notifications de son propre paquet, initialise les réglages)
- PC : la fermeture de la fenêtre principale minimise dans la zone de notification système et le service réseau local continue en arrière-plan
- PC : le menu de la zone de notification permet d'ouvrir la fenêtre principale / de quitter ; instance unique (un redémarrage restaure la fenêtre principale)
- PC : l'endpoint `/health` renvoie l'ID unique de l'appareil et le nom d'hôte pour que le mobile déduplique la recherche

### Récapitulatif des fonctionnalités 1.0.0

- Relaie vers le PC via le réseau local les codes de vérification SMS reçus sur le téléphone pour les afficher
- Île dynamique (WinIsland), copie en un clic et copie automatique (restauration du presse-papiers configurable)
- Interface glassmorphism moderne + animations

---

## العربية

## CodeBridge 1.0.1

| الملف | النظام الأساسي | النوع | الوصف |
|---|---|---|---|
| CodeBridge-1.0.1-android.apk | Android | APK | تطبيق الهاتف (Kotlin + Compose)، موقّع بالمفتاح الرسمي |
| CodeBridge-1.0.1-windows-installer.exe | Windows x64 | مثبّت | برنامج التثبيت NSIS |
| CodeBridge-1.0.1-windows-x64-portable.exe | Windows x64 | محمول | بدون تثبيت، انقر نقرًا مزدوجًا للتشغيل |

> يجب بناء إصدارات macOS / Linux على النظام الأساسي المقابل (أو في بيئة CI): تتطلب AppImage/deb الخاصة بنظام لينكس أداتي mksquashfs/fpm، ويجب تعبئة ملف dmg الخاص بنظام macOS على نظام macOS.

### تغييرات الإصدار 1.0.1 (منذ 1.0.0)

- تطبيق الهاتف: أصبحت مراقبة الإشعارات خدمة في المقدمة — تستمر في العمل بالخلفية بعد إغلاق الواجهة الرئيسية وتواصل نقل رموز التحقق
- تطبيق الهاتف: إضافة البحث التلقائي عن عملاء الكمبيوتر المثبتين على الشبكة المحلية (إزالة التكرار حسب المعرّف الفريد للجهاز؛ لا يظهر نفس الكمبيوتر مرتين؛ إذا تم اكتشاف جهاز عبر USB والشبكة المحلية معًا، تُفضَّل الشبكة المحلية)
- تطبيق الهاتف: إصلاح انهيار مراقبة الإشعارات (تخطي إشعارات الحزمة الخاصة بها، تهيئة الإعدادات)
- الكمبيوتر: إغلاق النافذة الرئيسية يقلّص التطبيق إلى علبة النظام مع استمرار خدمة الشبكة المحلية في الخلفية
- الكمبيوتر: قائمة العلبة تدعم فتح النافذة الرئيسية / الخروج؛ تشغيل بمثيل واحد (إعادة التشغيل تستعيد النافذة الرئيسية تلقائيًا)
- الكمبيوتر: نقطة النهاية `/health` ترجع المعرّف الفريد للجهاز واسم المضيف لإزالة التكرار عند البحث من الهاتف

### ملخص ميزات 1.0.0

- نقل رموز التحقق من الرسائل النصية المستلمة على الهاتف إلى الكمبيوتر عبر الشبكة المحلية لعرضها
- الجزيرة الديناميكية (WinIsland)، والنسخ بنقرة واحدة والنسخ التلقائي (مع إمكانية استعادة الحافظة)
- واجهة زجاجية حديثة + رسوم متحركة

---

## Русский

## CodeBridge 1.0.1

| Файл | Платформа | Тип | Описание |
|---|---|---|---|
| CodeBridge-1.0.1-android.apk | Android | APK | Клиент для телефона (Kotlin + Compose), подписан официальным ключом |
| CodeBridge-1.0.1-windows-installer.exe | Windows x64 | Установщик | Установщик NSIS |
| CodeBridge-1.0.1-windows-x64-portable.exe | Windows x64 | Портативная версия | Без установки, запуск двойным щелчком |

> Сборки для macOS / Linux нужно выполнять на соответствующей платформе (или в CI): для Linux AppImage/deb нужны mksquashfs/fpm, а dmg для macOS собирается на macOS.

### Изменения в 1.0.1 (с 1.0.0)

- Телефон: мониторинг уведомлений стал сервисом переднего плана — продолжает работать в фоне после закрытия главного окна и непрерывно пересылает коды
- Телефон: добавлен автоматический поиск установленных PC-клиентов в локальной сети (дедупликация по уникальному ID устройства; один и тот же ПК не показывается дважды; если устройство обнаружено одновременно по USB и по локальной сети, приоритет у локальной сети)
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

## CodeBridge 1.0.1

| Arquivo | Plataforma | Tipo | Descrição |
|---|---|---|---|
| CodeBridge-1.0.1-android.apk | Android | APK | Cliente móvel (Kotlin + Compose), assinado com a chave oficial |
| CodeBridge-1.0.1-windows-installer.exe | Windows x64 | Instalador | Instalador NSIS |
| CodeBridge-1.0.1-windows-x64-portable.exe | Windows x64 | Portátil | Sem instalação, duplo clique para executar |

> Os artefatos de macOS / Linux precisam ser compilados na plataforma correspondente (ou em CI): AppImage/deb do Linux exigem mksquashfs/fpm, e o dmg do macOS precisa ser empacotado no macOS.

### Mudanças na 1.0.1 (desde a 1.0.0)

- Celular: o monitoramento de notificações agora é um serviço em primeiro plano — continua rodando em segundo plano após fechar a interface principal, reencaminhando os códigos continuamente
- Celular: nova busca automática de clientes de PC instalados na rede local (deduplicação por ID exclusivo do dispositivo; o mesmo PC não aparece duas vezes; se um dispositivo for encontrado via USB e rede local ao mesmo tempo, a rede local tem prioridade)
- Celular: corrigido um travamento do monitoramento de notificações (ignora notificações do próprio pacote, inicializa as configurações)
- PC: fechar a janela principal minimiza para a bandeja do sistema e o serviço de rede local continua em segundo plano
- PC: o menu da bandeja permite abrir a janela principal / sair; instância única (reiniciar restaura a janela principal)
- PC: o endpoint `/health` retorna o ID exclusivo do dispositivo e o nome do host para o celular deduplicar a busca

### Resumo de recursos 1.0.0

- Transfere os códigos de verificação SMS recebidos no celular para o PC pela rede local para exibição
- Ilha dinâmica (WinIsland), cópia com um clique e cópia automática (restauração da área de transferência configurável)
- Interface de vidro fosco moderna + animações

---

