/** 关系模式 */
export type RelationshipMode = "dominant" | "puppy" | "warm";

/** 消息角色 */
export type MessageRole = "user" | "boyfriend";

/** 消息类型 */
export type MessageType = "text" | "image" | "voice" | "emoji" | "sticker";

/** 预置 fact_key 枚举（LLM 优先使用） */
export type ProfileFactKey =
  | "birthday"
  | "hobbies"
  | "favorite_food"
  | "recent_event"
  | "anniversary"
  | "dislikes"
  | `custom_${string}`;

/** 用户（认证账号） */
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

/** 男友 */
export interface Boyfriend {
  id: string;
  userId: string;
  relationshipMode: RelationshipMode;
  nickname: string;
  userNickname: string;
  avatarUrl: string;
  intimacy: number;
  lastSurpriseAt: Date | null;
  surpriseCountToday: number;
  lastSurpriseDate: string | null;
  memorySummary: string;
  unreadCount: number;
  lastMessagePreview: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

/** 消息 */
export interface Message {
  id: string;
  boyfriendId: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  mediaKey: string | null;
  emotion: string | null;
  isSurprise: boolean;
  createdAt: Date;
}

/** 记忆摘要（历史分段） */
export interface MemorySummary {
  id: string;
  boyfriendId: string;
  summary: string;
  messageCount: number;
  createdAt: Date;
}

/** 用户画像事实（键值对，按男友隔离） */
export interface UserProfileFact {
  id: string;
  boyfriendId: string;
  factKey: string;
  factValue: string;
  sourceMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** API 错误响应 */
export interface ApiError {
  error: string;
  code?: string;
}

/** LLM 媒介决策（M2+） */
export interface LLMDecision {
  emotion: "happy" | "sad" | "neutral" | "angry" | "shy" | "heart";
  preferredMedia: "text" | "voice" | "image";
  shouldGenerateImage: boolean;
  imageType: "scene" | "selfie" | "gift" | "share";
  imagePrompt: string;
  surpriseTriggered: boolean;
  surpriseType: "song" | "gift" | "none";
}

/** Session 用户（Auth.js 扩展） */
export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
}
