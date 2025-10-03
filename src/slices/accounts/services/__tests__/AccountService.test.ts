import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Dispatch } from 'react';
import { AccountService } from '../AccountService';
import { Account } from '../../Account';
import type { Account as IAccount, Transaction as ITransaction, AppAction } from '../../../../shared/types';

describe('AccountService', () => {
  let accountService: AccountService;
  let mockDispatch: Dispatch<AppAction>;
  let mockGetAccounts: () => IAccount[];
  let mockGetTransactions: () => ITransaction[];
  let mockAccounts: IAccount[];
  let mockTransactions: ITransaction[];

  beforeEach(() => {
    // Mock data
    mockAccounts = [
      {
        id: 'account-1',
        name: 'Main Checking',
        type: 'checking',
        balance: 1500,
        currency: 'USD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'account-2',
        name: 'Savings Account',
        type: 'savings',
        balance: 5000,
        currency: 'USD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'account-3',
        name: 'Credit Card',
        type: 'credit',
        balance: -500,
        currency: 'USD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    mockTransactions = [
      {
        id: 'tx-1',
        date: new Date('2024-01-15'),
        amount: 100,
        description: 'Deposit',
        category: 'Income',
        accountId: 'account-1',
        type: 'income',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'tx-2',
        date: new Date('2024-01-16'),
        amount: -50,
        description: 'Grocery',
        category: 'Food',
        accountId: 'account-1',
        type: 'expense',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
      },
      {
        id: 'tx-3',
        date: new Date('2024-01-17'),
        amount: 200,
        description: 'Interest',
        category: 'Income',
        accountId: 'account-2',
        type: 'income',
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17')
      }
    ];

    // Mock functions
    mockDispatch = vi.fn();
    mockGetAccounts = vi.fn(() => mockAccounts);
    mockGetTransactions = vi.fn(() => mockTransactions);

    // Create service instance
    accountService = new AccountService(mockDispatch, mockGetAccounts, mockGetTransactions);
  });

  describe('CRUD Operations', () => {
    describe('addAccount', () => {
      it('should add a valid account', () => {
        const newAccountData = {
          name: 'New Checking',
          type: 'checking' as const,
          balance: 1000,
          currency: 'USD'
        };

        const result = accountService.addAccount(newAccountData);

        expect(result.isValid).toBe(true);
        expect(result.account).toBeDefined();
        expect(result.account!.name).toBe('New Checking');
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'ADD_ACCOUNT',
          payload: expect.objectContaining({
            name: 'New Checking',
            type: 'checking',
            balance: 1000,
            currency: 'USD'
          })
        });
      });

      it('should reject account with duplicate name', () => {
        const duplicateAccountData = {
          name: 'Main Checking', // Same as existing account
          type: 'savings' as const,
          balance: 1000,
          currency: 'USD'
        };

        const result = accountService.addAccount(duplicateAccountData);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('An account with this name already exists');
        expect(mockDispatch).not.toHaveBeenCalled();
      });

      it('should reject invalid account data', () => {
        const invalidAccountData = {
          name: '', // Invalid - empty name
          type: 'checking' as const,
          balance: 1000,
          currency: 'USD'
        };

        const result = accountService.addAccount(invalidAccountData);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(mockDispatch).not.toHaveBeenCalled();
      });
    });

    describe('updateAccount', () => {
      it('should update an existing account', () => {
        const updates = {
          name: 'Updated Checking',
          balance: 2000
        };

        const result = accountService.updateAccount('account-1', updates);

        expect(result.isValid).toBe(true);
        expect(result.account).toBeDefined();
        expect(result.account!.name).toBe('Updated Checking');
        expect(result.account!.balance).toBe(2000);
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'UPDATE_ACCOUNT',
          payload: { id: 'account-1', updates }
        });
      });

      it('should reject update with duplicate name', () => {
        const updates = {
          name: 'Savings Account' // Name of another existing account
        };

        const result = accountService.updateAccount('account-1', updates);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('An account with this name already exists');
        expect(mockDispatch).not.toHaveBeenCalled();
      });

      it('should reject update for non-existent account', () => {
        const updates = { name: 'New Name' };

        const result = accountService.updateAccount('non-existent', updates);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Account not found');
        expect(mockDispatch).not.toHaveBeenCalled();
      });
    });

    describe('deleteAccount', () => {
      it('should delete account without transactions', () => {
        // Remove transactions for account-3 to make it deletable
        mockTransactions = mockTransactions.filter(t => t.accountId !== 'account-3');
        mockGetTransactions = vi.fn(() => mockTransactions);
        accountService = new AccountService(mockDispatch, mockGetAccounts, mockGetTransactions);

        const result = accountService.deleteAccount('account-3');

        expect(result.isValid).toBe(true);
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'DELETE_ACCOUNT',
          payload: 'account-3'
        });
      });

      it('should reject deletion of account with transactions', () => {
        const result = accountService.deleteAccount('account-1');

        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('Cannot delete account with');
        expect(result.errors[0]).toContain('existing transactions');
        expect(mockDispatch).not.toHaveBeenCalled();
      });

      it('should reject deletion of non-existent account', () => {
        const result = accountService.deleteAccount('non-existent');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Account not found');
        expect(mockDispatch).not.toHaveBeenCalled();
      });
    });

    describe('getAccount', () => {
      it('should return account by ID', () => {
        const account = accountService.getAccount('account-1');

        expect(account).toBeDefined();
        expect(account!.id).toBe('account-1');
        expect(account!.name).toBe('Main Checking');
      });

      it('should return null for non-existent account', () => {
        const account = accountService.getAccount('non-existent');

        expect(account).toBeNull();
      });
    });

    describe('getAllAccounts', () => {
      it('should return all accounts as Account instances', () => {
        const accounts = accountService.getAllAccounts();

        expect(accounts).toHaveLength(3);
        expect(accounts[0]).toBeInstanceOf(Account);
        expect(accounts.map(a => a.id)).toEqual(['account-1', 'account-2', 'account-3']);
      });
    });
  });

  describe('Balance Calculation Methods', () => {
    describe('calculateAccountBalance', () => {
      it('should calculate correct balance for account with transactions', () => {
        // account-1 has initial balance 1500, +100 income, -50 expense = 1550
        const balance = accountService.calculateAccountBalance('account-1');

        expect(balance).toBe(1550);
      });

      it('should return initial balance for account without transactions', () => {
        // account-3 has no transactions, should return initial balance
        const balance = accountService.calculateAccountBalance('account-3');

        expect(balance).toBe(-500);
      });

      it('should return 0 for non-existent account', () => {
        const balance = accountService.calculateAccountBalance('non-existent');

        expect(balance).toBe(0);
      });
    });

    describe('updateAccountBalance', () => {
      it('should update account balance based on transactions', () => {
        const result = accountService.updateAccountBalance('account-1');

        expect(result.isValid).toBe(true);
        expect(result.newBalance).toBe(1550);
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'UPDATE_ACCOUNT',
          payload: { id: 'account-1', updates: { balance: 1550 } }
        });
      });

      it('should reject update for non-existent account', () => {
        const result = accountService.updateAccountBalance('non-existent');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Account not found');
      });
    });

    describe('getAccountSummaries', () => {
      it('should return summaries with current balances', () => {
        const summaries = accountService.getAccountSummaries();

        expect(summaries).toHaveLength(3);
        
        const checkingSummary = summaries.find(s => s.id === 'account-1');
        expect(checkingSummary).toBeDefined();
        expect(checkingSummary!.balance).toBe(1550);
        expect(checkingSummary!.status).toBe('positive');
        expect(checkingSummary!.transactionCount).toBe(2);

        const savingsSummary = summaries.find(s => s.id === 'account-2');
        expect(savingsSummary).toBeDefined();
        expect(savingsSummary!.balance).toBe(5200); // 5000 + 200
        expect(savingsSummary!.transactionCount).toBe(1);
      });
    });
  });

  describe('Account Type Operations', () => {
    describe('getAccountsByType', () => {
      it('should return accounts of specified type', () => {
        const checkingAccounts = accountService.getAccountsByType('checking');
        const savingsAccounts = accountService.getAccountsByType('savings');

        expect(checkingAccounts).toHaveLength(1);
        expect(checkingAccounts[0].type).toBe('checking');
        
        expect(savingsAccounts).toHaveLength(1);
        expect(savingsAccounts[0].type).toBe('savings');
      });
    });

    describe('getTotalBalanceByType', () => {
      it('should return total balance by account type', () => {
        const balancesByType = accountService.getTotalBalanceByType();

        expect(balancesByType.checking.balance).toBe(1550);
        expect(balancesByType.checking.count).toBe(1);
        
        expect(balancesByType.savings.balance).toBe(5200);
        expect(balancesByType.savings.count).toBe(1);
        
        expect(balancesByType.credit.balance).toBe(-500);
        expect(balancesByType.credit.count).toBe(1);
      });
    });
  });

  describe('Validation Methods', () => {
    describe('canAccommodateTransaction', () => {
      it('should allow valid transactions', () => {
        const result = accountService.canAccommodateTransaction('account-1', -100);

        expect(result.isValid).toBe(true);
      });

      it('should reject transactions that would violate account rules', () => {
        // Try to make savings account go negative
        const result = accountService.canAccommodateTransaction('account-2', -6000);

        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('cannot have negative balance');
      });

      it('should reject transaction for non-existent account', () => {
        const result = accountService.canAccommodateTransaction('non-existent', 100);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Account not found');
      });
    });

    describe('validateAccountTypeRules', () => {
      it('should validate credit card rules', () => {
        const validCredit = { type: 'credit' as const, balance: -100 };
        const invalidCredit = { type: 'credit' as const, balance: 100 };

        expect(accountService.validateAccountTypeRules(validCredit).isValid).toBe(true);
        expect(accountService.validateAccountTypeRules(invalidCredit).isValid).toBe(false);
      });

      it('should validate savings account rules', () => {
        const validSavings = { type: 'savings' as const, balance: 1000 };
        const invalidSavings = { type: 'savings' as const, balance: -100 };

        expect(accountService.validateAccountTypeRules(validSavings).isValid).toBe(true);
        expect(accountService.validateAccountTypeRules(invalidSavings).isValid).toBe(false);
      });
    });
  });

  describe('Currency Operations', () => {
    describe('getAccountsByCurrency', () => {
      it('should return accounts with specified currency', () => {
        const usdAccounts = accountService.getAccountsByCurrency('USD');

        expect(usdAccounts).toHaveLength(3);
        expect(usdAccounts.every(a => a.currency === 'USD')).toBe(true);
      });
    });

    describe('getUniqueCurrencies', () => {
      it('should return unique currencies', () => {
        // Add account with different currency
        mockAccounts.push({
          id: 'account-4',
          name: 'EUR Account',
          type: 'checking',
          balance: 1000,
          currency: 'EUR',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        const currencies = accountService.getUniqueCurrencies();

        expect(currencies).toContain('USD');
        expect(currencies).toContain('EUR');
        expect(currencies).toHaveLength(2);
      });
    });

    describe('convertBalance', () => {
      it('should return same amount for same currency', () => {
        const converted = accountService.convertBalance(100, 'USD', 'USD');

        expect(converted).toBe(100);
      });

      it('should convert between different currencies', () => {
        const converted = accountService.convertBalance(100, 'USD', 'EUR');

        expect(converted).toBe(85); // Based on simplified rate of 0.85
      });
    });
  });

  describe('Export Operations', () => {
    describe('exportToCSV', () => {
      it('should export accounts to CSV format', () => {
        const csv = accountService.exportToCSV();

        expect(csv).toContain('Name,Type,Balance,Currency');
        expect(csv).toContain('Main Checking');
        expect(csv).toContain('Savings Account');
        expect(csv).toContain('Credit Card');
      });

      it('should handle empty account list', () => {
        mockGetAccounts = vi.fn(() => []);
        accountService = new AccountService(mockDispatch, mockGetAccounts, mockGetTransactions);

        const csv = accountService.exportToCSV();

        expect(csv).toBe('No accounts to export');
      });
    });

    describe('exportToJSON', () => {
      it('should export accounts to JSON format', () => {
        const json = accountService.exportToJSON();
        const data = JSON.parse(json);

        expect(data.accountCount).toBe(3);
        expect(data.accounts).toHaveLength(3);
        expect(data.summary.typeBreakdown).toBeDefined();
        expect(data.exportDate).toBeDefined();
      });
    });
  });

  describe('Search and Filter Operations', () => {
    describe('searchAccounts', () => {
      it('should search accounts by name', () => {
        const results = accountService.searchAccounts('checking');

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Main Checking');
      });

      it('should search accounts by type', () => {
        const results = accountService.searchAccounts('savings');

        expect(results).toHaveLength(1);
        expect(results[0].type).toBe('savings');
      });

      it('should return all accounts for empty query', () => {
        const results = accountService.searchAccounts('');

        expect(results).toHaveLength(3);
      });
    });

    describe('getSortedAccounts', () => {
      it('should sort accounts by name ascending', () => {
        const sorted = accountService.getSortedAccounts('name', 'asc');

        expect(sorted[0].name).toBe('Credit Card');
        expect(sorted[1].name).toBe('Main Checking');
        expect(sorted[2].name).toBe('Savings Account');
      });

      it('should sort accounts by balance descending', () => {
        const sorted = accountService.getSortedAccounts('balance', 'desc');

        expect(sorted[0].balance).toBe(5000); // Savings
        expect(sorted[1].balance).toBe(1500); // Checking
        expect(sorted[2].balance).toBe(-500); // Credit
      });
    });
  });

  describe('Utility Methods', () => {
    describe('getNetWorth', () => {
      it('should calculate total net worth', () => {
        const netWorth = accountService.getNetWorth();

        // 1550 (checking) + 5200 (savings) + (-500) (credit) = 6250
        expect(netWorth.amount).toBe(6250);
        expect(netWorth.formattedAmount).toContain('6,250');
        expect(netWorth.breakdown).toHaveLength(3);
      });
    });

    describe('getAccountHealth', () => {
      it('should assess account health', () => {
        const health = accountService.getAccountHealth();

        expect(health.accounts).toHaveLength(3);
        expect(health.healthy + health.warning + health.critical).toBe(3);
        
        // Check that each account has a status and reason
        health.accounts.forEach(account => {
          expect(['healthy', 'warning', 'critical']).toContain(account.status);
          expect(account.reason).toBeDefined();
        });
      });
    });
  });
});