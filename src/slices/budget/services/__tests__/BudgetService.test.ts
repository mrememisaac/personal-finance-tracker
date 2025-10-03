import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetService } from '../BudgetService';
import type { Budget as IBudget, Transaction } from '../../../../shared/types';

describe('BudgetService', () => {
  let budgetService: BudgetService;
  let mockTransactions: Transaction[];
  let mockBudgets: IBudget[];

  beforeEach(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Mock transactions for testing (current month)
    mockTransactions = [
      {
        id: '1',
        date: new Date(now.getFullYear(), now.getMonth(), 15),
        amount: 50,
        description: 'Grocery shopping',
        category: 'Food',
        accountId: 'acc1',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        date: new Date(now.getFullYear(), now.getMonth(), 20),
        amount: 30,
        description: 'Restaurant',
        category: 'Food',
        accountId: 'acc1',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        date: new Date(now.getFullYear(), now.getMonth(), 25),
        amount: 100,
        description: 'Gas',
        category: 'Transportation',
        accountId: 'acc1',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Mock budgets for testing (current month)
    mockBudgets = [
      {
        id: 'budget1',
        category: 'Food',
        limit: 200,
        period: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'budget2',
        category: 'Transportation',
        limit: 150,
        period: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    budgetService = new BudgetService(mockBudgets, mockTransactions);
  });

  describe('Budget Creation and Management', () => {
    it('should create a new budget successfully', () => {
      const newBudgetData = {
        category: 'Entertainment',
        limit: 100,
        period: 'monthly' as const,
        startDate: new Date('2024-02-01'),
        isActive: true
      };

      const budget = budgetService.createBudget(newBudgetData);

      expect(budget.category).toBe('Entertainment');
      expect(budget.limit).toBe(100);
      expect(budget.period).toBe('monthly');
      expect(budget.id).toBeDefined();
      expect(budget.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when creating invalid budget', () => {
      const invalidBudgetData = {
        category: '',
        limit: -100,
        period: 'monthly' as const,
        startDate: new Date('2024-02-01'),
        isActive: true
      };

      expect(() => budgetService.createBudget(invalidBudgetData)).toThrow();
    });

    it('should update existing budget', () => {
      const budget = budgetService.getBudgetById('budget1');
      expect(budget).toBeDefined();

      const updatedBudget = budgetService.updateBudget('budget1', { limit: 250 });

      expect(updatedBudget.limit).toBe(250);
      expect(updatedBudget.updatedAt.getTime()).toBeGreaterThan(budget!.createdAt.getTime());
    });

    it('should throw error when updating non-existent budget', () => {
      expect(() => budgetService.updateBudget('nonexistent', { limit: 100 })).toThrow();
    });

    it('should delete budget successfully', () => {
      const initialCount = budgetService.getBudgets().length;
      budgetService.deleteBudget('budget1');
      
      expect(budgetService.getBudgets().length).toBe(initialCount - 1);
      expect(budgetService.getBudgetById('budget1')).toBeUndefined();
    });

    it('should throw error when deleting non-existent budget', () => {
      expect(() => budgetService.deleteBudget('nonexistent')).toThrow();
    });
  });

  describe('Budget Retrieval', () => {
    it('should get all budgets', () => {
      const budgets = budgetService.getBudgets();
      expect(budgets).toHaveLength(2);
    });

    it('should get active budgets only', () => {
      // Add an inactive budget
      const inactiveBudget: IBudget = {
        ...mockBudgets[0],
        id: 'inactive1',
        isActive: false
      };
      
      budgetService = new BudgetService([...mockBudgets, inactiveBudget], mockTransactions);
      const activeBudgets = budgetService.getActiveBudgets();
      
      expect(activeBudgets).toHaveLength(2);
      expect(activeBudgets.every(budget => budget.isActive)).toBe(true);
    });

    it('should get budget by id', () => {
      const budget = budgetService.getBudgetById('budget1');
      expect(budget).toBeDefined();
      expect(budget!.id).toBe('budget1');
    });

    it('should get budget by category', () => {
      const budget = budgetService.getBudgetByCategory('Food');
      expect(budget).toBeDefined();
      expect(budget!.category).toBe('Food');
    });

    it('should return undefined for non-existent budget', () => {
      const budget = budgetService.getBudgetById('nonexistent');
      expect(budget).toBeUndefined();
    });
  });

  describe('Budget Progress Tracking', () => {
    it('should calculate budget progress correctly', () => {
      const progress = budgetService.calculateBudgetProgress('budget1');
      
      expect(progress.budgetId).toBe('budget1');
      expect(progress.spent).toBe(80); // 50 + 30 from Food transactions
      expect(progress.remaining).toBe(120); // 200 - 80
      expect(progress.percentage).toBe(40); // 80/200 * 100
      expect(progress.status).toBe('safe');
    });

    it('should get all budget progress', () => {
      const allProgress = budgetService.getAllBudgetProgress();
      
      expect(allProgress).toHaveLength(2);
      expect(allProgress[0].budgetId).toBe('budget1');
      expect(allProgress[1].budgetId).toBe('budget2');
    });

    it('should update progress when transactions change', () => {
      const now = new Date();
      const newTransactions = [
        ...mockTransactions,
        {
          id: '4',
          date: new Date(now.getFullYear(), now.getMonth(), 28),
          amount: 40,
          description: 'More food',
          category: 'Food',
          accountId: 'acc1',
          type: 'expense' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      budgetService.updateTransactions(newTransactions);
      const progress = budgetService.calculateBudgetProgress('budget1');
      
      expect(progress.spent).toBe(120); // 50 + 30 + 40
      expect(progress.remaining).toBe(80); // 200 - 120
      expect(progress.percentage).toBe(60); // 120/200 * 100
    });
  });

  describe('Budget Alerts', () => {
    it('should check budget alerts for over-budget scenarios', () => {
      const now = new Date();
      // Create a budget that will be over budget
      const overBudgetTransactions = [
        {
          id: '5',
          date: new Date(now.getFullYear(), now.getMonth(), 15),
          amount: 250,
          description: 'Expensive meal',
          category: 'Food',
          accountId: 'acc1',
          type: 'expense' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      budgetService.updateTransactions(overBudgetTransactions);
      const alerts = budgetService.checkBudgetAlerts();
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].budgetId).toBe('budget1');
      expect(alerts[0].severity).toBe('danger');
      expect(alerts[0].message).toContain('exceeded');
    });

    it('should check budget alerts for warning scenarios', () => {
      const now = new Date();
      // Create transactions that put budget at 85%
      const warningTransactions = [
        {
          id: '6',
          date: new Date(now.getFullYear(), now.getMonth(), 15),
          amount: 170,
          description: 'Large expense',
          category: 'Food',
          accountId: 'acc1',
          type: 'expense' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      budgetService.updateTransactions(warningTransactions);
      const alerts = budgetService.checkBudgetAlerts();
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('warning');
    });

    it('should check alert for potential transaction', () => {
      const alert = budgetService.checkBudgetAlertForTransaction(150, 'Food');
      
      expect(alert).toBeDefined();
      expect(alert!.category).toBe('Food');
      expect(alert!.severity).toBe('danger'); // 80 + 150 = 230 > 200 limit
    });

    it('should return null for transaction that does not trigger alert', () => {
      const alert = budgetService.checkBudgetAlertForTransaction(50, 'Food');
      expect(alert).toBeNull();
    });
  });

  describe('Budget Period Management', () => {
    it('should reset budgets for new period', () => {
      // Create expired budgets
      const expiredBudgets: IBudget[] = [
        {
          ...mockBudgets[0],
          startDate: new Date('2023-12-01'),
          endDate: new Date('2023-12-31'),
          isActive: true
        }
      ];

      budgetService = new BudgetService(expiredBudgets, []);
      const newBudgets = budgetService.resetBudgetsForNewPeriod();
      
      expect(newBudgets).toHaveLength(1);
      expect(newBudgets[0].startDate.getTime()).toBeGreaterThan(expiredBudgets[0].endDate.getTime());
    });
  });

  describe('Utility Methods', () => {
    it('should calculate total budgeted amount', () => {
      const total = budgetService.getTotalBudgetedAmount();
      expect(total).toBe(350); // 200 + 150
    });

    it('should calculate total spent amount', () => {
      const total = budgetService.getTotalSpentAmount();
      expect(total).toBe(180); // 80 (Food) + 100 (Transportation)
    });

    it('should calculate total remaining amount', () => {
      const total = budgetService.getTotalRemainingAmount();
      expect(total).toBe(170); // 120 (Food) + 50 (Transportation)
    });

    it('should get over-budget categories', () => {
      const now = new Date();
      // Create over-budget scenario
      const overBudgetTransactions = [
        {
          id: '7',
          date: new Date(now.getFullYear(), now.getMonth(), 15),
          amount: 300,
          description: 'Over budget',
          category: 'Food',
          accountId: 'acc1',
          type: 'expense' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      budgetService.updateTransactions(overBudgetTransactions);
      const overBudget = budgetService.getOverBudgetCategories();
      
      expect(overBudget).toHaveLength(1);
      expect(overBudget[0].category).toBe('Food');
    });

    it('should get budgets by status', () => {
      const safeBudgets = budgetService.getBudgetsByStatus('safe');
      expect(safeBudgets.length).toBeGreaterThan(0);
    });

    it('should get used categories', () => {
      const categories = budgetService.getUsedCategories();
      expect(categories).toContain('Food');
      expect(categories).toContain('Transportation');
    });

    it('should check if category has budget', () => {
      expect(budgetService.hasBudgetForCategory('Food')).toBe(true);
      expect(budgetService.hasBudgetForCategory('NonExistent')).toBe(false);
    });
  });

  describe('Statistics and Reporting', () => {
    it('should generate budget statistics', () => {
      const stats = budgetService.getBudgetStatistics();
      
      expect(stats.totalBudgets).toBe(2);
      expect(stats.activeBudgets).toBe(2);
      expect(stats.totalBudgeted).toBe(350);
      expect(stats.totalSpent).toBe(180);
      expect(stats.totalRemaining).toBe(170);
      expect(stats.averageUtilization).toBeCloseTo(51.43, 1);
      expect(stats.overBudgetCount).toBe(0);
    });
  });

  describe('Export/Import', () => {
    it('should export budgets', () => {
      const exported = budgetService.exportBudgets();
      expect(exported).toHaveLength(2);
      expect(exported[0]).toHaveProperty('id');
      expect(exported[0]).toHaveProperty('category');
    });

    it('should import valid budgets', () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-29T23:59:59.999Z');
      
      const newBudgets: IBudget[] = [
        {
          id: 'new1',
          category: 'Health',
          limit: 100,
          period: 'monthly',
          startDate: startDate,
          endDate: endDate,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      budgetService.importBudgets(newBudgets);
      const budgets = budgetService.getBudgets();
      
      expect(budgets).toHaveLength(1);
      expect(budgets[0].category).toBe('Health');
    });

    it('should throw error when importing invalid budgets', () => {
      const invalidBudgets = [
        {
          id: 'invalid1',
          category: '',
          limit: -100,
          period: 'monthly',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-29'),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ] as IBudget[];

      expect(() => budgetService.importBudgets(invalidBudgets)).toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate budget data', () => {
      const validData = {
        category: 'Test',
        limit: 100,
        period: 'monthly' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true
      };

      const result = budgetService.validateBudgetData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid data', () => {
      const invalidData = {
        category: '',
        limit: -100,
        period: 'invalid' as any,
        startDate: new Date(),
        endDate: new Date(),
        isActive: true
      };

      const result = budgetService.validateBudgetData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});