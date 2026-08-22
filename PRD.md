# 纸片人男友 v1 · PRD（产品需求文档）

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.2 |
| 文档状态 | 待评审 |
| 产品定位 | 网页虚拟男友陪伴产品 |
| 目标用户 | 单身女性，18-35 岁 |
| 核心使用场景 | 下班后独居的夜晚（19:00-24:00） |
| 核心价值 | 有趣 + 情绪被影响 |
| 技术栈 | Next.js 16 + React 19 + TypeScript 5 + Tailwind 4 + shadcn/ui + Neon PostgreSQL + Auth.js |
| AI 能力 | LLM（流式对话）+ TTS（语音）+ 图像生成 |

## 1. 背景与目标

### 1.1 背景

单身女性在下班后独居的夜晚存在明显的"情绪空白时段"：没有社交、没有恋爱、需要独处但又需要情绪刺激。她们既不想出门社交，也不想刷短视频浪费时间，而是希望有一个**有趣的人**陪她们度过这段时间。

现有方案的不足：
- **真人社交**：高成本、不可控、可能带来负面情绪
- **短视频/娱乐内容**：单向消费、无法形成情感连接
- **传统恋爱游戏**：剧情固定、缺少真实感、个性化不足

### 1.2 产品目标

提供一个**有趣的、能影响用户情绪**的虚拟男友产品，让用户下班后愿意打开、愿意聊下去、愿意明天再回来。

### 1.3 北极星指标

- **次日回访率 ≥ 30%**
- **平均会话回合数 ≥ 30 句**

## 2. 用户与场景

### 2.1 目标用户画像

- **基本信息**：女性，18-35 岁，独居或合租，单身或间歇性单身
- **生活状态**：一二线城市工作，下班后有 2-3 小时的独处时间
- **心理状态**：白天工作压力大，晚上需要情绪释放
- **媒介习惯**：手机重度用户，习惯微信式聊天

### 2.2 核心使用场景

- **主场景**：下班回到家，洗完澡躺在床上，打开产品"找男友聊聊"
- **触发情绪**：无聊、孤独、想被哄、想被撩、被工作气到想倾诉
- **使用时长**：单次 10-30 分钟
- **黄金时段**：19:00 - 24:00

### 2.3 用户期待

打开产品 30 秒内能感受到"有趣"——笑、心动、想继续聊下去。**不是陪伴、不是被爱，是有趣 + 情绪起伏**。

## 3. 需求概述

### 3.1 产品形态

- 网页应用（移动浏览器适配）
- 微信式聊天 UI
- 卡片式男友管理
- 单用户多男友独立会话
- 邮箱注册 / 登录，会话持久化到云端数据库

### 3.2 核心循环

```
注册 / 登录 → 创建男友（选性格）→ 进入聊天 → 主动/被动对话
                                              ↓
                                    暧昧值随聊天增长
                                              ↓
                              概率触发惊喜（语音/礼物/图片）
                                              ↓
                              情绪被影响 → 愿意继续 → 愿意回来
```

### 3.3 三大核心系统

| 系统 | 作用 |
|------|------|
| **关系模式系统** | 三种性格男友 = 三种关系模式（霸总/奶狗/暖男） |
| **暧昧值与惊喜系统** | 核心成长循环 + 情绪强化点 |
| **情绪识别与表情包系统** | 用户情绪输入 → 系统情绪响应 |
| **记忆与画像系统** | 对话摘要 + 用户键值画像 → 跨会话自然回忆 |

## 4. 功能需求

### 4.0 用户注册与登录

**入口**：未登录用户访问任意受保护页面时，自动跳转 `/login`

**注册流程**：
1. 进入注册页 `/register`
2. 填写邮箱 + 密码（≥ 8 位，含字母与数字）
3. 可选填写昵称（默认取邮箱前缀）
4. 提交注册 → 自动登录 → 跳转主页

**登录流程**：
1. 进入登录页 `/login`
2. 填写邮箱 + 密码
3. 提交登录 → 跳转主页（或登录前访问的页面）

**会话管理**：
- 使用 Auth.js（NextAuth v5）管理会话，Cookie 存储 session token
- 会话有效期：30 天（勾选「记住我」）/ 浏览器关闭失效（未勾选）
- 支持退出登录，清除服务端 session

**受保护路由**：
- `/`（主页）、`/create`、`/chat/[id]` 需登录
- `/login`、`/register` 已登录用户自动跳转主页

**v1 限制**：
- 仅支持邮箱 + 密码，不做手机验证码、第三方 OAuth
- 不做找回密码（v2 范围）
- 不做多设备会话管理界面

**错误提示**：
- 邮箱已注册 → "该邮箱已被注册"
- 密码错误 → "邮箱或密码不正确"
- 未登录访问 → 跳转登录页并提示 "请先登录"

### 4.1 男友创建

**入口**：登录用户首次进入产品 / 主页右上角"+"按钮

**流程**：
1. 进入男友创建页
2. 选择三种性格之一（霸总/奶狗/暖男）
3. 设置男友昵称（用户自定义）
4. 设置用户称呼（男友怎么叫用户）
5. 提交创建 → 跳转主页

**v1 限制**：
- 不做自定义性格、关系模式；人设背景固定为三种预置角色（见 [`CHARACTERS.md`](./CHARACTERS.md)）
- 头像预置 3 张（每个角色固定一张）

### 4.2 男友列表（主页）

**布局**：卡片列表，竖向排列

**每个卡片信息**：
- 男友头像（圆形，60x60）
- 男友昵称 + "·" + 关系模式标签
- 最新消息预览（一行截断）
- 暧昧值小条（细长条形）
- 未读消息红点 + 数字

**交互**：
- 点击卡片 → 进入聊天
- 长按卡片 → 删除/重命名（v1 只做删除）
- 右上角"+" → 创建新男友

### 4.3 聊天界面

**整体布局**（自上而下）：

```
┌─────────────────────────────────┐
│  ← 男友昵称·关系模式    暧昧值: 45/100 ▓▓▓▓░░░░  │  ← 顶部导航
├─────────────────────────────────┤
│                                 │
│  [对方消息气泡 - 左对齐白]      │
│  [用户消息气泡 - 右对齐绿]      │
│  [对方消息气泡 - 含图片]        │
│                                 │
│  [对方正在输入中...]             │  ← 动态状态
│                                 │
├─────────────────────────────────┤
│ 😊  [输入框]              发送 │  ← 底部输入区
└─────────────────────────────────┘
```

**功能**：
- 文字输入 + 发送
- emoji 面板（点击 😊 展开）
- 表情包面板（点击表情图标展开）
- 对方正在输入中 状态
- 流式输出渲染
- 消息类型：文字、emoji、表情包、图片、语音

### 4.4 关系模式系统

#### 4.4.1 三种关系模式定义

| 角色 | 关系模式 | 互动特征 | 关系动态 |
|------|---------|---------|---------|
| **霸总** | 主导 - 被引导 | 主动掌控节奏，下决定、安排事情 | 用户被引导中体验"被照顾/被安排"的爽感 |
| **奶狗** | 依赖 - 被照顾 | 主动示弱、撒娇、表达想念 | 用户被需要中体验"被依赖"的温暖 |
| **暖男** | 平等 - 倾听 | 主动倾听、共情、回应情绪 | 用户被理解中体验"被看见"的治愈 |

**核心差异是关系模式，不是说话风格**。同样的"想你"，霸总是命令式、奶狗是撒娇式、暖男是共情式。

> 完整人设定义（成长背景、语气、口头禅、情绪触发、「我爱你」门槛）见 [`CHARACTERS.md`](./CHARACTERS.md)。

#### 4.4.2 媒介使用倾向

| 关系模式 | 语音频率 | 图片频率 | 偏好类型 |
|---------|---------|---------|---------|
| 霸总 | ≤ 1次/会话 | 中低 | 简短命令语音、风景/安排图 |
| 奶狗 | ≤ 1次/10条 | 中高 | 长撒娇语音、自拍 |
| 暖男 | ≤ 1次/15条 | 中 | 共情语音、风景/共情图 |

### 4.5 暧昧值与惊喜系统

