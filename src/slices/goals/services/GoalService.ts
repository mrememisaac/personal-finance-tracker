import type { Goal as IGoal, Account, Transaction, ValidationResult } from '../../../shared/types';
import { Goal } from '../Goal';

export interface GoalProgress {
  goalId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progress: number;
  status: 'completed' | 'on-track' | 'behind' | 'overdue';
  daysRemaining: number;
  projectedCompletionDate: Date;
  requiredDailyContribution: number;
}

export interface GoalNotification {
  goalId: string;
  name: string;
  type: 'milestone' | 'completion' | 'overdue' | 'behind-schedule';
  message: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
}

export class GoalService {
  private goals: Goal[] = [];
  private accounts: Account[] = [];

  constructor(goals: IGoal[] = [], accounts: Account[] = []) {
    this.goals = goals.map(goal => new Goal(goal));
    this.accounts = accounts;
    this.updateAllGoalProgress();
  }

  // Goal creation and management methods
  createGoal(goalData: Omit<IGoal, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted'> & { isCompleted?: boolean }): Goal {
    const validation = Goal.validate({
      ...goalData,
      isCompleted: goalData.isCompleted || false,
      id: 'temp',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (!validation.isValid) {
      throw new Error(`Goal validation failed: ${validation.errors.join(', ')}`);
    }

    // Verify account exists
    const account = this.getAccountById(goalData.accountId);
    if (!account) {
      throw new Error(`Account with id ${goalData.accountId} not found`);
    }

    const goal = Goal.create(goalData);
    this.goals.push(goal);
    this.updateGoalProgress(goal.id);

    return goal;
  }

  updateGoal(id: string, updates: Partial<IGoal>): Goal {
    const goal = this.getGoalById(id);
    if (!goal) {
      throw new Error(`Goal with id ${id} not found`);
    }

    // If updating accountId, verify the account exists
    if (updates.accountId && updates.accountId !== goal.accountId) {
      const account = this.getAccountById(updates.accountId);
      if (!account) {
        throw new Error(`Account with id ${updates.accountId} not found`);
      }
    }

    const validation = goal.update(updates);
    if (!validation.isValid) {
      throw new Error(`Goal update validation failed: ${validation.errors.join(', ')}`);
    }

    this.updateGoalProgress(id);
    return goal;
  }

  deleteGoal(id: string): void {
    const index = this.goals.findIndex(goal => goal.id === id);
    if (index === -1) {
      throw new Error(`Goal with id ${id} not found`);
    }

    this.goals.splice(index, 1);
  }

  getGoals(): Goal[] {
    return [...this.goals];
  }

  getActiveGoals(): Goal[] {
    return this.goals.filter(goal => !goal.isCompleted);
  }

  getCompletedGoals(): Goal[] {
    return this.goals.filter(goal => goal.isCompleted);
  }

  getGoalById(id: string): Goal | undefined {
    return this.goals.find(goal => goal.id === id);
  }

  getGoalsByAccount(accountId: string): Goal[] {
    return this.goals.filter(goal => goal.accountId === accountId);
  }

  getGoalsByStatus(status: 'completed' | 'on-track' | 'behind' | 'overdue'): Goal[] {
    return this.goals.filter(goal => goal.getStatus() === status);
  }

  // Automatic goal progress updates based on account balances
  updateAccounts(accounts: Account[]): void {
    this.accounts = accounts;
    this.updateAllGoalProgress();
  }

  updateTransactions(_transactions: Transaction[]): void {
    // TODO: Store and use transactions when implementing transaction-based progress
    this.updateAllGoalProgress();
  }

  private updateAllGoalProgress(): void {
    this.goals.forEach(goal => {
      this.updateGoalProgress(goal.id);
    });
  }

  private updateGoalProgress(goalId: string): void {
    const goal = this.getGoalById(goalId);
    if (!goal || goal.isCompleted) return;

    const account = this.getAccountById(goal.accountId);
    if (!account) return;

    // Update current amount based on account balance
    // For savings goals, the current amount should reflect the account balance
    // or a portion of it dedicated to this goal
    const dedicatedAmount = this.calculateDedicatedAmount(goal, account);

    if (dedicatedAmount !== goal.currentAmount) {
      goal.setCurrentAmount(dedicatedAmount);
    }
  }

  private calculateDedicatedAmount(goal: Goal, account: Account): number {
    // For now, we'll use a simple approach where the current amount
    // is based on the account balance, but in a real app this might
    // involve more complex logic to track dedicated savings

    // If this is the only goal for this account, use the full balance
    const goalsForAccount = this.getGoalsByAccount(account.id).filter(g => !g.isCompleted);

    if (goalsForAccount.length === 1) {
      return Math.min(account.balance, goal.targetAmount);
    }

    // If multiple goals, distribute proportionally based on target amounts
    const totalTargetAmount = goalsForAccount.reduce((sum, g) => sum + g.targetAmount, 0);
    const goalProportion = goal.targetAmount / totalTargetAmount;
    const dedicatedAmount = account.balance * goalProportion;

    return Math.min(dedicatedAmount, goal.targetAmount);
  }

  // Goal completion detection and notifications
  checkGoalCompletion(): GoalNotification[] {
    const notifications: GoalNotification[] = [];

    this.goals.forEach(goal => {
      if (goal.isAchieved && !goal.isCompleted) {
        // Mark as completed and create notification
        goal.markAsCompleted();
        notifications.push({
          goalId: goal.id,
          name: goal.name,
          type: 'completion',
          message: `Congratulations! You've achieved your goal "${goal.name}"!`,
          severity: 'success'
        });
      }
    });

    return notifications;
  }

  checkMilestoneAchievements(): GoalNotification[] {
    const notifications: GoalNotification[] = [];

    this.getActiveGoals().forEach(goal => {
      const milestones = goal.getMilestones();
      const lastAchievedMilestone = milestones
        .filter(m => m.achieved)
        .sort((a, b) => b.percentage - a.percentage)[0];

      if (lastAchievedMilestone && lastAchievedMilestone.percentage < 100) {
        // Check if this is a new milestone (this would require tracking in a real app)
        notifications.push({
          goalId: goal.id,
          name: goal.name,
          type: 'milestone',
          message: `Great progress! You've reached ${lastAchievedMilestone.percentage}% of your goal "${goal.name}"`,
          severity: 'info'
        });
      }
    });

    return notifications;
  }

  checkOverdueGoals(): GoalNotification[] {
    const notifications: GoalNotification[] = [];

    this.getActiveGoals().forEach(goal => {
      if (goal.isOverdue) {
        notifications.push({
          goalId: goal.id,
          name: goal.name,
          type: 'overdue',
          message: `Goal "${goal.name}" is overdue. Consider adjusting your target date or increasing contributions.`,
          severity: 'danger'
        });
      } else if (!goal.isOnTrack && goal.daysRemaining <= 30) {
        notifications.push({
          goalId: goal.id,
          name: goal.name,
          type: 'behind-schedule',
          message: `Goal "${goal.name}" is behind schedule. You need ${goal.formattedRequiredDailyContribution} per day to stay on track.`,
          severity: 'warning'
        });
      }
    });

    return notifications;
  }

  getAllNotifications(): GoalNotification[] {
    return [
      ...this.checkGoalCompletion(),
      ...this.checkMilestoneAchievements(),
      ...this.checkOverdueGoals()
    ];
  }

  // Goal progress tracking methods
  calculateGoalProgress(goalId: string): GoalProgress {
    const goal = this.getGoalById(goalId);
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`);
    }

    return {
      goalId: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remainingAmount: goal.remainingAmount,
      progress: goal.progress,
      status: goal.getStatus(),
      daysRemaining: goal.daysRemaining,
      projectedCompletionDate: goal.projectedCompletionDate,
      requiredDailyContribution: goal.requiredDailyContribution
    };
  }

  getAllGoalProgress(): GoalProgress[] {
    return this.goals.map(goal => this.calculateGoalProgress(goal.id));
  }

  // Manual contribution methods
  addContribution(goalId: string, amount: number, description?: string): Goal {
    const goal = this.getGoalById(goalId);
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`);
    }

    if (amount <= 0) {
      throw new Error('Contribution amount must be positive');
    }

    goal.addContribution(amount);

    // Optionally create a transaction record for the contribution
    if (description) {
      // TODO: Create transaction record when transaction service is available
      /*
      const transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        date: new Date(),
        amount: amount,
        description: description || `Contribution to goal: ${goal.name}`,
        category: 'Savings',
        accountId: goal.accountId,
        type: 'income',
        tags: ['goal-contribution', `goal-${goalId}`]
      };
      */

      // In a real app, this would be handled by the transaction service
      // For now, we'll just update the goal
    }

    return goal;
  }

