import type { Budget as IBudget, ValidationResult, Transaction } from '../../shared/types';

export class Budget implements IBudget {
    public id: string;
    public category: string;
    public limit: number;
    public period: 'weekly' | 'monthly';
    public startDate: Date;
    public endDate: Date;
    public isActive: boolean;
    public createdAt: Date;
    public updatedAt: Date;

    // Private field to store current spending (will be calculated from transactions)
    private _currentSpent: number = 0;

    constructor(data: IBudget) {
        this.id = data.id;
        this.category = data.category;
        this.limit = data.limit;
        this.period = data.period;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
        this.isActive = data.isActive;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    // Computed properties for budget progress tracking
    get spent(): number {
        return this._currentSpent;
    }

    get remaining(): number {
        return Math.max(0, this.limit - this._currentSpent);
    }

    get percentage(): number {
        if (this.limit === 0) return 0;
        return Math.min(100, (this._currentSpent / this.limit) * 100);
    }

    get isOverBudget(): boolean {
        return this._currentSpent > this.limit;
    }

    get status(): 'safe' | 'warning' | 'danger' {
        const percentage = this.percentage;

        if (percentage >= 100) return 'danger';
        if (percentage >= 80) return 'warning';
        return 'safe';
    }

    get formattedLimit(): string {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        });

        return formatter.format(this.limit);
    }

    get formattedSpent(): string {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        });

        return formatter.format(this._currentSpent);
    }

    get formattedRemaining(): string {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        });

        return formatter.format(this.remaining);
    }

    get daysRemaining(): number {
        const now = new Date();
        const timeDiff = this.endDate.getTime() - now.getTime();
        return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    }

    get isExpired(): boolean {
        return new Date() > this.endDate;
    }

    get isCurrentPeriod(): boolean {
        const now = new Date();
        return now >= this.startDate && now <= this.endDate;
    }

    // Methods for budget period validation and calculations
    static calculateEndDate(startDate: Date, period: 'weekly' | 'monthly'): Date {
        const endDate = new Date(startDate);

        if (period === 'weekly') {
            endDate.setDate(endDate.getDate() + 7);
        } else if (period === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Set to end of day
        endDate.setHours(23, 59, 59, 999);
        return endDate;
    }

    // Method to update spending based on transactions
    updateSpentAmount(transactions: Transaction[]): void {
        this._currentSpent = this.calculateSpentFromTransactions(transactions);
        this.updatedAt = new Date();
    }

    // Method to calculate spent amount from transactions
    private calculateSpentFromTransactions(transactions: Transaction[]): number {
        return transactions
            .filter(transaction =>
                transaction.category === this.category &&
                transaction.type === 'expense' &&
                transaction.date >= this.startDate &&
                transaction.date <= this.endDate
            )
            .reduce((total, transaction) => total + transaction.amount, 0);
    }

    // Method to check if a transaction would exceed budget
    wouldExceedBudget(transactionAmount: number): boolean {
        return (this._currentSpent + transactionAmount) > this.limit;
    }

    // Method to get budget alert information
    getBudgetAlert(): { shouldAlert: boolean; message: string; severity: 'warning' | 'danger' } | null {
        const percentage = this.percentage;

        if (percentage >= 100) {
            return {
                shouldAlert: true,
                message: `You have exceeded your ${this.category} budget by ${this.formattedSpent}`,
                severity: 'danger'
            };
        }

        if (percentage >= 90) {
            return {
                shouldAlert: true,
                message: `You have used ${percentage.toFixed(1)}% of your ${this.category} budget`,
                severity: 'danger'
            };
        }

        if (percentage >= 80) {
            return {
                shouldAlert: true,
                message: `You have used ${percentage.toFixed(1)}% of your ${this.category} budget`,
                severity: 'warning'
            };
        }

        return null;
    }

    // Validation methods
    static validate(data: Partial<IBudget>): ValidationResult {
        const errors: string[] = [];

        // Required fields validation
        if (!data.category || data.category.trim().length === 0) {
            errors.push('Budget category is required');
        }

        if (!data.limit || data.limit <= 0) {
            errors.push('Budget limit must be greater than zero');
        }

        if (!data.period || !['weekly', 'monthly'].includes(data.period)) {
            errors.push('Budget period must be either "weekly" or "monthly"');
        }

        if (!data.startDate || !(data.startDate instanceof Date) || isNaN(data.startDate.getTime())) {
            errors.push('Valid start date is required');
        }

        if (!data.endDate || !(data.endDate instanceof Date) || isNaN(data.endDate.getTime())) {
            errors.push('Valid end date is required');
        }

        // Business logic validation
        if (data.category && data.category.length > 50) {
            errors.push('Budget category must be 50 characters or less');
        }

        if (data.limit && data.limit > 1000000) {
            errors.push('Budget limit cannot exceed $1,000,000');
        }

        if (data.startDate && data.endDate && data.startDate >= data.endDate) {
            errors.push('End date must be after start date');
        }

        // Period validation
        if (data.startDate && data.endDate && data.period) {
            const expectedEndDate = Budget.calculateEndDate(data.startDate, data.period);
            const daysDiff = Math.abs(data.endDate.getTime() - expectedEndDate.getTime()) / (1000 * 3600 * 24);

            if (daysDiff > 1) { // Allow 1 day tolerance
                errors.push(`End date does not match the specified ${data.period} period`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Instance validation method
    validate(): ValidationResult {
        return Budget.validate(this);
    }

    // Update method with validation
    update(updates: Partial<IBudget>): ValidationResult {
        const updatedData = { ...this, ...updates };
        const validation = Budget.validate(updatedData);

        if (validation.isValid) {
            Object.assign(this, updates);
            this.updatedAt = new Date();
        }

        return validation;
    }

    // Helper method to create a new Budget with generated metadata
    static create(data: Omit<IBudget, 'id' | 'createdAt' | 'updatedAt' | 'endDate'> & { endDate?: Date }): Budget {
        const now = new Date();

        // Calculate end date if not provided
        const endDate = data.endDate || Budget.calculateEndDate(data.startDate, data.period);

        const budgetData: IBudget = {
            ...data,
            endDate,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        };

        return new Budget(budgetData);
    }

    // Method to reset budget for new period
    resetForNewPeriod(): Budget {
        const newStartDate = new Date(this.endDate);
        newStartDate.setDate(newStartDate.getDate() + 1);
        newStartDate.setHours(0, 0, 0, 0);

        const newEndDate = Budget.calculateEndDate(newStartDate, this.period);

        const newBudgetData: IBudget = {
            ...this.toJSON(),
            id: crypto.randomUUID(),
            startDate: newStartDate,
            endDate: newEndDate,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return new Budget(newBudgetData);
    }

    // Method to convert to plain object (useful for serialization)
    toJSON(): IBudget {
        return {
            id: this.id,
            category: this.category,
            limit: this.limit,
            period: this.period,
            startDate: this.startDate,
            endDate: this.endDate,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    // Method to clone the budget
    clone(): Budget {
        const cloned = new Budget(this.toJSON());
        cloned._currentSpent = this._currentSpent;
        return cloned;
    }

    // Method to get budget summary
    getSummary(): {
        category: string;
        limit: string;
        spent: string;
        remaining: string;
        percentage: number;
        status: 'safe' | 'warning' | 'danger';
        daysRemaining: number;
    } {
        return {
            category: this.category,
            limit: this.formattedLimit,
            spent: this.formattedSpent,
            remaining: this.formattedRemaining,
            percentage: Math.round(this.percentage),
            status: this.status,
            daysRemaining: this.daysRemaining,
        };
    }
}