import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
config({ path: envPath, override: true });

import { createServerClient } from '../lib/supabase-server';
import { getUserByEmail } from '../lib/users';
import { getPages } from '../lib/lynqit-pages';

async function linkAllPagesToUser() {
  try {
    const supabase = createServerClient();
    const targetEmail = 'rubenfonteijne@gmail.com';

    console.log(`Linking all pages to user: ${targetEmail}`);

    // Get the target user
    const targetUser = await getUserByEmail(targetEmail);
    if (!targetUser) {
      console.error(`User not found: ${targetEmail}`);
      process.exit(1);
    }

    console.log(`Found user: ${targetUser.email} (ID: ${targetUser.id})`);

    // Get all pages
    const allPages = await getPages();
    console.log(`Found ${allPages.length} pages`);

    if (allPages.length === 0) {
      console.log('No pages to update');
      return;
    }

    // Update all pages to link to this user
    let updated = 0;
    let errors = 0;

    for (const page of allPages) {
      try {
        const { error } = await supabase
          .from('lynqit_pages')
          .update({ user_id: targetUser.id })
          .eq('id', page.id);

        if (error) {
          console.error(`Error updating page ${page.id} (${page.slug}):`, error);
          errors++;
        } else {
          console.log(`✓ Linked page "${page.slug}" to ${targetEmail}`);
          updated++;
        }
      } catch (error) {
        console.error(`Error updating page ${page.id}:`, error);
        errors++;
      }
    }

    console.log(`\nCompleted:`);
    console.log(`  - Updated: ${updated}`);
    console.log(`  - Errors: ${errors}`);
    console.log(`  - Total: ${allPages.length}`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

linkAllPagesToUser();

