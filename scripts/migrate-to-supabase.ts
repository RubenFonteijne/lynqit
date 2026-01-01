import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
config({ path: envPath, override: true });

// Debug: Check if env vars are loaded
console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

import { createServerClient } from '../lib/supabase-server';
import { getUserByEmail, createUser } from '../lib/users';
import { getPageBySlug, createPage, updatePage } from '../lib/lynqit-pages';
import { trackPageView, trackClick } from '../lib/analytics';
import { saveSettings } from '../lib/settings';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PAGES_FILE = path.join(DATA_DIR, 'lynqit-pages.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const CLICKS_FILE = path.join(DATA_DIR, 'clicks.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

interface OldUser {
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  mollieCustomerId?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  vatNumber?: string;
  phoneNumber?: string;
  createdAt: string;
}

interface OldPage {
  id: string;
  userId: string;
  slug: string;
  [key: string]: any;
}

interface OldPageView {
  id: string;
  pageId: string;
  timestamp: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
}

interface OldClick {
  id: string;
  pageId: string;
  timestamp: string;
  clickType: string;
  targetUrl?: string;
  userAgent?: string;
  ip?: string;
}

interface OldSettings {
  mollieApiKey?: string;
  mollieApiKeyTest?: string;
  mollieApiKeyLive?: string;
  useTestMode?: boolean;
  updatedAt?: string;
}

async function migrateUsers() {
  console.log('Migrating users...');
  
  if (!fs.existsSync(USERS_FILE)) {
    console.log('No users.json file found, skipping user migration');
    return;
  }

  const supabase = createServerClient();
  const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) as OldUser[];
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const oldUser of usersData) {
    try {
      // Check if user already exists
      const existingUser = await getUserByEmail(oldUser.email);
      if (existingUser) {
        console.log(`User ${oldUser.email} already exists, skipping...`);
        skipped++;
        continue;
      }

      // Create user in Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: oldUser.email.toLowerCase(),
        password: 'TEMP_PASSWORD_CHANGE_ME', // User will need to reset password
        email_confirm: true,
      });

      if (authError) {
        console.error(`Error creating auth user for ${oldUser.email}:`, authError);
        errors++;
        continue;
      }

      // Create user in database
      const newUser = await createUser(oldUser.email, 'TEMP_PASSWORD_CHANGE_ME', oldUser.role);
      
      // Update user with additional fields
      await supabase
        .from('users')
        .update({
          mollie_customer_id: oldUser.mollieCustomerId,
          company_name: oldUser.companyName,
          first_name: oldUser.firstName,
          last_name: oldUser.lastName,
          vat_number: oldUser.vatNumber,
          phone_number: oldUser.phoneNumber,
          created_at: oldUser.createdAt,
        })
        .eq('id', newUser.id);

      console.log(`Migrated user: ${oldUser.email}`);
      migrated++;
    } catch (error) {
      console.error(`Error migrating user ${oldUser.email}:`, error);
      errors++;
    }
  }

  console.log(`Users migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
}

// Page ID mapping: old ID -> new UUID
const pageIdMapping: Map<string, string> = new Map();

async function migratePages() {
  console.log('Migrating pages...');
  
  if (!fs.existsSync(PAGES_FILE)) {
    console.log('No lynqit-pages.json file found, skipping page migration');
    return;
  }

  const pagesData = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf-8')) as OldPage[];
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const oldPage of pagesData) {
    try {
      // Check if page already exists
      const existingPage = await getPageBySlug(oldPage.slug);
      if (existingPage) {
        // Map old ID to existing page UUID
        pageIdMapping.set(oldPage.id, existingPage.id);
        console.log(`Page ${oldPage.slug} already exists, mapping old ID...`);
        skipped++;
        continue;
      }

      // Create page
      const newPage = await createPage(oldPage.userId, oldPage.slug);
      
      // Map old ID to new UUID
      pageIdMapping.set(oldPage.id, newPage.id);
      
      // Update page with all data (excluding id, userId, slug, createdAt which are already set)
      const { id, userId, slug, createdAt, ...pageUpdates } = oldPage;
      await updatePage(newPage.id, pageUpdates);

      console.log(`Migrated page: ${oldPage.slug} (${oldPage.id} -> ${newPage.id})`);
      migrated++;
    } catch (error) {
      console.error(`Error migrating page ${oldPage.slug}:`, error);
      errors++;
    }
  }

  console.log(`Pages migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
  console.log(`Page ID mapping created: ${pageIdMapping.size} mappings`);
}

async function migrateAnalytics() {
  console.log('Migrating analytics...');
  
  if (!fs.existsSync(ANALYTICS_FILE)) {
    console.log('No analytics.json file found, skipping analytics migration');
    return;
  }

  const analyticsData = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8')) as OldPageView[];
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const pageView of analyticsData) {
    try {
      // Map old page ID to new UUID
      const newPageId = pageIdMapping.get(pageView.pageId);
      if (!newPageId) {
        console.log(`Skipping pageview ${pageView.id}: page ID ${pageView.pageId} not found in mapping`);
        skipped++;
        continue;
      }

      await trackPageView(
        newPageId,
        pageView.referrer,
        pageView.userAgent,
        pageView.ip
      );
      migrated++;
    } catch (error) {
      console.error(`Error migrating pageview ${pageView.id}:`, error);
      errors++;
    }
  }

  console.log(`Analytics migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
}

async function migrateClicks() {
  console.log('Migrating clicks...');
  
  if (!fs.existsSync(CLICKS_FILE)) {
    console.log('No clicks.json file found, skipping clicks migration');
    return;
  }

  const clicksData = JSON.parse(fs.readFileSync(CLICKS_FILE, 'utf-8')) as OldClick[];
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const click of clicksData) {
    try {
      // Map old page ID to new UUID
      const newPageId = pageIdMapping.get(click.pageId);
      if (!newPageId) {
        console.log(`Skipping click ${click.id}: page ID ${click.pageId} not found in mapping`);
        skipped++;
        continue;
      }

      await trackClick(
        newPageId,
        click.clickType,
        click.targetUrl,
        click.userAgent,
        click.ip
      );
      migrated++;
    } catch (error) {
      console.error(`Error migrating click ${click.id}:`, error);
      errors++;
    }
  }

  console.log(`Clicks migration complete: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
}

async function migrateSettings() {
  console.log('Migrating settings...');
  
  if (!fs.existsSync(SETTINGS_FILE)) {
    console.log('No settings.json file found, skipping settings migration');
    return;
  }

  try {
    const settingsData = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) as OldSettings;
    await saveSettings(settingsData);
    console.log('Settings migration complete');
  } catch (error) {
    console.error('Error migrating settings:', error);
  }
}

async function main() {
  console.log('Starting Supabase migration...');
  console.log('================================');
  
  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Supabase environment variables are not set!');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    await migrateUsers();
    await migratePages(); // This creates the pageIdMapping
    await migrateAnalytics(); // Uses pageIdMapping
    await migrateClicks(); // Uses pageIdMapping
    await migrateSettings();
    
    console.log('================================');
    console.log('Migration complete!');
    console.log('');
    console.log('IMPORTANT: Users have been created with temporary passwords.');
    console.log('Users will need to reset their passwords using Supabase Auth password reset.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();

