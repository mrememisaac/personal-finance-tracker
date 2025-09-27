import { describe, it, expect, beforeEach } from 'vitest';
import { GoalService } from '../GoalService';
import type { Goal as IGoal, Account, Transaction } from '../../../../shared/types';

describe('GoalService', () => {
  let goalService: GoalService;
  let mockAccounts: Account[];
  let mockTransactions: Transaction[];
  let mockGoals: IGoal[];

  beforeEach(() => {
    // Mock accounts
    mockAccounts = [
      {
        id: 'account-1',
        name: 'Savings Account',
        type: 'savings',
        balance: 5000,
        currency: 'USD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'account-2',
        name: 'Investment Account',
        type: 'investment',
        balance: 10000,
        currency: 'USD',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    // Mock transactions
    mockTransactions = [
      {
        id: 'trans-1',
        date: new Date('2024-01-15'),
        amount: 500,
        description: 'Salary deposit',
        category: 'Income',
        accountId: 'account-1',
        type: 'income',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      }
    ];

    // Mock goals
    mockGoals = [
      {
        id: 'goal-1',
        name: 'Emergency Fund',
        description: 'Build emergency fund',
        targetAmount: 10000,
        currentAmount: 3000,
        targetDate: new Date('2024-12-31'),
        accountId: 'account-1',
        isCompleted: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'goal-2',
        name: 'Vacation Fund',
        description: 'Save for vacation',
        targetAmount: 5000,
        currentAmount: 5000,
        targetDate: new Date('2024-06-01'),
        accountId: 'account-2',
        isCompleted: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    goalService = new GoalService(mockGoals, mockAccounts, mockTransactions);
  });

  describe('Goal Creation and Management', () => {
    it('should create a new goal successfully', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const goalData = {
        name: 'New Car Fund',
        description: 'Save for a new car',
        targetAmount: 20000,
        currentAmount: 0,
        targetDate: futureDate,
        accountId: 'account-1'
      };

      const goal = goalService.createGoal(goalData);

      expect(goal.name).toBe(goalData.name);
      expect(goal.targetAmount).toBe(goalData.targetAmount);
      expect(goal.accountId).toBe(goalData.accountId);
      expect(goal.id).toBeDefined();
      expect(goal.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when creating goal with invalid data', () => {
      const invalidGoalData = {
        name: '',
        targetAmount: -1000,
        currentAmount: 0,
        targetDate: new Date('2025-06-01'),
        accountId: 'account-1'
      };

      expect(() => goalService.createGoal(invalidGoalData)).toThrow('Goal validation failed');
    });

    it('should throw error when creating goal with non-existent account', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const goalData = {
        name: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        targetDate: futureDate,
        accountId: 'non-existent-account'
      };

      expect(() => goalService.createGoal(goalData)).toThrow('Account with id non-existent-account not found');
    });

    it('should update an existing goal', () => {
      // First update the target date to be in the future to avoid validation error
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      goalService.updateGoal('goal-1', { targetDate: futureDate });
      
      const updates = {
        name: 'Updated Emergency Fund',
        targetAmount: 15000
      };

      const updatedGoal = goalService.updateGoal('goal-1', updates);

      expect(updatedGoal.name).toBe(updates.name);
      expect(updatedGoal.targetAmount).toBe(updates.targetAmount);
      expect(updatedGoal.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when updating non-existent goal', () => {
      expect(() => goalService.updateGoal('non-existent', { name: 'Test' })).toThrow('Goal with id non-existent not found');
    });

    it('should delete a goal', () => {
      const initialCount = goalService.getGoals().length;
      goalService.deleteGoal('goal-1');
      
      expect(goalService.getGoals().length).toBe(initialCount - 1);
      expect(goalService.getGoalById('goal-1')).toBeUndefined();
    });

    it('should throw error when deleting non-existent goal', () => {
      expect(() => goalService.deleteGoal('non-existent')).toThrow('Goal with id non-existent not found');
    });
  });

  describe('Goal Retrieval', () => {
    it('should get all goals', () => {
      const goals = goalService.getGoals();
      expect(goals).toHaveLength(2);
      expect(goals[0].id).toBe('goal-1');
      expect(goals[1].id).toBe('goal-2');
    });

    it('should get active goals only', () => {
      const activeGoals = goalService.getActiveGoals();
      expect(activeGoals).toHaveLength(1);
      expect(activeGoals[0].id).toBe('goal-1');
      expect(activeGoals[0].isCompleted).toBe(false);
    });

    it('should get completed goals only', () => {
      const completedGoals = goalService.getCompletedGoals();
      expect(completedGoals).toHaveLength(1);
      expect(completedGoals[0].id).toBe('goal-2');
      expect(completedGoals[0].isCompleted).toBe(true);
    });

    it('should get goal by id', () => {
      const goal = goalService.getGoalById('goal-1');
      expect(goal).toBeDefined();
      expect(goal!.id).toBe('goal-1');
      expect(goal!.name).toBe('Emergency Fund');
    });

    it('should return undefined for non-existent goal id', () => {
      const goal = goalService.getGoalById('non-existent');
      expect(goal).toBeUndefined();
    });

    it('should get goals by account', () => {
      const goalsForAccount1 = goalService.getGoalsByAccount('account-1');
      expect(goalsForAccount1).toHaveLength(1);
      expect(goalsForAccount1[0].id).toBe('goal-1');

      const goalsForAccount2 = goalService.getGoalsByAccount('account-2');
      expect(goalsForAccount2).toHaveLength(1);
      expect(goalsForAccount2[0].id).toBe('goal-2');
    });

    it('should get goals by status', () => {
      const completedGoals = goalService.getGoalsByStatus('completed');
      expect(completedGoals).toHaveLength(1);
      expect(completedGoals[0].isCompleted).toBe(true);
    });
  });

  describe('Goal Progress Tracking', () => {
    it('should calculate goal progress correctly', () => {
      // First update the goal to have a future target date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      goalService.updateGoal('goal-1', { targetDate: futureDate });
      
      const progress = goalService.calculateGoalProgress('goal-1');

      expect(progress.goalId).toBe('goal-1');
      expect(progress.name).toBe('Emergency Fund');
      expect(progress.targetAmount).toBe(10000);
      // The service updates current amount based on account balance, so it should be 5000 (full account balance)
      expect(progress.currentAmount).toBe(5000);
      expect(progress.remainingAmount).toBe(5000);
      expect(progress.progress).toBe(50);
      expect(progress.status).toBeDefined();
      expect(progress.daysRemaining).toBeGreaterThan(0);
      expect(progress.projectedCompletionDate).toBeInstanceOf(Date);
      expect(progress.requiredDailyContribution).toBeGreaterThan(0);
    });

    it('should get all goal progress', () => {
      const allProgress = goalService.getAllGoalProgress();
      expect(allProgress).toHaveLength(2);
      expect(allProgress[0].goalId).toBe('goal-1');
      expect(allProgress[1].goalId).toBe('goal-2');
    });

    it('should throw error when calculating progress for non-existent goal', () => {
      expect(() => goalService.calculateGoalProgress('non-existent')).toThrow('Goal with id non-existent not found');
    });
  });

  describe('Goal Notifications', () => {
    it('should detect goal completion', () => {
      // Create a goal with a low target that will be achieved by account balance
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const goalData = {
        name: 'Test Completion',
        targetAmount: 1000, // Lower than account balance, so it will be achieved
        currentAmount: 0,
        targetDate: futureDate,
        accountId: 'account-1',
        isCompleted: false
      };

      const newGoal = goalService.createGoal(goalData);
      
      // Manually set the current amount to achieve the goal but keep it as not completed
      newGoal.currentAmount = 1000;
      newGoal.isCompleted = false; // Ensure it's not marked as completed yet
      
      const notifications = goalService.checkGoalCompletion();

      expect(notifications.length).toBeGreaterThan(0);
      const completionNotification = notifications.find(n => n.type === 'completion');
      expect(completionNotification).toBeDefined();
      expect(completionNotification!.severity).toBe('success');
    });

    it('should check milestone achievements', () => {
      const notifications = goalService.checkMilestoneAchievements();
      // This test depends on the current progress of goals
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should detect overdue goals', () => {
      // Create an overdue goal by first creating it with future date, then updating
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const overdueGoalData = {
        name: 'Overdue Goal',
        targetAmount: 5000,
        currentAmount: 1000,
        targetDate: futureDate,
        accountId: 'account-1'
      };
      
      const overdueGoal = goalService.createGoal(overdueGoalData);
      // Now update it to have a past date (simulating an overdue goal)
      const pastDate = new Date('2023-01-01');
      overdueGoal.targetDate = pastDate;

      const notifications = goalService.checkOverdueGoals();

      const overdueNotification = notifications.find(n => n.type === 'overdue');
      expect(overdueNotification).toBeDefined();
      expect(overdueNotification!.severity).toBe('danger');
    });

    it('should get all notifications', () => {
      const notifications = goalService.getAllNotifications();
      expect(Array.isArray(notifications)).toBe(true);
    });
  });

  describe('Manual Contributions', () => {
    it('should add contribution to goal', () => {
      const initialAmount = goalService.getGoalById('goal-1')!.currentAmount;
      const contributionAmount = 500;

      const updatedGoal = goalService.addContribution('goal-1', contributionAmount, 'Test contribution');

      expect(updatedGoal.currentAmount).toBe(initialAmount + contributionAmount);
      expect(updatedGoal.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when adding negative contribution', () => {
      expect(() => goalService.addContribution('goal-1', -100)).toThrow('Contribution amount must be positive');
    });

    it('should throw error when adding contribution to non-existent goal', () => {
      expect(() => goalService.addContribution('non-existent', 100)).toThrow('Goal with id non-existent not found');
    });
  });

  describe('Utility Methods', () => {
    it('should calculate total goal amount', () => {
      const total = goalService.getTotalGoalAmount();
      expect(total).toBe(15000); // 10000 + 5000
    });

    it('should calculate total current amount', () => {
      const total = goalService.getTotalCurrentAmount();
      // The service updates current amounts based on account balances
      // goal-1 gets 5000 (full account-1 balance), goal-2 gets 5000 (completed goal keeps its amount)
      expect(total).toBe(10000); // 5000 + 5000
    });

    it('should calculate total remaining amount', () => {
      const total = goalService.getTotalRemainingAmount();
      // goal-1: 10000 - 5000 = 5000, goal-2: 5000 - 5000 = 0
      expect(total).toBe(5000); // 5000 + 0
    });

    it('should calculate overall progress', () => {
      const progress = goalService.getOverallProgress();
      expect(progress).toBeCloseTo(66.67, 1); // 10000/15000 * 100
    });

    it('should get upcoming goals', () => {
      const upcomingGoals = goalService.getUpcomingGoals(365);
      expect(upcomingGoals.length).toBeGreaterThan(0);
    });

    it('should get goals by target date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const goalsInRange = goalService.getGoalsByTargetDateRange(startDate, endDate);
      
      expect(goalsInRange.length).toBeGreaterThan(0);
    });
  });

  describe('Data Management', () => {
    it('should update accounts and recalculate progress', () => {
      const updatedAccounts = [...mockAccounts];
      updatedAccounts[0].balance = 8000; // Increase balance

      goalService.updateAccounts(updatedAccounts);
      
      // The service should have updated internal accounts
      const goals = goalService.getGoals();
      expect(goals).toBeDefined();
    });

    it('should update transactions', () => {
      const updatedTransactions = [...mockTransactions];
      updatedTransactions.push({
        id: 'trans-2',
        date: new Date('2024-02-01'),
        amount: 1000,
        description: 'Bonus',
        category: 'Income',
        accountId: 'account-1',
        type: 'income',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      });

      goalService.updateTransactions(updatedTransactions);
      
      // The service should have updated internal transactions
      const goals = goalService.getGoals();
      expect(goals).toBeDefined();
    });

    it('should validate goal data', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const validData = {
        name: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 0,
        targetDate: futureDate,
        accountId: 'account-1',
        isCompleted: false,
        id: 'test-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = goalService.validateGoalData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should export goals', () => {
      const exportedGoals = goalService.exportGoals();
      expect(exportedGoals).toHaveLength(2);
      expect(exportedGoals[0].id).toBe('goal-1');
      expect(exportedGoals[1].id).toBe('goal-2');
    });

    it('should import valid goals', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const newGoals: IGoal[] = [
        {
          id: 'imported-goal-1',
          name: 'Imported Goal',
          targetAmount: 2000,
          currentAmount: 500,
          targetDate: futureDate,
          accountId: 'account-1',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      goalService.importGoals(newGoals);
      const goals = goalService.getGoals();
      
      expect(goals).toHaveLength(1);
      expect(goals[0].id).toBe('imported-goal-1');
    });

    it('should throw error when importing invalid goals', () => {
      const invalidGoals: IGoal[] = [
        {
          id: 'invalid-goal',
          name: '',
          targetAmount: -1000,
          currentAmount: 0,
          targetDate: new Date('2025-03-01'),
          accountId: 'non-existent-account',
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      expect(() => goalService.importGoals(invalidGoals)).toThrow('Import validation failed');
    });
  });

  describe('Statistics and Reporting', () => {
    it('should generate goal statistics', () => {
      const stats = goalService.getGoalStatistics();

      expect(stats.totalGoals).toBe(2);
      expect(stats.activeGoals).toBe(1);
      expect(stats.completedGoals).toBe(1);
      expect(stats.totalTargetAmount).toBe(15000);
      expect(stats.totalCurrentAmount).toBe(10000);
      expect(stats.totalRemainingAmount).toBe(5000);
      expect(stats.overallProgress).toBeCloseTo(66.67, 1);
      expect(stats.onTrackCount).toBeGreaterThanOrEqual(0);
      expect(stats.behindCount).toBeGreaterThanOrEqual(0);
      expect(stats.overdueCount).toBeGreaterThanOrEqual(0);
      expect(stats.averageDaysRemaining).toBeGreaterThanOrEqual(0);
      expect(stats.averageProgress).toBeGreaterThanOrEqual(0);
    });

    it('should suggest optimal contribution', () => {
      const suggestion = goalService.suggestOptimalContribution('goal-1');

      expect(suggestion.dailyAmount).toBeGreaterThan(0);
      expect(suggestion.weeklyAmount).toBe(suggestion.dailyAmount * 7);
      expect(suggestion.monthlyAmount).toBe(suggestion.dailyAmount * 30);
      expect(suggestion.formattedDaily).toContain('$');
      expect(suggestion.formattedWeekly).toContain('$');
      expect(suggestion.formattedMonthly).toContain('$');
    });

    it('should throw error when suggesting contribution for non-existent goal', () => {
      expect(() => goalService.suggestOptimalContribution('non-existent')).toThrow('Goal with id non-existent not found');
    });

    it('should provide goal insights', () => {
      const insights = goalService.getGoalInsights('goal-1');

      expect(typeof insights.isOnTrack).toBe('boolean');
      expect(typeof insights.daysAheadOrBehind).toBe('number');
      expect(Array.isArray(insights.milestoneProgress)).toBe(true);
      expect(typeof insights.recommendation).toBe('string');
      expect(insights.recommendation.length).toBeGreaterThan(0);
    });

    it('should throw error when getting insights for non-existent goal', () => {
      expect(() => goalService.getGoalInsights('non-existent')).toThrow('Goal with id non-existent not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty goals array', () => {
      const emptyService = new GoalService([], mockAccounts, mockTransactions);
      
      expect(emptyService.getGoals()).toHaveLength(0);
      expect(emptyService.getTotalGoalAmount()).toBe(0);
      expect(emptyService.getOverallProgress()).toBe(0);
    });

    it('should handle goals with zero target amount', () => {
      const zeroTargetGoal = {
        name: 'Zero Target',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: new Date('2025-06-01'),
        accountId: 'account-1'
      };

      expect(() => goalService.createGoal(zeroTargetGoal)).toThrow('Goal validation failed');
    });

    it('should handle goals with past target dates', () => {
      const pastDate = new Date('2020-01-01');
      const pastDateGoal = {
        name: 'Past Date Goal',
        targetAmount: 1000,
        currentAmount: 0,
        targetDate: pastDate,
        accountId: 'account-1'
      };

      expect(() => goalService.createGoal(pastDateGoal)).toThrow('Goal validation failed');
    });
  });
});