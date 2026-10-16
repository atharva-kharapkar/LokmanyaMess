import { useState, useMemo } from 'react';
import { 
  getCustomerDues as defaultGetCustomerDues, 
  getDueWarningDays as defaultGetDueWarningDays, 
  getDaysPendingDues as defaultGetDaysPendingDues, 
  computeStatus as defaultComputeStatus, 
  expiryStr as defaultExpiryStr, 
  todayStr as defaultTodayStr 
} from '../../utils/helpers';

export function usePayments({ db, saveDb, showToast, activeBranch, role, isOwnerRole }) {
  const [payModalCustomer, setPayModalCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(defaultTodayStr());
  const [payMode, setPayMode] = useState('Cash');
  const [payNote, setPayNote] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const [collectionFilter, setCollectionFilter] = useState('all');
  const [colStartDate, setColStartDate] = useState('');
  const [colEndDate, setColEndDate] = useState('');

  const openPayModal = (customer) => {
    if (!customer) return;
    setPayModalCustomer(customer);
    const dueAmt = typeof defaultGetCustomerDues === 'function' ? defaultGetCustomerDues(customer) : 0;
    setPayAmount(dueAmt > 0 ? dueAmt : (customer.amount || ''));
    setPayDate(defaultTodayStr());
    setPayMode('Cash');
    setPayNote('');
  };

  const handlePaySubmit = async (amountVal, dateVal, modeVal, noteVal) => {
    const isMarathi = db.settings && db.settings.lang === 'mr';
    if (!payModalCustomer) return;
    const numAmt = Number(amountVal || payAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      showToast(isMarathi ? 'कृपया वैध जमा रक्कम प्रविष्ट करा.' : 'Please enter a valid payment amount.', 'error');
      return;
    }

    const targetCustomer = payModalCustomer;
    const customerId = targetCustomer.id;
    const customerName = targetCustomer.name;
    const branchName = targetCustomer.branch || activeBranch || 'Branch 1';
    const txnDate = dateVal || payDate || defaultTodayStr();
    const txnMode = modeVal || payMode || 'Cash';
    const txnNote = noteVal || payNote || '';

    // Instant UI feedback: Close modal immediately (0ms) so user is never blocked
    setPayModalCustomer(null);
    setPayAmount('');
    setPayNote('');

    setIsSavingPayment(true);
    try {
      const now = Date.now();
      const exactTimeStr = new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const newTxn = {
        id: 'txn_' + now,
        custId: customerId,
        custName: customerName,
        amount: numAmt,
        date: txnDate,
        time: exactTimeStr,
        createdAt: now,
        mode: txnMode,
        paymentMode: txnMode,
        note: txnNote,
        branch: branchName,
        category: targetCustomer?.category || 'dinein',
        updatedAt: now
      };

      const saveResult = await saveDb((currentDb) => ({
        ...currentDb,
        transactions: [newTxn, ...(currentDb.transactions || [])],
        customers: (currentDb.customers || []).map(c => 
          String(c.id).trim() === String(customerId).trim() ? { 
            ...c, 
            deposited: Number(c.deposited || 0) + numAmt,
            updatedAt: now
          } : c
        )
      }));

      if (saveResult === false) {
        throw new Error(isMarathi ? 'स्थानिक डेटा सेव्ह अयशस्वी झाला.' : 'Local database save failed.');
      }

      showToast(
        isMarathi 
          ? `₹${numAmt.toLocaleString('en-IN')} जमा रक्कम यशस्वीरित्या नोंदवली!` 
          : `Payment of ₹${numAmt.toLocaleString('en-IN')} recorded successfully!`, 
        'success'
      );
    } catch (err) {
      console.error('handlePaySubmit error:', err);
      showToast(
        isMarathi ? 'जमा नोंदवताना त्रुटी आली: ' + err.message : 'Error recording payment: ' + err.message, 
        'error'
      );
    } finally {
      setIsSavingPayment(false);
    }
  };

  const deleteTransaction = async (txnId) => {
    const isMarathi = db.settings && db.settings.lang === 'mr';
    if (typeof isOwnerRole === 'function' && !isOwnerRole(role)) {
      showToast(isMarathi ? 'व्यवहार हटवण्यासाठी मालक प्रवेश आवश्यक आहे.' : 'Owner access is required to delete this transaction.', 'error');
      return;
    }
    if (!confirm(isMarathi ? 'आपण हा व्यवहार हटवू इच्छिता?' : 'Are you sure you want to delete this payment transaction?')) return;

    await saveDb((currentDb) => {
      const txn = (currentDb.transactions || []).find(t => t.id === txnId);
      let updatedCustomers = currentDb.customers || [];
      const now = Date.now();
      if (txn) {
        updatedCustomers = updatedCustomers.map(c => 
          String(c.id).trim() === String(txn.custId).trim() ? { 
            ...c, 
            deposited: Math.max(0, Number(c.deposited || 0) - Number(txn.amount || 0)),
            updatedAt: now
          } : c
        );
      }
      return {
        ...currentDb,
        transactions: (currentDb.transactions || []).filter(t => t.id !== txnId),
        customers: updatedCustomers
      };
    });

    showToast(isMarathi ? 'व्यवहार हटवला गेला!' : 'Transaction deleted!', 'success');
  };

  const today = defaultTodayStr();
  const currentMonth = today.slice(0, 7);

  const branchTxns = useMemo(() => {
    return (db.transactions || []).filter(t => !activeBranch || activeBranch === 'All' || (t.branch || 'Branch 1') === activeBranch);
  }, [db.transactions, activeBranch]);

  const todayCollectionTotal = useMemo(() => {
    return branchTxns.filter(t => t.date === today).reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [branchTxns, today]);

  const currentMonthCollectionTotal = useMemo(() => {
    return branchTxns.filter(t => t.date && t.date.slice(0, 7) === currentMonth).reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [branchTxns, currentMonth]);

  const filteredTxns = useMemo(() => {
    if (collectionFilter === 'today') return branchTxns.filter(t => t.date === today);
    if (collectionFilter === 'month') return branchTxns.filter(t => t.date && t.date.slice(0, 7) === currentMonth);
    if (collectionFilter === 'custom' && colStartDate && colEndDate) {
      return branchTxns.filter(t => t.date >= colStartDate && t.date <= colEndDate);
    }
    return branchTxns;
  }, [branchTxns, collectionFilter, today, currentMonth, colStartDate, colEndDate]);

  const filteredTxnsTotal = useMemo(() => {
    return filteredTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filteredTxns]);

  return {
    payModalCustomer,
    setPayModalCustomer,
    payAmount,
    setPayAmount,
    payDate,
    setPayDate,
    payMode,
    setPayMode,
    payNote,
    setPayNote,
    isSavingPayment,
    openPayModal,
    handlePaySubmit,
    deleteTransaction,
    collectionFilter,
    setCollectionFilter,
    colStartDate,
    setColStartDate,
    colEndDate,
    setColEndDate,
    filteredTxns,
    filteredTxnsTotal,
    todayCollectionTotal,
    currentMonthCollectionTotal,
    getCustomerDues: defaultGetCustomerDues,
    getDueWarningDays: defaultGetDueWarningDays,
    getDaysPendingDues: defaultGetDaysPendingDues,
    computeStatus: defaultComputeStatus,
    expiryStr: defaultExpiryStr
  };
}
