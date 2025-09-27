import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Tag, CreditCard } from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { Transaction } from '../Transaction';
import { 
  DEFAULT_EXPENSE_CATEGORIES, 
  DEFAULT_INCOME_CATEGORIES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES 
} from '../../../shared/constants';
import { formatCurrency } from '../../../shared/utils';
import type { Transaction as ITransaction, ValidationResult } from '../../../shared/types';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: ITransaction | null;
  onSuccess?: (transaction: ITransaction) => void;
}

interface FormData {
  amount: string;
  description: string;
  category: string;
  customCategory: string;
  accountId: string;
  type: 'income' | 'expense';
  date: string;
  tags: string;
}

interface FormErrors {
  amount?: string;
  description?: string;
  category?: string;
  accountId?: string;
  date?: string;
  general?: string;
}

export function TransactionForm({ isOpen, onClose, transaction, onSuccess }: TransactionFormProps) {
  const { state, dispatch } = useAppContext();
  const { accounts } = state;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    description: '',
    category: '',
    customCategory: '',
    accountId: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    tags: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Initialize form data when transaction prop changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: Math.abs(transaction.amount).toString(),
        description: transaction.description,
        category: transaction.category,
        customCategory: '',
        accountId: transaction.accountId,
        type: transaction.type,
        date: transaction.date.toISOString().split('T')[0],
        tags: transaction.tags?.join(', ') || '',
      });
      
      // Check if category is custom (not in predefined lists)
      const isCustomCategory = ![...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]
        .includes(transaction.category as any);
      setShowCustomCategory(isCustomCategory);
    } else {
      // Reset form for new transaction
      setFormData({
        amount: '',
        description: '',
        category: '',
        customCategory: '',
        accountId: accounts.length > 0 ? accounts[0].id : '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        tags: '',
      });
      setShowCustomCategory(false);
    }
    setErrors({});
  }, [transaction, accounts]);

  // Get categories based on transaction type
  const getCategories = () => {
    return formData.type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  };

  // Handle input changes with real-time validation
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Real-time validation for specific fields
    if (field === 'amount') {
      validateAmount(value);
    } else if (field === 'description') {
      validateDescription(value);
    } else if (field === 'date') {
      validateDate(value);
    }
  };

  // Validation functions
  const validateAmount = (amount: string): boolean => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setErrors(prev => ({ ...prev, amount: ERROR_MESSAGES.POSITIVE_AMOUNT_REQUIRED }));
      return false;
    }
    setErrors(prev => ({ ...prev, amount: undefined }));
    return true;
  };

  const validateDescription = (description: string): boolean => {
    if (!description.trim()) {
      setErrors(prev => ({ ...prev, description: ERROR_MESSAGES.REQUIRED_FIELD }));
      return false;
    }
    if (description.length > 200) {
      setErrors(prev => ({ ...prev, description: 'Description must be 200 characters or less' }));
      return false;
    }
    setErrors(prev => ({ ...prev, description: undefined }));
    return true;
  };

  const validateDate = (date: string): boolean => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (!date || isNaN(selectedDate.getTime())) {
      setErrors(prev => ({ ...prev, date: ERROR_MESSAGES.INVALID_DATE }));
      return false;
    }
    if (selectedDate > today) {
      setErrors(prev => ({ ...prev, date: 'Transaction date cannot be in the future' }));
      return false;
    }
    setErrors(prev => ({ ...prev, date: undefined }));
    return true;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Amount validation
    const numAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = ERROR_MESSAGES.POSITIVE_AMOUNT_REQUIRED;
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = ERROR_MESSAGES.REQUIRED_FIELD;
      isValid = false;
    } else if (formData.description.length > 200) {
      newErrors.description = 'Description must be 200 characters or less';
      isValid = false;
    }

    // Category validation
    const category = showCustomCategory ? formData.customCategory : formData.category;
    if (!category.trim()) {
      newErrors.category = ERROR_MESSAGES.REQUIRED_FIELD;
      isValid = false;
    }

    // Account validation
    if (!formData.accountId) {
      newErrors.accountId = ERROR_MESSAGES.REQUIRED_FIELD;
      isValid = false;
    }

    // Date validation
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (!formData.date || isNaN(selectedDate.getTime())) {
      newErrors.date = ERROR_MESSAGES.INVALID_DATE;
      isValid = false;
    } else if (selectedDate > today) {
      newErrors.date = 'Transaction date cannot be in the future';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const category = showCustomCategory ? formData.customCategory.trim() : formData.category;
      const tags = formData.tags.trim() 
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : undefined;

      const transactionData: Omit<ITransaction, 'id' | 'createdAt' | 'updatedAt'> = {
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category,
        accountId: formData.accountId,
        type: formData.type,
        date: new Date(formData.date),
        tags,
      };

      let result: ValidationResult & { transaction?: Transaction };

      if (transaction) {
        // Update existing transaction
        const transactionService = new (await import('../services/TransactionService')).TransactionService(
          dispatch,
          () => state.transactions
        );
        result = transactionService.updateTransaction(transaction.id, transactionData);
      } else {
        // Create new transaction
        const transactionService = new (await import('../services/TransactionService')).TransactionService(
          dispatch,
          () => state.transactions
        );
        result = transactionService.addTransaction(transactionData);
      }

      if (result.isValid && result.transaction) {
        onSuccess?.(result.transaction.toJSON());
        onClose();
        
        // Show success message (you might want to implement a toast notification system)
        console.log(transaction ? SUCCESS_MESSAGES.TRANSACTION_UPDATED : SUCCESS_MESSAGES.TRANSACTION_ADDED);
      } else {
        setErrors({ general: result.errors.join(', ') });
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      setErrors({ general: ERROR_MESSAGES.GENERIC_ERROR });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomCategory(true);
      setFormData(prev => ({ ...prev, category: '', customCategory: '' }));
    } else {
      setShowCustomCategory(false);
      setFormData(prev => ({ ...prev, category: value, customCategory: '' }));
    }
    setErrors(prev => ({ ...prev, category: undefined }));
  };

  // Handle transaction type change
  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData(prev => ({ 
      ...prev, 
      type, 
      category: '', // Reset category when type changes
      customCategory: '' 
    }));
    setShowCustomCategory(false);
    setErrors(prev => ({ ...prev, category: undefined }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
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
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                  formData.type === 'expense'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                  formData.type === 'income'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter transaction description"
                maxLength={200}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-between mt-1">
              {errors.description ? (
                <p className="text-sm text-red-600">{errors.description}</p>
              ) : (
                <div />
              )}
              <p className="text-xs text-gray-500">
                {formData.description.length}/200
              </p>
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                id="category"
                value={showCustomCategory ? 'custom' : formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select a category</option>
                {getCategories().map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="custom">+ Add Custom Category</option>
              </select>
            </div>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Custom Category Input */}
          {showCustomCategory && (
            <div>
              <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Category *
              </label>
              <input
                type="text"
                id="customCategory"
                value={formData.customCategory}
                onChange={(e) => handleInputChange('customCategory', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter custom category name"
                maxLength={50}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Account */}
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
              Account *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                id="accountId"
                value={formData.accountId}
                onChange={(e) => handleInputChange('accountId', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.accountId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
            </div>
            {errors.accountId && (
              <p className="mt-1 text-sm text-red-600">{errors.accountId}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          {/* Tags (Optional) */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (Optional)
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tags separated by commas"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple tags with commas (e.g., "groceries, weekly shopping")
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                formData.type === 'income'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Saving...' 
                : transaction 
                  ? 'Update Transaction' 
                  : 'Add Transaction'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}