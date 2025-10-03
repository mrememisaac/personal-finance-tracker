import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { BudgetForm } from './BudgetForm';

export function BudgetFormContainer() {
  const [isOpen, setIsOpen] = useState(false);
  const { dispatch } = useAppContext();

  const handleSubmit = (budgetData: any) => {
    const newBudget = {
      ...budgetData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      endDate: budgetData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days
    };

    dispatch({
      type: 'ADD_BUDGET',
      payload: newBudget,
    });

    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Budget
      </button>

      <BudgetForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}