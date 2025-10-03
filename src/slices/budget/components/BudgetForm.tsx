import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Budget } from '../Budget';
import type { Budget as IBudget } from '../../../shared/types';

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (budgetData: Omit<IBudget, 'id' | 'createdAt' | 'updatedAt' | 'endDate'> & { endDate?: Date }) => void;
  budget?: Budget;
  existingCategories?: string[];
}

const BudgetForm: React.FC<BudgetFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  budget,
  existingCategories = []
}) => {
  const [formData, setFormData] = useState({
    category: '',
    limit: '',
    period: 'monthly' as 'weekly' | 'monthly',
    startDate: '',
    isActive: true
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefined categories
  const predefinedCategories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Personal Care',
    'Home & Garden',
    'Gifts & Donations',
    'Business',
    'Other'
  ];

  // All available categories (predefined + existing)
  const allCategories = [...new Set([...predefinedCategories, ...existingCategories])];

  useEffect(() => {
    if (budget) {
      // Edit mode - populate form with existing budget data
      setFormData({
        category: budget.category,
        limit: budget.limit.toString(),
        period: budget.period,
        startDate: budget.startDate.toISOString().split('T')[0],
        isActive: budget.isActive
      });
    } else {
      // Create mode - reset form
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        category: '',
        limit: '',
        period: 'monthly',
        startDate: today,
        isActive: true
      });
    }
    setErrors([]);
  }, [budget, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Category validation
    if (!formData.category.trim()) {
      newErrors.push('Category is required');
    }

    // Limit validation
    const limit = parseFloat(formData.limit);
    if (!formData.limit || isNaN(limit) || limit <= 0) {
      newErrors.push('Budget limit must be a positive number');
    } else if (limit > 1000000) {
      newErrors.push('Budget limit cannot exceed $1,000,000');
    }

    // Start date validation
    if (!formData.startDate) {
      newErrors.push('Start date is required');
    } else {
      const startDate = new Date(formData.startDate);
      if (isNaN(startDate.getTime())) {
        newErrors.push('Invalid start date');
      }
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
      const startDate = new Date(formData.startDate);
      startDate.setHours(0, 0, 0, 0);

      const budgetData = {
        category: formData.category.trim(),
        limit: parseFloat(formData.limit),
        period: formData.period,
        startDate,
        isActive: formData.isActive
      };

      await onSubmit(budgetData);
      onClose();
    } catch (error) {
      setErrors(['Failed to save budget. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const calculateEndDate = (): string => {
    if (!formData.startDate) return '';
    
    const startDate = new Date(formData.startDate);
    const endDate = Budget.calculateEndDate(startDate, formData.period);
    
    return endDate.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {budget ? 'Edit Budget' : 'Create New Budget'}
          </h2>
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

          {/* Category Field */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <div className="relative">
              <input
                type="text"
                id="category"
                list="categories"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Select or enter a category"
                disabled={isSubmitting}
                required
              />
              <datalist id="categories">
                {allCategories.map(category => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Choose from suggestions or enter a custom category
            </p>
          </div>

          {/* Budget Limit Field */}
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
              Budget Limit *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                id="limit"
                value={formData.limit}
                onChange={(e) => handleInputChange('limit', e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
                min="0.01"
                max="1000000"
                step="0.01"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Period Field */}
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
              Budget Period *
            </label>
            <select
              id="period"
              value={formData.period}
              onChange={(e) => handleInputChange('period', e.target.value as 'weekly' | 'monthly')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
              required
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Start Date Field */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
              required
            />
            {formData.startDate && (
              <p className="mt-1 text-xs text-gray-500">
                End date: {calculateEndDate()}
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active budget
            </label>
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
                  {budget ? 'Update Budget' : 'Create Budget'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { BudgetForm };