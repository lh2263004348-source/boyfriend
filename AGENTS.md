# AGENTS.md

> 纸片人男友 v1 · Agent 协作规范

## 项目概览

- **项目名**：纸片人男友 v1
- **类型**：网页虚拟男友陪伴产品
- **目标用户**：单身女性，18-35 岁
- **核心场景**：下班后独居的夜晚（19:00-24:00）
- **核心价值**：有趣 + 情绪被影响
- **技术栈**：Next.js 16 + React 19 + TypeScript 5 + Tailwind 4 + shadcn/ui + Neon PostgreSQL + Drizzle ORM + Auth.js
- **AI 能力**：LLM（流式对话）+ TTS（语音）+ 图像生成
- **云存储**：Cloudflare R2（`src/lib/storage/r2.ts` 已实现 `uploadToR2`）
- **当前阶段**：M0（未开始）

## 文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 完整 PRD | `PRD.md` | 产品需求文档（v1.2，含登录 / Neon / 用户画像记忆） |
| 开发计划与测试 | `DEV_PLAN.md` | 分阶段交付 + 测试案例 + 阶段门禁 |
| 角色人设 | `CHARACTERS.md` | 三种预置男友完整人设（Prompt / 台词 / 情绪规则） |
| 设计规范 | `DESIGN.md` | 视觉/交互/动效规范 |
| 开发计划 | 本文件 + `DEV_PLAN.md` | M0-M6 任务清单；**测试案例见 DEV_PLAN.md** |
| 环境配置 | `.env` | 本地密钥（已 gitignore，勿提交） |

> **新 agent 第一步**：先读本文件，再读 `PRD.md`、`DEV_PLAN.md`、`CHARACTERS.md` 和 `DESIGN.md`，最后才开始执行任务。

## 项目结构（规划）