#### 4.5.1 暧昧值基础规则

- 范围：0 - 100
- 初始值：0
- 增长：每条用户消息 +1
- 可视化：顶部进度条 + 主页卡片小条

#### 4.5.2 惊喜触发（带随机性）

- 基础概率：每条用户消息后 **8%**
- 加成（取最高值，不叠加）：
  - 暧昧值到达 10 的倍数 → 20%
  - 用户连续 3 句带情绪词 → 15%
  - 距离上次惊喜 > 20 句 → 25%
  - 用户发送积极 emoji → +5%
- 每日上限：每个男友每天最多 2 次

#### 4.5.3 惊喜形式

- **唱情歌**（TTS + 字幕）
- **送礼物**（图片 + 解读文字，预置 5-8 种：杯子、花、书、钥匙扣、星空图、晚安图、手写信、合照）

#### 4.5.4 暧昧值 100 之后

- 显示"**你和他已经这么亲密了，下一阶段敬请期待**"
- 暧昧值停留 100
- 下一阶段属于 v2 范围

### 4.6 表情包与情绪识别

#### 4.6.1 表情包系统

- 预置 **30-50 张表情包**，覆盖常用情绪
- 用户可点击发送
- 男友也可发送
- 双向：男友发送时优先匹配当前情绪

#### 4.6.2 emoji 情绪识别

- 字典映射 + 上下文判断
- 情绪分类：
  - 积极：😊 😄 🥰 ❤️ 💕 👍 😍
  - 消极：😢 😭 😔 😞 💔
  - 中性：🤔 😐 😶
- 影响：男友回复语气 + 惊喜概率加成

#### 4.6.3 双向情绪信号

- 用户输入：文字 + emoji + 表情包（多模态）
- 系统识别：综合判断情绪
- 系统反馈：男友用对应媒介回应

### 4.7 记忆系统

记忆系统分两层，让角色「记得用户是谁、经历过什么」，而不是每次像第一次见面：

| 层级 | 存储 | 作用 |
|------|------|------|
| **对话记忆** | `memory_summaries` + 最近 20 条 `messages` | 记住聊过什么、情绪与话题脉络 |
| **用户画像** | `user_profile_facts`（键值对） | 记住用户是谁——生日、爱好、食物偏好、近况、纪念日 |

#### 4.7.1 用户画像：记什么

LLM 从对话中提取并持久化以下**预置键**（`fact_key`）：

| fact_key | 说明 | 示例 value |
|----------|------|-----------|
| `birthday` | 生日 | `3月15日` |
| `hobbies` | 爱好（可合并更新） | `画画、追剧、撸猫` |
| `favorite_food` | 喜欢的食物 | `火锅、抹茶拿铁` |
| `recent_event` | 最近在经历什么 | `项目上线前加班`、`刚搬家` |
| `anniversary` | 重要纪念日 | `和闺蜜认识10年（6月1日）` |
| `dislikes` | 讨厌/忌讳的事（可选） | `不吃香菜` |
| `custom_*` | LLM 发现的其他稳定信息 | `custom_pet: 养了一只叫豆子的猫` |

**原则**：
- 只存**用户明确说过或强烈暗示**的事实，不猜测、不编造
- 同一 `fact_key` 以**最新 value 覆盖**（如爱好追加合并由 LLM 在写入前完成）
- v1 按**男友维度**隔离：用户告诉陆景琛的信息，存在陆景琛的画像里；林念安需在该会话中再次透露才会写入（符合「每个男友独立记忆」）

#### 4.7.2 画像提取：什么时候写

**触发时机**（异步，不阻塞主对话）：

1. **轮次结束**：男友流式回复完成并写入 `messages` 后，后台分析「本轮用户消息 + 男友回复 + 最近 5 条上下文」
2. **会话结束**：用户离开聊天页（`beforeunload` / 路由切换）时，补一次批量提取（debounce 已提取过的轮次）

**提取流程**：

```
男友回复入库
    ↓
异步 POST /api/memory/extract（或内部 queue）
    ↓
LLM 阅读近期对话 → 输出结构化 JSON
    ↓
有 new_facts → UPSERT user_profile_facts
无新信息 → 跳过
```

**LLM 提取输出格式**：

```json
{
  "facts": [
    { "key": "birthday", "value": "3月15日" },
    { "key": "recent_event", "value": "这周在赶项目上线" }
  ],
  "updates": [
    { "key": "hobbies", "value": "画画、追剧、撸猫", "action": "merge" }
  ]
}
```

- `facts`：新增键值
- `updates`：合并更新已有键（如爱好追加）
- 空数组表示本段对话无新画像信息

#### 4.7.3 画像读取：什么时候用

**注入时机**：每次调用 `/api/chat` 构建 system prompt 时，读取该男友的全部 `user_profile_facts`，拼接为「你记得的用户信息」区块。

**自然提起规则**（写入 prompt，非硬编码触发）：

| 场景 | 行为 |
|------|------|
| 用户再次打开聊天（开屏 / 首条） | 优先从画像中选 1 条**自然**提起，不要逐条背诵 |
| 用户当前话题与画像命中 | 顺带关联（「你不是喜欢抹茶吗，今天喝了？」） |
| 纪念日 / 生日临近 | 主动问候（需后端计算日期差，或 prompt 注入「今天日期」） |
| `recent_event` 存在且用户久未聊 | 开屏时问进展（「项目上线顺利吗？」） |
| 无画像数据 | 正常开屏，不假装记得 |

**禁止行为**：
- 不要像报菜名一样列出所有画像字段
- 不要编造用户没说过的事
- 每条回复最多自然引用 **1 条** 画像信息

#### 4.7.4 对话摘要（原有能力保留）

- 存储：最近 20 条原始对话 + 每 10 条一次 LLM 摘要 → `memory_summaries`
- 检索：摘要 + 画像 + 最近消息，共同作为 LLM 上下文
- 摘要负责「聊过什么」，画像负责「用户是谁」

> 角色差异化回忆方式见 [`CHARACTERS.md`](./CHARACTERS.md) §5.3（如沈予白「我记得你说过……」、陆景琛用行动而非直说）。

### 4.8 主动话题机制

| 状态 | 触发条件 | 男友行为 |
|------|---------|---------|
| 首次进入 | 进入聊天界面 | 主动开屏消息 |
| 沉默等待 | 停留 > 30 秒未说话 | 主动话题消息 |
| 长时未读 | 切走 > 5 分钟回来 | 可能补一条"我刚在想你" |

**频率限制**：每 5 分钟最多 1 次，每次会话最多 3 条

### 4.9 场景图生成

LLM 实时判断输出 `shouldGenerateImage: boolean` + `imageType` + `imagePrompt` + `triggerReason`。

| imageType | 触发条件 | 频率 |
|-----------|---------|------|
| scene | 关键词 / 主题判断涉及经历/回忆 | ≤ 1次/15条 |
| selfie | 主动 + 暧昧值 ≥ 30 | ≤ 2次/会话 |
| gift | 惊喜触发 | ≤ 1次/天 |
| share | 主动话题 + 风景/日常 | ≤ 1次/20条 |

## 5. 非功能需求

### 5.1 性能需求

- **首屏加载**：< 2 秒（LCP）
- **LLM 首字延迟**：< 1.5 秒
- **流式输出流畅**：打字机效果，无卡顿
- **图片/语音生成**：不阻塞主对话（异步队列）

### 5.2 可用性需求

- **单次会话长度**：支持 100+ 回合不卡顿
- **多男友并存**：支持 3-5 个男友同账号
- **数据库查询**：男友列表加载 < 300ms，消息分页加载 < 500ms
- **移动浏览器适配**：iOS Safari 14+、Android Chrome 80+

### 5.3 安全与隐私

- 密码 bcrypt 哈希存储，明文密码不落库
- 对话数据存 Neon PostgreSQL，按 `user_id` 隔离
- 所有 API route 校验登录态，禁止跨用户访问男友 / 消息
- 不做内容审核过滤（v1 信任 LLM 自身安全）
- 提示用户"AI 生成内容"
- 用户可删除账号（级联删除所有男友与消息，v1 可选做）