  // Utility methods
  private getAccountById(accountId: string): Account | undefined {
    return this.accounts.find(account => account.id === accountId);
  }

  getTotalGoalAmount(): number {
    return this.goals.reduce((total, goal) => total + goal.targetAmount, 0);
  }

  getTotalCurrentAmount(): number {
    return this.goals.reduce((total, goal) => total + goal.currentAmount, 0);
  }

  getTotalRemainingAmount(): number {
    return this.goals.reduce((total, goal) => total + goal.remainingAmount, 0);
  }

  getOverallProgress(): number {
    const totalTarget = this.getTotalGoalAmount();
    const totalCurrent = this.getTotalCurrentAmount();

    if (totalTarget === 0) return 0;
    return Math.min(100, (totalCurrent / totalTarget) * 100);
  }

  // Category and account management
  getGoalsByTargetDateRange(startDate: Date, endDate: Date): Goal[] {
    return this.goals.filter(goal =>
      goal.targetDate >= startDate && goal.targetDate <= endDate
    );
  }

  getUpcomingGoals(days: number = 30): Goal[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.getActiveGoals().filter(goal =>
      goal.targetDate <= futureDate
    ).sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
  }

  // Validation helpers
  validateGoalData(data: Partial<IGoal>): ValidationResult {
    return Goal.validate(data);
  }

