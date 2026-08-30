<div align="center">

**🌐 选择语言 / Select Language**

[简体中文](#简体中文) · [繁體中文](#繁體中文) · [English](#english) · [Español](#español) · [Français](#français) · [العربية](#العربية) · [Русский](#русский) · [Português](#português)

</div>

> **说明 / Note**: 以简体中文为标准 · Simplified Chinese is the standard reference.

---

## 简体中文

## CodeBridge 1.0.3

| 文件 | 平台 | 类型 | 说明 |
|---|---|---|---|
| CodeBridge-1.0.3-android.apk | Android | APK | 手机端（Kotlin + Compose），正式密钥签名 |
| CodeBridge-1.0.3-windows-installer.exe | Windows x64 | 安装包 | NSIS 安装程序 |
| CodeBridge-1.0.3-windows-x64-portable.exe | Windows x64 | 便携版 | 免安装，双击运行 |

> macOS / Linux 产物需在对应平台（或 CI）构建：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

### 1.0.3 更新内容（自 1.0.2）

- 修复：自动清理旧版本遗留的断线缓存测试码，不再恢复连接后反复补发 123456
- 调整：默认只转发系统短信验证码（新增「仅短信验证码」开关），不再转发微信/QQ 等应用通知；仅在关闭该开关后才按关键词转发应用通知
- 修复：扫码配对二维码 host 取到对象导致手机连不上（改用 address 并优先局域网网段），二维码提示显示 IP 地址、生成失败提示
- 手机端扫码配对严格校验 host、相机打开失败提示
- 多 PC 推送：同时推送至所有已配置 PC，可在手机端设置中开关
- 连接健康面板（实时连接状态、最近心跳、设备信息）
- 验证码类型识别与上岛样式（登录 / 支付 / 注册 / 解锁，每种类型独立上岛样式）
- 平台模板库（淘宝 / 支付宝 / 微信 / 银行 / Steam / 微博，快速匹配平台文案与样式）
- 历史按天分组（今日 / 昨天 / 更早）、周报 / 月报统计、一键复制摘要分享

---

## 繁體中文

## CodeBridge 1.0.3

| 檔案 | 平台 | 類型 | 說明 |
|---|---|---|---|
| CodeBridge-1.0.3-android.apk | Android | APK | 手機端（Kotlin + Compose），正式金鑰簽名 |
| CodeBridge-1.0.3-windows-installer.exe | Windows x64 | 安裝包 | NSIS 安裝程式 |
| CodeBridge-1.0.3-windows-x64-portable.exe | Windows x64 | 攜帶版 | 免安裝，雙擊執行 |

> macOS / Linux 產物需在對應平台（或 CI）構建：Linux AppImage/deb 需 mksquashfs/fpm，macOS dmg 需在 macOS 上打包。

### 1.0.3 更新內容（自 1.0.2）

- 修復：自動清理舊版本遺留的斷線快取測試碼，不再恢復連線後反覆補發 123456
- 調整：預設只轉發系統簡訊驗證碼（新增「僅簡訊驗證碼」開關），不再轉發微信/QQ 等應用通知；僅在關閉該開關後才依關鍵字轉發應用通知
- 修復：掃碼配對 QR Code 的 host 取到物件導致手機連不上（改用 address 並優先區域網路網段），QR Code 提示顯示 IP 位址、產生失敗提示
- 手機端掃碼配對嚴格校驗 host、相機開啟失敗提示
- 多 PC 推送：同時推送至所有已設定 PC，可在手機端設定中開關
- 連線健康面板（即時連線狀態、最近心跳、裝置資訊）
- 驗證碼類型識別與上島樣式（登入 / 付款 / 註冊 / 解鎖，每種類型獨立上島樣式）
- 平台範本庫（淘寶 / 支付寶 / 微信 / 銀行 / Steam / 微博，快速比對平台文案與樣式）
- 歷史依天分組（今日 / 昨天 / 更早）、週報 / 月報統計、一鍵複製摘要分享

---

## English

## CodeBridge 1.0.3

| File | Platform | Type | Description |
|---|---|---|---|
| CodeBridge-1.0.3-android.apk | Android | APK | Mobile client (Kotlin + Compose), signed with the release key |
| CodeBridge-1.0.3-windows-installer.exe | Windows x64 | Installer | NSIS installer |
| CodeBridge-1.0.3-windows-x64-portable.exe | Windows x64 | Portable | No installation required, double-click to run |

> macOS / Linux artifacts must be built on the corresponding platform (or CI): Linux AppImage/deb require mksquashfs/fpm, and the macOS dmg must be packaged on macOS.

### 1.0.3 Changes (since 1.0.2)

- Fixed: automatically cleans up stale offline cached test codes left by older versions, so `123456` is no longer re-sent repeatedly after reconnecting
- Adjusted: by default only system SMS verification codes are forwarded (new "SMS codes only" toggle); app notifications such as WeChat/QQ are no longer forwarded unless the toggle is turned off, in which case they are forwarded by keyword
- Fixed: the QR pairing code set an object as the host, preventing the phone from connecting (now uses address and prefers the LAN subnet); the QR hint now shows the IP address and a generation-failure notice
- Mobile: strict host validation for QR pairing, plus a notice when the camera fails to open
- Multi-PC push: push to all configured PCs at once, toggleable in the mobile settings
- Connection health panel (live connection status, latest heartbeat, device info)
- Verification code type detection with per-type island styling (login / payment / registration / unlock, each type has its own island style)
- Platform template library (Taobao / Alipay / WeChat / banks / Steam / Weibo, quick matching of platform copy and styles)
- History grouped by day (today / yesterday / earlier), weekly / monthly stats, one-click summary copy and share

---

## Español

## CodeBridge 1.0.3

| Archivo | Plataforma | Tipo | Descripción |
|---|---|---|---|
| CodeBridge-1.0.3-android.apk | Android | APK | Cliente móvil (Kotlin + Compose), firmado con la clave oficial |
| CodeBridge-1.0.3-windows-installer.exe | Windows x64 | Instalador | Programa de instalación NSIS |
| CodeBridge-1.0.3-windows-x64-portable.exe | Windows x64 | Portátil | Sin instalación, doble clic para ejecutar |

> Los artefactos de macOS / Linux deben compilarse en la plataforma correspondiente (o en CI): las AppImage/deb de Linux requieren mksquashfs/fpm, y el dmg de macOS debe empaquetarse en macOS.

### Cambios de la 1.0.3 (desde la 1.0.2)

- Corrección: se limpian automáticamente los códigos de prueba en caché dejados por versiones anteriores al desconectarse; ya no se reenvía repetidamente `123456` tras reconectar
- Ajuste: por defecto solo se reenvían códigos de verificación SMS del sistema (nuevo interruptor «Solo SMS»); ya no se reenvían notificaciones de aplicaciones como WeChat/QQ, salvo que el interruptor esté desactivado, en cuyo caso se reenvían por palabras clave
- Corrección: el host del código QR de emparejamiento tomaba un objeto y el móvil no podía conectarse (ahora usa address y prioriza la subred de la LAN); el aviso del QR muestra la dirección IP y un aviso de error de generación
- Móvil: validación estricta del host en el emparejamiento por QR y aviso si la cámara no se abre
- Push multi-PC: enviar a todos los PC configurados a la vez, activable desde los ajustes del móvil
- Panel de salud de la conexión (estado en tiempo real, último latido, información del dispositivo)
- Detección del tipo de código de verificación con estilo de isla por tipo (inicio de sesión / pago / registro / desbloqueo, cada tipo con su propio estilo)
- Biblioteca de plantillas de plataforma (Taobao / Alipay / WeChat / bancos / Steam / Weibo, coincidencia rápida de textos y estilos)
- Historial agrupado por día (hoy / ayer / anterior), estadísticas semanales / mensuales, copiar y compartir el resumen con un clic

---

## Français

## CodeBridge 1.0.3

| Fichier | Plateforme | Type | Description |
|---|---|---|---|
| CodeBridge-1.0.3-android.apk | Android | APK | Client mobile (Kotlin + Compose), signé avec la clé officielle |
| CodeBridge-1.0.3-windows-installer.exe | Windows x64 | Installateur | Programme d'installation NSIS |
| CodeBridge-1.0.3-windows-x64-portable.exe | Windows x64 | Portable | Sans installation, double-clic pour exécuter |

> Les artefacts macOS / Linux doivent être compilés sur la plateforme correspondante (ou en CI) : les AppImage/deb Linux nécessitent mksquashfs/fpm, et le dmg macOS doit être empaqueté sur macOS.

### Changements de la 1.0.3 (depuis la 1.0.2)

- Correction : nettoyage automatique des codes de test en cache laissés par les anciennes versions lors d'une déconnexion ; `123456` n'est plus renvoyé à plusieurs reprises après la reconnexion
- Ajustement : par défaut, seuls les codes de vérification SMS système sont transmis (nouvel interrupteur « SMS uniquement ») ; les notifications d'applications comme WeChat/QQ ne sont plus transmises, sauf si l'interrupteur est désactivé, auquel cas elles sont transmises par mots-clés
- Correction : le host du QR d'appairage récupérait un objet, empêchant le téléphone de se connecter (utilisation de address et priorité au sous-réseau LAN) ; l'info-bulle du QR affiche l'adresse IP et un message d'échec de génération
- Mobile : validation stricte du host lors de l'appairage par QR et alerte si la caméra ne s'ouvre pas
- Push multi-PC : envoi à tous les PC configurés en même temps, activable dans les réglages mobiles
- Panneau de santé de la connexion (état en temps réel, dernier heartbeat, informations de l'appareil)
- Reconnaissance du type de code avec un style d'île par type (connexion / paiement / inscription / déverrouillage, chaque type a son propre style)
- Bibliothèque de modèles de plateforme (Taobao / Alipay / WeChat / banques / Steam / Weibo, correspondance rapide des textes et styles)
- Historique groupé par jour (aujourd'hui / hier / plus tôt), statistiques hebdomadaires / mensuelles, copier et partager le résumé en un clic

---

## العربية

## CodeBridge 1.0.3

| الملف | النظام الأساسي | النوع | الوصف |
|---|---|---|---|
| CodeBridge-1.0.3-android.apk | Android | APK | تطبيق الهاتف (Kotlin + Compose)، موقّع بالمفتاح الرسمي |
| CodeBridge-1.0.3-windows-installer.exe | Windows x64 | مثبّت | برنامج التثبيت NSIS |
| CodeBridge-1.0.3-windows-x64-portable.exe | Windows x64 | محمول | بدون تثبيت، انقر نقرًا مزدوجًا للتشغيل |

> يجب بناء إصدارات macOS / Linux على النظام الأساسي المقابل (أو في بيئة CI): تتطلب AppImage/deb الخاصة بنظام لينكس أداتي mksquashfs/fpm، ويجب تعبئة ملف dmg الخاص بنظام macOS على نظام macOS.

### تغييرات الإصدار 1.0.3 (منذ 1.0.2)

- إصلاح: التنظيف التلقائي لرموز الاختبار المخزنة مؤقتًا التي تركتها الإصدارات القديمة عند انقطاع الاتصال؛ لم يعد `123456` يُرسَل بشكل متكرر بعد استعادة الاتصال
- تعديل: افتراضيًا تُنقل رموز تحقق SMS الخاصة بالنظام فقط (مفتاح جديد «رموز SMS فقط»)؛ لم تعد إشعارات التطبيقات مثل WeChat/QQ تُنقل إلا عند إيقاف تشغيل هذا المفتاح، وعندها تُنقل حسب الكلمات المفتاحية
- إصلاح: host رمز QR للاقتران كان يأخذ كائنًا مما منع الهاتف من الاتصال (استخدام address مع أولوية لشبكة LAN الفرعية)؛ تلميح الـ QR يعرض عنوان IP مع رسالة فشل التوليد
- تطبيق الهاتف: تحقق صارم من host في الاقتران عبر QR وتنبيه عند فشل فتح الكاميرا
- دفع متعدد أجهزة الكمبيوتر: الدفع إلى جميع أجهزة الكمبيوتر المكوّنة في وقت واحد، مع مفتاح تشغيل/إيقاف في إعدادات الهاتف
- لوحة صحة الاتصال (حالة الاتصال الفورية، آخر نبضة، معلومات الجهاز)
- التعرف على نوع رمز التحقق مع نمط جزيرة لكل نوع (تسجيل دخول / دفع / تسجيل / فتح، لكل نوع نمطه الخاص)
- مكتبة قوالب المنصات (Taobao / Alipay / WeChat / البنوك / Steam / Weibo، مطابقة سريعة لنصوص وأساليب المنصة)
- التاريخ مجمّعًا حسب اليوم (اليوم / الأمس / الأقدم)، إحصائيات أسبوعية / شهرية، نسخ ومشاركة الملخص بنقرة واحدة

---

## Русский

## CodeBridge 1.0.3

| Файл | Платформа | Тип | Описание |
|---|---|---|---|
| CodeBridge-1.0.3-android.apk | Android | APK | Клиент для телефона (Kotlin + Compose), подписан официальным ключом |
| CodeBridge-1.0.3-windows-installer.exe | Windows x64 | Установщик | Установщик NSIS |
| CodeBridge-1.0.3-windows-x64-portable.exe | Windows x64 | Портативная версия | Без установки, запуск двойным щелчком |

> Сборки для macOS / Linux нужно выполнять на соответствующей платформе (или в CI): для Linux AppImage/deb нужны mksquashfs/fpm, а dmg для macOS собирается на macOS.

### Изменения в 1.0.3 (с 1.0.2)

- Исправлено: автоматическая очистка кэшированных тестовых кодов, оставшихся от старых версий при обрыве соединения; `123456` больше не отправляется повторно после восстановления связи
- Изменено: по умолчанию пересылаются только системные SMS-коды подтверждения (новый переключатель «Только SMS-коды»); уведомления приложений вроде WeChat/QQ больше не пересылаются, если только переключатель не выключен — тогда пересылка идёт по ключевым словам
- Исправлено: host в QR-коде сопряжения получал объект, из-за чего телефон не мог подключиться (теперь используется address с приоритетом локальной подсети); подсказка QR показывает IP-адрес и сообщение об ошибке генерации
- Телефон: строгая проверка host при сопряжении по QR и предупреждение при неудачном открытии камеры
- Мульти-PC push: отправка сразу на все настроенные ПК, переключается в настройках телефона
- Панель здоровья соединения (статус в реальном времени, последний heartbeat, информация об устройстве)
- Определение типа кода с отдельным стилем острова для каждого типа (вход / оплата / регистрация / разблокировка)
- Библиотека шаблонов платформ (Taobao / Alipay / WeChat / банки / Steam / Weibo, быстрый подбор текстов и стилей)
- История сгруппирована по дням (сегодня / вчера / ранее), недельная / месячная статистика, копирование и отправка сводки в один клик

---

## Português

## CodeBridge 1.0.3

| Arquivo | Plataforma | Tipo | Descrição |
|---|---|---|---|
| CodeBridge-1.0.3-android.apk | Android | APK | Cliente móvel (Kotlin + Compose), assinado com a chave oficial |
| CodeBridge-1.0.3-windows-installer.exe | Windows x64 | Instalador | Instalador NSIS |
| CodeBridge-1.0.3-windows-x64-portable.exe | Windows x64 | Portátil | Sem instalação, duplo clique para executar |

> Os artefatos de macOS / Linux precisam ser compilados na plataforma correspondente (ou em CI): AppImage/deb do Linux exigem mksquashfs/fpm, e o dmg do macOS precisa ser empacotado no macOS.

### Mudanças na 1.0.3 (desde a 1.0.2)

- Corrigido: limpeza automática dos códigos de teste em cache deixados pelas versões antigas ao desconectar; `123456` não é mais reenviado repetidamente após reconectar
- Ajustado: por padrão, apenas códigos de verificação SMS do sistema são encaminhados (novo interruptor "Somente SMS"); notificações de aplicativos como WeChat/QQ não são mais encaminhadas, a menos que o interruptor seja desativado, caso em que são encaminhadas por palavras-chave
- Corrigido: o host do QR de pareamento recebia um objeto, impedindo o celular de conectar (agora usa address e prioriza a sub-rede da LAN); a dica do QR mostra o endereço IP e um aviso de falha na geração
- Celular: validação estrita do host no pareamento por QR e aviso se a câmera não abrir
- Push multi-PC: enviar para todos os PCs configurados de uma vez, alternável nas configurações do celular
- Painel de saúde da conexão (status em tempo real, último heartbeat, informações do dispositivo)
- Detecção do tipo de código com estilo de ilha por tipo (login / pagamento / registro / desbloqueio, cada tipo com seu próprio estilo)
- Biblioteca de modelos de plataforma (Taobao / Alipay / WeChat / bancos / Steam / Weibo, correspondência rápida de textos e estilos)
- Histórico agrupado por dia (hoje / ontem / anterior), estatísticas semanais / mensais, copiar e compartilhar o resumo com um clique

---