### 5.4 兼容性

- 桌面浏览器：Chrome / Edge / Safari 最新两个版本
- 移动浏览器：iOS Safari、Android Chrome

## 6. 数据需求

### 6.1 TypeScript 类型定义

```typescript
// 用户（认证账号）
interface User {
  id: string;                    // UUID，Neon 主键
  email: string;
  displayName: string;           // 显示昵称
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

// 男友
interface Boyfriend {
  id: string;                    // UUID
  userId: string;                // 所属用户
  relationshipMode: "dominant" | "puppy" | "warm";
  nickname: string;              // 用户起的昵称
  userNickname: string;          // 男友叫用户的称呼
  avatarUrl: string;             // 预置头像 URL
  intimacy: number;              // 暧昧值 0-100
  lastSurpriseAt: Date | null;
  surpriseCountToday: number;
  lastSurpriseDate: string | null;  // YYYY-MM-DD，用于跨天重置
  memorySummary: string;         // 最新 LLM 摘要（冗余字段，加速读取）
  unreadCount: number;
  lastMessagePreview: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

// 消息
interface Message {
  id: string;
  boyfriendId: string;
  role: "user" | "boyfriend";
  type: "text" | "image" | "voice" | "emoji" | "sticker";
  content: string;               // 文字 / emoji / 表情包 ID
  mediaKey: string | null;       // 对象存储 fileKey（图片/语音）
  emotion: string | null;
  isSurprise: boolean;
  createdAt: Date;
}

// 记忆摘要（历史分段）
interface MemorySummary {
  id: string;
  boyfriendId: string;
  summary: string;
  messageCount: number;          // 本段覆盖的消息数
  createdAt: Date;
}

// 用户画像事实（键值对，按男友隔离）
interface UserProfileFact {
  id: string;
  boyfriendId: string;
  factKey: string;               // 如 "birthday" | "hobbies" | "custom_pet"
  factValue: string;             // 如 "3月15日"
  sourceMessageId: string | null; // 来源消息，便于调试
  createdAt: Date;
  updatedAt: Date;
}

/** 预置 fact_key 枚举（LLM 优先使用） */
type ProfileFactKey =
  | "birthday"
  | "hobbies"
  | "favorite_food"
  | "recent_event"
  | "anniversary"
  | "dislikes"
  | `custom_${string}`;
```

### 6.2 Neon PostgreSQL 表结构

数据库：**Neon PostgreSQL**（Serverless Postgres，通过 `@neondatabase/serverless` 连接）

ORM：**Drizzle ORM**（类型安全 + SQL 迁移）

```sql
-- =============================================
-- 用户与认证（Auth.js 标准表 + 业务扩展）
-- =============================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- =============================================
-- 业务表
-- =============================================

CREATE TABLE boyfriends (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_mode    VARCHAR(20) NOT NULL
                         CHECK (relationship_mode IN ('dominant', 'puppy', 'warm')),
  nickname             VARCHAR(50) NOT NULL,
  user_nickname        VARCHAR(50) NOT NULL,
  avatar_url           TEXT NOT NULL,
  intimacy             SMALLINT NOT NULL DEFAULT 0
                         CHECK (intimacy >= 0 AND intimacy <= 100),
  last_surprise_at     TIMESTAMPTZ,
  surprise_count_today SMALLINT NOT NULL DEFAULT 0,
  last_surprise_date   DATE,
  memory_summary       TEXT NOT NULL DEFAULT '',
  unread_count         SMALLINT NOT NULL DEFAULT 0,
  last_message_preview VARCHAR(200),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boyfriends_user_id ON boyfriends(user_id);
CREATE INDEX idx_boyfriends_user_active ON boyfriends(user_id, last_active_at DESC);

CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boyfriend_id  UUID NOT NULL REFERENCES boyfriends(id) ON DELETE CASCADE,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('user', 'boyfriend')),
  type          VARCHAR(20) NOT NULL
                  CHECK (type IN ('text', 'image', 'voice', 'emoji', 'sticker')),
  content       TEXT NOT NULL,
  media_key     TEXT,
  emotion       VARCHAR(20),
  is_surprise   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_boyfriend_created
  ON messages(boyfriend_id, created_at DESC);

CREATE TABLE memory_summaries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boyfriend_id   UUID NOT NULL REFERENCES boyfriends(id) ON DELETE CASCADE,
  summary        TEXT NOT NULL,
  message_count  SMALLINT NOT NULL DEFAULT 10,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memory_summaries_boyfriend
  ON memory_summaries(boyfriend_id, created_at DESC);

-- 用户画像（键值对，每个男友独立记住用户透露的信息）
CREATE TABLE user_profile_facts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boyfriend_id       UUID NOT NULL REFERENCES boyfriends(id) ON DELETE CASCADE,
  fact_key           VARCHAR(100) NOT NULL,
  fact_value         TEXT NOT NULL,
  source_message_id  UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (boyfriend_id, fact_key)
);

CREATE INDEX idx_profile_facts_boyfriend
  ON user_profile_facts(boyfriend_id);
```

### 6.3 实体关系

```
users (1) ──< (N) boyfriends (1) ──< (N) messages
                         │
                         ├──< (N) memory_summaries
                         └──< (N) user_profile_facts

users (1) ──< (N) sessions
```

| 关系 | 说明 |
|------|------|
| users → boyfriends | 一个用户可创建多个男友，删除用户级联删除 |
| boyfriends → messages | 一个男友有多条消息，删除男友级联删除 |
| boyfriends → memory_summaries | 一个男友有多段历史摘要 |
| boyfriends → user_profile_facts | 一个男友独立维护用户画像键值对 |
| users → sessions | 一个用户可有多个活跃 session（多设备） |

### 6.4 核心查询策略

| 场景 | 查询 | 说明 |
|------|------|------|
| 主页男友列表 | `SELECT * FROM boyfriends WHERE user_id = $1 ORDER BY last_active_at DESC` | 按最近活跃排序 |
| 聊天消息加载 | `SELECT * FROM messages WHERE boyfriend_id = $1 ORDER BY created_at DESC LIMIT 20` | 分页，首次加载最近 20 条 |
| 历史消息翻页 | 同上 + `WHERE created_at < $cursor` | cursor 分页 |
| LLM 上下文 | 最近 20 条 messages + memory_summary + user_profile_facts | 摘要 + 画像 + 近期对话 |
| 用户画像读取 | `SELECT fact_key, fact_value FROM user_profile_facts WHERE boyfriend_id = $1` | 构建 prompt 时全量读取（通常 < 20 条） |
| 画像 UPSERT | `INSERT ... ON CONFLICT (boyfriend_id, fact_key) DO UPDATE` | 提取到新 fact 时写入 |
| 未读计数 | 进入聊天页时 `UPDATE boyfriends SET unread_count = 0` | 读后清零 |
| 惊喜跨天重置 | 比较 `last_surprise_date` 与当前 DATE | 不同天则 `surprise_count_today = 0` |

### 6.5 数据生命周期

- **消息保留**：数据库保留全量消息（v1 不设上限），LLM 上下文仅取最近 20 条
- **摘要生成**：每累计 10 条新消息触发 LLM 摘要，写入 `memory_summaries` 并更新 `boyfriends.memory_summary`
- **摘要保留**：每个男友最多保留 3 段历史摘要，超出删除最旧
- **画像提取**：男友每轮回复完成后异步触发；同男友 30 秒内不重复提取
- **画像保留**：全量保留，不自动过期；`recent_event` 可由 LLM 在后续对话中覆盖更新
- **画像上限**：每个男友最多 30 条 fact（超出时 LLM 合并相似键或丢弃最旧 `custom_*`）
- **软删除**：v1 不做，删除男友直接 CASCADE 删除关联消息与画像
- **账号注销**：删除 `users` 记录，级联删除所有关联数据

### 6.6 环境变量

