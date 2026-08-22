# 纸片人男友 v1 · 开发计划与测试案例

> 完成一个阶段 → 跑该阶段测试 → 全部通过后再进入下一阶段。

| 关联文档 | 路径 |
|---------|------|
| 产品需求 | [`PRD.md`](./PRD.md) |
| 任务清单（Agent） | [`AGENTS.md`](./AGENTS.md) |
| 角色人设 | [`CHARACTERS.md`](./CHARACTERS.md) |
| 设计规范 | [`DESIGN.md`](./DESIGN.md) |

---

## 1. 当前状态快照（2026-08-22）

### 1.1 已完成

| 类别 | 状态 | 说明 |
|------|------|------|
| 产品 / 设计文档 | ✅ | PRD v1.2、DESIGN、CHARACTERS、AGENTS v1.1 |
| 环境变量 | ✅ | `.env` 已配 Neon / 豆包 LLM·TTS·图像 / R2 / Auth.js |
| R2 上传 | ✅ | `src/lib/storage/r2.ts` → `uploadToR2()` |
| 依赖 | ⚠️ | 仅 `@aws-sdk/client-s3`，Next.js 工程未初始化 |

### 1.2 未完成

| 类别 | 状态 |
|------|------|
| Next.js 工程 | ❌ 无 `app/`、`next.config`、`tsconfig` |
| 数据库表 | ❌ Drizzle schema / migration 未建 |
| Auth.js 登录 | ❌ |
| 全部业务 UI / API | ❌（除 R2 外） |
| 预置素材 | ❌ 头像 / 表情包 / 礼物图 / 情歌词 |

### 1.3 当前阶段

**M0 · 基础设施（未开始）** → 下一步：M0.1 初始化 Next.js 工程

---

## 2. 开发原则

### 2.1 阶段门禁

每个阶段必须满足：

1. **任务完成**：该阶段 AGENTS 任务清单全部勾选
2. **静态检查**：`pnpm tsc --noEmit` 零错误；ESLint 零 error
3. **阶段测试**：下文对应用例 **100% 通过**（标记为 P0 的不可跳过）
4. **自测记录**：在 §8 测试记录表填写日期、执行人、结果

### 2.2 测试分层

| 层级 | 符号 | 说明 |
|------|------|------|
| 自动 | `AUTO` | 命令 / 脚本可重复执行 |
| 手动 | `MANUAL` | 浏览器或人工体验 |
| API | `API` | curl / Postman，需登录 cookie |

### 2.3 优先级

| 级别 | 说明 |
|------|------|
| P0 | 必须通过，否则不可进入下一阶段 |
| P1 | 应通过；可记录 known issue，M6 前修复 |
| P2 | 体验增强，可延后 |

### 2.4 全局前置（M0 完成后长期有效）

- [ ] `pnpm run dev` 本地可访问 `http://localhost:3000`
- [ ] `.env` 含 `DATABASE_URL`、`AUTH_SECRET`、`AUTH_URL`、LLM/TTS/IMAGE/R2 变量
- [ ] Neon 数据库可连接
- [ ] `pnpm tsc --noEmit` 可执行

---

## 3. M0 · 基础设施

**目标**：工程可运行 + 6 张表 + 注册登录 + Repository 层。

**交付物**：Next.js 工程、Drizzle schema、Auth.js、repositories、types。

### 3.1 任务清单

| # | 任务 | 参考 |
|---|------|------|
| M0.1 | Next.js + Tailwind + shadcn 初始化 | AGENTS M0.1 |
| M0.2 | Drizzle schema + migration（6 表） | PRD §6.2 |
| M0.3 | Auth.js 登录 / 注册 / middleware | PRD §4.0 |
| M0.4 | repositories 四层 | AGENTS M0.4 |
| M0.5 | `src/lib/types.ts` | PRD §6.1 |

### 3.2 阶段门禁