  // Export/Import functionality
  exportGoals(): IGoal[] {
    return this.goals.map(goal => goal.toJSON());
  }

  importGoals(goals: IGoal[]): void {
    const validGoals: Goal[] = [];
    const errors: string[] = [];

    goals.forEach((goalData, index) => {
      const validation = Goal.validate(goalData);
      if (validation.isValid) {
        // Verify account exists
        const account = this.getAccountById(goalData.accountId);
        if (account) {
          validGoals.push(new Goal(goalData));
        } else {
          errors.push(`Goal ${index + 1}: Account with id ${goalData.accountId} not found`);
        }
      } else {
        errors.push(`Goal ${index + 1}: ${validation.errors.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Import validation failed:\n${errors.join('\n')}`);
    }

    this.goals = validGoals;
    this.updateAllGoalProgress();
  }

  // Statistics and reporting
  getGoalStatistics(): {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    totalRemainingAmount: number;
    overallProgress: number;
    onTrackCount: number;
    behindCount: number;
    overdueCount: number;
    averageDaysRemaining: number;
    averageProgress: number;
  } {
    const activeGoals = this.getActiveGoals();
    const completedGoals = this.getCompletedGoals();

    const totalDaysRemaining = activeGoals.reduce((sum, goal) => sum + goal.daysRemaining, 0);
    const totalProgress = this.goals.reduce((sum, goal) => sum + goal.progress, 0);

    return {
      totalGoals: this.goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalTargetAmount: this.getTotalGoalAmount(),
      totalCurrentAmount: this.getTotalCurrentAmount(),
      totalRemainingAmount: this.getTotalRemainingAmount(),
      overallProgress: this.getOverallProgress(),
      onTrackCount: this.getGoalsByStatus('on-track').length,
      behindCount: this.getGoalsByStatus('behind').length,
      overdueCount: this.getGoalsByStatus('overdue').length,
      averageDaysRemaining: activeGoals.length > 0 ? totalDaysRemaining / activeGoals.length : 0,
      averageProgress: this.goals.length > 0 ? totalProgress / this.goals.length : 0
    };
  }

  // Goal recommendation methods
  suggestOptimalContribution(goalId: string): {
    dailyAmount: number;
    weeklyAmount: number;
    monthlyAmount: number;
    formattedDaily: string;
    formattedWeekly: string;
    formattedMonthly: string;
  } {
    const goal = this.getGoalById(goalId);
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`);
    }

    const dailyAmount = goal.requiredDailyContribution;
    const weeklyAmount = dailyAmount * 7;
    const monthlyAmount = dailyAmount * 30;

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });

    return {
      dailyAmount,
      weeklyAmount,
      monthlyAmount,
      formattedDaily: formatter.format(dailyAmount),
      formattedWeekly: formatter.format(weeklyAmount),
      formattedMonthly: formatter.format(monthlyAmount)
    };
  }

  getGoalInsights(goalId: string): {
    isOnTrack: boolean;
    daysAheadOrBehind: number;
    milestoneProgress: { percentage: number; achieved: boolean; formattedAmount: string }[];
    recommendation: string;
  } {
    const goal = this.getGoalById(goalId);
    if (!goal) {
      throw new Error(`Goal with id ${goalId} not found`);
    }

    const projectedDate = goal.projectedCompletionDate;
    const targetDate = goal.targetDate;
    const daysDifference = Math.ceil((projectedDate.getTime() - targetDate.getTime()) / (1000 * 3600 * 24));

    let recommendation = '';
    if (goal.isCompleted) {
      recommendation = 'Congratulations! You have achieved this goal.';
    } else if (goal.isOverdue) {
      recommendation = 'This goal is overdue. Consider extending the target date or increasing your contributions.';
    } else if (daysDifference > 0) {
      recommendation = `You're behind schedule by ${daysDifference} days. Consider increasing your daily contribution to ${goal.formattedRequiredDailyContribution}.`;
    } else if (daysDifference < -7) {
      recommendation = `You're ahead of schedule! You could reduce your contributions or set a more ambitious target.`;
    } else {
      recommendation = 'You\'re on track to meet your goal. Keep up the great work!';
    }

    return {
      isOnTrack: goal.isOnTrack,
      daysAheadOrBehind: -daysDifference, // Negative means behind, positive means ahead
      milestoneProgress: goal.getMilestones(),
      recommendation
    };
  }
}