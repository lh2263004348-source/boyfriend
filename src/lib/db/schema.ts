import {
  boolean,
  date,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/** 账号表：密码只存 passwordHash，不存明文 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

/** 登录会话表：退出登录或过期后，对应 JWT 也会失效 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_sessions_token").on(table.sessionToken),
    index("idx_sessions_user_id").on(table.userId),
  ]
);

export const boyfriends = pgTable(
  "boyfriends",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    relationshipMode: varchar("relationship_mode", { length: 20 }).notNull(),
    nickname: varchar("nickname", { length: 50 }).notNull(),
    userNickname: varchar("user_nickname", { length: 50 }).notNull(),
    avatarUrl: text("avatar_url").notNull(),
    intimacy: smallint("intimacy").notNull().default(0),
    lastSurpriseAt: timestamp("last_surprise_at", { withTimezone: true }),
    surpriseCountToday: smallint("surprise_count_today").notNull().default(0),
    lastSurpriseDate: date("last_surprise_date"),
    memorySummary: text("memory_summary").notNull().default(""),
    unreadCount: smallint("unread_count").notNull().default(0),
    lastMessagePreview: varchar("last_message_preview", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_boyfriends_user_id").on(table.userId),
    index("idx_boyfriends_user_active").on(table.userId, table.lastActiveAt),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boyfriendId: uuid("boyfriend_id")
      .notNull()
      .references(() => boyfriends.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(),
    content: text("content").notNull(),
    mediaKey: text("media_key"),
    emotion: varchar("emotion", { length: 20 }),
    isSurprise: boolean("is_surprise").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_messages_boyfriend_created").on(table.boyfriendId, table.createdAt),
  ]
);

export const memorySummaries = pgTable(
  "memory_summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boyfriendId: uuid("boyfriend_id")
      .notNull()
      .references(() => boyfriends.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    messageCount: smallint("message_count").notNull().default(10),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_memory_summaries_boyfriend").on(table.boyfriendId, table.createdAt),
  ]
);

export const userProfileFacts = pgTable(
  "user_profile_facts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boyfriendId: uuid("boyfriend_id")
      .notNull()
      .references(() => boyfriends.id, { onDelete: "cascade" }),
    factKey: varchar("fact_key", { length: 100 }).notNull(),
    factValue: text("fact_value").notNull(),
    sourceMessageId: uuid("source_message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("user_profile_facts_boyfriend_id_fact_key_unique").on(
      table.boyfriendId,
      table.factKey
    ),
    index("idx_profile_facts_boyfriend").on(table.boyfriendId),
  ]
);

export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;
export type DbSession = typeof sessions.$inferSelect;
export type NewDbSession = typeof sessions.$inferInsert;
export type DbBoyfriend = typeof boyfriends.$inferSelect;
export type NewDbBoyfriend = typeof boyfriends.$inferInsert;
export type DbMessage = typeof messages.$inferSelect;
export type NewDbMessage = typeof messages.$inferInsert;
export type DbMemorySummary = typeof memorySummaries.$inferSelect;
export type NewDbMemorySummary = typeof memorySummaries.$inferInsert;
export type DbUserProfileFact = typeof userProfileFacts.$inferSelect;
export type NewDbUserProfileFact = typeof userProfileFacts.$inferInsert;