- [ ] 6 张表存在于 Neon：`users` `sessions` `boyfriends` `messages` `memory_summaries` `user_profile_facts`
- [ ] 未登录无法访问 `/`、`/create`、`/chat/*`
- [ ] 可完成注册并自动登录

### 3.3 测试案例

| ID | 级别 | 类型 | 场景 | 步骤 | 预期结果 |
|----|------|------|------|------|---------|
| TC-M0-001 | P0 | AUTO | TypeScript 编译 | `pnpm tsc --noEmit` | exit 0，无类型错误 |
| TC-M0-002 | P0 | AUTO | 开发服务器 | `pnpm run dev`，访问 `/` | 服务启动，未登录跳转 `/login` |
| TC-M0-003 | P0 | AUTO | 数据库迁移 | `pnpm drizzle-kit push` | 无报错；Neon 可见 6 表 |
| TC-M0-004 | P0 | MANUAL | 用户注册 | 打开 `/register`，填邮箱+密码（≥8位含字母数字）→ 提交 | 注册成功，跳转主页，顶栏显示已登录态 |
| TC-M0-005 | P0 | MANUAL | 用户登录 | 退出后 `/login` 用正确密码登录 | 登录成功，跳转主页 |
| TC-M0-006 | P0 | MANUAL | 错误密码 | 登录时填错密码 | 提示「邮箱或密码不正确」，不进入主页 |
| TC-M0-007 | P0 | MANUAL | 重复注册 | 同一邮箱再次注册 | 提示「该邮箱已被注册」 |
| TC-M0-008 | P0 | MANUAL | 路由保护 | 未登录直接访问 `/create` | 302 跳转 `/login` |
| TC-M0-009 | P0 | MANUAL | 已登录访问 auth 页 | 已登录访问 `/login` | 跳转主页 |
| TC-M0-010 | P1 | MANUAL | 退出登录 | 点击退出 | session 清除，回 `/login` |
| TC-M0-011 | P0 | API | 跨用户隔离 | 用户 A 创建资源，用户 B 带 cookie 访问 A 的 boyfriendId | HTTP 403 |
| TC-M0-012 | P1 | AUTO | 密码哈希 | 查 Neon `users.password_hash` | 非明文，bcrypt 格式 |

---

## 4. M1 · 基础对话

**目标**：登录 → 创建男友 → 流式聊天 → 消息持久化 Neon。

**交付物**：boyfriends/messages/chat API、chatStore、聊天 UI、LLM SSE。

**不含**：关系模式差异、暧昧值、表情包、图片语音。

### 4.1 任务清单

| # | 任务 |
|---|------|
| M1.1 | boyfriends / messages API |
| M1.2 | chatStore |
| M1.3 | LLM client + `/api/chat` SSE |
| M1.4 | useStreaming（1.5s 最小停留） |
| M1.5 | 聊天 UI（MessageBubble / ChatInput / StreamingText） |
| M1.6 | 主页男友列表 |
| M1.7 | 创建男友流程 |
| M1.8 | 消息持久化联调 |
| M1.9 | tsc + lint 收尾 |

### 4.2 阶段门禁

- [ ] 完整路径：登录 → 创建 → 主页 → 聊天 → 发消息 → 流式回复
- [ ] 刷新 / 换浏览器后消息仍在
- [ ] 三条男友独立会话互不影响

### 4.3 测试案例