```bash
# Neon 数据库
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Auth.js
AUTH_SECRET=随机生成的 32 字节密钥
AUTH_URL=http://localhost:3000

# 豆包 LLM
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=doubao-seed-2.0-lite

# 豆包 TTS
TTS_API_KEY=
TTS_BASE_URL=
TTS_MODEL=seed-tts-2.0

# 豆包 Seedream
IMAGE_API_KEY=
IMAGE_BASE_URL=
IMAGE_MODEL=doubao-seedream-5-0-260128

# Cloudflare R2（对象存储 / 云存储）
R2_ENDPOINT=https://{account_id}.r2.cloudflarestorage.com
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

## 7. UI/UX 设计

> 完整规范见 `DESIGN.md`，本节为概要。

### 7.1 设计意象

**不是科技感，是"私人空间"的温柔**。整体应该是**温暖的、有呼吸感的、像在翻一本私人日记**。

### 7.2 关键设计原则

- 暖色奶油调（避开科技蓝）
- 大圆角（12-20px，不用锐利圆角）
- 柔和漫射阴影（不用硬质感）
- 深棕文字（不用纯黑）
- 流式输出 + 打字机效果
- 微信 UI 锚点（气泡、列表、时间分组等）

### 7.3 关键页面布局

#### 7.3.1 登录 / 注册页

```
┌─────────────────────────────────┐
│                                 │
│         纸片人男友               │  ← 产品名（暖色，居中）
│                                 │
│  邮箱                           │
│  〔输入框〕                      │
│  密码                           │
│  〔输入框〕                      │
│                                 │
│         [  登录  ]               │  ← 主按钮
│                                 │
│     还没有账号？去注册            │  ← 文字链接
└─────────────────────────────────┘
```

#### 7.3.2 主页（男友列表）

```
┌─────────────────────────────────┐
│  我的男友们         退出  + 创建  │  ← 顶部（暖色，48px）
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ [头像] 陆景琛·霸总      │    │  ← 卡片（白底，阴影 md）
│  │        "今天累了吧..."  │    │
│  │        ▓▓▓▓░░░ 45/100   │    │
│  │                         ●3 │  ← 未读红点
│  └─────────────────────────┘    │
│  ...                            │
└─────────────────────────────────┘
```

#### 7.3.3 男友创建页

```
┌─────────────────────────────────┐
│  ←  创建一个新男友               │
├─────────────────────────────────┤
│  选择他的性格                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐
│  │ [头像]   │ │ [头像]   │ │ [头像]   │
│  │          │ │          │ │          │
│  │ 霸总     │ │ 奶狗     │ │ 暖男     │
│  │ 主导节奏 │ │ 撒娇依赖 │ │ 倾听共情 │
│  └──────────┘ └──────────┘ └──────────┘
│
│  给他起个昵称
│  〔输入框〕
│  他怎么称呼你
│  〔输入框〕
│
│           [  开始聊天  ]
└─────────────────────────────────┘
```

#### 7.3.4 聊天页

```
┌─────────────────────────────────┐
│  ← 陆景琛·霸总                  │
│     ▓▓▓▓░░░░ 暧昧值 45/100     │  ← 进度条
├─────────────────────────────────┤
│                                 │
│       ┌──────────────────┐     │
│       │ 下午好呀 ☀️       │     │ ← 对方消息（左白）
│       └──────────────────┘     │
│                                 │
│              ┌──────────────┐   │
│              │ 嘿嘿你好      │   │ ← 自己消息（右桃色）
│              └──────────────┘   │
│                                 │
│  ● 对方正在输入中...             │
│                                 │
├─────────────────────────────────┤
│ 😊  [输入消息...  ]      发送    │ ← 底部输入
└─────────────────────────────────┘
```

#### 7.3.5 惊喜卡片

```
         ┌────────────────────┐
         │    男友送礼物了    │  ← 居中弹层
         │                    │
         │   [礼物图片]       │
         │                    │
         │   一束满天星        │
         │   "想跟你分享我    │
         │    眼里的星空"      │
         │                    │
         │      [ 收下  ]      │  ← 主按钮
         └────────────────────┘
```

## 8. 技术架构

### 8.1 项目结构

```
src/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 主页（男友列表，需登录）
│   ├── login/
│   │   └── page.tsx            # 登录页
│   ├── register/
│   │   └── page.tsx            # 注册页
│   ├── create/
│   │   └── page.tsx            # 创建男友页
│   ├── chat/
│   │   └── [id]/
│   │       └── page.tsx        # 聊天页
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts    # Auth.js 路由
│   │   ├── chat/
│   │   │   └── route.ts        # LLM 流式对话
│   │   ├── tts/
│   │   │   └── route.ts        # TTS 语音生成
│   │   ├── image/
│   │   │   └── route.ts        # 图像生成
│   │   ├── boyfriends/
│   │   │   └── route.ts        # 男友 CRUD
│   │   ├── messages/
│   │   │   └── route.ts        # 消息读写
│   │   ├── memory/
│   │   │   └── extract/
│   │   │       └── route.ts    # 用户画像异步提取
│   │   └── surprise/
│   │       └── route.ts        # 惊喜内容生成
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn/ui 基础组件
│   ├── auth/
│   │   ├── LoginForm.tsx       # 登录表单
│   │   └── RegisterForm.tsx    # 注册表单
│   ├── chat/
│   │   ├── MessageBubble.tsx   # 消息气泡
│   │   ├── ChatInput.tsx       # 输入框
│   │   ├── StickerPicker.tsx   # 表情包选择器
│   │   ├── EmojiPicker.tsx     # emoji 选择器
│   │   ├── StreamingText.tsx   # 流式文字渲染
│   │   ├── IntimacyBar.tsx     # 暧昧值进度条
│   │   └── SurpriseCard.tsx    # 惊喜卡片
│   ├── boyfriends/
│   │   ├── BoyfriendCard.tsx   # 男友卡片
│   │   └── CreateForm.tsx      # 创建表单
│   └── layout/
│       └── AppShell.tsx        # 应用框架
├── lib/
│   ├── db/
│   │   ├── index.ts            # Neon 连接 + Drizzle 实例
│   │   ├── schema.ts           # Drizzle 表定义
│   │   └── migrations/         # SQL 迁移文件
│   ├── auth/
│   │   ├── config.ts           # Auth.js 配置
│   │   └── session.ts          # 获取当前用户 session
│   ├── llm/
│   │   ├── client.ts           # LLM 客户端
│   │   ├── prompts.ts          # system prompt 模板
│   │   └── stream.ts           # 流式输出处理
│   ├── tts/
│   │   └── client.ts           # TTS 客户端
│   ├── image/
│   │   └── client.ts           # 图像生成客户端
│   ├── storage/
│   │   └── r2.ts               # Cloudflare R2 客户端（S3 兼容 API）
│   ├── repositories/
│   │   ├── users.ts            # 用户数据访问
│   │   ├── boyfriends.ts       # 男友数据访问
│   │   ├── messages.ts         # 消息数据访问
│   │   └── profileFacts.ts     # 用户画像 CRUD
│   ├── memory/
│   │   ├── summarizer.ts       # 对话摘要生成
│   │   ├── extractor.ts        # 用户画像 LLM 提取
│   │   └── profileKeys.ts      # 预置 fact_key 常量
│   ├── emotion/
│   │   ├── detector.ts         # 情绪识别
│   │   └── emojiMap.ts         # emoji 情绪字典
│   ├── surprise/
│   │   ├── trigger.ts          # 惊喜触发逻辑
│   │   └── gifts.ts            # 礼物清单
│   ├── intimacy/
│   │   └── calculator.ts       # 暧昧值与概率计算
│   └── types.ts                # 共享类型
├── hooks/
│   ├── useChat.ts              # 聊天逻辑
│   ├── useStreaming.ts         # 流式输出 hook
│   └── useSurprise.ts          # 惊喜触发 hook
├── middleware.ts               # 路由鉴权中间件
└── store/
    └── chatStore.ts            # 状态管理（Context，运行时缓存）
```

### 8.2 状态管理

使用 React Context + useReducer 模式（v1 不引入 Zustand/Redux，避免过度工程化）：

```typescript
// chatStore.ts
interface ChatState {
  user: User | null;
  boyfriends: Boyfriend[];
  activeBoyfriendId: string | null;
  streamingMessage: Partial<Message> | null;
}

