import React, { createContext, useContext, useMemo } from 'react';
import { useAppContext } from '../shared/context/AppContext';

// Import all services
import { TransactionService } from '../slices/transaction';
import { AccountService } from '../slices/accounts';
import { BudgetService } from '../slices/budget';
import { GoalService } from '../slices/goals';
import { ReportService } from '../slices/reports';
import { TestService } from '../slices/testing';

interface ServiceContextType {
  transactionService: TransactionService;
  accountService: AccountService;
  budgetService: BudgetService;
  goalService: GoalService;
  reportService: ReportService;
  testService: TestService;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

interface ServiceProviderProps {
  children: React.ReactNode;
}

export function ServiceProvider({ children }: ServiceProviderProps) {
  const { state, dispatch } = useAppContext();

  // Create service instances with shared state and dispatch
  const services = useMemo(() => {
    const transactionService = new TransactionService(state, dispatch);
    const accountService = new AccountService(state, dispatch);
    const budgetService = new BudgetService(state, dispatch);
    const goalService = new GoalService(state, dispatch);
    const reportService = new ReportService(state, dispatch);
    const testService = new TestService(state, dispatch);

    // Set up cross-slice dependencies
    transactionService.setBudgetService(budgetService);
    transactionService.setAccountService(accountService);
    budgetService.setTransactionService(transactionService);
    goalService.setAccountService(accountService);
    reportService.setTransactionService(transactionService);
    reportService.setAccountService(accountService);
    reportService.setBudgetService(budgetService);

    return {
      transactionService,
      accountService,
      budgetService,
      goalService,
      reportService,
      testService,
    };
  }, [state, dispatch]);

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
}

// Individual service hooks for convenience
export function useTransactionService() {
  return useServices().transactionService;
}

export function useAccountService() {
  return useServices().accountService;
}

export function useBudgetService() {
  return useServices().budgetService;
}

export function useGoalService() {
  return useServices().goalService;
}

export function useReportService() {
  return useServices().reportService;
}

export function useTestService() {
  return useServices().testService;
}