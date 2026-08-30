<div align="center">

**🌐 选择语言 / Select Language**

[简体中文](#简体中文) · [繁體中文](#繁體中文) · [English](#english) · [Español](#español) · [Français](#français) · [العربية](#العربية) · [Русский](#русский) · [Português](#português)

</div>

> **说明 / Note**: 以简体中文为标准 · Simplified Chinese is the standard reference.

---

## 简体中文

## CodeBridge 公网加密中继服务器

手机与 PC 不在同一局域网（例如手机使用 4G/5G）时，通过本中继转发验证码。

- **端到端加密**：消息用 AES-256-GCM 加密，密钥由「房间名 + 中继密钥」在两端本地派生，中继服务器只能转发密文、无法解密。
- **零依赖**：仅使用 Node.js 内置模块。
- **认证**：请求携带 `tokenHash`（中继密钥的 SHA-256），中继只校验哈希，不接触密钥明文。

## 部署

```bash
node server.js            # 默认 9842 端口
PORT=9842 node server.js  # 指定端口
```

公网建议用 Caddy / Nginx 反代并开启 HTTPS：

```bash
# Caddyfile
relay.example.com {
    reverse_proxy 127.0.0.1:9842
}
```

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/relay/push` | 推送一条密文消息 `{ room, tokenHash, payload:{ iv, ct, tag } }` |
| POST | `/relay/pull` | 拉取增量消息 `{ room, tokenHash, lastId }`，返回 `{ lastId, msgs }` |
| GET | `/relay/health` | 健康检查 |

## 客户端配置

- PC 端：设置 → 连接 → 开启「公网加密中继」，填写中继地址、房间名、中继密钥
- 手机端：设置 → 公网中继，填写相同的中继地址、房间名、中继密钥
- 房间名建议使用足够随机的字符串（如 `cb-8f3a-...`），避免被他人抢先注册

---

## 繁體中文

## CodeBridge 公網加密中繼伺服器

手機與 PC 不在同一區域網路（例如手機使用 4G/5G）時，透過本中繼轉發驗證碼。

- **端到端加密**：訊息用 AES-256-GCM 加密，金鑰由「房間名稱 + 中繼金鑰」在兩端本機衍生，中繼伺服器只能轉發密文、無法解密。
- **零依賴**：僅使用 Node.js 內建模組。
- **認證**：請求攜帶 `tokenHash`（中繼金鑰的 SHA-256），中繼只驗證雜湊，不接觸金鑰明文。

## 部署

```bash
node server.js            # 默认 9842 端口
PORT=9842 node server.js  # 指定端口
```

公網建議用 Caddy / Nginx 反代並開啟 HTTPS：

```bash
# Caddyfile
relay.example.com {
    reverse_proxy 127.0.0.1:9842
}
```

## API

| 方法 | 路徑 | 說明 |
| --- | --- | --- |
| POST | `/relay/push` | 推送一則密文訊息 `{ room, tokenHash, payload:{ iv, ct, tag } }` |
| POST | `/relay/pull` | 拉取增量訊息 `{ room, tokenHash, lastId }`，回傳 `{ lastId, msgs }` |
| GET | `/relay/health` | 健康檢查 |

## 用戶端設定

- PC 端：設定 → 連線 → 開啟「公網加密中繼」，填寫中繼位址、房間名稱、中繼金鑰
- 手機端：設定 → 公網中繼，填寫相同的中繼位址、房間名稱、中繼金鑰
- 房間名稱建議使用足夠隨機的字串（如 `cb-8f3a-...`），避免被他人搶先註冊

---

## English

## CodeBridge Public Encrypted Relay Server

When the phone and the PC are not on the same LAN (for example, the phone uses 4G/5G), verification codes are forwarded through this relay.

- **End-to-end encryption**: messages are encrypted with AES-256-GCM; the key is derived locally on both ends from "room name + relay key", so the relay server can only forward ciphertext and cannot decrypt it.
- **Zero dependencies**: uses only Node.js built-in modules.
- **Authentication**: requests carry `tokenHash` (SHA-256 of the relay key); the relay only verifies the hash and never touches the key in plaintext.

## Deployment

```bash
node server.js            # 默认 9842 端口
PORT=9842 node server.js  # 指定端口
```

For public network deployment, it is recommended to use Caddy / Nginx as a reverse proxy with HTTPS enabled:

```bash
# Caddyfile
relay.example.com {
    reverse_proxy 127.0.0.1:9842
}
```

## API

| Method | Path | Description |
| --- | --- | --- |
| POST | `/relay/push` | Push a ciphertext message `{ room, tokenHash, payload:{ iv, ct, tag } }` |
| POST | `/relay/pull` | Pull incremental messages `{ room, tokenHash, lastId }`, returns `{ lastId, msgs }` |
| GET | `/relay/health` | Health check |

## Client configuration

- PC client: Settings → Connection → enable "Public encrypted relay", fill in the relay address, room name, and relay key
- Mobile client: Settings → Public relay, fill in the same relay address, room name, and relay key
- It is recommended to use a sufficiently random string as the room name (e.g., `cb-8f3a-...`) to prevent others from registering it first

---

## Español

## Servidor relay cifrado de CodeBridge para red pública

Cuando el teléfono y el PC no están en la misma red local (por ejemplo, el teléfono usa 4G/5G), el código de verificación se reenvía a través de este relay.

- **Cifrado de extremo a extremo**: los mensajes se cifran con AES-256-GCM; la clave se deriva localmente en ambos extremos a partir de «nombre de la sala + clave del relay», y el servidor relay solo puede reenviar el texto cifrado, sin poder descifrarlo.
- **Cero dependencias**: solo utiliza módulos integrados de Node.js.
- **Autenticación**: las solicitudes llevan `tokenHash` (SHA-256 de la clave del relay); el relay solo verifica el hash y nunca accede a la clave en texto plano.

## Despliegue

```bash
node server.js            # 默认 9842 端口
PORT=9842 node server.js  # 指定端口
```

Para redes públicas se recomienda usar Caddy / Nginx como proxy inverso con HTTPS activado:

```bash
# Caddyfile
relay.example.com {
    reverse_proxy 127.0.0.1:9842
}
```

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/relay/push` | Envía un mensaje con texto cifrado `{ room, tokenHash, payload:{ iv, ct, tag } }` |
| POST | `/relay/pull` | Obtiene mensajes incrementales `{ room, tokenHash, lastId }`, devuelve `{ lastId, msgs }` |
| GET | `/relay/health` | Comprobación de salud |

## Configuración del cliente

- Cliente de PC: Configuración → Conexión → activa «Relay cifrado de red pública», escribe la dirección del relay, el nombre de la sala y la clave del relay
- Cliente móvil: Configuración → Relay de red pública, escribe la misma dirección del relay, el mismo nombre de sala y la misma clave del relay
- Se recomienda usar una cadena suficientemente aleatoria como nombre de sala (por ejemplo, `cb-8f3a-...`) para evitar que otra persona la registre primero

---

## Français

## Serveur de relais chiffré CodeBridge pour réseau public

Lorsque le téléphone et le PC ne sont pas sur le même réseau local (par exemple, le téléphone utilise la 4G/5G), le code de vérification est transmis via ce relais.

- **Chiffrement de bout en bout** : les messages sont chiffrés avec AES-256-GCM ; la clé est dérivée localement aux deux extrémités à partir du « nom de la salle + clé du relais », et le serveur relais ne peut que transmettre le texte chiffré, sans pouvoir le déchiffrer.
- **Zéro dépendance** : utilise uniquement les modules intégrés de Node.js.
- **Authentification** : les requêtes portent `tokenHash` (SHA-256 de la clé du relais) ; le relais ne vérifie que le hash et n'accède jamais à la clé en clair.

## Déploiement

```bash
node server.js            # 默认 9842 端口
PORT=9842 node server.js  # 指定端口
```

Pour un réseau public, il est recommandé d'utiliser Caddy / Nginx en proxy inverse avec HTTPS activé :

```bash
# Caddyfile
relay.example.com {
    reverse_proxy 127.0.0.1:9842
}
```

## API

| Méthode | Chemin | Description |
| --- | --- | --- |
| POST | `/relay/push` | Envoie un message chiffré `{ room, tokenHash, payload:{ iv, ct, tag } }` |
| POST | `/relay/pull` | Récupère les messages incrémentaux `{ room, tokenHash, lastId }`, renvoie `{ lastId, msgs }` |
| GET | `/relay/health` | Vérification de santé |

## Configuration du client

- Client PC : Paramètres → Connexion → activez « Relais chiffré réseau public », saisissez l'adresse du relais, le nom de la salle et la clé du relais
- Client mobile : Paramètres → Relais réseau public, saisissez la même adresse de relais, le même nom de salle et la même clé de relais
- Il est recommandé d'utiliser une chaîne suffisamment aléatoire comme nom de salle (par exemple `cb-8f3a-...`) pour éviter qu'elle ne soit enregistrée par quelqu'un d'autre en premier

---

## العربية

## خادم الترحيل المشفّر من CodeBridge على الشبكة العامة

عندما لا يكون الهاتف والكمبيوتر (PC) على نفس الشبكة المحلية (مثلًا عند استخدام الهاتف لشبكة 4G/5G)، يتم إعادة توجيه رمز التحقق عبر هذا المرحّل.

- **تشفير من طرف إلى طرف**: يتم تشفير الرسائل باستخدام AES-256-GCM، ويتم اشتقاق المفتاح محليًا على الطرفين من «اسم الغرفة + مفتاح الترحيل»، ولا يستطيع خادم الترحيل سوى إعادة توجيه النص المشفر دون القدرة على فك تشفيره.
- **صفر تبعيات**: يستخدم فقط الوحدات المدمجة في Node.js.
- **المصادقة**: تحمل الطلبات `tokenHash` (SHA-256 لمفتاح الترحيل)، ولا يتحقق المرحّل سوى من التجزئة دون لمس المفتاح في صيغته الصريحة.

## النشر

```bash
node server.js            # 默认 9842 端口
PORT=9842 node server.js  # 指定端口
```

بالنسبة للشبكة العامة، يُنصح باستخدام Caddy / Nginx كوكيل عكسي مع تفعيل HTTPS:

```bash
# Caddyfile
relay.example.com {
    reverse_proxy 127.0.0.1:9842
}
```

## API

| الطريقة | المسار | الوصف |
| --- | --- | --- |
| POST | `/relay/push` | دفع رسالة نص مشفر `{ room, tokenHash, payload:{ iv, ct, tag } }` |
| POST | `/relay/pull` | سحب الرسائل المتزايدة `{ room, tokenHash, lastId }`، ويعيد `{ lastId, msgs }` |
| GET | `/relay/health` | فحص الصحة |

## إعدادات العميل

- عميل الكمبيوتر: الإعدادات ← الاتصال ← فعّل «الترحيل المشفّر على الشبكة العامة»، وأدخل عنوان الترحيل واسم الغرفة ومفتاح الترحيل
- تطبيق الهاتف: الإعدادات ← الترحيل العام، وأدخل نفس عنوان الترحيل واسم الغرفة ومفتاح الترحيل
- يُنصح باستخدام سلسلة عشوائية بما يكفي كاسم للغرفة (مثل `cb-8f3a-...`) لتجنب قيام شخص آخر بتسجيلها قبلك

---

## Русский

## Зашифрованный сервер-ретранслятор CodeBridge для публичной сети

Когда телефон и ПК не находятся в одной локальной сети (например, телефон использует 4G/5G), код подтверждения пересылается через этот ретранслятор.

- **Сквозное шифрование**: сообщения шифруются с помощью AES-256-GCM; ключ выводится локально на обоих концах из «имени комнаты + ключа ретрансляции», поэтому сервер-ретранслятор может только пересылать шифротекст и не может его расшифровать.
- **Ноль зависимостей**: используются только встроенные модули Node.js.
- **Аутентификация**: запросы содержат `tokenHash` (SHA-256 ключа ретрансляции); ретранслятор проверяет только хэш и не работает с ключом в открытом виде.

## Развертывание

```bash
node server.js            # 默认 9842 端口
PORT=9842 node server.js  # 指定端口
```

Для публичной сети рекомендуется использовать Caddy / Nginx в качестве обратного прокси с включённым HTTPS:

```bash
# Caddyfile
relay.example.com {
    reverse_proxy 127.0.0.1:9842
}
```

## API

| Метод | Путь | Описание |
| --- | --- | --- |
| POST | `/relay/push` | Отправка сообщения с шифротекстом `{ room, tokenHash, payload:{ iv, ct, tag } }` |
| POST | `/relay/pull` | Получение инкрементальных сообщений `{ room, tokenHash, lastId }`, возвращает `{ lastId, msgs }` |
| GET | `/relay/health` | Проверка состояния |

## Настройка клиента

- Клиент ПК: Настройки → Подключение → включите «Зашифрованный ретранслятор для публичной сети», укажите адрес ретранслятора, имя комнаты и ключ ретрансляции
- Мобильный клиент: Настройки → Публичный ретранслятор, укажите те же адрес ретранслятора, имя комнаты и ключ ретрансляции
- В качестве имени комнаты рекомендуется использовать достаточно случайную строку (например, `cb-8f3a-...`), чтобы другие не зарегистрировали её раньше вас

---

## Português

## Servidor de relay criptografado da CodeBridge para rede pública

Quando o celular e o PC não estão na mesma rede local (por exemplo, o celular usando 4G/5G), o código de verificação é encaminhado por meio deste relay.

- **Criptografia de ponta a ponta**: as mensagens são criptografadas com AES-256-GCM; a chave é derivada localmente nas duas extremidades a partir de «nome da sala + chave do relay», e o servidor relay só pode encaminhar o texto cifrado, sem conseguir descriptografá-lo.
- **Zero dependências**: usa apenas módulos integrados do Node.js.
- **Autenticação**: as requisições carregam `tokenHash` (SHA-256 da chave do relay); o relay apenas verifica o hash e nunca acessa a chave em texto puro.

## Implantação

```bash
node server.js            # 默认 9842 端口
PORT=9842 node server.js  # 指定端口
```

Para rede pública, recomenda-se usar Caddy / Nginx como proxy reverso com HTTPS ativado:

```bash
# Caddyfile
relay.example.com {
    reverse_proxy 127.0.0.1:9842
}
```

## API

| Método | Caminho | Descrição |
| --- | --- | --- |
| POST | `/relay/push` | Envia uma mensagem com texto cifrado `{ room, tokenHash, payload:{ iv, ct, tag } }` |
| POST | `/relay/pull` | Busca mensagens incrementais `{ room, tokenHash, lastId }`, retorna `{ lastId, msgs }` |
| GET | `/relay/health` | Verificação de saúde |

## Configuração do cliente

- Cliente de PC: Configurações → Conexão → ative «Relay criptografado de rede pública», preencha o endereço do relay, o nome da sala e a chave do relay
- Cliente móvel: Configurações → Relay público, preencha o mesmo endereço do relay, o mesmo nome de sala e a mesma chave do relay
- Recomenda-se usar uma string suficientemente aleatória como nome da sala (ex.: `cb-8f3a-...`) para evitar que outra pessoa a registre primeiro

---