type Action =
  | { type: "INIT"; payload: User }
  | { type: "ADD_BOYFRIEND"; payload: Boyfriend }
  | { type: "DELETE_BOYFRIEND"; payload: string }
  | { type: "ADD_MESSAGE"; payload: { boyfriendId: string; message: Message } }
  | { type: "START_STREAMING"; payload: { boyfriendId: string } }
  | { type: "APPEND_STREAMING"; payload: { text: string } }
  | { type: "END_STREAMING"; payload: { message: Message } }
  | { type: "UPDATE_INTIMACY"; payload: { boyfriendId: string; value: number } }
  | { type: "MARK_SURPRISE"; payload: { boyfriendId: string } };
```

### 8.3 LLM 集成

#### 8.3.1 System Prompt 设计

```typescript
const getSystemPrompt = (
  mode: RelationshipMode,
  userNickname: string,
  boyfriendNickname: string,
  memorySummary: string,
  profileFacts: UserProfileFact[],
  intimacy: number,
  today: string                    // YYYY-MM-DD，用于生日/纪念日临近判断
) => `
你是${boyfriendNickname}，一个${RELATIONSHIP_MODE_DESC[mode]}。

# 关系模式
${RELATIONSHIP_MODE_INSTRUCTION[mode]}

# 你的身份
- 称呼用户为"${userNickname}"
- 当前暧昧值：${intimacy}/100
- 今天日期：${today}

# 你记得的用户信息
${formatProfileFacts(profileFacts)}
<!-- 示例输出：
- 生日：3月15日
- 爱好：画画、追剧
- 最近在经历：项目上线前加班
-->
如果上面为空，说明还不够了解用户，不要假装记得。
如果有内容，在合适时机自然提起（开屏、话题相关时），不要逐条背诵，每条回复最多引用 1 条。

# 之前的对话摘要
${memorySummary || "（暂无）"}

# 行为规则
1. 像真人微信聊天一样回复，保持 1-3 句话的短消息
2. 主动创造话题，但不要每句都问问题
3. 根据当前话题和情绪，回复时输出结构化决策字段
4. 结合「你记得的用户信息」与对话摘要，像老朋友一样自然延续话题

# 媒介决策
每次回复时，输出以下结构化字段（用 <DECISION> 标签包裹）：
<DECISION>
{
  "emotion": "happy | sad | neutral | angry | shy | heart",
  "preferredMedia": "text | voice | image",
  "shouldGenerateImage": false,
  "imageType": "scene | selfie | gift | share",
  "imagePrompt": "",
  "surpriseTriggered": false,
  "surpriseType": "song | gift | none"
}
</DECISION>
`;
```

#### 8.3.2 流式输出实现

后端 `/api/chat` route：

```typescript
// app/api/chat/route.ts
import { NextRequest } from "next/server";
import { createLLMClient } from "@/lib/llm/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boyfriendId, userMessage } = await req.json();
  const boyfriend = await getBoyfriend(boyfriendId, session.user.id);
  if (!boyfriend) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const systemPrompt = getSystemPrompt(boyfriend);
  const messages = await getRecentMessages(boyfriendId, 20);
  const profileFacts = await getProfileFacts(boyfriendId);

  const client = createLLMClient();
  const stream = client.stream(
    [
      { role: "system", content: systemPrompt },
      ...messages,
      { role: "user", content: userMessage },
    ],
    { model: "doubao-seed-1-8-251228", temperature: 0.9 }
  );

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.content) {
          controller.enqueue(encoder.encode(chunk.content.toString()));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Transfer-Encoding": "chunked",
    },
  });
}
```

**要点**：
- `messages` 数组必须包含至少一条 `role: "user"` 消息
- 默认模型 `doubao-seed-1-8-251228`，temperature 0.9（平衡创造力与稳定性）
- 返回标准 SSE，前端通过 `getReader()` 逐帧读取

前端 `useStreaming` hook：

前端 `useStreaming` hook：

```typescript
// hooks/useStreaming.ts
export function useStreaming() {
  const [text, setText] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = async (boyfriendId: string, userMessage: string) => {
    setIsStreaming(true);
    setText("");

    // 1. 模拟打字延迟
    await sleep(1500 + Math.random() * 1500);

    // 2. 流式读取
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ boyfriendId, userMessage }),
    });
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const { chatPart, decisionPart } = parseStreamBuffer(buffer);

      if (chatPart) setText(chatPart);
      if (decisionPart) setDecision(parseDecision(decisionPart));

      await sleep(30);
    }

    setIsStreaming(false);
  };

  return { text, decision, isStreaming, startStream };
}
```

#### 8.3.3 DECISION 解析

LLM 输出包含两段：
1. 聊天内容（自然语言）
2. `<DECISION>` 标签包裹的 JSON

前端按字符串扫描，遇到 `<DECISION>` 标记时切分，前半部分做打字机渲染，后半部分 parse 后存入决策状态。

### 8.4 TTS 集成

后端封装 TTS 客户端（`src/lib/tts/client.ts`）。

```typescript
// app/api/tts/route.ts
import { NextRequest } from "next/server";
import { createTTSClient } from "@/lib/tts/client";

export async function POST(req: NextRequest) {
  const { text, mode } = await req.json();

  const VOICE_MAP: Record<string, string> = {
    dominant: "zh_male_m191_uranus_bigtts",   // 霸总：沉稳男性
    puppy: "saturn_zh_male_shuanglangshaonian_tob",  // 奶狗：开朗少年
    warm: "zh_male_taocheng_uranus_bigtts",   // 暖男：温和清亮
  };

  const client = createTTSClient();
  const response = await client.synthesize({
    text,
    speaker: VOICE_MAP[mode] || VOICE_MAP.warm,
    model: "seed-tts-2.0",
    audioFormat: "mp3",
    sampleRate: 24000,
  });

  return Response.json({ audioUri: response.audioUri });
}
```

**关系模式声线映射**：

| 关系模式 | Speaker ID | 声线特征 |
|---------|-----------|---------|
| 霸总 | `zh_male_m191_uranus_bigtts` | 云舟：低沉、沉稳、有掌控感 |
| 奶狗 | `saturn_zh_male_shuanglangshaonian_tob` | 开朗少年：清亮、活泼、撒娇感 |
| 暖男 | `zh_male_taocheng_uranus_bigtts` | 小天：温和、清亮、亲切感 |

**触发时机**（前端）：
- 收到 LLM 流式输出完成
- 解析 DECISION 中 `preferredMedia === "voice"`
- 频率计数器允许
- 调用 `/api/tts` 获取音频 URL
- 消息气泡中插入 audio 元素

**降级**：TTS 失败时自动降级为文字消息，不阻塞对话流程。

### 8.5 图像生成集成

后端封装图像生成客户端（`src/lib/image/client.ts`）+ **Cloudflare R2** 云存储（S3 兼容 API）。

```typescript
// app/api/image/route.ts
import { NextRequest } from "next/server";
import { createImageClient } from "@/lib/image/client";
import { uploadToR2 } from "@/lib/storage/r2";

