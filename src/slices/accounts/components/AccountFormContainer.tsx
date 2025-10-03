import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppContext } from '../../../shared/context/AppContext';
import { AccountForm } from './AccountForm';

export function AccountFormContainer() {
  const [isOpen, setIsOpen] = useState(false);
  const { dispatch } = useAppContext();

  const handleSubmit = (accountData: any) => {
    const newAccount = {
      ...accountData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({
      type: 'ADD_ACCOUNT',
      payload: newAccount,
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
        Add Account
      </button>

      <AccountForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSubmit}
      />
    </>
  );
}