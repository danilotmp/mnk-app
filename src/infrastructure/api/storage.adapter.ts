/**
 * Adaptadores de almacenamiento para React Native y Web
 */

import { StorageAdapter } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Adaptador de AsyncStorage para React Native
 */
export class AsyncStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  }
}

/**
 * Adaptador de localStorage para Web (placeholder)
 */
export class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
}

/**
 * Factory para obtener el adaptador correcto según la plataforma
 */
export function getStorageAdapter(): StorageAdapter {
  // React Native por defecto
  return new AsyncStorageAdapter();
}

