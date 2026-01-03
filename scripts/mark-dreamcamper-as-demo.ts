import dotenv from 'dotenv';
import { resolve } from 'path';
import { createServerClient } from '../lib/supabase-server';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

async function markDreamcamperAsDemo() {
  try {
    const supabase = createServerClient();
    
    // Update dreamcamper page to mark it as demo
    const { data, error } = await supabase
      .from('lynqit_pages')
      .update({ is_demo: true })
      .eq('slug', 'dreamcamper')
      .select();
    
    if (error) {
      // If column doesn't exist, inform user
      if (error.message?.includes('is_demo') || error.code === '42703') {
        console.error('Error: is_demo column does not exist. Please run the migration first:');
        console.error('supabase/migrations/005_add_is_demo.sql');
        process.exit(1);
      }
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Successfully marked dreamcamper page as demo');
      console.log(`Updated ${data.length} page(s)`);
    } else {
      console.log('⚠️  No page found with slug "dreamcamper"');
    }
  } catch (error: any) {
    console.error('Error marking dreamcamper as demo:', error.message);
    process.exit(1);
  }
}

markDreamcamperAsDemo();

