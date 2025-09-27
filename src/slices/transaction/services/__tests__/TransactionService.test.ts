import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TransactionService } from '../TransactionService';
import { Transaction } from '../../Transaction';
import type { Transaction as ITransaction, TransactionFilters, AppAction } from '../../../../shared/types';

// Mock data
const mockTransactions: ITransaction[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    amount: 1000,
    description: 'Salary',
    category: 'Income',
    accountId: 'acc1',
    type: 'income',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    date: new Date('2024-01-16'),
    amount: 50,
    description: 'Groceries',
    category: 'Food',
    accountId: 'acc1',
    type: 'expense',
    tags: ['essential', 'weekly'],
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: '3',
    date: new Date('2024-01-17'),
    amount: 25,
    description: 'Coffee',
    category: 'Food',
    accountId: 'acc2',
    type: 'expense',
    tags: ['daily'],
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17')
  },
  {
    id: '4',
    date: new Date('2024-01-18'),
    amount: 200,
    description: 'Freelance work',
    category: 'Income',
    accountId: 'acc1',
    type: 'income',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: '5',
    date: new Date('2024-01-19'),
    amount: 100,
    description: 'Gas',
    category: 'Transportation',
    accountId: 'acc1',
    type: 'expense',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19')
  }
];

describe('TransactionService', () => {
  let service: TransactionService;
  let mockDispatch: ReturnType<typeof vi.fn>;
  let mockGetTransactions: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDispatch = vi.fn();
    mockGetTransactions = vi.fn().mockReturnValue([...mockTransactions]);
    service = new TransactionService(mockDispatch, mockGetTransactions);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CRUD Operations', () => {
    describe('addTransaction', () => {
      it('should add a valid transaction', () => {
        const newTransactionData = {
          date: new Date('2024-01-20'),
          amount: 75,
          description: 'Dinner',
          category: 'Food',
          accountId: 'acc1',
          type: 'expense' as const
        };

        const result = service.addTransaction(newTransactionData);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.transaction).toBeInstanceOf(Transaction);
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'ADD_TRANSACTION',
          payload: expect.objectContaining({
            ...newTransactionData,
            id: expect.any(String),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          })
        });
      });

      it('should reject invalid transaction data', () => {
        const invalidTransactionData = {
          date: new Date('2024-01-20'),
          amount: 0, // Invalid: amount cannot be zero
          description: '',
          category: 'Food',
          accountId: 'acc1',
          type: 'expense' as const
        };

        const result = service.addTransaction(invalidTransactionData);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.transaction).toBeUndefined();
        expect(mockDispatch).not.toHaveBeenCalled();
      });
    });

    describe('updateTransaction', () => {
      it('should update an existing transaction', () => {
        const updates = {
          description: 'Updated groceries',
          amount: 60
        };

        const result = service.updateTransaction('2', updates);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.transaction?.description).toBe('Updated groceries');
        expect(result.transaction?.amount).toBe(60);
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'UPDATE_TRANSACTION',
          payload: { id: '2', updates }
        });
      });

      it('should reject update for non-existent transaction', () => {
        const result = service.updateTransaction('nonexistent', { description: 'Test' });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Transaction not found');
        expect(mockDispatch).not.toHaveBeenCalled();
      });

      it('should reject invalid update data', () => {
        const invalidUpdates = {
          amount: 0 // Invalid: amount cannot be zero
        };

        const result = service.updateTransaction('2', invalidUpdates);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(mockDispatch).not.toHaveBeenCalled();
      });
    });

    describe('deleteTransaction', () => {
      it('should delete an existing transaction', () => {
        const result = service.deleteTransaction('2');

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'DELETE_TRANSACTION',
          payload: '2'
        });
      });

      it('should reject deletion of non-existent transaction', () => {
        const result = service.deleteTransaction('nonexistent');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Transaction not found');
        expect(mockDispatch).not.toHaveBeenCalled();
      });
    });

    describe('getTransaction', () => {
      it('should return existing transaction', () => {
        const transaction = service.getTransaction('2');

        expect(transaction).toBeInstanceOf(Transaction);
        expect(transaction?.id).toBe('2');
        expect(transaction?.description).toBe('Groceries');
      });

      it('should return null for non-existent transaction', () => {
        const transaction = service.getTransaction('nonexistent');

        expect(transaction).toBeNull();
      });
    });
  });

  describe('Filtering and Sorting', () => {
    describe('getFilteredTransactions', () => {
      it('should return all transactions without filters', () => {
        const transactions = service.getFilteredTransactions();

        expect(transactions).toHaveLength(5);
        expect(transactions[0]).toBeInstanceOf(Transaction);
        // Should be sorted by date descending by default
        expect(transactions[0].date.getTime()).toBeGreaterThanOrEqual(transactions[1].date.getTime());
      });

      it('should filter by date range', () => {
        const filters: TransactionFilters = {
          dateRange: {
            start: new Date('2024-01-16'),
            end: new Date('2024-01-17')
          }
        };

        const transactions = service.getFilteredTransactions(filters);

        expect(transactions).toHaveLength(2);
        expect(transactions.every(t => t.date >= filters.dateRange!.start && t.date <= filters.dateRange!.end)).toBe(true);
      });

      it('should filter by categories', () => {
        const filters: TransactionFilters = {
          categories: ['Food']
        };

        const transactions = service.getFilteredTransactions(filters);

        expect(transactions).toHaveLength(2);
        expect(transactions.every(t => t.category === 'Food')).toBe(true);
      });

      it('should filter by transaction type', () => {
        const filters: TransactionFilters = {
          types: ['income']
        };

        const transactions = service.getFilteredTransactions(filters);

        expect(transactions).toHaveLength(2);
        expect(transactions.every(t => t.type === 'income')).toBe(true);
      });

      it('should filter by account', () => {
        const filters: TransactionFilters = {
          accounts: ['acc2']
        };

        const transactions = service.getFilteredTransactions(filters);

        expect(transactions).toHaveLength(1);
        expect(transactions[0].accountId).toBe('acc2');
      });

      it('should filter by amount range', () => {
        const filters: TransactionFilters = {
          amountRange: { min: 50, max: 100 }
        };

        const transactions = service.getFilteredTransactions(filters);

        expect(transactions).toHaveLength(2); // Groceries (50) and Gas (100)
        expect(transactions.every(t => {
          const amount = Math.abs(t.amount);
          return amount >= 50 && amount <= 100;
        })).toBe(true);
      });

      it('should sort transactions by specified field', () => {
        const transactions = service.getFilteredTransactions(undefined, 'amount', 'asc');

        expect(transactions[0].amount).toBeLessThanOrEqual(transactions[1].amount);
      });
    });
  });

  describe('Category Operations', () => {
    describe('getTransactionsByCategory', () => {
      it('should group transactions by category', () => {
        const categoryMap = service.getTransactionsByCategory();

        expect(categoryMap.size).toBe(3); // Income, Food, Transportation
        expect(categoryMap.get('Food')).toHaveLength(2);
        expect(categoryMap.get('Income')).toHaveLength(2);
        expect(categoryMap.get('Transportation')).toHaveLength(1);
      });
    });

    describe('getCategorySpendingSummary', () => {
      it('should calculate category spending summary', () => {
        const summary = service.getCategorySpendingSummary();

        // Should only include categories with expenses, not income categories
        const expenseCategories = summary.filter(s => s.totalSpent > 0);
        expect(expenseCategories).toHaveLength(2); // Only expense categories (Food, Transportation)
        
        const foodSummary = summary.find(s => s.category === 'Food');
        expect(foodSummary).toBeDefined();
        expect(foodSummary?.totalSpent).toBe(75); // 50 + 25
        expect(foodSummary?.transactionCount).toBe(2);
        expect(foodSummary?.averageAmount).toBe(37.5);
        expect(foodSummary?.formattedTotal).toContain('75');
      });

      it('should sort summary by total spent descending', () => {
        const summary = service.getCategorySpendingSummary();

        for (let i = 0; i < summary.length - 1; i++) {
          expect(summary[i].totalSpent).toBeGreaterThanOrEqual(summary[i + 1].totalSpent);
        }
      });
    });
  });

  describe('Calculation Methods', () => {
    describe('calculateTotalIncome', () => {
      it('should calculate total income correctly', () => {
        const totalIncome = service.calculateTotalIncome();

        expect(totalIncome).toBe(1200); // 1000 + 200
      });
    });

    describe('calculateTotalExpenses', () => {
      it('should calculate total expenses correctly', () => {
        const totalExpenses = service.calculateTotalExpenses();

        expect(totalExpenses).toBe(175); // 50 + 25 + 100
      });
    });

    describe('calculateNetBalance', () => {
      it('should calculate net balance correctly', () => {
        const netBalance = service.calculateNetBalance();

        expect(netBalance).toBe(1025); // 1200 - 175
      });
    });

    describe('getFinancialSummary', () => {
      it('should generate financial summary for custom period', () => {
        const customRange = {
          start: new Date('2024-01-15'),
          end: new Date('2024-01-18')
        };

        const summary = service.getFinancialSummary('custom', customRange);

        expect(summary.period).toBe('custom');
        expect(summary.dateRange).toEqual(customRange);
        expect(summary.income).toBe(1200);
        expect(summary.expenses).toBe(75); // Only groceries and coffee in this range
        expect(summary.netBalance).toBe(1125);
        expect(summary.transactionCount).toBe(4);
        expect(summary.formattedIncome).toContain('1,200');
      });
    });
  });

  describe('Export Operations', () => {
    describe('exportToCSV', () => {
      it('should export transactions to CSV format', () => {
        const csv = service.exportToCSV();

        expect(csv).toContain('Date,Description,Category,Type,Amount');
        expect(csv).toContain('Salary');
        expect(csv).toContain('Groceries');
        expect(csv.split('\n')).toHaveLength(6); // Header + 5 transactions
      });

      it('should handle empty transaction list', () => {
        mockGetTransactions.mockReturnValue([]);
        const csv = service.exportToCSV();

        expect(csv).toBe('No transactions to export');
      });
    });

    describe('exportToJSON', () => {
      it('should export transactions to JSON format', () => {
        const json = service.exportToJSON();
        const data = JSON.parse(json);

        expect(data.transactionCount).toBe(5);
        expect(data.summary.totalIncome).toBe(1200);
        expect(data.summary.totalExpenses).toBe(175);
        expect(data.summary.netBalance).toBe(1025);
        expect(data.transactions).toHaveLength(5);
        expect(data.exportDate).toBeDefined();
      });
    });
  });

  describe('Search Operations', () => {
    describe('searchTransactions', () => {
      it('should search by description', () => {
        const results = service.searchTransactions('groceries');

        expect(results).toHaveLength(1);
        expect(results[0].description.toLowerCase()).toContain('groceries');
      });

      it('should search by category', () => {
        const results = service.searchTransactions('food');

        expect(results).toHaveLength(2);
        expect(results.every(t => t.category.toLowerCase().includes('food'))).toBe(true);
      });

      it('should search by tags', () => {
        const results = service.searchTransactions('daily');

        expect(results).toHaveLength(1);
        expect(results[0].tags).toContain('daily');
      });

      it('should return all transactions for empty query', () => {
        const results = service.searchTransactions('');

        expect(results).toHaveLength(5);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('getUniqueCategories', () => {
      it('should return sorted unique categories', () => {
        const categories = service.getUniqueCategories();

        expect(categories).toEqual(['Food', 'Income', 'Transportation']);
      });
    });

    describe('getUniqueTags', () => {
      it('should return sorted unique tags', () => {
        const tags = service.getUniqueTags();

        expect(tags).toEqual(['daily', 'essential', 'weekly']);
      });
    });

    describe('getRecentTransactions', () => {
      it('should return recent transactions in descending date order', () => {
        const recent = service.getRecentTransactions(3);

        expect(recent).toHaveLength(3);
        expect(recent[0].date.getTime()).toBeGreaterThanOrEqual(recent[1].date.getTime());
        expect(recent[1].date.getTime()).toBeGreaterThanOrEqual(recent[2].date.getTime());
      });
    });

    describe('getTransactionsByAccount', () => {
      it('should return transactions for specific account', () => {
        const accountTransactions = service.getTransactionsByAccount('acc1');

        expect(accountTransactions).toHaveLength(4);
        expect(accountTransactions.every(t => t.accountId === 'acc1')).toBe(true);
      });
    });

    describe('getMonthlyTrends', () => {
      it('should return 12 months of trend data', () => {
        const trends = service.getMonthlyTrends();

        expect(trends).toHaveLength(12);
        expect(trends[0].month).toBeDefined();
        expect(trends[0].year).toBeDefined();
        expect(trends[0].income).toBeDefined();
        expect(trends[0].expenses).toBeDefined();
        expect(trends[0].netBalance).toBeDefined();
        expect(trends[0].transactionCount).toBeDefined();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty transaction list gracefully', () => {
      mockGetTransactions.mockReturnValue([]);

      expect(service.calculateTotalIncome()).toBe(0);
      expect(service.calculateTotalExpenses()).toBe(0);
      expect(service.calculateNetBalance()).toBe(0);
      expect(service.getFilteredTransactions()).toHaveLength(0);
      expect(service.getUniqueCategories()).toHaveLength(0);
    });

    it('should handle invalid date filters gracefully', () => {
      const filters: TransactionFilters = {
        dateRange: {
          start: new Date('invalid'),
          end: new Date('invalid')
        }
      };

      // Should not throw error, but return empty results due to invalid dates
      const transactions = service.getFilteredTransactions(filters);
      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should handle missing optional fields in transactions', () => {
      const transactionWithoutTags: ITransaction = {
        id: '6',
        date: new Date('2024-01-20'),
        amount: 30,
        description: 'Test transaction',
        category: 'Test',
        accountId: 'acc1',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGetTransactions.mockReturnValue([transactionWithoutTags]);

      const transactions = service.getFilteredTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0].tags).toBeUndefined();
    });
  });
});