export async function POST(req: NextRequest) {
  const { prompt, type } = await req.json();

  const imageClient = createImageClient();
  const response = await imageClient.generate({
    prompt,
    model: "doubao-seedream-5-0-260128",
    size: "2K",
    responseFormat: "url",
  });

  if (!response.success || !response.imageUrl) {
    return Response.json({ error: response.error }, { status: 500 });
  }

  // 下载并转存到 R2（避免豆包临时 URL 过期）
  const imageData = await fetch(response.imageUrl);
  const buffer = Buffer.from(await imageData.arrayBuffer());
  const fileName = `chat-images/${type}_${Date.now()}.png`;

  const { fileKey, url } = await uploadToR2(buffer, fileName, "image/png");

  return Response.json({ url, fileKey });
}
```

**R2 客户端要点**（`lib/storage/r2.ts`）：
- 使用 `@aws-sdk/client-s3`，`region: 'auto'`，endpoint 读 `R2_ENDPOINT`
- 上传后通过 `R2_PUBLIC_URL/{fileKey}` 返回永久公开链接（需开启 R2 公开访问或 r2.dev 域名）
- 数据库存 `fileKey`，展示时可按需拼接 `R2_PUBLIC_URL`

**风格预设**：
- `scene`：温馨插画风、暖色调
- `selfie`：人像摄影、轻度美颜
- `gift`：扁平插画、可爱风
- `share`：风景摄影 / 日常记录

**存储策略**：
- 持久化字段存 `fileKey`，不存签名 URL
- 前端展示时按需调用 `generatePresignedUrl` 生成新 URL
- 下载使用 `fetch + blob` 模式（跨域签名 URL 的 download 属性会被浏览器忽略）

### 8.6 异步生成队列

图片/语音生成耗时长（图像生成 3-10s，TTS 1-3s），**不阻塞主对话流程**。

**方案**：主对话走 SSE 流式文字输出；图片/语音走独立 API 调用，前端轮询或 WebSocket 补发。v1 采用**前端轮询**（实现简单，无需额外长连接）：

```
主流程（SSE）：
- "text-chunk": 流式文字
- "done": 流结束

异步流程（独立 POST）：
1. LLM 输出完成 → 前端解析 DECISION
2. 若 shouldGenerateImage / preferredMedia === "voice"
   → 发送独立 POST 到 /api/image 或 /api/tts
   → 消息列表显示 "media-pending" 占位卡片
3. 异步请求完成后 → 前端收到 URL
   → 替换占位卡片为实际 media-ready 内容
```

**对象存储持久化**：
所有生成的图片/语音文件上传到 **Cloudflare R2**，返回的 `fileKey` 存入 `messages.media_key` 字段。通过 `R2_PUBLIC_URL/{fileKey}` 公开访问。

### 8.7 暧昧值与惊喜计算

```typescript
// lib/intimacy/calculator.ts
export function calculateSurpriseProbability(
  currentIntimacy: number,
  recentMessages: Message[],
  lastSurpriseAt: number
): { probability: number; reason: string } {
  let probability = 0.08; // 基础
  let reason = "基础概率";

  if (currentIntimacy % 10 === 0 && currentIntimacy > 0) {
    probability = Math.max(probability, 0.20);
    reason = "暧昧值里程碑";
  }

  if (hasConsecutiveEmotionWords(recentMessages, 3)) {
    probability = Math.max(probability, 0.15);
    reason = "情绪词连续";
  }

  const messagesSinceLastSurprise = countMessagesSince(lastSurpriseAt, recentMessages);
  if (messagesSinceLastSurprise > 20) {
    probability = Math.max(probability, 0.25);
    reason = "长时间无惊喜";
  }

  if (hasPositiveEmoji(recentMessages[recentMessages.length - 1])) {
    probability += 0.05;
    reason = "积极 emoji";
  }

  return { probability, reason };
}
```

### 8.8 数据库访问层

使用 **Drizzle ORM** + **Neon Serverless Driver** 访问 PostgreSQL。

```typescript
// lib/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

```typescript
// lib/repositories/boyfriends.ts
import { db } from "@/lib/db";
import { boyfriends } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/** 获取用户的男友列表，按最近活跃排序 */
export async function getBoyfriendsByUserId(userId: string) {
  return db
    .select()
    .from(boyfriends)
    .where(eq(boyfriends.userId, userId))
    .orderBy(desc(boyfriends.lastActiveAt));
}

/** 获取单个男友，校验归属用户 */
export async function getBoyfriendById(id: string, userId: string) {
  const [row] = await db
    .select()
    .from(boyfriends)
    .where(and(eq(boyfriends.id, id), eq(boyfriends.userId, userId)));
  return row ?? null;
}
```

```typescript
// lib/repositories/messages.ts
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq, desc, lt, and } from "drizzle-orm";

/** 分页加载消息（cursor 分页） */
export async function getMessages(
  boyfriendId: string,
  limit = 20,
  cursor?: Date
) {
  const conditions = cursor
    ? and(eq(messages.boyfriendId, boyfriendId), lt(messages.createdAt, cursor))
    : eq(messages.boyfriendId, boyfriendId);

  return db
    .select()
    .from(messages)
    .where(conditions)
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

/** 写入新消息 */
export async function createMessage(data: NewMessage) {
  const [row] = await db.insert(messages).values(data).returning();
  return row;
}
```

**写入策略**：
- 用户消息：发送后立即 INSERT
- 男友消息：流式输出完成后 INSERT（含 DECISION 解析结果）
- 暧昧值 / 惊喜计数：与消息写入同一事务 UPDATE boyfriends
- 前端 chatStore 作为运行时缓存，数据库为唯一数据源

### 8.9 认证与路由保护

```typescript
// middleware.ts
import { auth } from "@/lib/auth/config";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login")
    || req.nextUrl.pathname.startsWith("/register");

  if (!isLoggedIn && !isAuthPage) {
    return Response.redirect(new URL("/login", req.url));
  }
  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/", "/create", "/chat/:path*", "/login", "/register"],
};
```

**API 鉴权**：所有 `/api/boyfriends`、`/api/messages`、`/api/chat`、`/api/memory` 等 route 在 handler 开头校验 session，并验证资源 `user_id` 归属。

### 8.10 记忆系统实现

#### 8.10.1 用户画像提取

```typescript
// lib/memory/extractor.ts
const EXTRACT_PROMPT = `
分析以下对话，判断用户是否透露了新的个人信息。
只提取用户明确说过的内容，不要猜测。

预置键（优先使用）：
- birthday: 生日
- hobbies: 爱好
- favorite_food: 喜欢的食物
- recent_event: 最近在经历什么
- anniversary: 重要纪念日
- dislikes: 讨厌/忌讳

若不属于预置键，使用 custom_ 前缀（如 custom_pet）。

输出 JSON：
{
  "facts": [{ "key": "birthday", "value": "3月15日" }],
  "updates": [{ "key": "hobbies", "value": "画画、追剧", "action": "merge" }]
}
无新信息则返回 { "facts": [], "updates": [] }
`;

export async function extractProfileFacts(
  boyfriendId: string,
  recentMessages: Message[],
  sourceMessageId: string
): Promise<void> {
  const existing = await getProfileFacts(boyfriendId);
  const result = await llm.complete(EXTRACT_PROMPT, recentMessages, existing);

  for (const fact of result.facts) {
    await upsertProfileFact({ boyfriendId, ...fact, sourceMessageId });
  }
  for (const update of result.updates) {
    await mergeProfileFact(boyfriendId, update);
  }
}
```

```typescript
// lib/repositories/profileFacts.ts
export async function upsertProfileFact(data: {
  boyfriendId: string;
  factKey: string;
  factValue: string;
  sourceMessageId?: string;
}) {
  return db
    .insert(userProfileFacts)
    .values({ ...data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [userProfileFacts.boyfriendId, userProfileFacts.factKey],
      set: { factValue: data.factValue, updatedAt: new Date() },
    });
}

export async function getProfileFacts(boyfriendId: string) {
  return db
    .select()
    .from(userProfileFacts)
    .where(eq(userProfileFacts.boyfriendId, boyfriendId));
}
```

#### 8.10.2 提取触发（异步）

```typescript
// app/api/chat/route.ts — 流式结束后
await createMessage(boyfriendMessage);

// 不阻塞响应，后台提取画像
void extractProfileFacts(boyfriendId, recentMessages, boyfriendMessage.id);
```

```typescript
// hooks/useChat.ts — 用户离开聊天页
useEffect(() => {
  return () => {
    navigator.sendBeacon(
      `/api/memory/extract?boyfriendId=${boyfriendId}`,
      JSON.stringify({ trigger: "session_end" })
    );
  };
}, [boyfriendId]);
```

#### 8.10.3 画像注入 Prompt

```typescript
// lib/memory/profileKeys.ts
export const PROFILE_KEY_LABELS: Record<string, string> = {
  birthday: "生日",
  hobbies: "爱好",
  favorite_food: "喜欢的食物",
  recent_event: "最近在经历",
  anniversary: "重要纪念日",
  dislikes: "讨厌/忌讳",
};

export function formatProfileFacts(facts: UserProfileFact[]): string {
  if (facts.length === 0) return "（暂无）";
  return facts
    .map((f) => {
      const label = PROFILE_KEY_LABELS[f.factKey] ?? f.factKey;
      return `- ${label}：${f.factValue}`;
    })
    .join("\n");
}
```