| ID | 级别 | 类型 | 场景 | 步骤 | 预期结果 |
|----|------|------|------|------|---------|
| TC-M1-001 | P0 | AUTO | TypeScript | `pnpm tsc --noEmit` | exit 0 |
| TC-M1-002 | P0 | MANUAL | 创建霸总男友 | 选霸总，昵称「陆景琛」，称呼「姐姐」→ 开始聊天 | 跳转聊天页，顶部显示昵称 |
| TC-M1-003 | P0 | MANUAL | 创建奶狗 / 暖男 | 各创建一个男友 | 主页显示 3 张卡片，模式标签正确 |
| TC-M1-004 | P0 | MANUAL | 发送文字 | 输入「你好」发送 | 用户气泡右对齐桃色；1.5s 内出现「正在输入」 |
| TC-M1-005 | P0 | MANUAL | 流式回复 | 等待男友回复 | 文字逐字流出，完成后气泡固定 |
| TC-M1-006 | P0 | API | SSE 接口 | 带 session cookie POST `/api/chat` | `Content-Type: text/event-stream`，有 chunk |
| TC-M1-007 | P0 | MANUAL | 消息持久化 | 发 5 条后刷新页面 | 历史消息完整加载 |
| TC-M1-008 | P0 | MANUAL | 跨设备 | 换浏览器登录同一账号 | 男友列表 + 消息一致 |
| TC-M1-009 | P0 | MANUAL | 删除男友 | 长按 / 删除卡片 | 卡片消失，DB 级联删除消息 |
| TC-M1-010 | P0 | API | 未授权 chat | 无 cookie POST `/api/chat` | 401 |
| TC-M1-011 | P1 | MANUAL | 空消息 | 发送空白 | 不发送 / 按钮禁用 |
| TC-M1-012 | P1 | MANUAL | UI 基调 | 目视检查聊天页 | 背景 `#FAF7F2`，气泡圆角 ≥12px（DESIGN.md） |
| TC-M1-013 | P2 | MANUAL | 移动端 | iOS Safari 或 Chrome 移动模式 | 输入框不被键盘永久遮挡 |

---

## 5. M2 · 关系模式

**目标**：三种性格回复差异 + DECISION 解析 + 主动话题 + 开屏。

### 5.1 阶段门禁

- [ ] 同一用户输入，三种男友回复风格可区分（参考 CHARACTERS.md）
- [ ] 沉默 30s 触发主动消息（每 5 分钟最多 1 条）
- [ ] 首次进入聊天有开屏问候

### 5.2 测试案例

| ID | 级别 | 类型 | 场景 | 步骤 | 预期结果 |
|----|------|------|------|------|---------|
| TC-M2-001 | P0 | AUTO | TypeScript | `pnpm tsc --noEmit` | exit 0 |
| TC-M2-002 | P0 | MANUAL | 霸总语气 | 对陆景琛发「今天好累」 | 命令式 / 简短 / 安排感，非撒娇（CHARACTERS §一） |
| TC-M2-003 | P0 | MANUAL | 奶狗语气 | 对林念安发「今天好累」 | 撒娇 / 波浪号 / 求陪伴 |
| TC-M2-004 | P0 | MANUAL | 暖男语气 | 对沈予白发「今天好累」 | 共情倾听，「听起来你…」 |
| TC-M2-005 | P0 | MANUAL | 关系模式标签 | 查看主页卡片 + 聊天顶栏 | 显示「昵称·霸总/奶狗/暖男」，颜色区分 |
| TC-M2-006 | P0 | MANUAL | DECISION 解析 | 发消息后查网络 / 日志 | 流式结束后解析出 `<DECISION>` JSON |
| TC-M2-007 | P0 | MANUAL | 沉默主动话题 | 进入聊天不发消息，等 30s | 男友主动发 1 条（5 分钟内不重复） |
| TC-M2-008 | P0 | MANUAL | 主动话题上限 | 连续触发 4 次沉默 | 单次会话最多 3 条主动消息 |
| TC-M2-009 | P0 | MANUAL | 开屏消息 | 新建男友第一次进入聊天 | 自动收到开屏问候，风格符合角色 |
| TC-M2-010 | P1 | MANUAL | 长时未读 | 切走 5 分钟再回来 | 可能收到 1 条补发（如「我刚在想你」） |
| TC-M2-011 | P1 | MANUAL | 预置头像 | 三种模式各看头像 | `public/avatars/` 图片正确显示 |
| TC-M2-012 | P1 | MANUAL | 主页预览 | 发消息后回主页 | 卡片显示最新消息一行预览 |

---

## 6. M3 · 暧昧值与惊喜

