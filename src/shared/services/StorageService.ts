import type { Account, Transaction, Budget, Goal } from '../types';

// Simple encryption/decryption using base64 and XOR cipher
// Note: This is for demonstration purposes. In production, use proper encryption libraries
class SimpleEncryption {
  private key: string;

  constructor(key: string = 'personal-finance-tracker-key') {
    this.key = key;
  }

  encrypt(data: string): string {
    try {
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        const keyChar = this.key.charCodeAt(i % this.key.length);
        const dataChar = data.charCodeAt(i);
        encrypted += String.fromCharCode(dataChar ^ keyChar);
      }
      return btoa(encrypted); // Base64 encode
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Return original data if encryption fails
    }
  }

  decrypt(encryptedData: string): string {
    try {
      const encrypted = atob(encryptedData); // Base64 decode
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = this.key.charCodeAt(i % this.key.length);
        const encryptedChar = encrypted.charCodeAt(i);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Return original data if decryption fails
    }
  }
}

export interface StorageData {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  lastBackup?: Date;
  version: string;
}

export interface BackupData extends StorageData {
  exportDate: Date;
  appVersion: string;
}

export class StorageService {
  private encryption: SimpleEncryption;
  private readonly STORAGE_KEY = 'personal-finance-data';
  private readonly BACKUP_KEY = 'personal-finance-backup';
  private readonly VERSION = '1.0.0';

  constructor(encryptionKey?: string) {
    this.encryption = new SimpleEncryption(encryptionKey);
  }

  // Save data to localStorage with encryption
  saveData(data: Omit<StorageData, 'version'>): boolean {
    try {
      const dataToSave: StorageData = {
        ...data,
        version: this.VERSION,
      };

      const jsonData = JSON.stringify(dataToSave, this.dateReplacer);
      const encryptedData = this.encryption.encrypt(jsonData);
      
      localStorage.setItem(this.STORAGE_KEY, encryptedData);
      return true;
    } catch (error) {
      console.error('Failed to save data:', error);
      return false;
    }
  }

  // Load data from localStorage with decryption
  loadData(): StorageData | null {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) {
        return this.getDefaultData();
      }

      const decryptedData = this.encryption.decrypt(encryptedData);
      const parsedData = JSON.parse(decryptedData, this.dateReviver) as StorageData;

      // Validate data structure
      if (!this.isValidStorageData(parsedData)) {
        console.warn('Invalid storage data structure, returning default data');
        return this.getDefaultData();
      }

      // Handle version migration if needed
      return this.migrateDataIfNeeded(parsedData);
    } catch (error) {
      console.error('Failed to load data:', error);
      return this.getDefaultData();
    }
  }

  // Clear all data from localStorage
  clearData(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.BACKUP_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  // Create backup of current data
  createBackup(): boolean {
    try {
      const currentData = this.loadData();
      if (!currentData) {
        return false;
      }

      const backupData: BackupData = {
        ...currentData,
        exportDate: new Date(),
        appVersion: this.VERSION,
        lastBackup: new Date(),
      };

      const jsonData = JSON.stringify(backupData, this.dateReplacer);
      const encryptedData = this.encryption.encrypt(jsonData);
      
      localStorage.setItem(this.BACKUP_KEY, encryptedData);
      
      // Update the main data with backup timestamp
      this.saveData({
        ...currentData,
        lastBackup: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  // Restore data from backup
  restoreFromBackup(): boolean {
    try {
      const encryptedBackup = localStorage.getItem(this.BACKUP_KEY);
      if (!encryptedBackup) {
        return false;
      }

      const decryptedData = this.encryption.decrypt(encryptedBackup);
      const backupData = JSON.parse(decryptedData, this.dateReviver) as BackupData;

      if (!this.isValidStorageData(backupData)) {
        return false;
      }

      // Restore the data (excluding backup metadata)
      const { exportDate, appVersion, ...dataToRestore } = backupData;
      return this.saveData(dataToRestore);
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  // Export data as JSON string (for external backup)
  exportData(): string | null {
    try {
      const currentData = this.loadData();
      if (!currentData) {
        return null;
      }

      const exportData: BackupData = {
        ...currentData,
        exportDate: new Date(),
        appVersion: this.VERSION,
      };

      return JSON.stringify(exportData, this.dateReplacer, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  // Import data from JSON string
  importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData, this.dateReviver) as BackupData;

      if (!this.isValidStorageData(importedData)) {
        throw new Error('Invalid data structure');
      }

      // Create backup before importing
      this.createBackup();

      // Import the data (excluding export metadata)
      const { exportDate, appVersion, ...dataToImport } = importedData;
      return this.saveData(dataToImport);
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Get storage usage information
  getStorageInfo(): {
    used: number;
    available: number;
    percentage: number;
    hasBackup: boolean;
    lastBackup?: Date;
  } {
    try {
      const data = this.loadData();
      const mainData = localStorage.getItem(this.STORAGE_KEY) || '';
      const backupData = localStorage.getItem(this.BACKUP_KEY) || '';
      
      const used = new Blob([mainData + backupData]).size;
      const available = 5 * 1024 * 1024; // Assume 5MB localStorage limit
      const percentage = (used / available) * 100;

      return {
        used,
        available,
        percentage: Math.min(percentage, 100),
        hasBackup: !!backupData,
        lastBackup: data?.lastBackup,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        used: 0,
        available: 5 * 1024 * 1024,
        percentage: 0,
        hasBackup: false,
      };
    }
  }

  // Check if localStorage is available
  isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Private helper methods
  private getDefaultData(): StorageData {
    return {
      accounts: [],
      transactions: [],
      budgets: [],
      goals: [],
      version: this.VERSION,
    };
  }

  private isValidStorageData(data: any): data is StorageData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.accounts) &&
      Array.isArray(data.transactions) &&
      Array.isArray(data.budgets) &&
      Array.isArray(data.goals) &&
      typeof data.version === 'string'
    );
  }

  private migrateDataIfNeeded(data: StorageData): StorageData {
    // Handle version migrations here
    if (data.version !== this.VERSION) {
      console.log(`Migrating data from version ${data.version} to ${this.VERSION}`);
      // Add migration logic here when needed
      data.version = this.VERSION;
    }
    return data;
  }

  // JSON serialization helpers for Date objects
  private dateReplacer(value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }

  // Utility methods for specific data types
  saveAccounts(accounts: Account[]): boolean {
    const currentData = this.loadData();
    if (!currentData) return false;
    
    return this.saveData({
      ...currentData,
      accounts,
    });
  }

  saveTransactions(transactions: Transaction[]): boolean {
    const currentData = this.loadData();
    if (!currentData) return false;
    
    return this.saveData({
      ...currentData,
      transactions,
    });
  }

  saveBudgets(budgets: Budget[]): boolean {
    const currentData = this.loadData();
    if (!currentData) return false;
    
    return this.saveData({
      ...currentData,
      budgets,
    });
  }

  saveGoals(goals: Goal[]): boolean {
    const currentData = this.loadData();
    if (!currentData) return false;
    
    return this.saveData({
      ...currentData,
      goals,
    });
  }

  // Cleanup old data (for maintenance)
  cleanup(): boolean {
    try {
      // Remove any old storage keys that might exist
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('personal-finance-') && 
            key !== this.STORAGE_KEY && key !== this.BACKUP_KEY) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();