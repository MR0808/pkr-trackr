-- Add database-level DEFAULT for every table's "id" column so that Prisma Studio
-- and raw INSERTs get an ID when the column is omitted. Prisma's @default(uuid())
-- and @default(cuid()) only apply when using the Prisma Client.
-- verification_tokens has a composite PK (no id column) so it is skipped.

ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "verifications" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "email_verification_challenges" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "email_change_records" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "phone_change_records" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "continents" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "countries" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "regions" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "groups" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "group_members" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "players" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "seasons" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "games" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "game_players" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "season_player_stats" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "group_invites" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;