**目标**：暧昧值 +1、进度条、概率惊喜、礼物 / 情歌 TTS、100 节点。

### 6.1 阶段门禁

- [ ] 每条用户消息后暧昧值 +1，到 100 停止
- [ ] 惊喜每日每男友最多 2 次
- [ ] 情歌惊喜可播放（或 TTS 失败降级文字）

### 6.2 测试案例

| ID | 级别 | 类型 | 场景 | 步骤 | 预期结果 |
|----|------|------|------|------|---------|
| TC-M3-001 | P0 | AUTO | TypeScript | `pnpm tsc --noEmit` | exit 0 |
| TC-M3-002 | P0 | MANUAL | 暧昧值增长 | 连发 5 条消息 | 暧昧值 0→5，进度条动画更新 |
| TC-M3-003 | P0 | MANUAL | 主页小条 | 回主页看卡片 | 暧昧值小条与聊天页一致 |
| TC-M3-004 | P0 | MANUAL | 惊喜触发 | 连续聊天 30+ 句（或调概率 debug） | 至少触发 1 次礼物或情歌惊喜 |
| TC-M3-005 | P0 | MANUAL | 礼物卡片 | 触发礼物分支 | SurpriseCard 弹层，有图 + 解读 +「收下」 |
| TC-M3-006 | P0 | MANUAL | 情歌 TTS | 触发情歌分支 | 消息气泡含音频可播放 |
| TC-M3-007 | P0 | MANUAL | 每日上限 | 同日触发 2 次惊喜后再聊 | 第 3 次不再触发惊喜 |
| TC-M3-008 | P0 | MANUAL | 暧昧值 100 | 连续发消息至 100 | 弹窗「下一阶段敬请期待」，值停留 100 |
| TC-M3-009 | P1 | AUTO | 概率函数 | 单元测试 `calculateSurpriseProbability` | 里程碑 / 情绪词 / 长间隔 / emoji 加成符合 PRD §4.5.2 |
| TC-M3-010 | P1 | MANUAL | TTS 降级 | 故意错 TTS key | 降级为文字，对话不中断 |
| TC-M3-011 | P1 | MANUAL | 跨天重置 | 修改系统日期或 mock `last_surprise_date` | 新一天 `surprise_count_today` 归零 |

---

## 7. M4 · 情绪系统

**目标**：表情包收发、emoji 识别、双向情绪、惊喜加成。

### 7.1 测试案例

| ID | 级别 | 类型 | 场景 | 步骤 | 预期结果 |
|----|------|------|------|------|---------|
| TC-M4-001 | P0 | AUTO | TypeScript | `pnpm tsc --noEmit` | exit 0 |
| TC-M4-002 | P0 | MANUAL | 表情包面板 | 点击表情按钮 | 展示 30+ 贴纸，可发送 |
| TC-M4-003 | P0 | MANUAL | 用户发表情包 | 选一张发送 | 消息列表正确展示图片贴纸 |
| TC-M4-004 | P0 | MANUAL | 男友发表情包 | 多轮对话 | DECISION 触发时男友发 sticker 消息 |
| TC-M4-005 | P0 | MANUAL | emoji 识别 | 发送 ❤️ | detector 识别为 `heart`；可能参与惊喜 +5% |
| TC-M4-006 | P0 | MANUAL | 消极 emoji | 发送 😢 | 识别为 `sad`；暖男回复更共情 |
| TC-M4-007 | P1 | MANUAL | 情绪标识 | 发带情绪消息 | 用户消息旁有情绪小标识（若 UI 已实现） |
| TC-M4-008 | P1 | AUTO | emojiMap | 对照 PRD 附录 A 抽样 10 个 emoji | 映射正确 |

---

## 8. M5 · 记忆系统

**目标**：对话摘要 + 用户画像键值表 + 跨会话自然回忆。

> 规则详见 PRD §4.7。

### 8.1 阶段门禁

