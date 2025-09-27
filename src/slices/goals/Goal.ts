import type { Goal as IGoal, ValidationResult } from '../../shared/types';

export class Goal implements IGoal {
  public id: string;
  public name: string;
  public description?: string;
  public targetAmount: number;
  public currentAmount: number;
  public targetDate: Date;
  public accountId: string;
  public isCompleted: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: IGoal) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.targetAmount = data.targetAmount;
    this.currentAmount = data.currentAmount;
    this.targetDate = data.targetDate;
    this.accountId = data.accountId;
    this.isCompleted = data.isCompleted;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Computed properties for progress tracking
  get progress(): number {
    if (this.targetAmount === 0) return 0;
    return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
  }

  get remainingAmount(): number {
    return Math.max(0, this.targetAmount - this.currentAmount);
  }

  get isAchieved(): boolean {
    return this.currentAmount >= this.targetAmount;
  }

  get daysRemaining(): number {
    const now = new Date();
    const timeDiff = this.targetDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  }

  get isOverdue(): boolean {
    return new Date() > this.targetDate && !this.isCompleted;
  }

  get formattedTargetAmount(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    
    return formatter.format(this.targetAmount);
  }

  get formattedCurrentAmount(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    
    return formatter.format(this.currentAmount);
  }

  get formattedRemainingAmount(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    
    return formatter.format(this.remainingAmount);
  }

  get formattedTargetDate(): string {
    return this.targetDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Progress monitoring methods
  get projectedCompletionDate(): Date {
    if (this.currentAmount >= this.targetAmount) {
      return new Date(); // Already completed
    }

    const now = new Date();
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - this.createdAt.getTime()) / (1000 * 3600 * 24)));
    const dailyProgress = this.currentAmount / daysElapsed;

    if (dailyProgress <= 0) {
      return this.targetDate; // No progress, return target date
    }

    const remainingDays = Math.ceil(this.remainingAmount / dailyProgress);
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + remainingDays);

    return projectedDate;
  }

  get isOnTrack(): boolean {
    if (this.isAchieved) return true;
    
    const projectedDate = this.projectedCompletionDate;
    return projectedDate <= this.targetDate;
  }

  get requiredDailyContribution(): number {
    if (this.isAchieved) return 0;
    
    const daysRemaining = this.daysRemaining;
    if (daysRemaining <= 0) return this.remainingAmount; // All remaining amount needed today
    
    return this.remainingAmount / daysRemaining;
  }

  get formattedRequiredDailyContribution(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    
    return formatter.format(this.requiredDailyContribution);
  }

  // Methods for updating progress
  addContribution(amount: number): void {
    if (amount < 0) {
      throw new Error('Contribution amount must be positive');
    }
    
    this.currentAmount += amount;
    this.updatedAt = new Date();
    
    // Auto-complete if target is reached
    if (this.currentAmount >= this.targetAmount && !this.isCompleted) {
      this.isCompleted = true;
    }
  }

  setCurrentAmount(amount: number): void {
    if (amount < 0) {
      throw new Error('Current amount cannot be negative');
    }
    
    this.currentAmount = amount;
    this.updatedAt = new Date();
    
    // Update completion status
    this.isCompleted = amount >= this.targetAmount;
  }

  markAsCompleted(): void {
    this.isCompleted = true;
    this.updatedAt = new Date();
  }

  markAsIncomplete(): void {
    this.isCompleted = false;
    this.updatedAt = new Date();
  }

  // Method to get goal status
  getStatus(): 'completed' | 'on-track' | 'behind' | 'overdue' {
    if (this.isCompleted) return 'completed';
    if (this.isOverdue) return 'overdue';
    if (this.isOnTrack) return 'on-track';
    return 'behind';
  }

  // Validation methods
  static validate(data: Partial<IGoal>): ValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Goal name is required');
    }

    if (!data.targetAmount || data.targetAmount <= 0) {
      errors.push('Target amount must be greater than zero');
    }

    if (data.currentAmount === undefined || data.currentAmount === null || data.currentAmount < 0) {
      errors.push('Current amount must be zero or greater');
    }

    if (!data.targetDate || !(data.targetDate instanceof Date) || isNaN(data.targetDate.getTime())) {
      errors.push('Valid target date is required');
    }

    if (!data.accountId || data.accountId.trim().length === 0) {
      errors.push('Account ID is required');
    }

    // Business logic validation
    if (data.name && data.name.length > 100) {
      errors.push('Goal name must be 100 characters or less');
    }

    if (data.description && data.description.length > 500) {
      errors.push('Goal description must be 500 characters or less');
    }

    if (data.targetAmount && data.targetAmount > 10000000) {
      errors.push('Target amount cannot exceed $10,000,000');
    }

    if (data.currentAmount && data.targetAmount && data.currentAmount > data.targetAmount * 1.1) {
      errors.push('Current amount should not exceed target amount by more than 10%');
    }

    // Date validation - target date should be in the future (unless goal is completed)
    if (data.targetDate && !data.isCompleted && data.targetDate <= new Date()) {
      errors.push('Target date should be in the future for incomplete goals');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Instance validation method
  validate(): ValidationResult {
    return Goal.validate(this);
  }

  // Update method with validation
  update(updates: Partial<IGoal>): ValidationResult {
    const updatedData = { ...this, ...updates };
    const validation = Goal.validate(updatedData);
    
    if (validation.isValid) {
      Object.assign(this, updates);
      this.updatedAt = new Date();
      
      // Update completion status if amounts changed
      if (updates.currentAmount !== undefined || updates.targetAmount !== undefined) {
        this.isCompleted = this.currentAmount >= this.targetAmount;
      }
    }
    
    return validation;
  }

  // Helper method to create a new Goal with generated metadata
  static create(data: Omit<IGoal, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted'> & { isCompleted?: boolean }): Goal {
    const now = new Date();
    const goalData: IGoal = {
      ...data,
      isCompleted: data.isCompleted || false,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return new Goal(goalData);
  }

  // Method to convert to plain object (useful for serialization)
  toJSON(): IGoal {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      targetAmount: this.targetAmount,
      currentAmount: this.currentAmount,
      targetDate: this.targetDate,
      accountId: this.accountId,
      isCompleted: this.isCompleted,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Method to clone the goal
  clone(): Goal {
    return new Goal(this.toJSON());
  }

  // Method to get goal summary
  getSummary(): {
    name: string;
    targetAmount: string;
    currentAmount: string;
    remainingAmount: string;
    progress: number;
    status: 'completed' | 'on-track' | 'behind' | 'overdue';
    daysRemaining: number;
    requiredDailyContribution: string;
  } {
    return {
      name: this.name,
      targetAmount: this.formattedTargetAmount,
      currentAmount: this.formattedCurrentAmount,
      remainingAmount: this.formattedRemainingAmount,
      progress: Math.round(this.progress),
      status: this.getStatus(),
      daysRemaining: this.daysRemaining,
      requiredDailyContribution: this.formattedRequiredDailyContribution,
    };
  }

  // Method to calculate milestone achievements
  getMilestones(): { percentage: number; amount: number; achieved: boolean; formattedAmount: string }[] {
    const milestones = [25, 50, 75, 100];
    
    return milestones.map(percentage => {
      const amount = (this.targetAmount * percentage) / 100;
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      });
      
      return {
        percentage,
        amount,
        achieved: this.currentAmount >= amount,
        formattedAmount: formatter.format(amount),
      };
    });
  }
}