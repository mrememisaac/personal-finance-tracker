import React, { useState, useEffect } from 'react';
import { X, DollarSign, Building, CreditCard, Type } from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { AccountService } from '../services/AccountService';
import { 
  ACCOUNT_TYPES,
  SUPPORTED_CURRENCIES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES 
} from '../../../shared/constants';
import { formatCurrency } from '../../../shared/utils';
import type { Account as IAccount, ValidationResult } from '../../../shared/types';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  account?: IAccount | null;
  onSuccess?: (account: IAccount) => void;
}

interface FormData {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: string;
  currency: string;
}

interface FormErrors {
  name?: string;
  type?: string;
  balance?: string;
  currency?: string;
  general?: string;
}

export function AccountForm({ isOpen, onClose, account, onSuccess }: AccountFormProps) {
  const { state, dispatch } = useAppContext();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'checking',
    balance: '',
    currency: 'USD',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when account prop changes
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance.toString(),
        currency: account.currency,
      });
    } else {
      // Reset form for new account
      setFormData({
        name: '',
        type: 'checking',
        balance: '',
        currency: 'USD',
      });
    }
    setErrors({});
  }, [account]);

  // Handle input changes with real-time validation
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Real-time validation for specific fields
    if (field === 'name') {
      validateName(value);
    } else if (field === 'balance') {
      validateBalance(value);
    }
  };

  // Validation functions
  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setErrors(prev => ({ ...prev, name: ERROR_MESSAGES.REQUIRED_FIELD }));
      return false;
    }
    if (name.length > 50) {
      setErrors(prev => ({ ...prev, name: 'Account name must be 50 characters or less' }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: undefined }));
    return true;
  };

  const validateBalance = (balance: string): boolean => {
    const numBalance = parseFloat(balance);
    if (balance === '' || isNaN(numBalance)) {
      setErrors(prev => ({ ...prev, balance: 'Please enter a valid balance' }));
      return false;
    }
    
    // Type-specific validation
    if (formData.type === 'savings' && numBalance < 0) {
      setErrors(prev => ({ ...prev, balance: 'Savings accounts cannot have negative balance' }));
      return false;
    }
    
    if (formData.type === 'credit' && numBalance > 0) {
      setErrors(prev => ({ ...prev, balance: 'Credit card accounts should start with zero or negative balance' }));
      return false;
    }

    setErrors(prev => ({ ...prev, balance: undefined }));
    return true;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = ERROR_MESSAGES.REQUIRED_FIELD;
      isValid = false;
    } else if (formData.name.length > 50) {
      newErrors.name = 'Account name must be 50 characters or less';
      isValid = false;
    }

    // Balance validation
    const numBalance = parseFloat(formData.balance);
    if (formData.balance === '' || isNaN(numBalance)) {
      newErrors.balance = 'Please enter a valid balance';
      isValid = false;
    } else {
      // Type-specific validation
      if (formData.type === 'savings' && numBalance < 0) {
        newErrors.balance = 'Savings accounts cannot have negative balance';
        isValid = false;
      }
      
      if (formData.type === 'credit' && numBalance > 0) {
        newErrors.balance = 'Credit card accounts should start with zero or negative balance';
        isValid = false;
      }
    }

    // Currency validation
    if (!formData.currency) {
      newErrors.currency = ERROR_MESSAGES.REQUIRED_FIELD;
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
      const accountService = new AccountService(
        dispatch,
        () => state.accounts,
        () => state.transactions
      );

      const accountData: Omit<IAccount, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        type: formData.type,
        balance: parseFloat(formData.balance),
        currency: formData.currency,
      };

      let result: ValidationResult & { account?: any };

      if (account) {
        // Update existing account
        result = accountService.updateAccount(account.id, accountData);
      } else {
        // Create new account
        result = accountService.addAccount(accountData);
      }

      if (result.isValid && result.account) {
        onSuccess?.(result.account.toJSON());
        onClose();
        
        // Show success message (you might want to implement a toast notification system)
        console.log(account ? SUCCESS_MESSAGES.ACCOUNT_UPDATED : SUCCESS_MESSAGES.ACCOUNT_CREATED);
      } else {
        setErrors({ general: result.errors.join(', ') });
      }
    } catch (error) {
      console.error('Error saving account:', error);
      setErrors({ general: ERROR_MESSAGES.GENERIC_ERROR });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle account type change
  const handleTypeChange = (type: 'checking' | 'savings' | 'credit' | 'investment') => {
    setFormData(prev => ({ ...prev, type }));
    setErrors(prev => ({ ...prev, type: undefined, balance: undefined }));
    
    // Re-validate balance with new type
    if (formData.balance) {
      setTimeout(() => validateBalance(formData.balance), 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {account ? 'Edit Account' : 'Add Account'}
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

          {/* Account Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Account Name *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter account name"
                maxLength={50}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-between mt-1">
              {errors.name ? (
                <p className="text-sm text-red-600">{errors.name}</p>
              ) : (
                <div />
              )}
              <p className="text-xs text-gray-500">
                {formData.name.length}/50
              </p>
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={`p-3 rounded-md border text-sm font-medium transition-colors text-left ${
                    formData.type === type.value
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Type className="w-4 h-4" />
                    <span>{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Initial Balance */}
          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Balance *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                id="balance"
                step="0.01"
                value={formData.balance}
                onChange={(e) => handleInputChange('balance', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.balance ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            {errors.balance && (
              <p className="mt-1 text-sm text-red-600">{errors.balance}</p>
            )}
            
            {/* Type-specific help text */}
            <div className="mt-1">
              {formData.type === 'credit' && (
                <p className="text-xs text-gray-500">
                  Credit cards should start with zero or negative balance (amount owed)
                </p>
              )}
              {formData.type === 'savings' && (
                <p className="text-xs text-gray-500">
                  Savings accounts cannot have negative balance
                </p>
              )}
              {formData.type === 'checking' && (
                <p className="text-xs text-gray-500">
                  Enter your current checking account balance
                </p>
              )}
              {formData.type === 'investment' && (
                <p className="text-xs text-gray-500">
                  Enter the current value of your investment account
                </p>
              )}
            </div>
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.currency ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>
            {errors.currency && (
              <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
            )}
          </div>

          {/* Preview */}
          {formData.name && formData.balance && (
            <div className="bg-gray-50 rounded-md p-3 border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{formData.name}</p>
                  <p className="text-sm text-gray-500">
                    {ACCOUNT_TYPES.find(t => t.value === formData.type)?.label}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    parseFloat(formData.balance) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(parseFloat(formData.balance) || 0, formData.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

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
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-blue-600 hover:bg-blue-700 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Saving...' 
                : account 
                  ? 'Update Account' 
                  : 'Create Account'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}