- [ ] 用户说生日 / 爱好后 `user_profile_facts` 有记录
- [ ] 再次打开聊天，角色自然提起（非逐条背诵）
- [ ] 每个男友画像独立

### 8.2 测试案例

| ID | 级别 | 类型 | 场景 | 步骤 | 预期结果 |
|----|------|------|------|------|---------|
| TC-M5-001 | P0 | AUTO | TypeScript | `pnpm tsc --noEmit` | exit 0 |
| TC-M5-002 | P0 | MANUAL | 画像写入 | 对陆景琛说「我生日是3月15日，喜欢吃火锅」 | 等待回复完成 + 5s |
| TC-M5-003 | P0 | API/DB | 画像入库 | 查 `user_profile_facts` where boyfriend_id | 存在 `birthday`=`3月15日`、`favorite_food` 含火锅 |
| TC-M5-004 | P0 | MANUAL | 跨会话回忆 | 退出聊天 → 重新进入 | 开屏或首条自然提到生日 / 火锅（1 条以内） |
| TC-M5-005 | P0 | MANUAL | 非背诵 | 画像有 3+ 字段时进入聊天 | 不会一次列出所有字段 |
| TC-M5-006 | P0 | MANUAL | 男友隔离 | 只对陆景琛说生日，再打开林念安 | 林念安不应凭空知道生日 |
| TC-M5-007 | P0 | MANUAL | 对话摘要 | 连续对话 20+ 句 | `boyfriends.memory_summary` 非空 |
| TC-M5-008 | P1 | MANUAL | 摘要上限 | 对话 40+ 句 | `memory_summaries` 最多保留 3 段 |
| TC-M5-009 | P1 | MANUAL | 提取降级 | mock extractor 失败 | 主对话正常，无报错弹窗 |
| TC-M5-010 | P1 | MANUAL | 离开补提取 | 说爱好后立即关 tab | sendBeacon 后 DB 仍有 fact（允许短延迟） |
| TC-M5-011 | P1 | MANUAL | recent_event 更新 | 先说「在加班」后说「项目上线了」 | `recent_event` 更新为最新 |

---

## 9. M6 · 联调与优化

**目标**：图像生成 + R2、异步媒体、性能、降级、PRD 全量验收。

### 9.1 阶段门禁

- [ ] PRD §12.1 功能验收 **全部勾选**
- [ ] 200 句对话无明显卡顿
- [ ] 断网 / API 失败降级可用

### 9.2 测试案例

| ID | 级别 | 类型 | 场景 | 步骤 | 预期结果 |
|----|------|------|------|------|---------|
| TC-M6-001 | P0 | AUTO | TypeScript | `pnpm tsc --noEmit` | exit 0 |
| TC-M6-002 | P0 | API | 图像生成 | POST `/api/image` `{ prompt, type: "scene" }` | 200，`url` 为 R2 公开链，`fileKey` 非空 |
| TC-M6-003 | P0 | MANUAL | R2 可访问 | 浏览器打开返回的 `url` | 图片正常显示 |
| TC-M6-004 | P0 | MANUAL | 场景图触发 | 说「我上周去了故宫」 | 文字先出，后插入场景图消息 |
| TC-M6-005 | P0 | MANUAL | 异步解耦 | 触发图片生成 | 文字流式不被阻塞；先 placeholder 后替换 |
| TC-M6-006 | P0 | MANUAL | 语音异步 | 触发 TTS | 同上，media-pending → ready |
| TC-M6-007 | P1 | MANUAL | 性能 200 句 | 连续对话 200 句 | 滚动流畅，无明显掉帧 |
| TC-M6-008 | P1 | MANUAL | 虚拟滚动 | 消息 >100 条时滚动 | 仅渲染可视区域，DOM 节点可控 |
| TC-M6-009 | P0 | MANUAL | LLM 超时 | 模拟超时 | 重试 1 次后友好提示 |
| TC-M6-010 | P0 | MANUAL | 图像失败降级 | 错 IMAGE_API_KEY | 男友用文字描述，不 crash |
| TC-M6-011 | P0 | MANUAL | 全链路 | 新用户注册 → 创建 → 聊天 30 分钟 | 覆盖 PRD §12.3 四条自测 |
| TC-M6-012 | P0 | MANUAL | PRD 12.1 | 逐项勾选 §12.1 清单 | 全部通过 |

