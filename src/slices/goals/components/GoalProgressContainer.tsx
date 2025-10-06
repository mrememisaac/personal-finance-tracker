import React from 'react';
import { useAppContext } from '../../../shared/context/AppContext';
import { GoalProgress } from './GoalProgress';
import { Goal } from '../Goal';
import type { GoalProgress as IGoalProgress, GoalNotification } from '../services/GoalService';

export function GoalProgressContainer() {
  const { state } = useAppContext();

  // Convert goal data to Goal instances
  const goals = state.goals.map(goalData => new Goal(goalData));

  // Calculate progress for each goal
  const goalProgress: IGoalProgress[] = goals.map(goal => {
    const progressPercentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
    
    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Determine status
    let status: 'completed' | 'on-track' | 'behind' | 'overdue' = 'on-track';
    if (goal.isCompleted) {
      status = 'completed';
    } else if (daysRemaining === 0 && !goal.isCompleted) {
      status = 'overdue';
    } else if (daysRemaining < 30 && progressPercentage < 80) {
      status = 'behind';
    }

    // Calculate projected completion date
    let projectedCompletionDate: Date | null = null;
    if (!goal.isCompleted && remainingAmount > 0) {
      const daysSinceCreation = Math.max(1, Math.ceil((now.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      const averageDailyProgress = goal.currentAmount / daysSinceCreation;
      
      if (averageDailyProgress > 0) {
        const daysToCompletion = remainingAmount / averageDailyProgress;
        projectedCompletionDate = new Date(now.getTime() + (daysToCompletion * 24 * 60 * 60 * 1000));
      }
    }

    return {
      goalId: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remainingAmount,
      progress: progressPercentage,
      status,
      daysRemaining,
      projectedCompletionDate: projectedCompletionDate || new Date(),
      requiredDailyContribution: remainingAmount / Math.max(1, daysRemaining),
    };
  });

  // Mock notifications for now
  const notifications: GoalNotification[] = [];

  if (goals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Yet</h3>
          <p className="text-gray-600 mb-4">
            Set your first financial goal to start tracking your progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoalProgress
      goals={goals}
      goalProgress={goalProgress}
      notifications={notifications}
    />
  );
}