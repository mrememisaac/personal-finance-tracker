import { useState } from 'react';
import { TransactionList } from './TransactionList';
import { TransactionForm } from './TransactionForm';
import { AppProvider } from '../../../shared/context/AppContext';
import type { Transaction } from '../../../shared/types';

// Demo component to showcase the TransactionList functionality
export function TransactionListDemo() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      console.log('Delete transaction:', transactionId);
      // In a real app, this would dispatch a delete action
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleFormSuccess = (transaction: Transaction) => {
    console.log('Transaction saved:', transaction);
    handleFormClose();
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Transaction List Demo
            </h1>
            <p className="text-gray-600">
              This demo shows the TransactionList component with all its features:
              sorting, filtering, pagination, search, and export functionality.
            </p>
          </div>

          <div className="mb-4">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add New Transaction
            </button>
          </div>

          <TransactionList
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />

          {showForm && (
            <TransactionForm
              isOpen={showForm}
              onClose={handleFormClose}
              transaction={editingTransaction}
              onSuccess={handleFormSuccess}
            />
          )}
        </div>
      </div>
    </AppProvider>
  );
}