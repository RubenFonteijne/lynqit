import { createServerClient } from './supabase-server';

export interface Settings {
  useTestMode?: boolean;
  // Stripe settings
  stripeSecretKey?: string;
  stripeSecretKeyTest?: string;
  stripeSecretKeyLive?: string;
  stripePublishableKeyTest?: string;
  stripePublishableKeyLive?: string;
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
        case 'use_test_mode':
          settings.useTestMode = setting.value === 'true' || setting.value === true;
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

    if (settings.useTestMode !== undefined) {
      settingsToSave.push({
        key: 'use_test_mode',
        value: settings.useTestMode.toString(),
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