> 完整结构见 PRD §8.1。以下为要点。

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # 主页（需登录）
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── create/page.tsx
│   ├── chat/[id]/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── chat/route.ts
│   │   ├── tts/route.ts
│   │   ├── image/route.ts
│   │   ├── boyfriends/route.ts
│   │   ├── messages/route.ts
│   │   ├── memory/extract/route.ts
│   │   └── surprise/route.ts
│   └── globals.css
├── components/
│   ├── ui/
│   ├── auth/                       # LoginForm / RegisterForm
│   ├── chat/
│   ├── boyfriends/
│   └── layout/
├── lib/
│   ├── db/                         # Neon + Drizzle schema / migrations
│   ├── auth/                       # Auth.js config / session
│   ├── repositories/               # users / boyfriends / messages / profileFacts
│   ├── llm/                        # client / prompts / parser
│   ├── tts/
│   ├── image/
│   ├── storage/r2.ts               # ✅ 已实现
│   ├── memory/                     # summarizer / extractor / profileKeys
│   ├── emotion/
│   ├── surprise/
│   ├── intimacy/
│   ├── relationship/
│   └── types.ts
├── hooks/
├── middleware.ts                   # 路由鉴权
└── store/chatStore.ts              # 运行时缓存（DB 为唯一数据源）
```

## 开发路线图

### 总览

| 阶段 | 主题 | 任务数 | 前置依赖 |
|------|------|--------|---------|
| M0 | 基础设施 | 5 | 无 |
| M1 | 基础对话 | 9 | M0 |
| M2 | 关系模式 | 7 | M1 |
| M3 | 暧昧值与惊喜 | 6 | M1 |
| M4 | 情绪系统 | 5 | M1, M2 |
| M5 | 记忆系统 | 6 | M1, M2 |
| M6 | 联调与优化 | 6 | M1-M5 |

**任务依赖约定**：横向（M 内）按编号顺序；纵向（跨 M）按上表"前置依赖"。
**领取建议**：单个 agent 一次领取一个任务，按编号顺序执行。

---

### M0 · 基础设施

**阶段目标**：Next.js 工程可运行 + Neon 表结构 + 登录鉴权。

#### M0.1 项目初始化
- **输入**：无
- **输出**：
  - 初始化 Next.js 16 + Tailwind 4 + shadcn/ui
  - 安装依赖：`tailwindcss-animate`、`lucide-react`、`drizzle-orm`、`@neondatabase/serverless`、`next-auth@beta`、`bcryptjs`
  - 按 PRD §8.1 建立目录结构
  - 确认 `.env` 已配置（见 PRD §6.6）
- **验证**：`pnpm run dev` 正常启动

#### M0.2 数据库 Schema 与迁移
- **输入**：M0.1
- **输出**：
  - `src/lib/db/schema.ts`：users / sessions / boyfriends / messages / memory_summaries / **user_profile_facts**
  - `src/lib/db/index.ts`：Neon 连接 + Drizzle 实例
  - 首次 migration 并执行
- **验证**：Neon 控制台可见 6 张表；`pnpm drizzle-kit push` 无错误

#### M0.3 Auth.js 认证
- **输入**：M0.2
- **输出**：
  - `src/lib/auth/config.ts`：邮箱 + 密码 Credentials  Provider
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `src/middleware.ts`：保护 `/`、`/create`、`/chat/*`
  - `login/page.tsx` + `register/page.tsx` + 表单组件
- **验证**：注册 → 自动登录 → 跳转主页；未登录访问受保护页跳转 `/login`

#### M0.4 Repository 数据访问层
- **输入**：M0.2, M0.3
- **输出**：
  - `src/lib/repositories/users.ts`
  - `src/lib/repositories/boyfriends.ts`
  - `src/lib/repositories/messages.ts`
  - `src/lib/repositories/profileFacts.ts`
  - 所有查询校验 `user_id` 归属
- **验证**：API 层 CRUD 测试通过；跨用户访问返回 403

#### M0.5 类型定义
- **输入**：M0.2
- **输出**：`src/lib/types.ts` 对齐 PRD §6.1（User / Boyfriend / Message / MemorySummary / UserProfileFact / RelationshipMode）
- **验证**：`pnpm tsc --noEmit` 无错误

**M0 阶段交付**：能注册登录 + 数据库表就绪 + repository 可用

---

### M1 · 基础对话

**阶段目标**：最小可运行 demo——登录后能创建男友、进入聊天、流式对话，数据落 Neon。

#### M1.1 男友 / 消息 API
- **输入**：M0.4
- **输出**：
  - `src/app/api/boyfriends/route.ts` CRUD
  - `src/app/api/messages/route.ts` 分页读写
- **验证**：Postman / curl 能创建男友、写入消息

#### M1.2 状态管理（chatStore）
- **输入**：M0.5
- **输出**：`src/store/chatStore.ts` Context + useReducer（INIT / ADD_BOYFRIEND / DELETE_BOYFRIEND / ADD_MESSAGE / START_STREAMING / APPEND_STREAMING / END_STREAMING 等）
- **验证**：dispatch 后 state 正确；持久化走 API 而非 localStorage

#### M1.3 LLM 客户端与流式 API
- **输入**：M0.1
- **输出**：
  - `src/lib/llm/client.ts`（读 `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL`）
  - `src/app/api/chat/route.ts` POST，SSE 流返回
  - 校验 session + boyfriend 归属
  - 临时 system prompt（v1 简化版，不接关系模式）
- **验证**：`curl -X POST`（带 cookie）能拿到 SSE 流

#### M1.4 流式输出 Hook
- **输入**：M1.3
- **输出**：`src/hooks/useStreaming.ts`，含 1.5 秒最小停留时间
- **验证**：组件调用能看打字机效果

#### M1.5 微信风格聊天 UI
- **输入**：M1.2, M1.4
- **输出**：
  - `MessageBubble.tsx` / `ChatInput.tsx` / `StreamingText.tsx`
  - `chat/[id]/page.tsx`
  - 顶部暧昧值进度条占位
- **验证**：能发送消息并看到流式回复

#### M1.6 主页（男友列表）
- **输入**：M1.2
- **输出**：`BoyfriendCard.tsx` + `page.tsx`（含退出登录）
- **验证**：创建男友后主页可见卡片，点击进入聊天

#### M1.7 创建男友流程
- **输入**：M0.5, M1.2
- **输出**：`create/page.tsx` + `CreateForm.tsx`（三种性格 + 昵称 + 用户称呼；默认昵称见 CHARACTERS.md）
- **验证**：跑通「登录 → 创建 → 主页 → 聊天」

#### M1.8 消息持久化联调
- **输入**：M1.1, M1.5
- **输出**：用户消息即时 INSERT；男友消息流式完成后 INSERT；刷新页面消息不丢
- **验证**：换浏览器登录同一账号，数据仍在

#### M1.9 M1 阶段收尾
- **输入**：M1.1-M1.8
- **输出**：`pnpm tsc --noEmit` 通过；修复 lint 错误
- **验证**：M1 交付标准全部满足

**M1 阶段交付**：登录 + 创建男友 + 流式对话 + Neon 持久化（无关系模式 / 无暧昧值 / 无表情包 / 无图片语音）

---

### M2 · 关系模式

**阶段目标**：三种性格差异化体验 + 主动话题机制。

#### M2.1 关系模式 Prompt 模板
- **输入**：M1.3
- **输出**：`src/lib/llm/prompts.ts` `getSystemPrompt(boyfriend, memorySummary, profileFacts, intimacy)`，注入 CHARACTERS.md 人设
- **验证**：不同 relationshipMode 回复风格明显不同

#### M2.2 关系模式配置中心
- **输入**：M0.5
- **输出**：`src/lib/relationship/config.ts`（标签、颜色、描述、头像映射）
- **验证**：组件能根据 mode 展示不同颜色标签

#### M2.3 媒介倾向决策
- **输入**：M1.3, M2.1
- **输出**：prompts 增加 DECISION 规则；`src/lib/llm/parser.ts` 解析 `<DECISION>`
- **验证**：LLM 输出结构化 DECISION，前端正确解析

#### M2.4 关系模式标签 UI
- **输入**：M2.2
- **输出**：MessageBubble / BoyfriendCard / CreateForm 显示关系模式标签
- **验证**：视觉上能区分三种角色

#### M2.5 主动话题生成逻辑
- **输入**：M1.4
- **输出**：`src/hooks/useProactive.ts`（沉默 30 秒、长时未读 5 分钟；每 5 分钟最多 1 条、单次会话最多 3 条）
- **验证**：沉默 30 秒出现主动消息

#### M2.6 开屏消息与首屏体验
- **输入**：M2.5
- **输出**：首次进入聊天开屏问候（台词见 CHARACTERS.md §5.2）；主页卡片消息预览
- **验证**：新建男友第一次进入有开屏问候

#### M2.7 关系模式素材
- **输入**：M2.2
- **输出**：三张预置头像 → `public/avatars/`（可用图像 API 生成或占位图）
- **验证**：三种头像在 UI 正确显示

**M2 阶段交付**：三种性格差异化对话 + 主动话题 + 关系模式标签

---

### M3 · 暧昧值与惊喜

**阶段目标**：暧昧值增长 + 概率触发惊喜 + 礼物 / 情歌。

#### M3.1 暧昧值基础逻辑
- **输入**：M1.2
- **输出**：
  - `src/lib/intimacy/calculator.ts`：每条用户消息后 `intimacy += 1`，UPDATE boyfriends
  - `IntimacyBar.tsx`（聊天页 + 主页卡片）
- **验证**：每发一条 +1，进度条实时更新

#### M3.2 惊喜概率计算
- **输入**：M3.1
- **输出**：`src/lib/surprise/trigger.ts` `calculateSurpriseProbability()`（基础 8% + 四种加成）
- **验证**：不同场景概率计算正确

#### M3.3 每日惊喜上限
- **输入**：M3.2
- **输出**：boyfriends 表字段 `surprise_count_today` + `last_surprise_date`，跨天重置，2 次/天上限
- **验证**：同日触发 2 次后不再触发

#### M3.4 礼物惊喜
- **输入**：M3.2
- **输出**：`src/lib/surprise/gifts.ts` + `SurpriseCard.tsx`；礼物图存 R2 或 `public/gifts/`
- **验证**：触发惊喜时看到礼物卡片

#### M3.5 情歌 TTS 集成
- **输入**：M3.2
- **输出**：
  - `src/app/api/tts/route.ts`
  - `src/lib/tts/client.ts`（模型 `seed-tts-2.0`）
  - `src/lib/surprise/songs.ts` 预置 3-5 首歌词
- **验证**：情歌惊喜能听到语音

#### M3.6 暧昧值 100 处理
- **输入**：M3.1
- **输出**：`NextStagePrompt.tsx`，到 100 弹窗提示，停留 100 不再增长
- **验证**：连续聊天到 100 提示正确

**M3 阶段交付**：暧昧值可视化 + 概率惊喜（礼物 + 情歌 TTS）+ 100 节点

---

### M4 · 情绪系统

**阶段目标**：表情包 + emoji 识别 + 双向情绪响应。

#### M4.1 表情包预置
- **输入**：M0.1
- **输出**：30-50 张 → `public/stickers/` + `src/lib/stickers/data.ts`
- **验证**：30+ 张可选用

#### M4.2 表情包选择器
- **输入**：M4.1
- **输出**：`StickerPicker.tsx` 集成到 ChatInput
- **验证**：发送表情包后列表正确显示

#### M4.3 emoji 情绪识别
- **输入**：M0.5
- **输出**：`emojiMap.ts` + `detector.ts`（PRD 附录 A）；参与惊喜加成
- **验证**：用户发 ❤️ 识别为 "heart"

#### M4.4 男友表情包回复
- **输入**：M4.1, M2.3
- **输出**：DECISION 增加 `sendSticker` + `stickerEmotion`
- **验证**：合适情绪下男友发表情包

#### M4.5 双向情绪响应
- **输入**：M4.3, M4.4
- **输出**：用户消息情绪标识；LLM 注入用户情绪
- **验证**：用户发「哈哈」时回复更活泼

**M4 阶段交付**：表情包收发 + emoji 识别 + 双向情绪

---

### M5 · 记忆系统

**阶段目标**：对话摘要 + 用户画像键值表，跨会话自然回忆。

> 完整规则见 PRD §4.7。

#### M5.1 消息上下文策略
- **输入**：M1.1
- **输出**：LLM 上下文取最近 20 条 messages；全量消息保留在 DB（cursor 分页加载）
- **验证**：连续 30 句后 LLM 仍只收到最近 20 条 + 摘要

#### M5.2 LLM 对话摘要
- **输入**：M5.1
- **输出**：`src/lib/memory/summarizer.ts` 每 10 条触发摘要 → `memory_summaries` + 更新 `boyfriends.memory_summary`
- **验证**：对话 20 句后 memory_summary 有内容

#### M5.3 用户画像提取
- **输入**：M5.1
- **输出**：
  - `src/lib/memory/extractor.ts` + `profileKeys.ts`
  - `src/app/api/memory/extract/route.ts`
  - 男友回复完成后异步 UPSERT `user_profile_facts`（birthday / hobbies / favorite_food / recent_event / anniversary 等）
  - 离开聊天页 `sendBeacon` 补提取
- **验证**：用户说「我生日 3 月 15 日」后，DB 有对应 fact

#### M5.4 Prompt 上下文注入
- **输入**：M5.2, M5.3, M2.1
- **输出**：`getSystemPrompt()` 拼接 memory_summary + profileFacts + 最近 20 条
- **验证**：prompt 含画像与摘要

#### M5.5 回忆触发
- **输入**：M5.4
- **输出**：开屏 / 话题命中时自然引用画像（规则见 PRD §4.7.3、CHARACTERS.md §5.3）
- **验证**：再次打开聊天，角色提起之前透露的信息（非背诵）

#### M5.6 M5 阶段收尾
- **输入**：M5.1-M5.5
- **输出**：画像提取失败静默降级；30 秒 debounce
- **验证**：M5 验收项通过

**M5 阶段交付**：摘要 + 用户画像表 + 异步提取 + 跨会话回忆

---

### M6 · 联调与优化

**阶段目标**：图像生成 + R2 上传 + 性能 + PRD 全量验收。

#### M6.1 图像生成 API
- **输入**：M0.1
- **输出**：
  - `src/app/api/image/route.ts`
  - `src/lib/image/client.ts`（`IMAGE_MODEL=doubao-seedream-5.0-lite`）
  - 生成后 `uploadToR2()` 转存，返回 `{ fileKey, url }`
- **验证**：调用 API 返回 R2 公开 URL

#### M6.2 场景图关键词触发
- **输入**：M2.3, M6.1
- **输出**：`sceneKeywords.ts` + DECISION 处理 `shouldGenerateImage`
- **验证**：聊经历类话题能触发场景图

#### M6.3 异步媒体与 SSE
- **输入**：M6.1, M3.5
- **输出**：文字流式先发；图片/语音异步 POST，前端 `media-pending` → `media-ready`
- **验证**：文字与媒体生成解耦

#### M6.4 性能优化
- **输入**：M1-M5
- **输出**：消息虚拟滚动（>100 条）、图片懒加载、流式 30ms/帧、消息 cursor 分页
- **验证**：200 句无明显卡顿

#### M6.5 错误处理与降级
- **输入**：M1-M5
- **输出**：LLM 超时重试；TTS/图像/画像提取失败降级；401/403 统一处理
- **验证**：断网 / 断 API 测试降级正常

#### M6.6 全量自测与 PRD 验收
- **输入**：M1-M5
- **输出**：按 PRD §12 逐项跑通，输出自测报告
- **验证**：12.1 / 12.2 / 12.3 全部满足

**M6 阶段交付**：v1 完整产品 + 全部 PRD 验收标准达成

---

## 关键代码位置

| 模块 | 路径 | 负责 |
|------|------|------|
| 数据库 | `src/lib/db/` | Drizzle schema + Neon 连接 |
| 认证 | `src/lib/auth/` + `middleware.ts` | Auth.js 会话 + 路由保护 |
| 数据访问 | `src/lib/repositories/` | users / boyfriends / messages / profileFacts |
| LLM 集成 | `src/lib/llm/` | 流式对话、Prompt、DECISION 解析 |
| 记忆系统 | `src/lib/memory/` | 摘要、画像提取、profileKeys |
| 状态管理 | `src/store/chatStore.ts` | 运行时缓存 |
| 暧昧值 | `src/lib/intimacy/` | 进度与惊喜概率 |
| 惊喜 | `src/lib/surprise/` | 触发、礼物、情歌 |
| 情绪 | `src/lib/emotion/` | emoji 字典 + 检测 |
| 关系模式 | `src/lib/relationship/` | 配置 + 风格 |
| 云存储 | `src/lib/storage/r2.ts` | ✅ uploadToR2 |
| Hooks | `src/hooks/` | useStreaming / useProactive / useChat |
| API | `src/app/api/` | auth / chat / tts / image / boyfriends / messages / memory / surprise |

## 开发规范

### TypeScript
- 严格模式（`"strict": true`）
- 所有函数必须有明确返回类型
- 避免 `any`；类型集中在 `src/lib/types.ts`

### React/Next.js
- 客户端组件加 `'use client'`
- 避免 JSX 中直接使用 `Date.now()` / `Math.random()`（hydration 风险）
- 动态内容用 `useEffect` + `useState`

### 状态管理
- v1 使用 React Context + useReducer
- **数据库为唯一数据源**；chatStore 作运行时缓存，刷新从 API 恢复

### AI 能力调用
- **必须**走 API route，禁止前端直连
- LLM 走 SSE 流式；图像/语音/画像提取异步，不阻塞主对话

### 数据存储
- 业务数据存 **Neon PostgreSQL**，统一走 `repositories/`
- 禁止在组件中直接操作 DB 或 localStorage
- 媒体文件存 **Cloudflare R2**，DB 只存 `fileKey`
- API route 必须校验 session + 资源 `user_id` 归属

### 错误处理
- API route 必须有 try-catch，返回 `{ error, code }`
- LLM 超时重试 1 次；TTS/图像/画像提取失败静默降级

### 命名规范
- 组件：PascalCase；工具：camelCase；常量：UPPER_SNAKE_CASE

## 测试与验证

### 静态检查
- 每任务完成：`pnpm tsc --noEmit`
- ESLint 错误必须修复

### 验收标准
- 完整标准见 `PRD.md` §12
- **分阶段测试案例见 `DEV_PLAN.md`**（每阶段 P0 全通过后进入下一阶段）
- M6 必须 100% 满足 12.1 / 12.2 / 12.3

## AI 能力集成

全部通过后端 API route 调用，密钥读 `.env`。

### LLM（流式对话）
- 客户端：`src/lib/llm/client.ts`
- 模型：`LLM_MODEL`（默认 `doubao-seed-2.0-lite`）
- Base URL：`LLM_BASE_URL`
- temperature：0.9；输出含 `<DECISION>` 标签

### TTS（语音）
- 客户端：`src/lib/tts/client.ts`
- 模型：`seed-tts-2.0`
- 声线：霸总 `zh_male_m191_uranus_bigtts` / 奶狗 `saturn_zh_male_shuanglangshaonian_tob` / 暖男 `zh_male_taocheng_uranus_bigtts`
- 失败降级为文字

### 图像生成
- 客户端：`src/lib/image/client.ts`
- 模型：`IMAGE_MODEL`（默认 `doubao-seedream-5.0-lite`）
- 异步生成 → `uploadToR2()` → 存 `fileKey`

### 对象存储（Cloudflare R2）
- 实现：`src/lib/storage/r2.ts` → `uploadToR2()`
- 环境变量：`R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL`
- 公开 URL：`${R2_PUBLIC_URL}/${fileKey}`

## 设计规范要点

> 完整规范见 `DESIGN.md`

- 主背景 `#FAF7F2`；自己气泡 `#FFB5A0`；文字 `#2D2520`
- 大圆角 8-20px；柔和阴影；微信式聊天布局
- 关系模式色：霸总 `#8B5A4A` / 奶狗 `#E8A598` / 暖男 `#D4A574`

## 待确认的开放点

> 与 PRD §14 同步。已确认项勿擅自更改。

| # | 开放点 | 状态 | 说明 |
|---|--------|------|------|
| 1 | LLM 选型 | **已确认** | `doubao-seed-2.0-lite`，后端 API route |
| 2 | TTS | **已确认** | 模型 `seed-tts-2.0` + 三种声线 ID |
| 3 | 对象存储 | **已确认** | Cloudflare R2 + `uploadToR2` |
| 4 | 数据库 | **已确认** | Neon PostgreSQL + Drizzle ORM |
| 5 | 认证 | **已确认** | Auth.js，邮箱 + 密码 |
| 6 | 预置头像 | 待生成 | 3 张，M2.7 |
| 7 | 表情包 | 待生成 | 30-50 张，M4.1 |
| 8 | 礼物图 | 待生成 | 5-8 张，M3.4 |
| 9 | 情歌词 | 待文案 | 3-5 首，M3.5 |
| 10 | 代表台词 | 待文案 | 每种 3-5 句，M2.6 |
| 11 | 场景图关键词 | 待补充 | M6.2 联调 |
| 12 | 主动话题阈值 | 待定 | 默认 30s / 5min |
| 13 | 暧昧值 100 文案 | 待文案 | M3.6 |
| 14 | 画像跨男友共享 | 待定 | v1 按男友隔离 |

## 协作规范

### 任务领取
- 单个 agent 一次领取一个任务，按编号顺序执行
- 任务前读 PRD 相关章节 + CHARACTERS.md（涉及 Prompt 时）

### 任务完成
- 自检：`pnpm tsc --noEmit` + 任务验证项
- 修复发现的问题，不遗留

### 沟通
- PRD 未明确的边界先确认用户
- 不要自行扩展 PRD 范围
- 不要 Mock / 伪造 AI 集成调用

## 文档版本

| 版本 | 日期 | 改动 |
|------|------|------|
| v1.1 | 2026-08-22 | 对齐 PRD v1.2；关联 `DEV_PLAN.md` 分阶段测试 |
| v1.0 | — | 初始协作规范 |
