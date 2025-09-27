import { describe, it, expect, beforeEach } from 'vitest';
import { Budget } from './Budget';
import type { Budget as IBudget, Transaction } from '../../shared/types';

describe('Budget Model', () => {
    let validBudgetData: IBudget;
    let mockTransactions: Transaction[];

    beforeEach(() => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31T23:59:59.999Z');

        validBudgetData = {
            id: 'test-budget-id',
            category: 'Food',
            limit: 500,
            period: 'monthly',
            startDate,
            endDate,
            isActive: true,
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        mockTransactions = [
            {
                id: 'trans-1',
                date: new Date('2024-01-15'),
                amount: 50,
                description: 'Grocery shopping',
                category: 'Food',
                accountId: 'account-1',
                type: 'expense',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'trans-2',
                date: new Date('2024-01-20'),
                amount: 75,
                description: 'Restaurant',
                category: 'Food',
                accountId: 'account-1',
                type: 'expense',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'trans-3',
                date: new Date('2024-01-25'),
                amount: 30,
                description: 'Coffee',
                category: 'Entertainment', // Different category
                accountId: 'account-1',
                type: 'expense',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 'trans-4',
                date: new Date('2024-01-10'),
                amount: 100,
                description: 'Salary',
                category: 'Food',
                accountId: 'account-1',
                type: 'income', // Income, not expense
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
    });

    describe('Constructor and Basic Properties', () => {
        it('should create a budget with all properties', () => {
            const budget = new Budget(validBudgetData);

            expect(budget.id).toBe('test-budget-id');
            expect(budget.category).toBe('Food');
            expect(budget.limit).toBe(500);
            expect(budget.period).toBe('monthly');
            expect(budget.isActive).toBe(true);
        });
    });

    describe('Computed Properties', () => {
        let budget: Budget;

        beforeEach(() => {
            budget = new Budget(validBudgetData);
            budget.updateSpentAmount(mockTransactions);
        });

        it('should calculate spent amount correctly', () => {
            // Should only count Food category expenses: 50 + 75 = 125
            expect(budget.spent).toBe(125);
        });

        it('should calculate remaining amount correctly', () => {
            // 500 - 125 = 375
            expect(budget.remaining).toBe(375);
        });

        it('should calculate percentage correctly', () => {
            // (125 / 500) * 100 = 25%
            expect(budget.percentage).toBe(25);
        });

        it('should identify when not over budget', () => {
            expect(budget.isOverBudget).toBe(false);
        });

        it('should identify when over budget', () => {
            const overBudgetTransactions = [
                ...mockTransactions,
                {
                    id: 'trans-5',
                    date: new Date('2024-01-28'),
                    amount: 400,
                    description: 'Expensive dinner',
                    category: 'Food',
                    accountId: 'account-1',
                    type: 'expense' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            budget.updateSpentAmount(overBudgetTransactions);
            expect(budget.isOverBudget).toBe(true);
        });

        it('should return correct status for safe spending', () => {
            expect(budget.status).toBe('safe'); // 25% is safe
        });

        it('should return correct status for warning spending', () => {
            const warningTransactions = [
                ...mockTransactions,
                {
                    id: 'trans-5',
                    date: new Date('2024-01-28'),
                    amount: 275, // Total will be 400 (80%)
                    description: 'More food',
                    category: 'Food',
                    accountId: 'account-1',
                    type: 'expense' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            budget.updateSpentAmount(warningTransactions);
            expect(budget.status).toBe('warning');
        });

        it('should return correct status for danger spending', () => {
            const dangerTransactions = [
                ...mockTransactions,
                {
                    id: 'trans-5',
                    date: new Date('2024-01-28'),
                    amount: 400, // Total will be 525 (105%)
                    description: 'Too much food',
                    category: 'Food',
                    accountId: 'account-1',
                    type: 'expense' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            budget.updateSpentAmount(dangerTransactions);
            expect(budget.status).toBe('danger');
        });

        it('should format amounts correctly', () => {
            expect(budget.formattedLimit).toBe('$500.00');
            expect(budget.formattedSpent).toBe('$125.00');
            expect(budget.formattedRemaining).toBe('$375.00');
        });
    });

    describe('Date and Period Methods', () => {
        it('should calculate end date correctly for weekly period', () => {
            const startDate = new Date('2024-01-01');
            const endDate = Budget.calculateEndDate(startDate, 'weekly');

            expect(endDate.getDate()).toBe(8); // 7 days later
            expect(endDate.getHours()).toBe(23);
            expect(endDate.getMinutes()).toBe(59);
        });

        it('should calculate end date correctly for monthly period', () => {
            const startDate = new Date('2024-01-01');
            const endDate = Budget.calculateEndDate(startDate, 'monthly');

            expect(endDate.getMonth()).toBe(1); // February (0-indexed)
            expect(endDate.getDate()).toBe(1);
            expect(endDate.getHours()).toBe(23);
            expect(endDate.getMinutes()).toBe(59);
        });

        it('should calculate days remaining correctly', () => {
            const budget = new Budget({
                ...validBudgetData,
                endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            });

            expect(budget.daysRemaining).toBe(5);
        });

        it('should identify expired budgets', () => {
            const expiredBudget = new Budget({
                ...validBudgetData,
                endDate: new Date('2023-12-31'), // Past date
            });

            expect(expiredBudget.isExpired).toBe(true);
        });

        it('should identify current period budgets', () => {
            const now = new Date();
            const currentBudget = new Budget({
                ...validBudgetData,
                startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
                endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
            });

            expect(currentBudget.isCurrentPeriod).toBe(true);
        });
    });

    describe('Budget Alert Methods', () => {
        let budget: Budget;

        beforeEach(() => {
            budget = new Budget(validBudgetData);
        });

        it('should not alert for safe spending', () => {
            budget.updateSpentAmount(mockTransactions); // 25% spent
            const alert = budget.getBudgetAlert();

            expect(alert).toBeNull();
        });

        it('should alert for warning spending', () => {
            const warningTransactions = [
                ...mockTransactions,
                {
                    id: 'trans-5',
                    date: new Date('2024-01-28'),
                    amount: 275, // Total 400 (80%)
                    description: 'More food',
                    category: 'Food',
                    accountId: 'account-1',
                    type: 'expense' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            budget.updateSpentAmount(warningTransactions);
            const alert = budget.getBudgetAlert();

            expect(alert).not.toBeNull();
            expect(alert!.severity).toBe('warning');
            expect(alert!.message).toContain('80.0%');
        });

        it('should alert for danger spending (90%+)', () => {
            const dangerTransactions = [
                ...mockTransactions,
                {
                    id: 'trans-5',
                    date: new Date('2024-01-28'),
                    amount: 325, // Total 450 (90%)
                    description: 'Almost over budget',
                    category: 'Food',
                    accountId: 'account-1',
                    type: 'expense' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            budget.updateSpentAmount(dangerTransactions);
            const alert = budget.getBudgetAlert();

            expect(alert).not.toBeNull();
            expect(alert!.severity).toBe('danger');
            expect(alert!.message).toContain('90.0%');
        });

        it('should alert for over budget spending', () => {
            const overBudgetTransactions = [
                ...mockTransactions,
                {
                    id: 'trans-5',
                    date: new Date('2024-01-28'),
                    amount: 400, // Total 525 (105%)
                    description: 'Over budget',
                    category: 'Food',
                    accountId: 'account-1',
                    type: 'expense' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            budget.updateSpentAmount(overBudgetTransactions);
            const alert = budget.getBudgetAlert();

            expect(alert).not.toBeNull();
            expect(alert!.severity).toBe('danger');
            expect(alert!.message).toContain('exceeded');
        });

        it('should check if transaction would exceed budget', () => {
            budget.updateSpentAmount(mockTransactions); // Currently at 125

            expect(budget.wouldExceedBudget(300)).toBe(false); // 125 + 300 = 425 < 500
            expect(budget.wouldExceedBudget(400)).toBe(true);  // 125 + 400 = 525 > 500
        });
    });

    describe('Static Validation', () => {
        it('should validate a correct budget', () => {
            const result = Budget.validate(validBudgetData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject budget without category', () => {
            const invalidData = { ...validBudgetData, category: '' };
            const result = Budget.validate(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Budget category is required');
        });

        it('should reject budget with zero or negative limit', () => {
            const invalidData = { ...validBudgetData, limit: 0 };
            const result = Budget.validate(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Budget limit must be greater than zero');
        });

        it('should reject budget with invalid period', () => {
            const invalidData = { ...validBudgetData, period: 'invalid' as any };
            const result = Budget.validate(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Budget period must be either "weekly" or "monthly"');
        });

        it('should reject budget with invalid start date', () => {
            const invalidData = { ...validBudgetData, startDate: new Date('invalid') };
            const result = Budget.validate(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Valid start date is required');
        });

        it('should reject budget with invalid end date', () => {
            const invalidData = { ...validBudgetData, endDate: new Date('invalid') };
            const result = Budget.validate(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Valid end date is required');
        });

        it('should reject budget with end date before start date', () => {
            const invalidData = {
                ...validBudgetData,
                startDate: new Date('2024-01-31'),
                endDate: new Date('2024-01-01'),
            };
            const result = Budget.validate(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('End date must be after start date');
        });

        it('should reject budget with category too long', () => {
            const longCategory = 'a'.repeat(51);
            const invalidData = { ...validBudgetData, category: longCategory };
            const result = Budget.validate(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Budget category must be 50 characters or less');
        });

        it('should reject budget with excessive limit', () => {
            const invalidData = { ...validBudgetData, limit: 2000000 };
            const result = Budget.validate(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Budget limit cannot exceed $1,000,000');
        });
    });

    describe('Instance Methods', () => {
        let budget: Budget;

        beforeEach(() => {
            budget = new Budget(validBudgetData);
        });

        it('should validate instance correctly', () => {
            const result = budget.validate();

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should update budget with valid data', () => {
            const originalUpdatedAt = budget.updatedAt;

            setTimeout(() => {
                const result = budget.update({
                    category: 'Entertainment',
                    limit: 300,
                });

                expect(result.isValid).toBe(true);
                expect(budget.category).toBe('Entertainment');
                expect(budget.limit).toBe(300);
                expect(budget.updatedAt).not.toEqual(originalUpdatedAt);
            }, 1);
        });

        it('should not update budget with invalid data', () => {
            const originalCategory = budget.category;
            const originalUpdatedAt = budget.updatedAt;

            const result = budget.update({
                category: '', // Invalid
            });

            expect(result.isValid).toBe(false);
            expect(budget.category).toBe(originalCategory);
            expect(budget.updatedAt).toEqual(originalUpdatedAt);
        });

        it('should convert to JSON correctly', () => {
            const json = budget.toJSON();

            expect(json).toEqual(validBudgetData);
        });

        it('should clone budget correctly', () => {
            budget.updateSpentAmount(mockTransactions);
            const cloned = budget.clone();

            expect(cloned).not.toBe(budget);
            expect(cloned.toJSON()).toEqual(budget.toJSON());
            expect(cloned.spent).toBe(budget.spent);
        });

        it('should reset for new period correctly', () => {
            const newBudget = budget.resetForNewPeriod();

            expect(newBudget.id).not.toBe(budget.id);
            expect(newBudget.category).toBe(budget.category);
            expect(newBudget.limit).toBe(budget.limit);
            expect(newBudget.period).toBe(budget.period);
            expect(newBudget.startDate.getTime()).toBeGreaterThan(budget.endDate.getTime());
        });
    });

    describe('Static Create Method', () => {
        it('should create budget with generated metadata and calculated end date', () => {
            const budgetData = {
                category: 'Transportation',
                limit: 200,
                period: 'weekly' as const,
                startDate: new Date('2024-01-01'),
                isActive: true,
            };

            const budget = Budget.create(budgetData);

            expect(budget.id).toBeDefined();
            expect(budget.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
            expect(budget.createdAt).toBeInstanceOf(Date);
            expect(budget.updatedAt).toBeInstanceOf(Date);
            expect(budget.createdAt).toEqual(budget.updatedAt);

            // Check that end date is calculated correctly for weekly period
            expect(budget.endDate.getDate()).toBe(8); // 7 days after start

            // Check that all other properties are set correctly
            expect(budget.category).toBe('Transportation');
            expect(budget.limit).toBe(200);
            expect(budget.period).toBe('weekly');
            expect(budget.isActive).toBe(true);
        });

        it('should use provided end date if given', () => {
            const customEndDate = new Date('2024-01-15');
            const budgetData = {
                category: 'Transportation',
                limit: 200,
                period: 'weekly' as const,
                startDate: new Date('2024-01-01'),
                endDate: customEndDate,
                isActive: true,
            };

            const budget = Budget.create(budgetData);

            expect(budget.endDate).toEqual(customEndDate);
        });
    });

    describe('Budget Summary', () => {
        it('should return correct summary', () => {
            const budget = new Budget(validBudgetData);
            budget.updateSpentAmount(mockTransactions);

            const summary = budget.getSummary();

            expect(summary).toEqual({
                category: 'Food',
                limit: '$500.00',
                spent: '$125.00',
                remaining: '$375.00',
                percentage: 25,
                status: 'safe',
                daysRemaining: expect.any(Number),
            });
        });
    });
});