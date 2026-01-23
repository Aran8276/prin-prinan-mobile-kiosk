import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@PrinPrinan:settings';

export interface UrlParam {
  key: string;
  value: string;
}

export interface AppSettings {
  baseUrl: string;
  pin: string;
  params: UrlParam[];
}

const DEFAULT_SETTINGS: AppSettings = {
  baseUrl: '',
  pin: '0000',
  params: [{ key: 'copies', value: '1' }],
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save settings.', e);
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Failed to fetch settings.', e);
    return DEFAULT_SETTINGS;
  }
};