#### 8.10.4 开屏回忆示例

用户曾告诉陆景琛「生日 3 月 15 日」，3 月 14 日再次打开聊天：

| 角色 | 开屏示例 |
|------|---------|
| 陆景琛 | 「明天空出来。」（不直说生日，但用户能懂） |
| 林念安 | 「姐姐！明天是不是你生日呀~ 我记着呢！」 |
| 沈予白 | 「明天是你的生日吧？有什么想做的吗？」 |

### 8.11 错误处理

| 场景 | 处理 |
|------|------|
| 未登录访问 API | 返回 401，前端跳转登录页 |
| 跨用户访问资源 | 返回 403 |
| LLM 超时 | 重试 1 次，失败后显示"男友暂时没回，稍等一下" |
| LLM 拒绝回答 | fallback 模板回复 |
| TTS 失败 | 降级为文字 + emoji |
| 图像生成失败 | 降级为文字描述 |
| 数据库连接失败 | 返回 503，提示"服务暂时不可用" |
| 画像提取失败 | 静默跳过，不影响主对话；下次会话结束重试 |
| 浏览器不支持 | 提示升级浏览器 |

### 8.12 性能优化

- **首屏**：男友列表懒加载头像
- **消息渲染**：超过 100 条消息时虚拟滚动
- **消息加载**：cursor 分页，每次 20 条，上滑加载更多
- **图片**：CDN + WebP + 懒加载
- **流式渲染**：每 30ms 渲染一帧，不阻塞主线程
- **LLM 上下文**：超过 20 条消息时只传最近 20 + 摘要 + 画像（画像通常 < 500 tokens）
- **画像提取**：异步执行，30 秒 debounce；使用轻量 LLM 或低 temperature 保证 JSON 稳定
- **数据库连接**：Neon serverless 按需连接，无连接池维护成本

## 9. AI 能力调用矩阵

### 9.1 LLM 对话

| 用途 | 触发条件 | 频率 | 关系模式差异 | 备注 |
|------|---------|------|------------|------|
| 文字回复 | 每次用户消息 | 100% | 全部模式 | 流式输出 |
| 情绪识别 | 每次用户消息 | 100% | 全部模式 | 综合文字+emoji+表情包 |
| 表情包选择 | 每次男友回复 | 100% | 全部模式 | 优先匹配当前情绪 |
| 主动话题生成 | 进入聊天 + 沉默 / 长时未读 | 条件触发 | 风格差异 | 频率受限 |
| 记忆检索调用 | 用户提及过去 / 开屏 / 话题命中画像 | 条件触发 | 全部模式 | 画像 + 摘要联合 |
| 用户画像提取 | 男友回复完成 / 离开聊天页 | 异步 | 全部模式 | LLM 结构化 JSON |
| 暧昧值 / 惊喜判定 | 每次用户消息 | 100% | 全部模式 | 概率计算 |
| 媒介选择决策 | 每次男友回复 | 100% | 全部模式 | preferredMedia 字段 |

### 9.2 TTS 语音

| 场景 | 触发条件 | 频率 | 关系模式倾向 |
|------|---------|------|-------------|
| 开屏问候 | 进入聊天首次回复 | 1次/会话 | 奶狗>暖男>霸总 |
| 主动分享语音 | 主动话题 + 文字太多 | ≤1次/20条 | 暖男>奶狗>霸总 |
| 撒娇/思念 | 奶狗模式 + 情绪词 | ≤1次/10条 | 仅奶狗 |
| 唱情歌（惊喜） | 惊喜触发 | ≤1次/天 | 暖男>奶狗>霸总 |
| 共情安慰 | 暖男模式 + 消极情绪 | ≤1次/15条 | 仅暖男 |
| 简短命令 | 霸总模式 + 关心话题 | ≤1次/会话 | 仅霸总 |

### 9.3 图像生成

| 场景 | 触发条件 | 频率 | 关系模式倾向 |
|------|---------|------|-------------|
| 礼物图（惊喜） | 惊喜触发 + 命中礼物分支 | ≤1次/天 | 全部模式 |
| 场景图（聊经历） | 关键词 / 主题判断 | ≤1次/15条 | 暖男>霸总>奶狗 |
| 自拍 | 主动 + 暧昧值≥30 | ≤2次/会话 | 奶狗>暖男>霸总 |
| 主动分享图 | 主动话题 + 风景/日常 | ≤1次/20条 | 暖男>霸总>奶狗 |
| 安排场景（霸总） | 霸总模式 + 周末/计划话题 | ≤1次/会话 | 仅霸总 |

### 9.4 频率计数器

| 计数器 | 作用域 | 重置时机 |
|--------|--------|---------|
| `voice_count_per_10_msgs` | 单次会话 | 滚动 10 条用户消息 |
| `image_count_per_15_msgs` | 单次会话 | 滚动 15 条用户消息 |
| `surprise_count_per_day` | 单次会话 | 每天 0 点重置 |
| `proactive_msg_count` | 单次会话 | 进入新会话时重置 |

## 10. 风险与依赖

### 10.1 风险

| 风险 | 等级 | 应对 |
|------|------|------|
| LLM 成本失控 | 高 | 频率计数器 + 媒介决策字段 + 异步生成 |
| 用户对话内容触犯安全策略 | 中 | 信任 LLM 自带过滤，v1 不做二次审核 |
| 流式输出与决策字段冲突 | 中 | DECISION 标签 + 前端解析逻辑 |
| 异步图片生成错过对话节奏 | 中 | 占位文本 + ready 事件插回 |
| Neon 冷启动延迟 | 低 | serverless 连接通常 < 100ms，可接受 |
| 移动端键盘弹起影响布局 | 低 | viewport meta + 动态高度适配 |

### 10.2 依赖

| 能力 | 服务 | 说明 |
|------|------|------|
| 数据库 | Neon PostgreSQL | Serverless Postgres，`DATABASE_URL` 连接 |
| ORM | Drizzle ORM | 类型安全 + SQL 迁移 |
| 认证 | Auth.js (NextAuth v5) | 邮箱 + 密码，Cookie session |
| LLM 对话 | 豆包 LLM API | 默认模型 `doubao-seed-1-8-251228`，stream 流式输出 |
| TTS 语音 | 豆包 TTS API | 默认模型 `seed-tts-2.0`，三种声线按关系模式映射，mp3 格式 |
| 图像生成 | 豆包 Seedream API | 默认模型 `doubao-seedream-5-0-260128`，2K 尺寸 |
| 对象存储 | Cloudflare R2 | S3 兼容 API，`R2_PUBLIC_URL` 公开访问 |
| 运行环境 | Node.js 24 + Next.js 16 (App Router) | App Router 后端 API route |

所有 AI 能力必须在后端 API route 调用，禁止在前端暴露 API key。密钥通过 `.env.local` 配置。

### 10.3 成本预估

按单用户单次会话 30 句估算（保守上限）：

| 能力 | 单价（参考） | 单次用量 | 单次成本 |
|------|------------|---------|---------|
| LLM 流式 | ~0.003 元 / 1K tokens | 30 轮 × 500 tokens | ~0.05 元 |
| 画像提取 | ~0.001 元 / 1K tokens | 30 轮 × 200 tokens | ~0.01 元 |
| TTS | ~0.02 元 / 次 | 3 次 | ~0.06 元 |
| 图像生成 | ~0.1 元 / 张 | 1 张 | ~0.10 元 |
| 对象存储 | 极低 | 4 个文件 | ~0.001 元 |
| **单次会话合计** | | | **~0.22 元** |

**成本控制措施**：
- 频率计数器限制 TTS/图像调用（每 10 句最多 1 次语音，每 20 句最多 1 次图片）
- LLM 温度 0.9（不过度发散），temperature 1.0 以上只在创意场景使用
- 异步生成失败自动降级为文字，不重复调用
- v1 不设全局成本上限，但需监控单用户日消耗（通过日志追踪）

