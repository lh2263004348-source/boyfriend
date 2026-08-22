/**
 * 一次性迁移脚本：在 Neon 创建 M0 所需的 6 张表
 * 用法: pnpm exec tsx scripts/migrate.ts
 */
import { neon, Pool } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const sql = neon(process.env.DATABASE_URL!);

const DROP_SQL = `
DROP TABLE IF EXISTS user_profile_facts CASCADE;
DROP TABLE IF EXISTS memory_summaries CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS boyfriends CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
`;

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS boyfriends (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_mode    VARCHAR(20) NOT NULL,
  nickname             VARCHAR(50) NOT NULL,
  user_nickname        VARCHAR(50) NOT NULL,
  avatar_url           TEXT NOT NULL,
  intimacy             SMALLINT NOT NULL DEFAULT 0,
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

CREATE INDEX IF NOT EXISTS idx_boyfriends_user_id ON boyfriends(user_id);
CREATE INDEX IF NOT EXISTS idx_boyfriends_user_active ON boyfriends(user_id, last_active_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boyfriend_id  UUID NOT NULL REFERENCES boyfriends(id) ON DELETE CASCADE,
  role          VARCHAR(20) NOT NULL,
  type          VARCHAR(20) NOT NULL,
  content       TEXT NOT NULL,
  media_key     TEXT,
  emotion       VARCHAR(20),
  is_surprise   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_boyfriend_created
  ON messages(boyfriend_id, created_at DESC);

CREATE TABLE IF NOT EXISTS memory_summaries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boyfriend_id   UUID NOT NULL REFERENCES boyfriends(id) ON DELETE CASCADE,
  summary        TEXT NOT NULL,
  message_count  SMALLINT NOT NULL DEFAULT 10,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_summaries_boyfriend
  ON memory_summaries(boyfriend_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_profile_facts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boyfriend_id       UUID NOT NULL REFERENCES boyfriends(id) ON DELETE CASCADE,
  fact_key           VARCHAR(100) NOT NULL,
  fact_value         TEXT NOT NULL,
  source_message_id  UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (boyfriend_id, fact_key)
);

CREATE INDEX IF NOT EXISTS idx_profile_facts_boyfriend
  ON user_profile_facts(boyfriend_id);
`;

async function main(): Promise<void> {
  const forceReset = process.env.FORCE_RESET === "1";

  if (forceReset) {
    console.log("FORCE_RESET=1: dropping legacy/conflicting tables...");
    for (const statement of DROP_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
      await pool.query(statement);
    }
  }

  console.log("Running migration...");
  const statements = MIGRATION_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log("Migration complete.");

  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('users','sessions','boyfriends','messages','memory_summaries','user_profile_facts')
    ORDER BY table_name
  `;
  console.log(
    "Tables present:",
    (tables as { table_name: string }[])
      .map((t) => t.table_name)
      .join(", ")
  );

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
