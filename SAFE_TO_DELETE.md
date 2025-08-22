# Safe to Delete Files

## 🗑️ Documentation Files (Outdated/Redundant)
These documentation files are outdated or redundant and can be deleted:

```bash
# Status/completion docs (outdated)
./BACKEND_FRONTEND_ALIGNMENT_COMPLETE.md
./FIXES_SUMMARY.md
./FRONTEND_ROLE_SYSTEM_AUDIT_COMPLETE.md
./FRONTEND_ULTRA_SIMPLIFIED_COMPLETE.md
./ULTRA_SIMPLIFIED_ROLES_COMPLETE.md

# Analysis docs (completed, no longer needed)
./docs/409_CONFLICT_HANDLING.md
./docs/ANONYMOUS_VIEWING_IMPLEMENTATION.md
./docs/CODEBASE_ANALYSIS.md
./docs/DATABASE_SCHEMA_SYNC.md
./docs/MENU_MODIFIERS_ANALYSIS_COMPLETE.md
./docs/SUPABASE_SYNC_GUIDE.md

# Debug plans (completed)
./debug/ChatDebugPlan.md
./tests/ChatAuditPlan.md

# Redundant status files
./CLEANUP_PLAN.md
./DO_NOT_BREAK_LIST.md
./SERVICE_MAPPING.md
./TECHNICAL_DEBT.md
```

## 🗑️ SQL Files (Orphaned/Applied)
These SQL files are either applied or orphaned:

```bash
# Applied fixes (no longer needed)
./apply-comments-fix.sql
./backup_before_cleanup.sql
./fix-feed-function.sql
./fix-foreign-key.sql
./fix-messaging-foreign-keys.sql
./fix-messaging-rls.sql
./fix-queso-taco-image.sql
./fix-wolfpack-status.sql
./fix-wolfpack-video-deletion.sql
./fix_duplicate_rls_policies.sql
./fix_notifications.sql
./fix_remote_notifications.sql
./temp-user-auth-fix.sql

# Schema diffs (completed)
./remote_schema_diff.sql
./schema_diff.sql
./all_remote_tables.sql
./complete_remote_schema.sql

# Old setup files
./create-user-preferences-table.sql
./create-user-uploads-bucket.sql
./ultra-simplify-roles-backend.sql
./check-feature-flag-roles.sql

# Debug SQL
./debug/add-to-salem-pack.sql
```

## 🗑️ Script Files (Debug/Migration Tools)
These scripts were used for migrations and debugging:

```bash
# Migration scripts (completed)
./scripts/apply-dj-schema.js
./scripts/fix-auth-mapping.js
./scripts/fix-createclient-refs.js
./scripts/fix-server-imports.js
./scripts/fix-supabase-imports.js
./scripts/fix-syntax-errors.js
./scripts/fix-wolfpack-feed.js
./scripts/migrate-wolfpack-imports.js
./scripts/update-type-imports.js

# Debug/monitoring scripts
./scripts/monitor-feed-performance.js
./scripts/test-feed-performance.js
./scripts/test-notification-system.js
./scripts/check-database-sync.js

# Old SQL scripts
./scripts/apply-feed-optimizations.sql
./scripts/complement-existing-optimizations.sql
./scripts/create-video-bucket.sql
./scripts/setup-firebase-notifications.sql
./scripts/test-notifications.sql
```

## 🗑️ Debug Files
All debug JavaScript files (development tools):

```bash
./debug/api-key-debug.js
./debug/auth-debug.js
./debug/chat-flow-debug.js
./debug/emergencyDebug.js
./debug/fix-auth-cache.js
./debug/master-debug.js
./debug/network-debug.js
./debug/resource-404-debug.js
./debug/rpc-audit.js
./debug/README.md
```

## 🗑️ Backup/Temporary Files
```bash
./app/layout.tsx.backup
./build.log
./public/index.html.backup
./server.log
./supabase/.temp
./food_drink_categories (appears to be orphaned)
./tasks/todo.md
./temp_types.ts
./types/database.types.ts.corrupted
```

## 🗑️ Execution Files
```bash
./cleanup_food_ordering.sh
./execute_fix.sh
./supabase.deb
```

## ⚠️ DO NOT DELETE
Keep these important files:

```bash
# Essential docs
./CLAUDE.md (project instructions)
./README.md (main documentation)
./DATABASE_TYPES_GUIDE.md (current type system)
./NEW_DATABASE_STRUCTURE.md (current structure)
./MESSAGING_SYSTEM_CRITICAL_NOTES.md (working system notes)
./PROJECT_STATUS.md (current status)
./MENU_VIDEO_MAPPING.md (feature documentation)
./WATCH_IT_MADE_CORE_FEATURE.md (feature documentation)
./CRITICAL_DO_NOT_TOUCH.md (protection notes)

# Essential scripts
./scripts/setup-supabase.js (might be needed)
./scripts/validate-env.js (useful)
./scripts/check-env.js (useful)
./scripts/populate-service-worker.js (needed for PWA)

# All supabase/migrations/ files (database history)
# All current source code files
# All configuration files (package.json, tsconfig.json, etc.)
```

## Total Files to Delete: ~75 files
This will clean up approximately 75 files without affecting functionality.