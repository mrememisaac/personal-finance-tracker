import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GoalProgress from '../GoalProgress';
import { Goal } from '../../Goal';
import type { GoalProgress as IGoalProgress, GoalNotification } from '../../services/GoalService';

describe('GoalProgress', () => {
  let mockGoals: Goal[];
  let mockGoalProgress: IGoalProgress[];
  let mockNotifications: GoalNotification[];

  beforeEach(() => {
    // Mock goals
    mockGoals = [
      new Goal({
        id: 'goal-1',
        name: 'Emergency Fund',
        description: 'Build emergency fund',
        targetAmount: 10000,
        currentAmount: 7500,
        targetDate: new Date('2024-12-31'),
        accountId: 'account-1',
        isCompleted: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }),
      new Goal({
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
      }),
      new Goal({
        id: 'goal-3',
        name: 'Car Fund',
        description: 'Save for new car',
        targetAmount: 20000,
        currentAmount: 5000,
        targetDate: new Date('2023-12-31'), // Overdue
        accountId: 'account-3',
        isCompleted: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      })
    ];

    // Mock goal progress
    mockGoalProgress = [
      {
        goalId: 'goal-1',
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 7500,
        remainingAmount: 2500,
        progress: 75,
        status: 'on-track',
        daysRemaining: 30,
        projectedCompletionDate: new Date('2024-12-15'),
        requiredDailyContribution: 83.33
      },
      {
        goalId: 'goal-2',
        name: 'Vacation Fund',
        targetAmount: 5000,
        currentAmount: 5000,
        remainingAmount: 0,
        progress: 100,
        status: 'completed',
        daysRemaining: 0,
        projectedCompletionDate: new Date(),
        requiredDailyContribution: 0
      },
      {
        goalId: 'goal-3',
        name: 'Car Fund',
        targetAmount: 20000,
        currentAmount: 5000,
        remainingAmount: 15000,
        progress: 25,
        status: 'overdue',
        daysRemaining: 0,
        projectedCompletionDate: new Date('2025-06-01'),
        requiredDailyContribution: 0
      }
    ];

    // Mock notifications
    mockNotifications = [
      {
        goalId: 'goal-2',
        name: 'Vacation Fund',
        type: 'completion',
        message: 'Congratulations! You\'ve achieved your goal "Vacation Fund"!',
        severity: 'success'
      },
      {
        goalId: 'goal-1',
        name: 'Emergency Fund',
        type: 'milestone',
        message: 'Great progress! You\'ve reached 75% of your goal "Emergency Fund"',
        severity: 'info'
      },
      {
        goalId: 'goal-3',
        name: 'Car Fund',
        type: 'overdue',
        message: 'Goal "Car Fund" is overdue. Consider adjusting your target date or increasing contributions.',
        severity: 'danger'
      }
    ];
  });

  const defaultProps = {
    goals: mockGoals,
    goalProgress: mockGoalProgress,
    notifications: mockNotifications
  };

  describe('Overall Summary', () => {
    it('should display correct summary statistics', () => {
      render(<GoalProgress {...defaultProps} />);

      expect(screen.getByText('Goals Overview')).toBeInTheDocument();
      expect(screen.getByText('$35,000')).toBeInTheDocument(); // Total target
      expect(screen.getByText('$17,500')).toBeInTheDocument(); // Current amount
      expect(screen.getByText('$17,500')).toBeInTheDocument(); // Remaining
      expect(screen.getByText('50.0%')).toBeInTheDocument(); // Overall progress
    });

    it('should display overall progress bar', () => {
      render(<GoalProgress {...defaultProps} />);

      const progressBar = screen.getByText('Overall Goal Progress').parentElement?.querySelector('[style*="width: 50%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show completed goals count', () => {
      render(<GoalProgress {...defaultProps} />);

      expect(screen.getByText('1 of 3 goals completed')).toBeInTheDocument();
    });
  });

  describe('Goal Status Stats', () => {
    it('should display correct status counts', () => {
      render(<GoalProgress {...defaultProps} />);

      expect(screen.getByText('Goal Status')).toBeInTheDocument();
      
      // Find the status section and check counts
      const statusSection = screen.getByText('Goal Status').parentElement;
      expect(statusSection).toBeInTheDocument();
      
      // Check for status counts (these appear in the grid)
      const completedCount = screen.getAllByText('1').find(el => 
        el.parentElement?.textContent?.includes('Completed')
      );
      expect(completedCount).toBeInTheDocument();
      
      const onTrackCount = screen.getAllByText('1').find(el => 
        el.parentElement?.textContent?.includes('On Track')
      );
      expect(onTrackCount).toBeInTheDocument();
      
      const overdueCount = screen.getAllByText('1').find(el => 
        el.parentElement?.textContent?.includes('Overdue')
      );
      expect(overdueCount).toBeInTheDocument();
      
      const activeCount = screen.getAllByText('2').find(el => 
        el.parentElement?.textContent?.includes('Active')
      );
      expect(activeCount).toBeInTheDocument();
    });
  });

  describe('Individual Goal Cards', () => {
    it('should render all goal cards', () => {
      render(<GoalProgress {...defaultProps} />);

      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      expect(screen.getByText('Vacation Fund')).toBeInTheDocument();
      expect(screen.getByText('Car Fund')).toBeInTheDocument();
    });

    it('should display correct progress for each goal', () => {
      render(<GoalProgress {...defaultProps} />);

      // Emergency Fund - 75% complete
      expect(screen.getByText('75.0% complete')).toBeInTheDocument();
      expect(screen.getByText('$7,500 / $10,000')).toBeInTheDocument();

      // Vacation Fund - 100% complete
      expect(screen.getByText('100.0% complete')).toBeInTheDocument();
      expect(screen.getByText('$5,000 / $5,000')).toBeInTheDocument();

      // Car Fund - 25% complete
      expect(screen.getByText('25.0% complete')).toBeInTheDocument();
      expect(screen.getByText('$5,000 / $20,000')).toBeInTheDocument();
    });

    it('should show correct status badges', () => {
      render(<GoalProgress {...defaultProps} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('On Track')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('should display remaining amounts and days', () => {
      render(<GoalProgress {...defaultProps} />);

      expect(screen.getByText('$2,500')).toBeInTheDocument(); // Emergency Fund remaining
      expect(screen.getByText('30 days')).toBeInTheDocument(); // Emergency Fund days remaining
      expect(screen.getByText('$15,000')).toBeInTheDocument(); // Car Fund remaining
      expect(screen.getByText('Overdue')).toBeInTheDocument(); // Car Fund overdue
    });

    it('should show daily contribution requirements', () => {
      render(<GoalProgress {...defaultProps} />);

      expect(screen.getByText('$83/day needed')).toBeInTheDocument(); // Emergency Fund
    });

    it('should display milestone progress', () => {
      render(<GoalProgress {...defaultProps} />);

      // Check for milestone indicators (25%, 50%, 75%, 100%)
      const milestoneElements = screen.getAllByText('25%');
      expect(milestoneElements.length).toBeGreaterThan(0);
      
      const milestone50Elements = screen.getAllByText('50%');
      expect(milestone50Elements.length).toBeGreaterThan(0);
      
      const milestone75Elements = screen.getAllByText('75%');
      expect(milestone75Elements.length).toBeGreaterThan(0);
      
      const milestone100Elements = screen.getAllByText('100%');
      expect(milestone100Elements.length).toBeGreaterThan(0);
    });
  });

  describe('Notifications', () => {
    it('should display notification badges on goal cards', () => {
      render(<GoalProgress {...defaultProps} />);

      // Each goal should have a notification badge showing count
      const notificationBadges = screen.getAllByText('1');
      expect(notificationBadges.length).toBeGreaterThan(0);
    });

    it('should show notification count in header', () => {
      render(<GoalProgress {...defaultProps} />);

      expect(screen.getByText('3 notifications')).toBeInTheDocument();
    });

    it('should display achievement notifications section', () => {
      render(<GoalProgress {...defaultProps} />);

      expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
      expect(screen.getByText('Congratulations! You\'ve achieved your goal "Vacation Fund"!')).toBeInTheDocument();
      expect(screen.getByText('Great progress! You\'ve reached 75% of your goal "Emergency Fund"')).toBeInTheDocument();
    });

    it('should limit achievement notifications to 3', () => {
      const manyNotifications = [
        ...mockNotifications,
        {
          goalId: 'goal-4',
          name: 'Goal 4',
          type: 'milestone' as const,
          message: 'Milestone 4',
          severity: 'info' as const
        },
        {
          goalId: 'goal-5',
          name: 'Goal 5',
          type: 'completion' as const,
          message: 'Completion 5',
          severity: 'success' as const
        }
      ];

      render(<GoalProgress {...defaultProps} notifications={manyNotifications} />);

      const achievementSection = screen.getByText('Recent Achievements').parentElement;
      const notificationElements = achievementSection?.querySelectorAll('[class*="p-3"]');
      expect(notificationElements?.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Goal Interactions', () => {
    it('should call onGoalClick when goal card is clicked', () => {
      const mockOnGoalClick = vi.fn();
      render(<GoalProgress {...defaultProps} onGoalClick={mockOnGoalClick} />);

      const emergencyFundCard = screen.getByText('Emergency Fund').closest('[class*="cursor-pointer"]');
      expect(emergencyFundCard).toBeInTheDocument();
      
      if (emergencyFundCard) {
        fireEvent.click(emergencyFundCard);
        expect(mockOnGoalClick).toHaveBeenCalledWith('goal-1');
      }
    });

    it('should make goal cards clickable when onGoalClick is provided', () => {
      const mockOnGoalClick = vi.fn();
      render(<GoalProgress {...defaultProps} onGoalClick={mockOnGoalClick} />);

      const goalCards = screen.getAllByText(/Fund/).map(el => 
        el.closest('[class*="cursor-pointer"]')
      ).filter(Boolean);
      
      expect(goalCards.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no goals exist', () => {
      render(<GoalProgress goals={[]} goalProgress={[]} />);

      expect(screen.getByText('No Goals Set')).toBeInTheDocument();
      expect(screen.getByText('Create your first financial goal to start tracking your progress.')).toBeInTheDocument();
    });
  });

  describe('Goal Sorting', () => {
    it('should display completed goals first', () => {
      render(<GoalProgress {...defaultProps} />);

      const goalNames = screen.getAllByText(/Fund/).map(el => el.textContent);
      const vacationIndex = goalNames.findIndex(name => name?.includes('Vacation'));
      const emergencyIndex = goalNames.findIndex(name => name?.includes('Emergency'));
      const carIndex = goalNames.findIndex(name => name?.includes('Car'));

      // Completed goals (Vacation) should come first
      expect(vacationIndex).toBeLessThan(emergencyIndex);
      expect(vacationIndex).toBeLessThan(carIndex);
    });

    it('should sort active goals by status priority (overdue first)', () => {
      render(<GoalProgress {...defaultProps} />);

      const goalCards = screen.getAllByText(/Fund/).map(el => 
        el.closest('[class*="p-6"]')
      );

      // Find the order of active goals (excluding completed)
      const activeGoalNames = goalCards
        .map(card => card?.textContent)
        .filter(text => text && !text.includes('Completed'))
        .map(text => {
          if (text?.includes('Emergency')) return 'Emergency';
          if (text?.includes('Car')) return 'Car';
          return null;
        })
        .filter(Boolean);

      // Car Fund (overdue) should come before Emergency Fund (on-track)
      const carIndex = activeGoalNames.indexOf('Car');
      const emergencyIndex = activeGoalNames.indexOf('Emergency');
      
      if (carIndex !== -1 && emergencyIndex !== -1) {
        expect(carIndex).toBeLessThan(emergencyIndex);
      }
    });
  });

  describe('Responsive Design', () => {
    it('should apply custom className', () => {
      const { container } = render(<GoalProgress {...defaultProps} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should use grid layout for goal cards', () => {
      render(<GoalProgress {...defaultProps} />);

      const goalContainer = screen.getByText('Your Goals').parentElement?.querySelector('[class*="grid"]');
      expect(goalContainer).toBeInTheDocument();
      expect(goalContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Data Formatting', () => {
    it('should format currency correctly', () => {
      render(<GoalProgress {...defaultProps} />);

      // Check for properly formatted currency (no decimals for whole numbers)
      expect(screen.getByText('$35,000')).toBeInTheDocument();
      expect(screen.getByText('$17,500')).toBeInTheDocument();
      expect(screen.getByText('$10,000')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      render(<GoalProgress {...defaultProps} />);

      // Check for properly formatted dates
      expect(screen.getByText(/Dec 31, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jun 1, 2024/)).toBeInTheDocument();
    });

    it('should format percentages correctly', () => {
      render(<GoalProgress {...defaultProps} />);

      expect(screen.getByText('75.0% complete')).toBeInTheDocument();
      expect(screen.getByText('100.0% complete')).toBeInTheDocument();
      expect(screen.getByText('25.0% complete')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle goals without descriptions', () => {
      const goalsWithoutDescriptions = mockGoals.map(goal => ({
        ...goal,
        description: undefined
      }));

      render(<GoalProgress 
        goals={goalsWithoutDescriptions} 
        goalProgress={mockGoalProgress} 
      />);

      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      expect(screen.getByText('Vacation Fund')).toBeInTheDocument();
      expect(screen.getByText('Car Fund')).toBeInTheDocument();
    });

    it('should handle missing goal progress data', () => {
      const incompleteProgress = mockGoalProgress.slice(0, 2); // Missing progress for goal-3

      render(<GoalProgress 
        goals={mockGoals} 
        goalProgress={incompleteProgress} 
      />);

      // Should still render the goals that have progress data
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
      expect(screen.getByText('Vacation Fund')).toBeInTheDocument();
    });

    it('should handle zero target amounts gracefully', () => {
      const zeroProgress = {
        goalId: 'goal-zero',
        name: 'Zero Goal',
        targetAmount: 0,
        currentAmount: 0,
        remainingAmount: 0,
        progress: 0,
        status: 'on-track' as const,
        daysRemaining: 30,
        projectedCompletionDate: new Date(),
        requiredDailyContribution: 0
      };

      render(<GoalProgress 
        goals={[]} 
        goalProgress={[zeroProgress]} 
      />);

      // Should handle division by zero gracefully
      expect(screen.getByText('$0')).toBeInTheDocument();
    });
  });
});