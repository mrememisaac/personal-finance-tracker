import type { Budget as IBudget, Transaction, BudgetProgress, BudgetAlert, ValidationResult } from '../../../shared/types';
import { Budget } from '../Budget';

export class BudgetService {
  private budgets: Budget[] = [];
  private transactions: Transaction[] = [];

  constructor(budgets: IBudget[] = [], transactions: Transaction[] = []) {
    this.budgets = budgets.map(budget => new Budget(budget));
    this.transactions = transactions;
    this.updateAllBudgetProgress();
  }

  // Budget creation and management methods
  createBudget(budgetData: Omit<IBudget, 'id' | 'createdAt' | 'updatedAt' | 'endDate'> & { endDate?: Date }): Budget {
    const validation = Budget.validate({
      ...budgetData,
      endDate: budgetData.endDate || Budget.calculateEndDate(budgetData.startDate, budgetData.period),
      id: 'temp',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (!validation.isValid) {
      throw new Error(`Budget validation failed: ${validation.errors.join(', ')}`);
    }

    const budget = Budget.create(budgetData);
    this.budgets.push(budget);
    this.updateBudgetProgress(budget.id);
    
    return budget;
  }

  updateBudget(id: string, updates: Partial<IBudget>): Budget {
    const budget = this.getBudgetById(id);
    if (!budget) {
      throw new Error(`Budget with id ${id} not found`);
    }

    const validation = budget.update(updates);
    if (!validation.isValid) {
      throw new Error(`Budget update validation failed: ${validation.errors.join(', ')}`);
    }

    this.updateBudgetProgress(id);
    return budget;
  }

  deleteBudget(id: string): void {
    const index = this.budgets.findIndex(budget => budget.id === id);
    if (index === -1) {
      throw new Error(`Budget with id ${id} not found`);
    }

    this.budgets.splice(index, 1);
  }

  getBudgets(): Budget[] {
    return [...this.budgets];
  }

  getActiveBudgets(): Budget[] {
    return this.budgets.filter(budget => budget.isActive && budget.isCurrentPeriod);
  }

  getBudgetById(id: string): Budget | undefined {
    return this.budgets.find(budget => budget.id === id);
  }

  getBudgetByCategory(category: string): Budget | undefined {
    return this.budgets.find(budget => 
      budget.category === category && 
      budget.isActive && 
      budget.isCurrentPeriod
    );
  }

  // Automatic budget progress tracking based on transactions
  updateTransactions(transactions: Transaction[]): void {
    this.transactions = transactions;
    this.updateAllBudgetProgress();
  }

  private updateAllBudgetProgress(): void {
    this.budgets.forEach(budget => {
      this.updateBudgetProgress(budget.id);
    });
  }

  private updateBudgetProgress(budgetId: string): void {
    const budget = this.getBudgetById(budgetId);
    if (!budget) return;

    const relevantTransactions = this.getTransactionsForBudget(budget);
    budget.updateSpentAmount(relevantTransactions);
  }

  private getTransactionsForBudget(budget: Budget): Transaction[] {
    return this.transactions.filter(transaction =>
      transaction.category === budget.category &&
      transaction.type === 'expense' &&
      transaction.date >= budget.startDate &&
      transaction.date <= budget.endDate
    );
  }

  // Budget progress calculations
  calculateBudgetProgress(budgetId: string): BudgetProgress {
    const budget = this.getBudgetById(budgetId);
    if (!budget) {
      throw new Error(`Budget with id ${budgetId} not found`);
    }

    return {
      budgetId: budget.id,
      spent: budget.spent,
      remaining: budget.remaining,
      percentage: budget.percentage,
      status: budget.status
    };
  }

  getAllBudgetProgress(): BudgetProgress[] {
    return this.budgets.map(budget => this.calculateBudgetProgress(budget.id));
  }

  // Budget alert system for spending limits
  checkBudgetAlerts(): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];

    this.getActiveBudgets().forEach(budget => {
      const alert = budget.getBudgetAlert();
      if (alert && alert.shouldAlert) {
        alerts.push({
          budgetId: budget.id,
          category: budget.category,
          message: alert.message,
          severity: alert.severity
        });
      }
    });

    return alerts;
  }

