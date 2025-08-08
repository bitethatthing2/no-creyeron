#!/bin/bash

# Execute the SQL fix on the remote database
cat fix_notifications.sql | npx supabase db remote --linked