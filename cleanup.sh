#!/bin/bash

echo "🧹 Starting safe cleanup of unnecessary files..."
echo "This will delete ~75 files that are no longer needed."
echo ""

# Count files to be deleted
count=0

# Documentation files (outdated/redundant)
docs_to_delete=(
    "BACKEND_FRONTEND_ALIGNMENT_COMPLETE.md"
    "FIXES_SUMMARY.md"
    "FRONTEND_ROLE_SYSTEM_AUDIT_COMPLETE.md"
    "FRONTEND_ULTRA_SIMPLIFIED_COMPLETE.md"
    "ULTRA_SIMPLIFIED_ROLES_COMPLETE.md"
    "docs/409_CONFLICT_HANDLING.md"
    "docs/ANONYMOUS_VIEWING_IMPLEMENTATION.md"
    "docs/CODEBASE_ANALYSIS.md"
    "docs/DATABASE_SCHEMA_SYNC.md"
    "docs/MENU_MODIFIERS_ANALYSIS_COMPLETE.md"
    "docs/SUPABASE_SYNC_GUIDE.md"
    "debug/ChatDebugPlan.md"
    "tests/ChatAuditPlan.md"
    "CLEANUP_PLAN.md"
    "DO_NOT_BREAK_LIST.md"
    "SERVICE_MAPPING.md"
    "TECHNICAL_DEBT.md"
)

# SQL files (applied/orphaned)
sql_to_delete=(
    "apply-comments-fix.sql"
    "backup_before_cleanup.sql"
    "fix-feed-function.sql"
    "fix-foreign-key.sql"
    "fix-messaging-foreign-keys.sql"
    "fix-messaging-rls.sql"
    "fix-queso-taco-image.sql"
    "fix-wolfpack-status.sql"
    "fix-wolfpack-video-deletion.sql"
    "fix_duplicate_rls_policies.sql"
    "fix_notifications.sql"
    "fix_remote_notifications.sql"
    "temp-user-auth-fix.sql"
    "remote_schema_diff.sql"
    "schema_diff.sql"
    "all_remote_tables.sql"
    "complete_remote_schema.sql"
    "create-user-preferences-table.sql"
    "create-user-uploads-bucket.sql"
    "ultra-simplify-roles-backend.sql"
    "check-feature-flag-roles.sql"
    "debug/add-to-salem-pack.sql"
    "scripts/apply-feed-optimizations.sql"
    "scripts/complement-existing-optimizations.sql"
    "scripts/create-video-bucket.sql"
    "scripts/setup-firebase-notifications.sql"
    "scripts/test-notifications.sql"
)

# Script files (debug/migration tools)
scripts_to_delete=(
    "scripts/apply-dj-schema.js"
    "scripts/fix-auth-mapping.js"
    "scripts/fix-createclient-refs.js"
    "scripts/fix-server-imports.js"
    "scripts/fix-supabase-imports.js"
    "scripts/fix-syntax-errors.js"
    "scripts/fix-wolfpack-feed.js"
    "scripts/migrate-wolfpack-imports.js"
    "scripts/update-type-imports.js"
    "scripts/monitor-feed-performance.js"
    "scripts/test-feed-performance.js"
    "scripts/test-notification-system.js"
    "scripts/check-database-sync.js"
)

# Debug files
debug_to_delete=(
    "debug/api-key-debug.js"
    "debug/auth-debug.js"
    "debug/chat-flow-debug.js"
    "debug/emergencyDebug.js"
    "debug/fix-auth-cache.js"
    "debug/master-debug.js"
    "debug/network-debug.js"
    "debug/resource-404-debug.js"
    "debug/rpc-audit.js"
    "debug/README.md"
)

# Backup/temporary files
temp_to_delete=(
    "app/layout.tsx.backup"
    "build.log"
    "public/index.html.backup"
    "server.log"
    "supabase/.temp"
    "food_drink_categories"
    "tasks/todo.md"
    "temp_types.ts"
    "types/database.types.ts.corrupted"
    "cleanup_food_ordering.sh"
    "execute_fix.sh"
    "supabase.deb"
)

# Function to safely delete file
delete_file() {
    local file="$1"
    if [ -f "$file" ] || [ -d "$file" ]; then
        echo "🗑️  Deleting: $file"
        rm -rf "$file"
        ((count++))
    else
        echo "⚠️  Not found: $file"
    fi
}

echo "📄 Deleting documentation files..."
for file in "${docs_to_delete[@]}"; do
    delete_file "$file"
done

echo ""
echo "🗄️  Deleting SQL files..."
for file in "${sql_to_delete[@]}"; do
    delete_file "$file"
done

echo ""
echo "⚙️  Deleting script files..."
for file in "${scripts_to_delete[@]}"; do
    delete_file "$file"
done

echo ""
echo "🐛 Deleting debug files..."
for file in "${debug_to_delete[@]}"; do
    delete_file "$file"
done

echo ""
echo "🗂️  Deleting backup/temporary files..."
for file in "${temp_to_delete[@]}"; do
    delete_file "$file"
done

echo ""
echo "✅ Cleanup complete!"
echo "🗑️  Deleted $count files"
echo ""
echo "📋 Kept important files:"
echo "   ✓ CLAUDE.md (project instructions)"
echo "   ✓ README.md (main documentation)" 
echo "   ✓ DATABASE_TYPES_GUIDE.md (current type system)"
echo "   ✓ NEW_DATABASE_STRUCTURE.md (current structure)"
echo "   ✓ All supabase/migrations/ (database history)"
echo "   ✓ All source code and configuration files"
echo ""
echo "🎉 Your project is now much cleaner!"