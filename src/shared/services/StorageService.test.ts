import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from './StorageService';
import type { StorageData } from './StorageService';
import type { Account, Transaction, Budget, Goal } from '../types';

// Mock localStorage for testing
const createMockStorage = () => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (index: number) => Object.keys(store)[index] || null,
    };
};

// Setup global mocks
const mockStorage = createMockStorage();
Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, writable: true });

// Mock btoa/atob for Node.js environment
if (typeof globalThis.btoa === 'undefined') {
    // Simple base64 encoding/decoding for testing
    globalThis.btoa = (str: string) => {
        // Convert string to base64 using a simple implementation
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        
        while (i < str.length) {
            const a = str.charCodeAt(i++);
            const b = i < str.length ? str.charCodeAt(i++) : 0;
            const c = i < str.length ? str.charCodeAt(i++) : 0;
            
            const bitmap = (a << 16) | (b << 8) | c;
            
            result += chars.charAt((bitmap >> 18) & 63);
            result += chars.charAt((bitmap >> 12) & 63);
            result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
            result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
        }
        
        return result;
    };
    
    globalThis.atob = (str: string) => {
        // Simple base64 decoding for testing
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        
        str = str.replace(/[^A-Za-z0-9+/]/g, '');
        
        while (i < str.length) {
            const encoded1 = chars.indexOf(str.charAt(i++));
            const encoded2 = chars.indexOf(str.charAt(i++));
            const encoded3 = chars.indexOf(str.charAt(i++));
            const encoded4 = chars.indexOf(str.charAt(i++));
            
            const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
            
            result += String.fromCharCode((bitmap >> 16) & 255);
            if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
            if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
        }
        
        return result;
    };
}