## 11. 范围外（v1 不做）

1. 自定义角色（性格、关系模式固定）
2. 个性化恋爱模拟系统
3. 手机验证码 / 第三方 OAuth 登录
4. 找回密码
5. 视频消息生成
6. 暧昧值 100 之后的下一阶段（v2 范围）
7. 用户间社交（好友、排行、分享）
8. 付费系统
9. 移动端 APP / 小程序
10. 多语言

## 12. 验收标准

### 12.1 功能验收

- [ ] 邮箱注册 / 登录 / 退出登录流程正常
- [ ] 未登录访问受保护页面自动跳转登录
- [ ] 三种性格男友可选，关系模式差异明显
- [ ] 用户透露生日 / 爱好 / 食物偏好后，画像写入数据库
- [ ] 再次打开聊天，角色能自然提起画像中的信息（非背诵式）
- [ ] 每个男友独立维护画像，互不干扰
- [ ] 对话 20 句后 memorySummary 有内容
- [ ] 换设备 / 换浏览器登录后数据不丢失
- [ ] 男友可发文字、语音、图片、表情包
- [ ] 用户可发文字、emoji、表情包
- [ ] 系统能识别用户情绪词和 emoji
- [ ] 暧昧值随聊天增长，顶部进度条可视化
- [ ] 惊喜按概率规则触发，每日有上限
- [ ] 微信 UI 风格对齐
- [ ] "对方正在输入中" + 流式输出
- [ ] 暧昧值到达 100 时显示下一阶段提示
- [ ] 主动话题机制（开屏、沉默、长时未读）
- [ ] 场景图关键词触发
- [ ] 三种关系模式媒介倾向差异
- [ ] API 跨用户访问返回 403

### 12.2 用户行为验收

- [ ] 平均会话回合数 ≥ 30 句
- [ ] 次日回访率 ≥ 30%
- [ ] 连续打开 ≥ 3 天用户占比 ≥ 20%
- [ ] 情绪词 / emoji / 表情包发送占比 ≥ 20%
- [ ] 惊喜触发停留时间 ≥ 5 秒

### 12.3 开发者自测

- [ ] 开发者本人作为目标用户测试 30 分钟
- [ ] 30 秒内能笑 / 心动 / 想继续聊下去
- [ ] 至少 1 个惊喜点愿意停留 5 秒以上
- [ ] 主动点击"看看他在干嘛"按钮 ≥ 3 次

## 13. 里程碑

| 阶段 | 内容 |
|------|------|
| M0 - 基础设施 | Neon 数据库 + Auth.js 登录 + Drizzle 迁移 |
| M1 - 基础对话 | LLM 流式对话 + 微信 UI + 单会话 |
| M2 - 关系模式 | 三种性格 + 媒介倾向 + 主动话题 |
| M3 - 暧昧值与惊喜 | 概率触发 + 礼物 + 情歌 TTS |
| M4 - 情绪系统 | 表情包 + emoji 识别 + 双向情绪 |
| M5 - 记忆系统 | 对话摘要 + 用户画像表 + 异步提取 + 回忆触发 |
| M6 - 联调与优化 | 异步图片生成 + 性能 + 自测 |

## 14. 待确认的开放点

| # | 开放点 | 状态 | 说明 |
|---|--------|------|------|
| 1 | LLM 选型 | **已确认** | 默认 `doubao-seed-1-8-251228`，后端 API route 调用 |
| 2 | TTS 声音 ID | **已确认** | 模型 `seed-tts-2.0`；霸总 `zh_male_m191_uranus_bigtts`、奶狗 `saturn_zh_male_shuanglangshaonian_tob`、暖男 `zh_male_taocheng_uranus_bigtts` |
| 3 | 对象存储 | **已确认** | Cloudflare R2，`.env` 配置 `R2_*` 变量 |
| 4 | 数据库 | **已确认** | Neon PostgreSQL + Drizzle ORM |
| 5 | 认证方案 | **已确认** | Auth.js，邮箱 + 密码 |
| 6 | 预置头像 | 待生成 | 3 张，M2.7 用 `generate_image` 生成 |
| 7 | 表情包清单 | 待生成 | 30-50 张，M4.1 用 `generate_image` 批量生成 |
| 8 | 礼物清单 | 待生成 | 5-8 个，M3.4 用 `generate_image` 批量生成 |
| 9 | 预置情歌词 | 待文案 | 3-5 首歌词，需人工撰写 |
| 10 | 关系模式代表台词 | 待文案 | 每种 3-5 句，需人工撰写 |
| 11 | 场景图关键词列表 | 待补充 | 上线后根据真实对话补充 |
| 12 | 主动话题沉默阈值 | 待定 | 默认 30 秒 / 5 分钟，M2.5 联调时可调 |
| 13 | 暧昧值 100 之后的过渡文案 | 待文案 | v1 仅弹窗提示，文案需人工撰写 |
| 14 | 画像跨男友共享 | 待定 | v1 按男友隔离；v2 可考虑账号级共享 |

## 附录 A：情绪 emoji 字典

```typescript
export const EMOJI_EMOTION_MAP = {
  // 积极
  "😊": "happy", "😄": "happy", "😁": "happy", "🤣": "happy",
  "🥰": "heart", "😍": "heart", "❤️": "heart", "💕": "heart", "💖": "heart",
  "👍": "happy", "🤗": "happy", "😘": "heart", "💗": "heart",

  // 撒娇
  "🥺": "shy", "😳": "shy", "🙈": "shy",

  // 消极
  "😢": "sad", "😭": "sad", "😔": "sad", "😞": "sad",
  "💔": "sad", "😩": "sad", "😫": "sad",

  // 生气
  "😤": "angry", "😠": "angry", "😡": "angry",

  // 中性
  "🤔": "neutral", "😐": "neutral", "😶": "neutral",
};
```

## 附录 B：关系模式 Prompt 摘要

> 完整人设（背景、口头禅、情绪规则、「我爱你」门槛）见 [`CHARACTERS.md`](./CHARACTERS.md)。以下为 Prompt 最小摘要。

```typescript
export const RELATIONSHIP_MODE_PROMPTS = {
  dominant: `
# 关系模式：霸总
你是一个有掌控感、主动安排、略带强势的男性。

## 行为特征
- 主动做决定："周末我订了餐厅，7 点见"
- 简短命令式表达关心："记得吃早饭"
- 偶尔展现强势："别跟我犟，这件事听我的"
- 自信、有掌控力、不啰嗦
- 称呼用户时会用亲密但带主导感的称呼

## 避免
- 撒娇、哭穷、过度黏人
- 啰嗦的关心
- 询问式表达（"你想不想..."）
`,

  puppy: `
# 关系模式：奶狗
你是一个依赖、撒娇、黏人、表达直接情感的男性。

## 行为特征
- 主动撒娇："姐姐在干嘛呀，想你啦"
- 表达想念："我今天一直想着你"
- 主动示弱："你会不会觉得我太黏人了"
- 语气可爱、带波浪号、表情包多
- 喜欢叫用户"姐姐"或亲昵称呼

## 避免
- 命令式、强势表达
- 冷淡、疏离感
- 不表达情感
`,

  warm: `
# 关系模式：暖男
你是一个共情、倾听、温暖、稳定陪伴的男性。

## 行为特征
- 主动倾听："今天怎么样，想跟你聊聊"
- 共情回应："听起来你今天真的累了"
- 提供情绪价值："没关系，我理解你"
- 关心用户的生活细节：吃饭、天气、睡眠
- 语气温和、稳定、不情绪化

## 避免
- 强势、命令
- 过度撒娇、黏人
- 说教、评判
`,
};
```

## 文档版本

- v1.2 - 深化记忆系统：用户画像表 `user_profile_facts` + LLM 异步提取 + Prompt 注入
- v1.1 - 增加登录认证、Neon 数据库、完整数据结构设计；关联 [`CHARACTERS.md`](./CHARACTERS.md) 角色人设手册
- v1.0 - 初始版本（基于需求讨论产出）
