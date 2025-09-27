import React from 'react';
import { useAppContext } from '../../../shared/context/AppContext';
import { AccountList } from './AccountList';

export function AccountListContainer() {
  const { state, dispatch } = useAppContext();

  const handleEdit = (accountId: string, updates: any) => {
    dispatch({
      type: 'UPDATE_ACCOUNT',
      payload: { id: accountId, updates },
    });
  };

  const handleDelete = (accountId: string) => {
    dispatch({
      type: 'DELETE_ACCOUNT',
      payload: accountId,
    });
  };

  return (
    <AccountList
      accounts={state.accounts}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}