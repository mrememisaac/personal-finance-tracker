import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { GoalForm } from './GoalForm';
import type { Goal as IGoal } from '../../../shared/types';

export function GoalFormContainer() {
  const { state, dispatch } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = (goalData: Omit<IGoal, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted'> & { isCompleted?: boolean }) => {
    const newGoal: IGoal = {
      ...goalData,
      id: crypto.randomUUID(),
      isCompleted: goalData.isCompleted || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({
      type: 'ADD_GOAL',
      payload: newGoal,
    });

    setIsFormOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsFormOpen(true)}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Goal
      </button>

      <GoalForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        accounts={state.accounts}
      />
    </>
  );
}