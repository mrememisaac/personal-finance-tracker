import type { AppState, AppAction } from '../../shared/types';
import type { Budget } from './Budget';
import type { TransactionService } from '../transaction/TransactionService';

export interface BudgetAlert {
  budgetId: string;
  category: string;
  type: 'warning' | 'danger';
  message: string;
  percentage: number;
}

export class BudgetService {
  private transactionService?: TransactionService;

  constructor(
    private state: AppState,
    private dispatch: React.Dispatch<AppAction>
  ) {}

  setTransactionService(transactionService: TransactionService) {
    this.transactionService = transactionService;
  }

  createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Budget {
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dispatch({
      type: 'ADD_BUDGET',
      payload: newBudget,
    });

    return newBudget;
  }

  updateBudget(id: string, updates: Partial<Budget>): Budget | null {
    const existingBudget = this.state.budgets.find(b => b.id === id);
    if (!existingBudget) return null;

    this.dispatch({
      type: 'UPDATE_BUDGET',
      payload: { id, updates: { ...updates, updatedAt: new Date() } },
    });

    return { ...existingBudget, ...updates, updatedAt: new Date() };
  }

  deleteBudget(id: string): boolean {
    const budget = this.state.budgets.find(b => b.id === id);
    if (!budget) return false;

    this.dispatch({
      type: 'DELETE_BUDGET',
      payload: id,
    });

    return true;
  }

  getBudgets(): Budget[] {
    return [...this.state.budgets].sort((a, b) => a.category.localeCompare(b.category));
  }

  getBudgetByCategory(category: string): Budget | undefined {
    return this.state.budgets.find(b => b.category === category && b.isActive);
  }

  calculateBudgetProgress(budgetId: string): {
    spent: number;
    remaining: number;
    percentage: number;
    status: 'safe' | 'warning' | 'danger';
  } {
    const budget = this.state.budgets.find(b => b.id === budgetId);
    if (!budget) {
      return { spent: 0, remaining: 0, percentage: 0, status: 'safe' };
    }

    // Calculate spent amount from transactions
    const spent = this.calculateSpentInCategory(budget.category, budget.startDate, budget.endDate);
    const remaining = Math.max(0, budget.limit - spent);
    const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (percentage >= 100) {
      status = 'danger';
    } else if (percentage >= 80) {
      status = 'warning';
    }

    return { spent, remaining, percentage, status };
  }

  private calculateSpentInCategory(category: string, startDate: Date, endDate: Date): number {
    if (!this.transactionService) return 0;

    const transactions = this.transactionService.getTransactions({
      category,
      type: 'expense',
      dateRange: { start: startDate, end: endDate },
    });

    return transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  updateBudgetProgress(category: string, amount: number): void {
    const budget = this.getBudgetByCategory(category);
    if (!budget) return;

    // Budget progress is calculated dynamically, no need to store it
    // This method can be used to trigger alerts or notifications
    const progress = this.calculateBudgetProgress(budget.id);
    
    if (progress.status === 'warning' || progress.status === 'danger') {
      // Could emit an event or show a notification here
      console.log(`Budget alert for ${category}: ${progress.percentage.toFixed(1)}% used`);
    }
  }

  checkBudgetAlerts(): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];

    this.state.budgets
      .filter(b => b.isActive)
      .forEach(budget => {
        const progress = this.calculateBudgetProgress(budget.id);
        
        if (progress.percentage >= 100) {
          alerts.push({
            budgetId: budget.id,
            category: budget.category,
            type: 'danger',
            message: `Budget exceeded for ${budget.category}`,
            percentage: progress.percentage,
          });
        } else if (progress.percentage >= 80) {
          alerts.push({
            budgetId: budget.id,
            category: budget.category,
            type: 'warning',
            message: `Budget warning for ${budget.category} (${progress.percentage.toFixed(1)}% used)`,
            percentage: progress.percentage,
          });
        }
      });

    return alerts;
  }

  resetBudgetsForNewPeriod(): void {
    const now = new Date();
    
    this.state.budgets
      .filter(b => b.isActive && b.endDate < now)
      .forEach(budget => {
        let newStartDate: Date;
        let newEndDate: Date;

        if (budget.period === 'monthly') {
          newStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          newEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else { // weekly
          const dayOfWeek = now.getDay();
          newStartDate = new Date(now);
          newStartDate.setDate(now.getDate() - dayOfWeek);
          newEndDate = new Date(newStartDate);
          newEndDate.setDate(newStartDate.getDate() + 6);
        }

        this.updateBudget(budget.id, {
          startDate: newStartDate,
          endDate: newEndDate,
        });
      });
  }

  getBudgetSummary(): {
    totalBudgets: number;
    activeBudgets: number;
    totalLimit: number;
    totalSpent: number;
    overBudgetCount: number;
  } {
    const budgets = this.getBudgets();
    const activeBudgets = budgets.filter(b => b.isActive);
    
    let totalLimit = 0;
    let totalSpent = 0;
    let overBudgetCount = 0;

    activeBudgets.forEach(budget => {
      const progress = this.calculateBudgetProgress(budget.id);
      totalLimit += budget.limit;
      totalSpent += progress.spent;
      if (progress.percentage >= 100) {
        overBudgetCount++;
      }
    });

    return {
      totalBudgets: budgets.length,
      activeBudgets: activeBudgets.length,
      totalLimit,
      totalSpent,
      overBudgetCount,
    };
  }
}