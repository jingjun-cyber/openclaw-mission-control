# Mission Control

**AI 运维控制台** - 统一的任务管理、团队协作、系统监控平台

![Mission Control](https://img.shields.io/badge/Next.js-14.2.5-black) ![Convex](https://img.shields.io/badge/Convex-Local-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## 功能概览

### 核心模块

| 模块 | 路由 | 描述 |
|------|------|------|
| **Overview** | `/overview` | 系统健康状态、活跃工作、风险预警 |
| **Tasks** | `/tasks` | 任务看板、AI 规划、执行追踪 |
| **Pipeline** | `/pipeline` | 内容工作流、阶段管理 |
| **Calendar** | `/calendar` | 日程安排、Cron 任务可视化 |
| **Memory** | `/memory` | 文档工作台、知识库管理 |
| **Team** | `/team` | 团队成员、Agent 状态、工作负载 |
| **Office** | `/office` | 工位状态、在场检测 |
| **Collab** | `/collab` | 多 Agent 协作大厅 |
| **Approvals** | `/approvals` | 审批流程、敏感操作控制 |
| **Settings** | `/settings` | 系统配置、安全状态、连接诊断 |
| **Usage** | `/usage` | Token 消耗、成本分析 |
| **Incidents** | `/incidents` | 事件管理、告警记录 |
| **Daily** | `/daily` | 每日总结、运营概览 |

### 核心特性

- **AI Planning Flow** - 任务自动进入规划阶段，生成执行计划和验收标准
- **多 Agent 协作** - 协作大厅、执行队列、任务移交
- **安全门控** - 只读模式、Mutation 保护、本地 Token 认证
- **实时监控** - 会话上下文压力、系统健康状态、连接诊断
- **审批流程** - 敏感操作审批、Dry-run、执行记录
- **公网访问** - Cloudflare Tunnel 支持远程访问

## 技术栈

- **前端**: Next.js 14 (App Router) + React + Tailwind CSS
- **数据库**: Convex (本地运行)
- **部署**: Cloudflare Tunnel (公网) + 本地开发

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`:

```bash
# Convex 配置
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211

# 安全配置 (可选)
MISSION_CONTROL_READ_ONLY=false
MISSION_CONTROL_MUTATION_GUARD=true
MISSION_CONTROL_LOCAL_TOKEN=your-secret-token
OFFICE_WEBHOOK_SECRET=your-webhook-secret
```

### 3. 启动服务

```bash
# 启动 Convex (终端 1)
npm run convex:dev

# 启动 Next.js (终端 2)
npm run dev
```

### 4. 初始化数据

```bash
# 同步所有数据
npm run sync:all

# 或单独同步
npm run seed:defaults   # 初始化默认数据
npm run sync:agents     # 同步 Agent
npm run sync:memory     # 同步文档
npm run sync:sessions   # 同步会话
npm run sync:cron       # 同步定时任务
```

### 5. 访问应用

- **本地访问**: http://localhost:3000
- **公网访问**: https://missioncontrol.jayclaw.org (需配置 Cloudflare Tunnel)

## AI Planning 流程

新任务自动进入规划阶段：

1. 在 `/tasks` 创建任务
2. 系统创建关联的 `planningSession`
3. 在 `Planning` 标签页回答引导问题
4. 可选择 `Skip`、`Stop planning`、`Regenerate questions`
5. 完成规划后，任务存储结构化执行计划和验收标准
6. 任务阶段移动到 `execution`

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/safety/status` | GET | 安全状态 (只读、保护、Token) |
| `/api/security/status` | GET | 详细安全诊断 |
| `/api/version/status` | GET | 版本信息 |
| `/api/office/presence` | POST | 工位在场更新 (Webhook) |
| `/api/context-pressure` | GET | 会话上下文压力 |
| `/api/connectors/status` | GET | 连接器状态 |
| `/api/auth/verify` | POST | Token 验证 |

## Cloudflare Tunnel 配置

参见 [Cloudflare Tunnel 配置指南](../docs/cloudflare-tunnel-setup.md)

**快速配置**:

1. 在 Cloudflare Zero Trust 添加 Tunnel
2. 配置 Hostname:
   - `missioncontrol.jayclaw.org` → `localhost:3000`
   - `convex.jayclaw.org` → `localhost:3210`
3. 更新 `.env.local`:
   ```bash
   NEXT_PUBLIC_CONVEX_URL=https://convex.jayclaw.org
   ```

## 构建

```bash
npm run build
```

## 环境要求

- Node.js 18+
- npm 9+
- macOS / Linux

## 许可证

MIT

## 相关链接

- [GitHub](https://github.com/jingjun-cyber/openclaw-mission-control)
- [Cloudflare Tunnel 配置](../docs/cloudflare-tunnel-setup.md)
