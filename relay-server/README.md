# CodeBridge 公网加密中继服务器

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
