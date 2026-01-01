import { createServerClient } from './supabase-server';

export interface Settings {
  mollieApiKey?: string;
  mollieApiKeyTest?: string;
  mollieApiKeyLive?: string;
  useTestMode?: boolean;
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
export async function getActiveMollieApiKey(): Promise<string | undefined> {
  const settings = await getSettings();
  if (settings.useTestMode) {
    return settings.mollieApiKeyTest || process.env.MOLLIE_API_KEY;
  } else {
    return settings.mollieApiKeyLive || process.env.MOLLIE_API_KEY;
  }
}
