import { createServerClient } from './supabase-server';

export interface Settings {
  mollieApiKey?: string;
  mollieApiKeyTest?: string;
  mollieApiKeyLive?: string;
  useTestMode?: boolean;
  // Stripe settings
  stripeSecretKey?: string;
  stripeSecretKeyTest?: string;
  stripeSecretKeyLive?: string;
  stripePublishableKeyTest?: string;
  stripePublishableKeyLive?: string;
  // Payment provider selection
  paymentProvider?: 'mollie' | 'stripe'; // Default to 'mollie' for backward compatibility
  updatedAt?: string;
}

// Get settings
export async function getSettings(): Promise<Settings> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (error) {
      console.error('Error fetching settings:', error);
      return {
        useTestMode: true,
      };
    }

    // Convert array of key-value pairs to Settings object
    const settings: Settings = {
      useTestMode: true,
    };

    (data || []).forEach((setting: any) => {
      switch (setting.key) {
        case 'mollie_api_key_test':
          settings.mollieApiKeyTest = setting.value;
          break;
        case 'mollie_api_key_live':
          settings.mollieApiKeyLive = setting.value;
          break;
        case 'use_test_mode':
          settings.useTestMode = setting.value === 'true' || setting.value === true;
          break;
        case 'mollie_api_key':
          settings.mollieApiKey = setting.value;
          break;
        case 'stripe_secret_key_test':
          settings.stripeSecretKeyTest = setting.value;
          break;
        case 'stripe_secret_key_live':
          settings.stripeSecretKeyLive = setting.value;
          break;
        case 'stripe_publishable_key_test':
          settings.stripePublishableKeyTest = setting.value;
          break;
        case 'stripe_publishable_key_live':
          settings.stripePublishableKeyLive = setting.value;
          break;
        case 'payment_provider':
          settings.paymentProvider = setting.value as 'mollie' | 'stripe';
          break;
      }
      if (setting.updated_at) {
        settings.updatedAt = setting.updated_at;
      }
    });

    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {
      useTestMode: true,
    };
  }
}

// Save settings
export async function saveSettings(settings: Settings): Promise<void> {
  const supabase = createServerClient();
  
  try {
    const settingsToSave: Array<{ key: string; value: string }> = [];

    if (settings.mollieApiKeyTest !== undefined) {
      settingsToSave.push({
        key: 'mollie_api_key_test',
        value: settings.mollieApiKeyTest,
      });
    }

    if (settings.mollieApiKeyLive !== undefined) {
      settingsToSave.push({
        key: 'mollie_api_key_live',
        value: settings.mollieApiKeyLive,
      });
    }

    if (settings.useTestMode !== undefined) {
      settingsToSave.push({
        key: 'use_test_mode',
        value: settings.useTestMode.toString(),
      });
    }

    if (settings.mollieApiKey !== undefined) {
      settingsToSave.push({
        key: 'mollie_api_key',
        value: settings.mollieApiKey,
      });
    }

    if (settings.stripeSecretKeyTest !== undefined) {
      settingsToSave.push({
        key: 'stripe_secret_key_test',
        value: settings.stripeSecretKeyTest,
      });
    }

    if (settings.stripeSecretKeyLive !== undefined) {
      settingsToSave.push({
        key: 'stripe_secret_key_live',
        value: settings.stripeSecretKeyLive,
      });
    }

    if (settings.stripePublishableKeyTest !== undefined) {
      settingsToSave.push({
        key: 'stripe_publishable_key_test',
        value: settings.stripePublishableKeyTest,
      });
    }

    if (settings.stripePublishableKeyLive !== undefined) {
      settingsToSave.push({
        key: 'stripe_publishable_key_live',
        value: settings.stripePublishableKeyLive,
      });
    }

    if (settings.paymentProvider !== undefined) {
      settingsToSave.push({
        key: 'payment_provider',
        value: settings.paymentProvider,
      });
    }

    // Use upsert to insert or update each setting
    for (const setting of settingsToSave) {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) {
        console.error(`Error saving setting ${setting.key}:`, error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

// Get active Mollie API key (test or live based on useTestMode)
// HARDCODED FALLBACK KEYS - Replace with your actual keys
const HARDCODED_TEST_KEY = "test_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM"; // Replace with your test key
const HARDCODED_LIVE_KEY = "live_MdEcEVWzQtfHdGtvyTrBNvq3Hyhr5u"; // Replace with your live key

export async function getActiveMollieApiKey(): Promise<string | undefined> {
  const settings = await getSettings();
  if (settings.useTestMode) {
    return settings.mollieApiKeyTest || process.env.MOLLIE_API_KEY || HARDCODED_TEST_KEY;
  } else {
    return settings.mollieApiKeyLive || process.env.MOLLIE_API_KEY || HARDCODED_LIVE_KEY;
  }
}