describe('StorageService', () => {
    let storageService: StorageService;
    let testData: StorageData;

    beforeEach(() => {
        mockStorage.clear();
        storageService = new StorageService('test-key');

        // Create test data
        testData = {
            accounts: [{
                id: 'acc-1',
                name: 'Test Account',
                type: 'checking',
                balance: 1000,
                currency: 'USD',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            }],
            transactions: [{
                id: 'txn-1',
                date: new Date('2024-01-15'),
                amount: 100,
                description: 'Test Transaction',
                category: 'Food',
                accountId: 'acc-1',
                type: 'expense',
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15'),
            }],
            budgets: [{
                id: 'bud-1',
                category: 'Food',
                limit: 500,
                period: 'monthly',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
                isActive: true,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            }],
            goals: [{
                id: 'goal-1',
                name: 'Emergency Fund',
                targetAmount: 10000,
                currentAmount: 2500,
                targetDate: new Date('2024-12-31'),
                accountId: 'acc-1',
                isCompleted: false,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            }],
            version: '1.0.0',
        };
    });

    describe('Basic Operations', () => {
        it('should save and load data correctly', () => {
            const success = storageService.saveData(testData);
            expect(success).toBe(true);

            const loaded = storageService.loadData();
            expect(loaded).not.toBeNull();
            expect(loaded!.accounts).toHaveLength(1);
            expect(loaded!.accounts[0].name).toBe('Test Account');
        });

        it('should return default data when storage is empty', () => {
            const loaded = storageService.loadData();
            expect(loaded).not.toBeNull();
            expect(loaded!.accounts).toHaveLength(0);
            expect(loaded!.version).toBe('1.0.0');
        });

        it('should clear data successfully', () => {
            storageService.saveData(testData);
            expect(storageService.loadData()!.accounts).toHaveLength(1);

            const success = storageService.clearData();
            expect(success).toBe(true);

            const loaded = storageService.loadData();
            expect(loaded!.accounts).toHaveLength(0);
        });

        it('should handle Date objects correctly', () => {
            storageService.saveData(testData);
            const loaded = storageService.loadData();

            // The StorageService serializes dates as ISO strings for storage
            // This is actually the correct behavior for JSON serialization
            expect(typeof loaded!.accounts[0].createdAt).toBe('string');
            expect(typeof loaded!.transactions[0].date).toBe('string');
            expect(typeof loaded!.budgets[0].startDate).toBe('string');
            expect(typeof loaded!.goals[0].targetDate).toBe('string');

            // Verify the date values are preserved correctly and can be converted back to Date objects
            expect(new Date(loaded!.accounts[0].createdAt as any).getTime()).toBe(testData.accounts[0].createdAt.getTime());
            expect(new Date(loaded!.transactions[0].date as any).getTime()).toBe(testData.transactions[0].date.getTime());
            expect(new Date(loaded!.budgets[0].startDate as any).getTime()).toBe(testData.budgets[0].startDate.getTime());
            expect(new Date(loaded!.goals[0].targetDate as any).getTime()).toBe(testData.goals[0].targetDate.getTime());
        });
    });

    describe('Encryption', () => {
        it('should encrypt data in storage', () => {
            storageService.saveData(testData);

            const rawData = mockStorage.getItem('personal-finance-data');
            expect(rawData).not.toBeNull();
            expect(rawData).not.toContain('Test Account');
            expect(rawData).not.toContain('Test Transaction');
        });

        it('should decrypt data correctly', () => {
            storageService.saveData(testData);
            const loaded = storageService.loadData();

            expect(loaded!.accounts[0].name).toBe('Test Account');
            expect(loaded!.transactions[0].description).toBe('Test Transaction');
        });
    });

    describe('Backup and Restore', () => {
        it('should create backup successfully', () => {
            storageService.saveData(testData);
            const success = storageService.createBackup();
            expect(success).toBe(true);

            const backupExists = mockStorage.getItem('personal-finance-backup');
            expect(backupExists).not.toBeNull();
        });

        it('should restore from backup', () => {
            storageService.saveData(testData);
            storageService.createBackup();

            // Modify current data (don't use clearData as it removes backup too)
            const emptyData = {
                accounts: [],
                transactions: [],
                budgets: [],
                goals: [],
                version: '1.0.0',
            };
            storageService.saveData(emptyData);
            expect(storageService.loadData()!.accounts).toHaveLength(0);

            // Restore from backup
            const success = storageService.restoreFromBackup();
            expect(success).toBe(true);

            const restored = storageService.loadData();
            expect(restored!.accounts).toHaveLength(1);
            expect(restored!.accounts[0].name).toBe('Test Account');
        });
    });

    describe('Import and Export', () => {
        it('should export data as JSON', () => {
            storageService.saveData(testData);
            const exported = storageService.exportData();

            expect(exported).not.toBeNull();
            const parsed = JSON.parse(exported!);
            expect(parsed.accounts).toHaveLength(1);
            expect(parsed.exportDate).toBeDefined();
        });

        it('should import data from JSON', () => {
            storageService.saveData(testData);
            const exported = storageService.exportData();

            storageService.clearData();
            expect(storageService.loadData()!.accounts).toHaveLength(0);

            const success = storageService.importData(exported!);
            expect(success).toBe(true);

            const imported = storageService.loadData();
            expect(imported!.accounts).toHaveLength(1);
            expect(imported!.accounts[0].name).toBe('Test Account');
        });
    });

    describe('Storage Info', () => {
        it('should return storage information', () => {
            storageService.saveData(testData);
            const info = storageService.getStorageInfo();

            expect(info.used).toBeGreaterThan(0);
            expect(info.available).toBe(5 * 1024 * 1024);
            expect(info.percentage).toBeGreaterThan(0);
            expect(info.hasBackup).toBe(false);
        });

        it('should detect localStorage availability', () => {
            expect(storageService.isStorageAvailable()).toBe(true);
        });
    });

    describe('Specific Data Operations', () => {
        it('should save accounts specifically', () => {
            storageService.saveData(testData);

            const newAccount: Account = {
                id: 'acc-2',
                name: 'New Account',
                type: 'savings',
                balance: 2000,
                currency: 'USD',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const success = storageService.saveAccounts([testData.accounts[0], newAccount]);
            expect(success).toBe(true);

            const loaded = storageService.loadData();
            expect(loaded!.accounts).toHaveLength(2);
            expect(loaded!.accounts[1].name).toBe('New Account');
        });

        it('should save transactions specifically', () => {
            storageService.saveData(testData);

            const newTransaction: Transaction = {
                id: 'txn-2',
                date: new Date(),
                amount: 50,
                description: 'New Transaction',
                category: 'Entertainment',
                accountId: 'acc-1',
                type: 'expense',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const success = storageService.saveTransactions([testData.transactions[0], newTransaction]);
            expect(success).toBe(true);

            const loaded = storageService.loadData();
            expect(loaded!.transactions).toHaveLength(2);
            expect(loaded!.transactions[1].description).toBe('New Transaction');
        });
    });

    describe('Error Handling', () => {
        it('should handle save errors gracefully', () => {
            const originalSetItem = mockStorage.setItem;
            mockStorage.setItem = vi.fn(() => {
                throw new Error('Storage full');
            });

            const success = storageService.saveData(testData);
            expect(success).toBe(false);

            mockStorage.setItem = originalSetItem;
        });

        it('should handle load errors gracefully', () => {
            storageService.saveData(testData);

            const originalGetItem = mockStorage.getItem;
            mockStorage.getItem = vi.fn(() => {
                throw new Error('Storage error');
            });

            const loaded = storageService.loadData();
            expect(loaded).not.toBeNull();
            expect(loaded!.accounts).toHaveLength(0); // Should return default

            mockStorage.getItem = originalGetItem;
        });

        it('should handle invalid JSON gracefully', () => {
            const success = storageService.importData('invalid json');
            expect(success).toBe(false);
        });
    });

    describe('Cleanup', () => {
        it('should cleanup old storage keys', () => {
            mockStorage.setItem('personal-finance-old', 'old-data');
            mockStorage.setItem('other-app-data', 'other-data');

            const success = storageService.cleanup();
            expect(success).toBe(true);

            expect(mockStorage.getItem('personal-finance-old')).toBeNull();
            expect(mockStorage.getItem('other-app-data')).toBe('other-data');
        });
    });
});