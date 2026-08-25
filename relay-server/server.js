#!/usr/bin/env node
/**
 * CodeBridge 公网加密中继服务器
 * -----------------------------------------------
 * 手机端与 PC 端不在同一局域网时，通过本中继转发验证码。
 * 消息使用 AES-256-GCM 端到端加密，本服务器只转发密文，
 * 密钥由「房间名 + 中继密钥」在两端本地派生，中继无法解密。
 *
 * 部署：
 *   node server.js            # 默认监听 9842（HTTP）
 *   PORT=9842 node server.js  # 指定端口
 * 公网建议用 Caddy / Nginx 反代并启用 HTTPS，例如：
 *   relay.example.com {
 *       reverse_proxy 127.0.0.1:9842
 *   }
 *
 * API（均为 JSON POST）：
 *   POST /relay/push  { room, tokenHash, payload:{ iv, ct, tag } }
 *   POST /relay/pull  { room, tokenHash, lastId }
 *   GET  /relay/health
 */
'use strict';

const http = require('http');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || process.argv[2] || '9842', 10);
const MAX_PER_ROOM = 200;          // 每房间最多保留消息数
const TTL_MS = 24 * 60 * 60 * 1000; // 消息保留时长（24 小时）

// rooms: Map<room, { tokenHash, msgs: [{id,time,iv,ct,tag}], lastId }>
const rooms = new Map();

function sendJson(res, status, obj) {
  const text = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 2e6) { reject(new Error('body too large')); req.destroy(); }
    });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('invalid json')); } });
    req.on('error', reject);
  });
}

/** 取房间；room 首次出现时用 tokenHash 注册，之后必须匹配 */
function getRoom(room, tokenHash) {
  let r = rooms.get(room);
  if (!r) {
    if (!tokenHash) return null;
    r = { tokenHash, msgs: [], lastId: 0 };
    rooms.set(room, r);
    return r;
  }
  if (!r.tokenHash || r.tokenHash !== tokenHash) return null;
  return r;
}

function prune(r) {
  const cutoff = Date.now() - TTL_MS;
  while (r.msgs.length && r.msgs[0].time < cutoff) r.msgs.shift();
  if (r.msgs.length > MAX_PER_ROOM) r.msgs.splice(0, r.msgs.length - MAX_PER_ROOM);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    });
    res.end();
    return;
  }
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/\/+$/, '') || '/';
  try {
    if (req.method === 'GET' && path === '/relay/health') {
      return sendJson(res, 200, { ok: true, name: 'CodeBridge Relay', time: new Date().toISOString(), rooms: rooms.size });
    }
    if (req.method === 'POST' && path === '/relay/push') {
      const body = await readBody(req);
      const room = String(body.room || '').trim();
      const tokenHash = String(body.tokenHash || '');
      if (!room || !tokenHash) return sendJson(res, 400, { ok: false, error: 'room/tokenHash required' });
      const r = getRoom(room, tokenHash);
      if (!r) return sendJson(res, 403, { ok: false, error: 'room auth failed' });
      const payload = body.payload;
      if (!payload || !payload.iv || !payload.ct || !payload.tag) {
        return sendJson(res, 400, { ok: false, error: 'payload{iv,ct,tag} required' });
      }
      r.lastId += 1;
      prune(r);
      r.msgs.push({
        id: r.lastId,
        time: Date.now(),
        iv: String(payload.iv).slice(0, 1024),
        ct: String(payload.ct).slice(0, 65536),
        tag: String(payload.tag).slice(0, 1024),
      });
      return sendJson(res, 200, { ok: true, id: r.lastId });
    }
    if (req.method === 'POST' && path === '/relay/pull') {
      const body = await readBody(req);
      const room = String(body.room || '').trim();
      const tokenHash = String(body.tokenHash || '');
      if (!room || !tokenHash) return sendJson(res, 400, { ok: false, error: 'room/tokenHash required' });
      const r = getRoom(room, tokenHash);
      if (!r) return sendJson(res, 403, { ok: false, error: 'room auth failed' });
      const lastId = Math.max(0, Number(body.lastId) || 0);
      prune(r);
      const msgs = r.msgs.filter((m) => m.id > lastId).slice(0, 100);
      return sendJson(res, 200, { ok: true, lastId: r.lastId, msgs });
    }
    return sendJson(res, 404, { ok: false, error: 'not found' });
  } catch (err) {
    return sendJson(res, 500, { ok: false, error: String(err && err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log('[CodeBridge Relay] listening on port ' + PORT);
});
