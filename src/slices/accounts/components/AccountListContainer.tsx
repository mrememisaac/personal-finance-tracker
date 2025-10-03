
import { AccountList } from './AccountList';

export function AccountListContainer() {
  // AccountList handles its own account operations via context
  // No need to pass accounts, onEdit, onDelete as props

  return <AccountList />;
}