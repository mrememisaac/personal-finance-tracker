import type { AppState, AppAction, Goal as IGoal } from '../../shared/types';
import { Goal } from './Goal';
import type { AccountService } from '../accounts/AccountService';

export class GoalService {
  private accountService?: AccountService;
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  constructor(
    state: AppState,
    dispatch: React.Dispatch<AppAction>
  ) {
    this.state = state;
    this.dispatch = dispatch;
  }

  setAccountService(accountService: AccountService) {
    this.accountService = accountService;
  }

  createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Goal {
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dispatch({
      type: 'ADD_GOAL',
      payload: newGoal,
    });

    return newGoal;
  }

  updateGoal(id: string, updates: Partial<IGoal>): Goal | null {
    const existingGoal = this.state.goals.find(g => g.id === id);
    if (!existingGoal) return null;

    const updatedGoalData = { ...existingGoal, ...updates, updatedAt: new Date() };

    this.dispatch({
      type: 'UPDATE_GOAL',
      payload: { id, updates: { ...updates, updatedAt: new Date() } },
    });

    return new Goal(updatedGoalData);
  }

  deleteGoal(id: string): boolean {
    const goal = this.state.goals.find(g => g.id === id);
    if (!goal) return false;

    this.dispatch({
      type: 'DELETE_GOAL',
      payload: id,
    });

    return true;
  }

  getGoals(): Goal[] {
    return [...this.state.goals].sort((a, b) => {
      // Sort by completion status first, then by target date
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return a.targetDate.getTime() - b.targetDate.getTime();
    }).map(goal => new Goal(goal));
  }

  getGoalById(id: string): Goal | undefined {
    const goal = this.state.goals.find(g => g.id === id);
    return goal ? new Goal(goal) : undefined;
  }

  calculateGoalProgress(goalId: string): {
    progress: number;
    remainingAmount: number;
    projectedCompletionDate: Date | null;
    isCompleted: boolean;
    daysRemaining: number;
  } {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (!goal) {
      return {
        progress: 0,
        remainingAmount: 0,
        projectedCompletionDate: null,
        isCompleted: false,
        daysRemaining: 0,
      };
    }

    // Get current account balance if accountService is available
    let currentAmount = goal.currentAmount;
    if (this.accountService && goal.accountId) {
      const account = this.accountService.getAccountById(goal.accountId);
      if (account) {
        currentAmount = account.balance;
      }
    }

    const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
    const remainingAmount = Math.max(0, goal.targetAmount - currentAmount);
    const isCompleted = currentAmount >= goal.targetAmount;

    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate projected completion date based on current progress
    let projectedCompletionDate: Date | null = null;
    if (!isCompleted && remainingAmount > 0) {
      const daysSinceCreation = Math.max(1, Math.ceil((now.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      const averageDailyProgress = currentAmount / daysSinceCreation;

      if (averageDailyProgress > 0) {
        const daysToCompletion = remainingAmount / averageDailyProgress;
        projectedCompletionDate = new Date(now.getTime() + (daysToCompletion * 24 * 60 * 60 * 1000));
      }
    }

    return {
      progress,
      remainingAmount,
      projectedCompletionDate,
      isCompleted,
      daysRemaining,
    };
  }

  updateGoalProgress(goalId: string, newAmount: number): void {
    const goal = this.getGoalById(goalId);
    if (!goal) return;

    const wasCompleted = goal.isCompleted;
    const isNowCompleted = newAmount >= goal.targetAmount;

    this.updateGoal(goalId, {
      currentAmount: newAmount,
      isCompleted: isNowCompleted,
    });

    // If goal just became completed, could trigger a celebration or notification
    if (!wasCompleted && isNowCompleted) {
      console.log(`Congratulations! Goal "${goal.name}" has been completed!`);
    }
  }

  getGoalSummary(): {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    overallProgress: number;
  } {
    const goals = this.getGoals();
    const completedGoals = goals.filter(g => g.isCompleted).length;
    const activeGoals = goals.filter(g => !g.isCompleted).length;

    let totalTargetAmount = 0;
    let totalCurrentAmount = 0;

    goals.forEach(goal => {
      totalTargetAmount += goal.targetAmount;

      // Use account balance if available, otherwise use stored current amount
      let currentAmount = goal.currentAmount;
      if (this.accountService && goal.accountId) {
        const account = this.accountService.getAccountById(goal.accountId);
        if (account) {
          currentAmount = account.balance;
        }
      }
      totalCurrentAmount += currentAmount;
    });

    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    return {
      totalGoals: goals.length,
      completedGoals,
      activeGoals,
      totalTargetAmount,
      totalCurrentAmount,
      overallProgress,
    };
  }

  getUpcomingGoalDeadlines(days: number = 30): Goal[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

    return this.state.goals
      .filter(goal => !goal.isCompleted && goal.targetDate >= now && goal.targetDate <= futureDate)
      .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())
      .map(goal => new Goal(goal));
  }

  validateGoalData(goal: Partial<Goal>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!goal.name || goal.name.trim().length === 0) {
      errors.push('Goal name is required');
    }

    if (!goal.targetAmount || goal.targetAmount <= 0) {
      errors.push('Target amount must be greater than 0');
    }

    if (!goal.targetDate || goal.targetDate <= new Date()) {
      errors.push('Target date must be in the future');
    }

    if (goal.currentAmount !== undefined && goal.currentAmount < 0) {
      errors.push('Current amount cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}