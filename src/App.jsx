import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useCustomers } from './features/customers/useCustomers';
import { usePayments } from './features/payments/usePayments';
import { useExpenses } from './features/expenses/useExpenses';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardTab from './pages/DashboardTab';
import CustomersTab from './pages/CustomersTab';
import CollectionsTab from './pages/CollectionsTab';
import ExpensesTab from './pages/ExpensesTab';
import SettingsTab from './pages/SettingsTab';
import CustomerModal from './components/modals/CustomerModal';
import PaymentModal from './components/modals/PaymentModal';
import HistoryModal from './components/modals/HistoryModal';
import WhatsAppBulkReminderModal from './components/modals/WhatsAppBulkReminderModal';
import PhotoPreviewModal from './components/modals/PhotoPreviewModal';
import PauseModal from './components/modals/PauseModal';
import CalculatorDrawer from './components/ui/CalculatorDrawer';

function AppContent() {
  const auth = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { db, saveDb, showToast, activeBranch, role, isLoggedIn, lockScreenJSX } = auth;
  const isOwnerRole = role === 'owner';

  const customers = useCustomers({ db, saveDb, showToast, activeBranch, currentTab, role, isOwnerRole });
  const payments = usePayments({ db, saveDb, showToast, activeBranch, role, isOwnerRole });
  const expenses = useExpenses({ db, saveDb, showToast, activeBranch, role, isOwnerRole });

  const handleTabChange = (newTab) => {
    if (newTab !== 'oldcustomers') auth.setIsArchiveUnlocked(false);
    if (newTab !== 'settings') auth.setIsSettingsUnlocked(false);
    setCurrentTab(newTab);
  };

  if (!isLoggedIn) return lockScreenJSX;

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
      <Sidebar currentTab={currentTab} setCurrentTab={handleTabChange} role={role} handleLogout={auth.handleLogout} t={auth.t} />
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0, overflow: 'hidden' }}>
        <Header activeBranch={activeBranch} setActiveBranch={auth.setActiveBranch} boundBranch={auth.boundBranch} role={role} currentTab={currentTab} metrics={auth.metrics} currentMonthNetProfit={auth.currentMonthNetProfit} showCalculator={auth.showCalculator} setShowCalculator={auth.setShowCalculator} handleLogout={auth.handleLogout} t={auth.t} />
        <main className="tab-content" style={{ flex: 1, padding: '24px', overflowY: 'auto', minHeight: 0 }}>
          {currentTab === 'dashboard' && <DashboardTab db={db} activeBranch={activeBranch} role={role} setCurrentTab={handleTabChange} metrics={auth.metrics} computeStatus={payments.computeStatus} openAddCust={customers.openAddCust} openEditCust={customers.openEditCust} deleteCustomer={customers.deleteCustomer} restoreCustomer={customers.restoreCustomer} openPayModal={payments.openPayModal} getCustomerDues={payments.getCustomerDues} getDueWarningDays={payments.getDueWarningDays} expiryStr={payments.expiryStr} t={auth.t} onOpenPauseModal={customers.setPauseModalCust} />}
          {(currentTab === 'customers' || currentTab === 'tiffin' || currentTab === 'shortterm' || currentTab === 'oldcustomers') && <CustomersTab db={db} activeBranch={activeBranch} currentTab={currentTab} isArchiveUnlocked={auth.isArchiveUnlocked} archiveInputRef={auth.archiveInputRef} archivePinInput={auth.archivePinInput} setArchivePinInput={auth.setArchivePinInput} showToast={showToast} matchesArchiveSecret={auth.matchesArchiveSecret} setIsArchiveUnlocked={auth.setIsArchiveUnlocked} t={auth.t} custSearch={customers.custSearch} setCustSearch={customers.setCustSearch} tiffinAreaFilter={customers.tiffinAreaFilter} setTiffinAreaFilter={customers.setTiffinAreaFilter} filteredCustomers={customers.filteredCustomers} computeStatus={payments.computeStatus} getCustomerDues={payments.getCustomerDues} PLAN_DAYS={payments.PLAN_DAYS} parseLocalDate={payments.parseLocalDate} getDueWarningDays={payments.getDueWarningDays} getDaysPendingDues={payments.getDaysPendingDues} expiryStr={payments.expiryStr} openAddCust={customers.openAddCust} onOpenEditCust={customers.openEditCust} onDeleteCustomer={customers.deleteCustomer} onRestoreCustomer={customers.restoreCustomer} onAddArea={customers.handleAddArea} onDeleteArea={customers.handleDeleteArea} onDeleteAllAreas={customers.handleDeleteAllAreas} role={role} onEnlargePhoto={(imgData) => auth.setPreviewImage(imgData)} onOpenPayModal={payments.openPayModal} onOpenHistoryModal={auth.openHistoryModal} onSendWhatsAppReminder={auth.handleSendWhatsAppReminder} onOpenBulkReminder={auth.handleOpenBulkReminder} onExportCustomers={auth.handleExportCustomers} onOpenPauseModal={customers.setPauseModalCust} />}
          {currentTab === 'collections' && <CollectionsTab db={db} activeBranch={activeBranch} role={role} filter={payments.collectionFilter} setFilter={payments.setCollectionFilter} startDate={payments.colStartDate} setStartDate={payments.setColStartDate} endDate={payments.colEndDate} setEndDate={payments.setColEndDate} filteredTxns={payments.filteredTxns} filteredTxnsTotal={payments.filteredTxnsTotal} todayCollectionTotal={payments.todayCollectionTotal} currentMonthCollectionTotal={payments.currentMonthCollectionTotal} deleteTransaction={payments.deleteTransaction} onDeleteTxn={payments.deleteTransaction} matchesArchiveSecret={auth.matchesArchiveSecret} showToast={showToast} t={auth.t} onEnlargePhoto={(imgData) => auth.setPreviewImage(imgData)} />}
          {currentTab === 'expenses' && <ExpensesTab db={db} activeBranch={activeBranch} role={role} expenseForm={expenses.expenseForm} setExpenseForm={expenses.setExpenseForm} handleSaveExpense={expenses.handleSaveExpense} handleDeleteExpense={expenses.handleDeleteExpense} filter={expenses.expenseFilter} setFilter={expenses.setExpenseFilter} startDate={expenses.expStartDate} setStartDate={expenses.setExpStartDate} endDate={expenses.expEndDate} setEndDate={expenses.setExpEndDate} filteredExpenses={expenses.filteredExpenses} filteredExpensesTotal={expenses.filteredExpensesTotal} todayExpenseTotal={expenses.todayExpenseTotal} currentMonthExpenseTotal={expenses.currentMonthExpenseTotal} matchesArchiveSecret={auth.matchesArchiveSecret} showToast={showToast} t={auth.t} />}
          {currentTab === 'settings' && <SettingsTab db={db} saveDb={saveDb} role={role} activeBranch={activeBranch} isSettingsUnlocked={auth.isSettingsUnlocked} setIsSettingsUnlocked={auth.setIsSettingsUnlocked} settingsPinInput={auth.settingsPinInput} setSettingsPinInput={auth.setSettingsPinInput} saveSettings={auth.saveSettings} handleForceRestoreFromCloud={auth.handleForceRestoreFromCloud} showToast={showToast} t={auth.t} />}
        </main>
      </div>
      <CustomerModal isOpen={customers.isCustModalOpen} onClose={() => customers.setIsCustModalOpen(false)} initialData={customers.custFormToEdit} customer={customers.custFormToEdit} editCustId={customers.editCustId} isEditing={Boolean(customers.editCustId)} onSave={customers.saveCustomer} isSaving={customers.isSavingCustomer} currentTab={currentTab} db={db} showToast={showToast} />
      <PaymentModal isOpen={Boolean(payments.payModalCustomer)} onClose={() => payments.setPayModalCustomer(null)} customer={payments.payModalCustomer} amount={payments.payAmount} setAmount={payments.setPayAmount} date={payments.payDate} setDate={payments.setPayDate} mode={payments.payMode} setMode={payments.setPayMode} note={payments.payNote} setNote={payments.setPayNote} onSave={payments.handlePaySubmit} isSaving={payments.isSavingPayment} db={db} getCustomerDues={payments.getCustomerDues} />
      <HistoryModal isOpen={Boolean(auth.historyCust)} onClose={() => auth.setHistoryCust(null)} customer={auth.historyCust} db={db} getCustomerDues={payments.getCustomerDues} />
      <WhatsAppBulkReminderModal isBulkReminderOpen={auth.isBulkReminderOpen} setIsBulkReminderOpen={auth.setIsBulkReminderOpen} db={db} getCustomerDues={payments.getCustomerDues} showToast={showToast} />
      <PhotoPreviewModal previewImage={auth.previewImage} setPreviewImage={auth.setPreviewImage} />
      <PauseModal isOpen={Boolean(customers.pauseModalCust)} customer={customers.pauseModalCust} onClose={() => customers.setPauseModalCust(null)} onSavePause={customers.handlePauseCustomer} onSaveResume={customers.handleResumeCustomer} isMarathi={db.settings?.lang === 'mr'} />
      <CalculatorDrawer showCalculator={auth.showCalculator} setShowCalculator={auth.setShowCalculator} calcInput={auth.calcInput} setCalcInput={auth.setCalcInput} calcResult={auth.calcResult} handleCalcKeyPress={auth.handleCalcKeyPress} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
