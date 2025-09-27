import React from 'react';
import { Target, Calendar, TrendingUp, CheckCircle, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import type { Goal } from '../Goal';
import type { GoalProgress as IGoalProgress, GoalNotification } from '../services/GoalService';

interface GoalProgressProps {
  goals: Goal[];
  goalProgress: IGoalProgress[];
  notifications?: GoalNotification[];
  onGoalClick?: (goalId: string) => void;
  className?: string;
}

interface GoalCardProps {
  goal: Goal;
  progress: IGoalProgress;
  notifications: GoalNotification[];
  onClick?: (goalId: string) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, progress, notifications, onClick }) => {
  const getStatusColor = (status: 'completed' | 'on-track' | 'behind' | 'overdue') => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'on-track':
        return 'bg-blue-500';
      case 'behind':
        return 'bg-yellow-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: 'completed' | 'on-track' | 'behind' | 'overdue') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'on-track':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'behind':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'overdue':
        return <Clock className="w-5 h-5 text-red-600" />;
      default:
        return <Target className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBgColor = (status: 'completed' | 'on-track' | 'behind' | 'overdue') => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'on-track':
        return 'bg-blue-50 border-blue-200';
      case 'behind':
        return 'bg-yellow-50 border-yellow-200';
      case 'overdue':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: 'completed' | 'on-track' | 'behind' | 'overdue') => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'on-track':
        return 'On Track';
      case 'behind':
        return 'Behind Schedule';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const goalNotifications = notifications.filter(n => n.goalId === goal.id);
  const hasNotifications = goalNotifications.length > 0;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const percentage = Math.min(100, progress.progress);

  return (
    <div 
      className={`p-6 rounded-lg border-2 ${getStatusBgColor(progress.status)} transition-all duration-200 hover:shadow-lg cursor-pointer relative`}
      onClick={() => onClick?.(goal.id)}
    >
      {/* Notification Badge */}
      {hasNotifications && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {goalNotifications.length}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          {getStatusIcon(progress.status)}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{goal.name}</h3>
            {goal.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{goal.description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            progress.status === 'completed' ? 'bg-green-100 text-green-800' :
            progress.status === 'on-track' ? 'bg-blue-100 text-blue-800' :
            progress.status === 'behind' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {getStatusText(progress.status)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {percentage.toFixed(1)}% complete
          </span>
          <span className="text-sm text-gray-600">
            {formatCurrency(progress.currentAmount)} / {formatCurrency(progress.targetAmount)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${getStatusColor(progress.status)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Goal Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium text-gray-800">
              {formatCurrency(progress.remainingAmount)}
            </div>
            <div className="text-xs text-gray-600">Remaining</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium text-gray-800">
              {progress.daysRemaining > 0 ? `${progress.daysRemaining} days` : 'Overdue'}
            </div>
            <div className="text-xs text-gray-600">
              {progress.daysRemaining > 0 ? 'Remaining' : 'Past due'}
            </div>
          </div>
        </div>
      </div>

      {/* Target Date */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>Target: {formatDate(goal.targetDate)}</span>
        {progress.status !== 'completed' && progress.requiredDailyContribution > 0 && (
          <span className="font-medium">
            {formatCurrency(progress.requiredDailyContribution)}/day needed
          </span>
        )}
      </div>

      {/* Notifications */}
      {hasNotifications && (
        <div className="space-y-2">
          {goalNotifications.slice(0, 2).map((notification, index) => (
            <div
              key={index}
              className={`p-2 rounded text-xs ${
                notification.severity === 'success' ? 'bg-green-100 text-green-800' :
                notification.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                notification.severity === 'danger' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}
            >
              {notification.message}
            </div>
          ))}
          {goalNotifications.length > 2 && (
            <div className="text-xs text-gray-500 text-center">
              +{goalNotifications.length - 2} more notifications
            </div>
          )}
        </div>
      )}

      {/* Milestones for active goals */}
      {progress.status !== 'completed' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            {[25, 50, 75, 100].map(milestone => {
              const achieved = percentage >= milestone;
              return (
                <div
                  key={milestone}
                  className={`flex flex-col items-center ${achieved ? 'text-green-600' : 'text-gray-400'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${achieved ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="mt-1">{milestone}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const GoalProgress: React.FC<GoalProgressProps> = ({ 
  goals = [], 
  goalProgress = [], 
  notifications = [], 
  onGoalClick,
  className = '' 
}) => {
  // Calculate summary statistics
  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalRemainingAmount = goals.reduce((sum, goal) => sum + goal.remainingAmount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  const completedGoals = goals.filter(goal => goal.isCompleted);
  const activeGoals = goals.filter(goal => !goal.isCompleted);
  const onTrackGoals = goalProgress.filter(p => p.status === 'on-track');
  const behindGoals = goalProgress.filter(p => p.status === 'behind');
  const overdueGoals = goalProgress.filter(p => p.status === 'overdue');

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (goals.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="text-gray-500 mb-4">
          <Target className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">No Goals Set</h3>
          <p className="text-sm">Create your first financial goal to start tracking your progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Goals Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalTargetAmount)}</div>
            <div className="text-sm text-blue-800">Total Target</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCurrentAmount)}</div>
            <div className="text-sm text-green-800">Current Amount</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalRemainingAmount)}</div>
            <div className="text-sm text-orange-800">Remaining</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{overallProgress.toFixed(1)}%</div>
            <div className="text-sm text-purple-800">Overall Progress</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Goal Progress</span>
            <span className="text-sm font-semibold text-gray-600">
              {completedGoals.length} of {goals.length} goals completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, overallProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Goal Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{completedGoals.length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{onTrackGoals.length}</div>
            <div className="text-sm text-gray-600">On Track</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{behindGoals.length}</div>
            <div className="text-sm text-gray-600">Behind</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{overdueGoals.length}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{activeGoals.length}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>
      </div>

      {/* Individual Goal Progress */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Your Goals</h3>
          {notifications.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              <span>{notifications.length} notifications</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Show completed goals first */}
          {completedGoals.map(goal => {
            const progress = goalProgress.find(p => p.goalId === goal.id);
            if (!progress) return null;
            
            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                progress={progress}
                notifications={notifications}
                onClick={onGoalClick}
              />
            );
          })}
          
          {/* Then show active goals sorted by status priority */}
          {activeGoals
            .sort((a, b) => {
              const aProgress = goalProgress.find(p => p.goalId === a.id);
              const bProgress = goalProgress.find(p => p.goalId === b.id);
              
              if (!aProgress || !bProgress) return 0;
              
              const statusPriority = { 'overdue': 0, 'behind': 1, 'on-track': 2, 'completed': 3 };
              return statusPriority[aProgress.status] - statusPriority[bProgress.status];
            })
            .map(goal => {
              const progress = goalProgress.find(p => p.goalId === goal.id);
              if (!progress) return null;
              
              return (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  progress={progress}
                  notifications={notifications}
                  onClick={onGoalClick}
                />
              );
            })}
        </div>
      </div>

      {/* Achievement Notifications */}
      {notifications.filter(n => n.type === 'completion' || n.type === 'milestone').length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Achievements</h3>
          <div className="space-y-3">
            {notifications
              .filter(n => n.type === 'completion' || n.type === 'milestone')
              .slice(0, 3)
              .map((notification, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-start space-x-3 ${
                    notification.severity === 'success' ? 'bg-green-50 border border-green-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}
                >
                  {notification.type === 'completion' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium text-gray-800">{notification.name}</div>
                    <div className="text-sm text-gray-600">{notification.message}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { GoalProgress };