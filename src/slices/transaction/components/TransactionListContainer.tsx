import React from 'react';
import { useAppContext } from '../../../shared/context/AppContext';
import { TransactionList } from './TransactionList';

export function TransactionListContainer() {
  const { state, dispatch } = useAppContext();

  const handleEdit = (transactionId: string, updates: any) => {
    dispatch({
      type: 'UPDATE_TRANSACTION',
      payload: { id: transactionId, updates },
    });
  };

  const handleDelete = (transactionId: string) => {
    dispatch({
      type: 'DELETE_TRANSACTION',
      payload: transactionId,
    });
  };

  return (
    <TransactionList
      transactions={state.transactions}
      accounts={state.accounts}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}