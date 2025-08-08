const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read the SQL fix
const sql = fs.readFileSync('./fix_remote_notifications.sql', 'utf8');

// Create Supabase client with service role key
const supabaseUrl = 'https://tvnpgbjypnezoasbhbwx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeRemoteFix() {
  try {
    console.log('Executing SQL fix on remote database...');
    
    // Execute the SQL fix
    const { data, error } = await supabase.rpc('query', {
      query: sql
    });
    
    if (error) {
      console.error('Error executing SQL fix:', error);
      return;
    }
    
    console.log('SQL fix executed successfully!');
    console.log('Result:', data);
    
    // Test the fixed function
    console.log('\nTesting fetch_notifications function...');
    const { data: testData, error: testError } = await supabase.rpc('fetch_notifications', {
      p_limit: 5,
      p_offset: 0
    });
    
    if (testError) {
      console.error('Error testing fetch_notifications:', testError);
    } else {
      console.log('fetch_notifications test successful!');
      console.log('Notifications:', testData);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

executeRemoteFix();