  checkBudgetAlertForTransaction(transactionAmount: number, category: string): BudgetAlert | null {
    const budget = this.getBudgetByCategory(category);
    if (!budget) return null;

    if (budget.wouldExceedBudget(transactionAmount)) {
      const newTotal = budget.spent + transactionAmount;
      const newPercentage = (newTotal / budget.limit) * 100;

      return {
        budgetId: budget.id,
        category: budget.category,
        message: `This transaction would put you at ${newPercentage.toFixed(1)}% of your ${category} budget`,
        severity: newPercentage >= 100 ? 'danger' : 'warning'
      };
    }

    return null;
  }

  // Reset budgets for new period
  resetBudgetsForNewPeriod(): Budget[] {
    const expiredBudgets = this.budgets.filter(budget => budget.isExpired && budget.isActive);
    const newBudgets: Budget[] = [];

    expiredBudgets.forEach(expiredBudget => {
      // Create new budget for next period
      const newBudget = expiredBudget.resetForNewPeriod();
      this.budgets.push(newBudget);
      newBudgets.push(newBudget);

      // Deactivate the expired budget
      expiredBudget.update({ isActive: false });
    });

    // Update progress for new budgets
    newBudgets.forEach(budget => {
      this.updateBudgetProgress(budget.id);
    });

    return newBudgets;
  }

  // Utility methods
  getTotalBudgetedAmount(): number {
    return this.getActiveBudgets().reduce((total, budget) => total + budget.limit, 0);
  }

  getTotalSpentAmount(): number {
    return this.getActiveBudgets().reduce((total, budget) => total + budget.spent, 0);
  }

  getTotalRemainingAmount(): number {
    return this.getActiveBudgets().reduce((total, budget) => total + budget.remaining, 0);
  }

  getOverBudgetCategories(): Budget[] {
    return this.getActiveBudgets().filter(budget => budget.isOverBudget);
  }

  getBudgetsByStatus(status: 'safe' | 'warning' | 'danger'): Budget[] {
    return this.getActiveBudgets().filter(budget => budget.status === status);
  }

  // Category management
  getUsedCategories(): string[] {
    return [...new Set(this.budgets.map(budget => budget.category))];
  }

  hasBudgetForCategory(category: string): boolean {
    return this.getBudgetByCategory(category) !== undefined;
  }

  // Validation helpers
  validateBudgetData(data: Partial<IBudget>): ValidationResult {
    return Budget.validate(data);
  }

  // Export/Import functionality
  exportBudgets(): IBudget[] {
    return this.budgets.map(budget => budget.toJSON());
  }

  importBudgets(budgets: IBudget[]): void {
    const validBudgets: Budget[] = [];
    const errors: string[] = [];

    budgets.forEach((budgetData, index) => {
      const validation = Budget.validate(budgetData);
      if (validation.isValid) {
        validBudgets.push(new Budget(budgetData));
      } else {
        errors.push(`Budget ${index + 1}: ${validation.errors.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Import validation failed:\n${errors.join('\n')}`);
    }

    this.budgets = validBudgets;
    this.updateAllBudgetProgress();
  }

  // Statistics and reporting
  getBudgetStatistics(): {
    totalBudgets: number;
    activeBudgets: number;
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
    averageUtilization: number;
    overBudgetCount: number;
    warningCount: number;
    safeCount: number;
  } {
    const activeBudgets = this.getActiveBudgets();
    const totalBudgeted = this.getTotalBudgetedAmount();
    const totalSpent = this.getTotalSpentAmount();

    return {
      totalBudgets: this.budgets.length,
      activeBudgets: activeBudgets.length,
      totalBudgeted,
      totalSpent,
      totalRemaining: this.getTotalRemainingAmount(),
      averageUtilization: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
      overBudgetCount: this.getOverBudgetCategories().length,
      warningCount: this.getBudgetsByStatus('warning').length,
      safeCount: this.getBudgetsByStatus('safe').length
    };
  }
}