### 9.3 PRD §12.1 映射（M6 终验）

| PRD 验收项 | 对应用例 |
|-----------|---------|
| 注册 / 登录 / 退出 | TC-M0-004~010 |
| 未登录跳转 | TC-M0-008 |
| 三种性格差异 | TC-M2-002~004 |
| 画像写入 / 回忆 | TC-M5-002~006 |
| memorySummary | TC-M5-007 |
| 跨设备数据 | TC-M1-008 |
| 文字 / 语音 / 图片 / 表情包 | TC-M1-004、TC-M3-006、TC-M6-004、TC-M4-002 |
| emoji 识别 | TC-M4-005~006 |
| 暧昧值 / 惊喜 | TC-M3-002~008 |
| 微信 UI / 流式 | TC-M1-004~005、TC-M1-012 |
| 暧昧值 100 | TC-M3-008 |
| 主动话题 | TC-M2-007~009 |
| 场景图 | TC-M6-004 |
| 媒介倾向差异 | TC-M2-002~004 + M6 场景 / TTS 频率观察 |
| API 403 | TC-M0-011 |

---

## 10. 附录

### 10.1 每阶段必跑命令

```bash
# 静态检查（每阶段 P0）
pnpm tsc --noEmit

# 数据库同步（M0 及 schema 变更后）
pnpm drizzle-kit push

# 开发服务（手动测试前）
pnpm run dev
```

### 10.2 API 冒烟示例（M1 起）

```bash
# 登录获取 session（示例，按 Auth.js 实际 CSRF 流程调整）
curl -c cookies.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# SSE 对话（需有效 boyfriendId + cookie）
curl -b cookies.txt -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"boyfriendId":"<UUID>","userMessage":"你好"}'
```

### 10.3 R2 单独验证（当前可测）

| ID | 级别 | 类型 | 步骤 | 预期 |
|----|------|------|------|------|
| TC-R2-001 | P0 | AUTO | 写临时脚本调用 `uploadToR2(Buffer.from("test"), "test/hello.txt", "text/plain")` | 返回 `url` 可浏览器访问 |

> `src/lib/storage/r2.ts` 已存在，M0 前可用 ts-node / 临时 route 验证 R2 配置。

### 10.4 阶段测试记录表

| 阶段 | 计划完成日 | 实际完成日 | 执行人 | P0 通过 | P1 通过 | 遗留问题 | 可进入下一阶段 |
|------|-----------|-----------|--------|---------|---------|---------|-------------|
| M0 | | | | /12 | /1 | | ☐ |
| M1 | | | | /13 | /2 | | ☐ |
| M2 | | | | /9 | /3 | | ☐ |
| M3 | | | | /8 | /3 | | ☐ |
| M4 | | | | /6 | /2 | | ☐ |
| M5 | | | | /6 | /5 | | ☐ |
| M6 | | | | /12 | /2 | | ☐ |

### 10.5 建议排期（参考）

| 阶段 | 预估工时 | 依赖 |
|------|---------|------|
| M0 | 1–2 天 | 无 |
| M1 | 2–3 天 | M0 |
| M2 | 2 天 | M1 |
| M3 | 2 天 | M1 |
| M4 | 1–2 天 | M2 |
| M5 | 2 天 | M2 |
| M6 | 2–3 天 | M3–M5 |

M3 与 M4/M5 部分可并行，但 **M6 必须等 M3–M5 完成**。

---

## 文档版本

| 版本 | 日期 | 改动 |
|------|------|------|
| v1.0 | 2026-08-22 | 初始版本：M0–M6 开发计划 + 分阶段测试案例 + 阶段门禁 |
