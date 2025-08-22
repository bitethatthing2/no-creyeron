/**
 * Fix auth_id mapping for existing users
 * This script updates users table to link existing users with their Supabase Auth accounts
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAuthMapping() {
  try {
    console.log('🔍 Finding users with missing auth_id...');
    
    // Get all users with missing auth_id
    const { data: usersWithoutAuth, error: usersError } = await supabase
      .from('users')
      .select('id, email, auth_id')
      .is('auth_id', null);

    if (usersError) {
      throw usersError;
    }

    console.log(`📊 Found ${usersWithoutAuth.length} users without auth_id`);

    if (usersWithoutAuth.length === 0) {
      console.log('✅ All users already have auth_id mapping');
      return;
    }

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw authError;
    }

    console.log(`📊 Found ${authUsers.users.length} auth users`);

    let fixedCount = 0;
    let notFoundCount = 0;

    // Match users by email
    for (const user of usersWithoutAuth) {
      const authUser = authUsers.users.find(au => au.email === user.email);
      
      if (authUser) {
        console.log(`🔗 Linking ${user.email} -> ${authUser.id}`);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_id: authUser.id })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Failed to update ${user.email}:`, updateError);
        } else {
          fixedCount++;
          console.log(`✅ Updated ${user.email}`);
        }
      } else {
        notFoundCount++;
        console.log(`⚠️  No auth user found for ${user.email}`);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Fixed: ${fixedCount} users`);
    console.log(`   Not found: ${notFoundCount} users`);
    console.log(`   Total processed: ${usersWithoutAuth.length} users`);

    if (notFoundCount > 0) {
      console.log(`\n💡 Note: Users without auth accounts need to sign up through the app`);
    }

  } catch (error) {
    console.error('❌ Error fixing auth mapping:', error);
    process.exit(1);
  }
}

// For users that don't have auth accounts, create them
async function createMissingAuthAccounts() {
  try {
    console.log('\n🔍 Creating missing auth accounts...');
    
    // Get users still without auth_id after the mapping fix
    const { data: usersWithoutAuth, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .is('auth_id', null)
      .limit(10); // Process in batches

    if (error) throw error;

    if (usersWithoutAuth.length === 0) {
      console.log('✅ All users have auth accounts');
      return;
    }

    console.log(`📊 Creating auth accounts for ${usersWithoutAuth.length} users`);

    for (const user of usersWithoutAuth) {
      try {
        // Create auth user with temporary password
        const tempPassword = 'TempPass123!'; // They'll need to reset this
        
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm emails
          user_metadata: {
            first_name: user.first_name,
            last_name: user.last_name
          }
        });

        if (createError) {
          console.error(`❌ Failed to create auth for ${user.email}:`, createError);
          continue;
        }

        // Update the user record with the new auth_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_id: authUser.user.id })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Failed to link ${user.email}:`, updateError);
        } else {
          console.log(`✅ Created and linked ${user.email}`);
        }

      } catch (error) {
        console.error(`❌ Error processing ${user.email}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ Error creating auth accounts:', error);
  }
}

async function main() {
  console.log('🚀 Starting auth mapping fix...\n');
  
  // First try to map existing auth users
  await fixAuthMapping();
  
  // Then create missing auth accounts if needed
  await createMissingAuthAccounts();
  
  console.log('\n🎉 Auth mapping fix complete!');
}

if (require.main === module) {
  main();
}

module.exports = { fixAuthMapping, createMissingAuthAccounts };