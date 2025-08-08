#!/usr/bin/env node

/**
 * Script to apply DJ dashboard schema to Supabase database
 * This can be run manually when database access is available
 */

const fs = require('fs');
const path = require('path');

// Path to the DJ schema migration
const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20250703_complete_dj_dashboard_schema.sql');

async function applyDJSchema() {
  try {
    console.log('🎵 DJ Dashboard Schema Application Script');
    console.log('=====================================');
    
    // Check if migration file exists
    if (!fs.existsSync(MIGRATION_FILE)) {
      console.error('❌ Migration file not found:', MIGRATION_FILE);
      process.exit(1);
    }
    
    console.log('✅ Migration file found');
    console.log('📄 File:', MIGRATION_FILE);
    
    // Read the migration content
    const migrationContent = fs.readFileSync(MIGRATION_FILE, 'utf8');
    const tableCount = (migrationContent.match(/CREATE TABLE/g) || []).length;
    const functionCount = (migrationContent.match(/CREATE.*FUNCTION/g) || []).length;
    const policyCount = (migrationContent.match(/CREATE POLICY/g) || []).length;
    
    console.log('📊 Migration Summary:');
    console.log(`   • ${tableCount} tables to create`);
    console.log(`   • ${functionCount} functions to create`);
    console.log(`   • ${policyCount} RLS policies to create`);
    
    console.log('\n🚀 To apply this schema:');
    console.log('1. Ensure you have Supabase CLI access to your project');
    console.log('2. Run: npx supabase db push');
    console.log('3. Or manually execute the SQL in your Supabase dashboard');
    
    console.log('\n📋 Key DJ Tables that will be created:');
    console.log('   • dj_dashboard_state - DJ control center');
    console.log('   • dj_broadcasts - Messages to the pack');
    console.log('   • dj_broadcast_responses - User responses');
    console.log('   • dj_events - Interactive events');
    console.log('   • dj_event_participants - Event participants');
    console.log('   • dj_broadcast_templates - Reusable templates');
    console.log('   • dj_event_templates - Pre-built events');
    console.log('   • dj_analytics - Performance metrics');
    
    console.log('\n🔧 Key Functions:');
    console.log('   • get_dj_dashboard_analytics() - Real-time metrics');
    console.log('   • dj_broadcast_message() - Send messages');
    console.log('   • create_dj_event() - Create events');
    console.log('   • record_broadcast_response() - Track responses');
    
    console.log('\n✨ Schema is ready to apply!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  applyDJSchema();
}

module.exports = { applyDJSchema };