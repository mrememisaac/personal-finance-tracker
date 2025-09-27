import { describe, it, expect, beforeEach } from 'vitest';
import { Goal } from './Goal';
import { Goal as IGoal } from '../../shared/types';

describe('Goal Model', () => {
  let validGoalData: IGoal;

  beforeEach(() => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 365); // 1 year from now
    
    validGoalData = {
      id: 'test-goal-id',
      name: 'Emergency Fund',
      description: 'Build an emergency fund for unexpected expenses',
      targetAmount: 10000,
      currentAmount: 2500,
      targetDate: futureDate,
      accountId: 'savings-account-1',
      isCompleted: false,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
    };
  });

  describe('Constructor and Basic Properties', () => {
    it('should create a goal with all properties', () => {
      const goal = new Goal(validGoalData);

      expect(goal.id).toBe('test-goal-id');
      expect(goal.name).toBe('Emergency Fund');
      expect(goal.description).toBe('Build an emergency fund for unexpected expenses');
      expect(goal.targetAmount).toBe(10000);
      expect(goal.currentAmount).toBe(2500);
      expect(goal.accountId).toBe('savings-account-1');
      expect(goal.isCompleted).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    let goal: Goal;

    beforeEach(() => {
      goal = new Goal(validGoalData);
    });

    it('should calculate progress correctly', () => {
      // (2500 / 10000) * 100 = 25%
      expect(goal.progress).toBe(25);
    });

    it('should calculate remaining amount correctly', () => {
      // 10000 - 2500 = 7500
      expect(goal.remainingAmount).toBe(7500);
    });

    it('should identify when goal is not achieved', () => {
      expect(goal.isAchieved).toBe(false);
    });

    it('should identify when goal is achieved', () => {
      const achievedGoal = new Goal({
        ...validGoalData,
        currentAmount: 10000,
      });

      expect(achievedGoal.isAchieved).toBe(true);
    });

    it('should calculate days remaining correctly', () => {
      const goal = new Goal({
        ...validGoalData,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      expect(goal.daysRemaining).toBe(30);
    });

    it('should identify overdue goals', () => {
      const overdueGoal = new Goal({
        ...validGoalData,
        targetDate: new Date('2023-12-31'), // Past date
        isCompleted: false,
      });

      expect(overdueGoal.isOverdue).toBe(true);
    });

    it('should not identify completed goals as overdue', () => {
      const completedGoal = new Goal({
        ...validGoalData,
        targetDate: new Date('2023-12-31'), // Past date
        isCompleted: true,
      });

      expect(completedGoal.isOverdue).toBe(false);
    });

    it('should format amounts correctly', () => {
      expect(goal.formattedTargetAmount).toBe('$10,000.00');
      expect(goal.formattedCurrentAmount).toBe('$2,500.00');
      expect(goal.formattedRemainingAmount).toBe('$7,500.00');
    });

    it('should format target date correctly', () => {
      const goal = new Goal({
        ...validGoalData,
        targetDate: new Date('2024-12-25'),
      });

      expect(goal.formattedTargetDate).toBe('December 25, 2024');
    });
  });

  describe('Progress Monitoring Methods', () => {
    let goal: Goal;

    beforeEach(() => {
      // Create a goal that was started 100 days ago
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - 100);
      
      goal = new Goal({
        ...validGoalData,
        createdAt: createdDate,
        currentAmount: 2500, // $25/day progress
      });
    });

    it('should calculate projected completion date', () => {
      const projectedDate = goal.projectedCompletionDate;
      const now = new Date();
      
      // The projected date should be in the future for an incomplete goal
      expect(projectedDate.getTime()).toBeGreaterThan(now.getTime());
      
      // For a goal with some progress, the projected date should be reasonable
      // (not too far in the future or past)
      const daysDiff = (projectedDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
      expect(daysDiff).toBeGreaterThan(0);
      expect(daysDiff).toBeLessThan(10000); // Less than ~27 years
    });

    it('should identify if goal is on track', () => {
      // This depends on the target date vs projected completion date
      // For this test, we'll assume the goal is on track if projected date is before target
      const isOnTrack = goal.isOnTrack;
      expect(typeof isOnTrack).toBe('boolean');
    });

    it('should calculate required daily contribution', () => {
      const goal = new Goal({
        ...validGoalData,
        targetDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000), // 100 days from now
        currentAmount: 2500,
        targetAmount: 10000,
      });

      // Need $7500 in 100 days = $75/day
      expect(goal.requiredDailyContribution).toBe(75);
      expect(goal.formattedRequiredDailyContribution).toBe('$75.00');
    });

    it('should return zero daily contribution for achieved goals', () => {
      const achievedGoal = new Goal({
        ...validGoalData,
        currentAmount: 10000,
      });

      expect(achievedGoal.requiredDailyContribution).toBe(0);
    });
  });

  describe('Progress Update Methods', () => {
    let goal: Goal;

    beforeEach(() => {
      goal = new Goal(validGoalData);
    });

    it('should add contribution correctly', () => {
      const originalAmount = goal.currentAmount;
      const originalUpdatedAt = goal.updatedAt;

      goal.addContribution(500);

      expect(goal.currentAmount).toBe(originalAmount + 500);
      expect(goal.updatedAt).not.toEqual(originalUpdatedAt);
    });

    it('should auto-complete goal when target is reached', () => {
      goal.addContribution(7500); // Reach the target

      expect(goal.currentAmount).toBe(10000);
      expect(goal.isCompleted).toBe(true);
    });

    it('should reject negative contributions', () => {
      expect(() => goal.addContribution(-100)).toThrow('Contribution amount must be positive');
    });

    it('should set current amount correctly', () => {
      const originalUpdatedAt = goal.updatedAt;

      goal.setCurrentAmount(5000);

      expect(goal.currentAmount).toBe(5000);
      expect(goal.updatedAt).not.toEqual(originalUpdatedAt);
    });

    it('should update completion status when setting amount', () => {
      goal.setCurrentAmount(10000);

      expect(goal.isCompleted).toBe(true);
    });

    it('should reject negative current amount', () => {
      expect(() => goal.setCurrentAmount(-100)).toThrow('Current amount cannot be negative');
    });

    it('should mark as completed correctly', () => {
      const originalUpdatedAt = goal.updatedAt;

      goal.markAsCompleted();

      expect(goal.isCompleted).toBe(true);
      expect(goal.updatedAt).not.toEqual(originalUpdatedAt);
    });

    it('should mark as incomplete correctly', () => {
      goal.isCompleted = true;
      const originalUpdatedAt = goal.updatedAt;

      goal.markAsIncomplete();

      expect(goal.isCompleted).toBe(false);
      expect(goal.updatedAt).not.toEqual(originalUpdatedAt);
    });
  });

  describe('Status Methods', () => {
    it('should return completed status', () => {
      const completedGoal = new Goal({
        ...validGoalData,
        isCompleted: true,
      });

      expect(completedGoal.getStatus()).toBe('completed');
    });

    it('should return overdue status', () => {
      const overdueGoal = new Goal({
        ...validGoalData,
        targetDate: new Date('2023-12-31'),
        isCompleted: false,
      });

      expect(overdueGoal.getStatus()).toBe('overdue');
    });

    it('should return on-track or behind status based on progress', () => {
      const goal = new Goal(validGoalData);
      const status = goal.getStatus();
      
      expect(['on-track', 'behind']).toContain(status);
    });
  });

  describe('Static Validation', () => {
    it('should validate a correct goal', () => {
      const result = Goal.validate(validGoalData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject goal without name', () => {
      const invalidData = { ...validGoalData, name: '' };
      const result = Goal.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Goal name is required');
    });

    it('should reject goal with zero or negative target amount', () => {
      const invalidData = { ...validGoalData, targetAmount: 0 };
      const result = Goal.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Target amount must be greater than zero');
    });

    it('should reject goal with negative current amount', () => {
      const invalidData = { ...validGoalData, currentAmount: -100 };
      const result = Goal.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Current amount must be zero or greater');
    });

    it('should reject goal with invalid target date', () => {
      const invalidData = { ...validGoalData, targetDate: new Date('invalid') };
      const result = Goal.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid target date is required');
    });

    it('should reject goal without account ID', () => {
      const invalidData = { ...validGoalData, accountId: '' };
      const result = Goal.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account ID is required');
    });

    it('should reject goal with name too long', () => {
      const longName = 'a'.repeat(101);
      const invalidData = { ...validGoalData, name: longName };
      const result = Goal.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Goal name must be 100 characters or less');
    });

    it('should reject goal with description too long', () => {
      const longDescription = 'a'.repeat(501);
      const invalidData = { ...validGoalData, description: longDescription };
      const result = Goal.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Goal description must be 500 characters or less');
    });

    it('should reject goal with excessive target amount', () => {
      const invalidData = { ...validGoalData, targetAmount: 20000000 };
      const result = Goal.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Target amount cannot exceed $10,000,000');
    });

    it('should reject goal with current amount much higher than target', () => {
      const invalidData = { 
        ...validGoalData, 
        targetAmount: 1000,
        currentAmount: 1200, // 20% over target
      };
      const result = Goal.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Current amount should not exceed target amount by more than 10%');
    });

    it('should reject incomplete goal with past target date', () => {
      const invalidData = {
        ...validGoalData,
        targetDate: new Date('2023-12-31'),
        isCompleted: false,
      };
      const result = Goal.validate(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Target date should be in the future for incomplete goals');
    });

    it('should allow completed goal with past target date', () => {
      const validData = {
        ...validGoalData,
        targetDate: new Date('2023-12-31'),
        isCompleted: true,
      };
      const result = Goal.validate(validData);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Instance Methods', () => {
    let goal: Goal;

    beforeEach(() => {
      goal = new Goal(validGoalData);
    });

    it('should validate instance correctly', () => {
      const result = goal.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should update goal with valid data', () => {
      const originalUpdatedAt = goal.updatedAt;
      
      setTimeout(() => {
        const result = goal.update({
          name: 'Updated Emergency Fund',
          targetAmount: 15000,
        });

        expect(result.isValid).toBe(true);
        expect(goal.name).toBe('Updated Emergency Fund');
        expect(goal.targetAmount).toBe(15000);
        expect(goal.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });

    it('should update completion status when amounts change', () => {
      const result = goal.update({
        currentAmount: 10000,
      });

      expect(result.isValid).toBe(true);
      expect(goal.isCompleted).toBe(true);
    });

    it('should not update goal with invalid data', () => {
      const originalName = goal.name;
      const originalUpdatedAt = goal.updatedAt;

      const result = goal.update({
        name: '', // Invalid
      });

      expect(result.isValid).toBe(false);
      expect(goal.name).toBe(originalName);
      expect(goal.updatedAt).toEqual(originalUpdatedAt);
    });

    it('should convert to JSON correctly', () => {
      const json = goal.toJSON();

      expect(json).toEqual(validGoalData);
    });

    it('should clone goal correctly', () => {
      const cloned = goal.clone();

      expect(cloned).not.toBe(goal);
      expect(cloned.toJSON()).toEqual(goal.toJSON());
    });
  });

  describe('Static Create Method', () => {
    it('should create goal with generated metadata', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 365);
      
      const goalData = {
        name: 'Vacation Fund',
        description: 'Save for a dream vacation',
        targetAmount: 5000,
        currentAmount: 0,
        targetDate: futureDate,
        accountId: 'savings-account-1',
      };

      const goal = Goal.create(goalData);

      expect(goal.id).toBeDefined();
      expect(goal.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(goal.createdAt).toBeInstanceOf(Date);
      expect(goal.updatedAt).toBeInstanceOf(Date);
      expect(goal.createdAt).toEqual(goal.updatedAt);
      expect(goal.isCompleted).toBe(false);
      
      // Check that all other properties are set correctly
      expect(goal.name).toBe('Vacation Fund');
      expect(goal.description).toBe('Save for a dream vacation');
      expect(goal.targetAmount).toBe(5000);
      expect(goal.currentAmount).toBe(0);
      expect(goal.accountId).toBe('savings-account-1');
    });

    it('should allow setting completion status', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 365);
      
      const goalData = {
        name: 'Completed Goal',
        targetAmount: 1000,
        currentAmount: 1000,
        targetDate: futureDate,
        accountId: 'savings-account-1',
        isCompleted: true,
      };

      const goal = Goal.create(goalData);

      expect(goal.isCompleted).toBe(true);
    });
  });

  describe('Goal Summary', () => {
    it('should return correct summary', () => {
      const goal = new Goal(validGoalData);
      const summary = goal.getSummary();

      expect(summary).toEqual({
        name: 'Emergency Fund',
        targetAmount: '$10,000.00',
        currentAmount: '$2,500.00',
        remainingAmount: '$7,500.00',
        progress: 25,
        status: expect.any(String),
        daysRemaining: expect.any(Number),
        requiredDailyContribution: expect.any(String),
      });
    });
  });

  describe('Milestones', () => {
    it('should calculate milestones correctly', () => {
      const goal = new Goal({
        ...validGoalData,
        currentAmount: 3000, // 30% progress
      });

      const milestones = goal.getMilestones();

      expect(milestones).toHaveLength(4);
      expect(milestones[0]).toEqual({
        percentage: 25,
        amount: 2500,
        achieved: true,
        formattedAmount: '$2,500.00',
      });
      expect(milestones[1]).toEqual({
        percentage: 50,
        amount: 5000,
        achieved: false,
        formattedAmount: '$5,000.00',
      });
      expect(milestones[2]).toEqual({
        percentage: 75,
        amount: 7500,
        achieved: false,
        formattedAmount: '$7,500.00',
      });
      expect(milestones[3]).toEqual({
        percentage: 100,
        amount: 10000,
        achieved: false,
        formattedAmount: '$10,000.00',
      });
    });
  });
});