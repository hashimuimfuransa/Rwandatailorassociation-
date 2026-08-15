-- Replace the ineffective compound unique on system_settings with a real one.
--
-- The previous constraint was UNIQUE(scope, associationId, key). Postgres
-- treats NULLs as distinct in a unique index, so PLATFORM-scoped rows — which
-- all carry associationId = NULL — were never actually constrained: two rows
-- with the same key could both be inserted, and the application would read
-- whichever one the planner returned first. Collapsing the NULL into a literal
-- makes the constraint enforceable.

-- DropIndex
DROP INDEX IF EXISTS "system_settings_scope_associationId_key_key";

-- AlterTable: add nullable first, backfill, then enforce NOT NULL, so this
-- migration is safe against a table that already holds rows.
ALTER TABLE "system_settings" ADD COLUMN "scopeKey" TEXT;

UPDATE "system_settings"
SET "scopeKey" = CASE
  WHEN "associationId" IS NULL THEN 'PLATFORM::' || "key"
  ELSE 'ASSOCIATION:' || "associationId" || ':' || "key"
END
WHERE "scopeKey" IS NULL;

ALTER TABLE "system_settings" ALTER COLUMN "scopeKey" SET NOT NULL;

-- CreateIndex
-- Fails loudly if duplicates already exist. That is intended: pre-existing
-- duplicate settings are corruption that must be resolved by hand, not
-- silently collapsed by the migration.
CREATE UNIQUE INDEX "system_settings_scopeKey_key" ON "system_settings"("scopeKey");

-- CreateIndex
CREATE INDEX "system_settings_scope_associationId_key_idx" ON "system_settings"("scope", "associationId", "key");
