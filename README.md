# DAM RAG - 智能文件管理 + AI 对话平台

一个基于 RAG（检索增强生成）的全栈 AI 文档问答系统，支持文件上传、向量化处理、流式对话和来源引用。面向求职展示的真实工程项目。

---

## 技术栈

`Nuxt3` `Vue3` `TypeScript` `Tailwind CSS` `PostgreSQL` `pgvector` `Prisma` `Docker` `DashScope`

---

## 架构图

```
User Browser
    │
    ├── GET /           → pages/index.vue (文件管理)
    └── GET /chat       → pages/chat.vue (AI 对话)
         │
         ▼
    Nuxt3 Server API
    ├── POST /api/files/upload   → 文件分块 → Embedding → pgvector
    ├── GET  /api/files          → 文件列表
    ├── DELETE /api/files/:id    → 删除文件 + 向量
    └── POST /api/chat/query     → RAG 检索 → qwen-turbo → SSE 流式输出
         │
         ▼
    PostgreSQL + pgvector
    ├── File  (id, name, size, status)
    └── Chunk (id, fileId, content, embedding vector(1536))
         │
         ▼
    DashScope API (通义千问)
    ├── text-embedding-v2 (向量化，1536 维)
    └── qwen-turbo (流式对话)
```

---

## 功能

### 文件管理页 (`/`)

- 支持拖拽上传 `.txt` / `.md` / `.pdf` 文件
- 文件卡片实时展示处理状态：`PENDING` → `PROCESSING` → `READY` / `ERROR`
- 上传后每 3 秒轮询状态，处理完成后自动停止
- 支持删除文件（级联删除对应向量块）

### RAG 处理流水线（异步）

- 文本提取 → 分块（500 字符，50 字符重叠）
- 调用 DashScope text-embedding-v2 生成向量
- 向量写入 PostgreSQL pgvector 扩展

### AI 对话页 (`/chat`)

- 基于 SSE 的流式回答，逐 token 渲染
- 检索引用展示：显示回答来源自哪些文档片段
- 多轮对话历史
- Markdown 格式渲染

---

## 功能截图

> 截图待补充（文件管理页 / AI 对话页）

---

## 本地启动（Docker 方式，推荐）

```bash
# 1. 克隆项目
git clone https://github.com/Drelightlee/dam-rag.git
cd dam-rag

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DASHSCOPE_API_KEY

# 3. 启动服务（应用 + PostgreSQL）
docker compose up -d --build

# 4. 初始化数据库
docker compose exec app npx prisma migrate deploy

# 5. 访问
# http://localhost:3000
```

---

## 本地开发（不使用 Docker）

```bash
# 安装依赖
pnpm install

# 需要本地 PostgreSQL（已安装 pgvector 扩展）
# 在 .env 中配置 DATABASE_URL

# 初始化数据库
npx prisma migrate dev

# 启动开发服务器
pnpm dev
```

---

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:pass@localhost:5432/damrag` |
| `DASHSCOPE_API_KEY` | 通义千问 API Key | `sk-xxx` |

---

## 技术亮点

- **RAG 完整流程**：文档分块 → Embedding → pgvector 向量检索 → LLM 流式回答，引用来源可追溯
- **SSE 流式输出**：Nitro server 原生流式写入，前端 `ReadableStream` 逐 token 渲染，无需 WebSocket
- **异步处理流水线**：文件上传立即返回 HTTP 200，后台异步完成分块 + 向量化，前端轮询状态更新
- **Docker 容器化部署**：多阶段 Dockerfile 减小镜像体积，`docker-compose` 一键启动应用与数据库

---

## 项目结构

```
dam-rag/
├── nuxt.config.ts
├── tailwind.config.ts
├── prisma/
│   └── schema.prisma          # File + Chunk 模型，pgvector 支持
├── prisma.config.ts           # Prisma 7 数据源配置
├── server/
│   ├── api/
│   │   ├── files/upload.post.ts    # 上传 + 触发处理流水线
│   │   ├── files/index.get.ts      # 文件列表
│   │   ├── files/[id].delete.ts    # 删除文件 + 向量
│   │   └── chat/query.post.ts      # RAG 检索 + SSE 流式输出
│   └── utils/
│       ├── db.ts              # Prisma 单例
│       ├── chunking.ts        # 文本分块
│       ├── embeddings.ts      # DashScope 向量化
│       └── retrieval.ts       # pgvector 余弦相似度检索
├── pages/
│   ├── index.vue              # 文件管理页
│   └── chat.vue               # AI 对话页
├── components/
│   ├── FileUploader.vue       # 拖拽上传组件
│   ├── FileCard.vue           # 文件状态卡片
│   └── ChatWindow.vue         # 对话 UI（SSE 消费）
├── composables/
│   └── useChat.ts             # SSE 客户端状态管理
├── Dockerfile                 # 多阶段构建
└── docker-compose.yml         # 应用 + PostgreSQL 服务编排
```
