import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Target } from 'lucide-react';
import { Goal } from '../Goal';
import type { Goal as IGoal, Account } from '../../../shared/types';

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: Omit<IGoal, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted'> & { isCompleted?: boolean }) => void;
  goal?: Goal;
  accounts: Account[];
}

const GoalForm: React.FC<GoalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  goal,
  accounts
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    accountId: ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      // Edit mode - populate form with existing goal data
      setFormData({
        name: goal.name,
        description: goal.description || '',
        targetAmount: goal.targetAmount.toString(),
        currentAmount: goal.currentAmount.toString(),
        targetDate: goal.targetDate.toISOString().split('T')[0],
        accountId: goal.accountId
      });
    } else {
      // Create mode - reset form
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      setFormData({
        name: '',
        description: '',
        targetAmount: '',
        currentAmount: '0',
        targetDate: futureDate.toISOString().split('T')[0],
        accountId: ''
      });
    }
    setErrors([]);
  }, [goal, isOpen, accounts]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Name validation
    if (!formData.name.trim()) {
      newErrors.push('Goal name is required');
    } else if (formData.name.length > 100) {
      newErrors.push('Goal name must be 100 characters or less');
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.push('Goal description must be 500 characters or less');
    }

    // Target amount validation
    const targetAmount = parseFloat(formData.targetAmount);
    if (!formData.targetAmount || isNaN(targetAmount) || targetAmount <= 0) {
      newErrors.push('Target amount must be a positive number');
    } else if (targetAmount > 10000000) {
      newErrors.push('Target amount cannot exceed $10,000,000');
    }

    // Current amount validation
    const currentAmount = parseFloat(formData.currentAmount);
    if (formData.currentAmount === '' || isNaN(currentAmount) || currentAmount < 0) {
      newErrors.push('Current amount must be zero or greater');
    } else if (currentAmount > targetAmount * 1.1) {
      newErrors.push('Current amount should not exceed target amount by more than 10%');
    }

    // Target date validation
    if (!formData.targetDate) {
      newErrors.push('Target date is required');
    } else {
      const targetDate = new Date(formData.targetDate);
      if (isNaN(targetDate.getTime())) {
        newErrors.push('Invalid target date');
      } else if (targetDate <= new Date() && !goal) {
        newErrors.push('Target date should be in the future for new goals');
      }
    }

    // Account validation
    if (!formData.accountId) {
      newErrors.push('Account selection is required');
    } else if (!accounts.find(acc => acc.id === formData.accountId)) {
      newErrors.push('Selected account is not valid');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const targetDate = new Date(formData.targetDate);
      targetDate.setHours(23, 59, 59, 999); // Set to end of day

      const goalData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        targetDate,
        accountId: formData.accountId
      };

      await onSubmit(goalData);
      onClose();
    } catch (error) {
      setErrors(['Failed to save goal. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const calculateProgress = (): number => {
    const target = parseFloat(formData.targetAmount) || 0;
    const current = parseFloat(formData.currentAmount) || 0;
    
    if (target === 0) return 0;
    return Math.min(100, (current / target) * 100);
  };

  const calculateDaysRemaining = (): number => {
    if (!formData.targetDate) return 0;
    
    const targetDate = new Date(formData.targetDate);
    const now = new Date();
    const timeDiff = targetDate.getTime() - now.getTime();
    
    return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  };

  const getSelectedAccount = (): Account | undefined => {
    return accounts.find(acc => acc.id === formData.accountId);
  };

  if (!isOpen) return null;

  const progress = calculateProgress();
  const daysRemaining = calculateDaysRemaining();
  const selectedAccount = getSelectedAccount();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              {goal ? 'Edit Goal' : 'Create New Goal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Goal Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., Emergency Fund, Vacation, New Car"
              maxLength={100}
              disabled={isSubmitting}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.name.length}/100 characters
            </p>
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Describe your goal and why it's important to you"
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Target Amount Field */}
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                id="targetAmount"
                value={formData.targetAmount}
                onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
                min="0.01"
                max="10000000"
                step="0.01"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Current Amount Field */}
          <div>
            <label htmlFor="currentAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Current Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                id="currentAmount"
                value={formData.currentAmount}
                onChange={(e) => handleInputChange('currentAmount', e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Progress Preview */}
          {formData.targetAmount && formData.currentAmount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-800">Progress Preview</span>
                <span className="text-sm font-semibold text-blue-600">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-blue-700">
                ${parseFloat(formData.currentAmount || '0').toLocaleString()} of ${parseFloat(formData.targetAmount || '0').toLocaleString()}
              </div>
            </div>
          )}

          {/* Target Date Field */}
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
              Target Date *
            </label>
            <input
              type="date"
              id="targetDate"
              value={formData.targetDate}
              onChange={(e) => handleInputChange('targetDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
              required
            />
            {formData.targetDate && (
              <p className="mt-1 text-xs text-gray-500">
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Target date has passed'}
              </p>
            )}
          </div>

          {/* Account Selection */}
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
              Associated Account *
            </label>
            <select
              id="accountId"
              value={formData.accountId}
              onChange={(e) => handleInputChange('accountId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
              required
            >
              <option value="">Select an account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type}) - {account.balance.toLocaleString('en-US', {
                    style: 'currency',
                    currency: account.currency
                  })}
                </option>
              ))}
            </select>
            {selectedAccount && (
              <p className="mt-1 text-xs text-gray-500">
                Current balance: {selectedAccount.balance.toLocaleString('en-US', {
                  style: 'currency',
                  currency: selectedAccount.currency
                })}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {goal ? 'Update Goal' : 'Create Goal'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { GoalForm };