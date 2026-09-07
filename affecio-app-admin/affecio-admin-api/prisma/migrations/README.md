# This project shares the main Affecio Postgres database.
# Do NOT run `prisma migrate reset` — it would wipe production/shared data.
#
# Workflow for this repo:
# 1. `npx prisma db pull`   — sync shared models from the live DB
# 2. Add admin-only models to schema.prisma (AdminUser, AuditLog, etc.)
# 3. `npx prisma db push`   — apply admin table changes safely (no reset)
# 4. `npx prisma generate`  — regenerate the client
#
# Migration files from the main app live in the main API repo, not here.
