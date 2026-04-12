# Cloudflare Tunnel 配置指南 - Mission Control

## 背景

### 项目介绍
Mission Control 是一个运行在 Mac mini 上的 AI 运维控制台，使用：
- **Next.js** - 前端应用 (端口 3000)
- **Convex** - 本地数据库 (端口 3210)

### 访问方式
我们希望通过公网域名访问 Mission Control，这样：
- 不在本地网络时也能查看系统状态
- 可以分享给其他人访问（需要时）
- 使用 Cloudflare Tunnel 实现，无需公网 IP

### 当前问题
公网访问 `missioncontrol.jayclaw.org` 时，前端页面可以加载，但**无法获取数据**。

**原因**：
- 前端需要连接 Convex 数据库获取任务、会话、团队等数据
- Convex 运行在本地 `localhost:3210`
- 公网用户无法访问 `localhost`
- 需要通过 Cloudflare Tunnel 暴露 Convex 端口

---

## 目标

### 完成后效果
| 访问方式 | 域名 | 状态 |
|----------|------|------|
| 本地访问 | `localhost:3000` | ✅ 完整功能 |
| 公网访问 | `missioncontrol.jayclaw.org` | ✅ 完整功能 |

### 架构图
```
用户浏览器
    │
    ▼
Cloudflare CDN
    │
    ▼
Cloudflare Tunnel (macclaw)
    │
    ├── missioncontrol.jayclaw.org → localhost:3000 (Next.js)
    │
    └── convex.jayclaw.org → localhost:3210 (Convex)
```

---

## 配置步骤

### 步骤 1：在 Cloudflare Zero Trust 添加 Convex 域名

1. 打开浏览器，访问 [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)

2. 登录你的 Cloudflare 账号

3. 左侧菜单选择 **Access** → **Tunnels**

4. 找到名为 `macclaw` 的 tunnel，点击进入

5. 点击 **Public Hostname** 标签页

6. 点击 **Add a public hostname** 按钮

7. 填写配置：

   | 字段 | 值 |
   |------|-----|
   | Subdomain | `convex` |
   | Domain | `jayclaw.org` |
   | Path | (留空) |
   | Type | `HTTP` |
   | URL | `localhost:3210` |

8. 点击 **Save** 保存

### 步骤 2：更新环境变量

修改项目环境变量文件：

**文件位置**：
```
~/.openclaw/workspace/projects/mission-control/apps/mission-control-app/.env.local
```

**修改内容**：
```bash
# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=anonymous:anonymous-mission-control-app

# Public Convex URLs (via Cloudflare Tunnel)
NEXT_PUBLIC_CONVEX_URL=https://convex.jayclaw.org
NEXT_PUBLIC_CONVEX_SITE_URL=https://convex.jayclaw.org
```

### 步骤 3：重启服务

```bash
# 进入项目目录
cd ~/.openclaw/workspace/projects/mission-control/apps/mission-control-app

# 重启 Next.js 开发服务器
pkill -f "next dev"
npm run dev
```

### 步骤 4：验证配置

1. **测试 Convex 公网访问**：
   ```bash
   curl -s "https://convex.jayclaw.org/api/query" \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"path":"tasks:list","args":{}}'
   ```

   应该返回任务列表 JSON。

2. **测试 Mission Control 公网访问**：
   打开浏览器访问 `https://missioncontrol.jayclaw.org`

   应该能看到完整的系统状态和任务列表。

---

## 故障排除

### 问题：Cloudflare Tunnel 连接失败

**症状**：
```
ERR Unable to establish connection with Cloudflare edge
error="TLS handshake with edge error: EOF"
```

**原因**：Surge 代理拦截了 cloudflared 的连接

**解决方案**：在 Surge 配置中添加规则让 cloudflared 直连

**操作步骤**：
1. 打开 Surge 应用
2. 编辑配置文件
3. 在 `[Rule]` 部分添加：
   ```ini
   PROCESS-NAME,cloudflared,DIRECT
   ```
4. 重载 Surge 配置
5. 重启 cloudflared：
   ```bash
   sudo launchctl kickstart -k system/com.cloudflare.cloudflared
   ```

### 问题：前端显示 0 数据

**检查清单**：
1. Convex 是否运行？`lsof -i :3210`
2. 环境变量是否正确？`cat .env.local | grep CONVEX`
3. 域名是否解析？`nslookup convex.jayclaw.org`
4. Tunnel 是否连接？`ps aux | grep cloudflared`

---

## 当前配置

### 已配置的 Tunnel
```yaml
# /etc/cloudflared/config.yml
tunnel: 4c08b3b6-f51e-49bc-a1c4-2ecf083249f8
credentials-file: /etc/cloudflared/4c08b3b6-f51e-49bc-a1c4-2ecf083249f8.json
protocol: http2

ingress:
  - hostname: missioncontrol.jayclaw.org
    service: http://localhost:3000
  - hostname: convex.jayclaw.org      # ← 待添加
    service: http://localhost:3210     # ← 待添加
  - service: http_status:404
```

### 域名列表

| 域名 | 端口 | 服务 | 状态 |
|------|------|------|------|
| `missioncontrol.jayclaw.org` | 3000 | Next.js 前端 | ✅ 已配置 |
| `convex.jayclaw.org` | 3210 | Convex 数据库 | ❌ 待配置 |

---

## 注意事项

1. **域名拼写**：是 `jayclaw.org`，不是 `jawclaw.org`

2. **本地访问**：配置完成后，本地访问仍可使用 `localhost:3000`，数据同样正常

3. **安全性**：公网暴露 Convex 可能需要考虑认证，当前是匿名访问

4. **Convex 版本**：使用的是本地 Convex (`convex-local-backend`)，不是 Convex Cloud

---

## 相关文件

| 文件 | 路径 |
|------|------|
| Tunnel 配置 | `/etc/cloudflared/config.yml` |
| 环境变量 | `~/.openclaw/workspace/projects/mission-control/apps/mission-control-app/.env.local` |
| 项目目录 | `~/.openclaw/workspace/projects/mission-control/apps/mission-control-app` |

---

**创建时间**：2026-04-12
**最后更新**：2026-04-12
