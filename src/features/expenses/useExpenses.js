import { useState, useMemo } from 'react';
import { todayStr as defaultTodayStr } from '../../utils/helpers';

export function useExpenses({ db, saveDb, showToast, activeBranch, role, isOwnerRole }) {
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    date: defaultTodayStr(),
    category: 'Grocery',
    note: ''
  });

  const [expenseFilter, setExpenseFilter] = useState('all');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');

  const handleSaveExpense = async (e) => {
    if (e) e.preventDefault();
    const isMarathi = db.settings && db.settings.lang === 'mr';
    const amountNum = Number(expenseForm.amount);
    if (!expenseForm.title || isNaN(amountNum) || amountNum <= 0) {
      showToast(isMarathi ? 'कृपया शीर्षक आणि वैध खर्च रक्कम प्रविष्ट करा.' : 'Please enter title and valid expense amount.', 'error');
      return;
    }

    const newExpense = {
      id: 'exp_' + Date.now(),
      title: expenseForm.title.trim(),
      amount: amountNum,
      date: expenseForm.date || defaultTodayStr(),
      category: expenseForm.category || 'Grocery',
      note: (expenseForm.note || '').trim(),
      branch: activeBranch || 'Branch 1'
    };

    await saveDb((currentDb) => ({
      ...currentDb,
      expenses: [newExpense, ...(currentDb.expenses || [])]
    }));

    showToast(isMarathi ? 'खर्च यशस्वीरित्या जतन केला!' : 'Expense saved successfully!', 'success');
    setExpenseForm({
      title: '',
      amount: '',
      date: defaultTodayStr(),
      category: 'Grocery',
      note: ''
    });
  };

  const handleDeleteExpense = async (expId) => {
    const isMarathi = db.settings && db.settings.lang === 'mr';
    if (typeof isOwnerRole === 'function' && !isOwnerRole(role)) {
      showToast(isMarathi ? 'खर्च हटवण्यासाठी मालक प्रवेश आवश्यक आहे.' : 'Owner access is required to delete expenses.', 'error');
      return;
    }
    if (!confirm(isMarathi ? 'आपण हा खर्च हटवू इच्छिता?' : 'Are you sure you want to delete this expense?')) return;

    await saveDb((currentDb) => ({
      ...currentDb,
      expenses: (currentDb.expenses || []).filter(e => e.id !== expId)
    }));

    showToast(isMarathi ? 'खर्च हटवला गेला!' : 'Expense deleted!', 'success');
  };

  const today = defaultTodayStr();
  const currentMonth = today.slice(0, 7);

  const branchExpenses = useMemo(() => {
    return (db.expenses || []).filter(e => !activeBranch || activeBranch === 'All' || (e.branch || 'Branch 1') === activeBranch);
  }, [db.expenses, activeBranch]);

  const todayExpenseTotal = useMemo(() => {
    return branchExpenses.filter(e => e.date === today).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [branchExpenses, today]);

  const currentMonthExpenseTotal = useMemo(() => {
    return branchExpenses.filter(e => e.date && e.date.slice(0, 7) === currentMonth).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [branchExpenses, currentMonth]);

  const filteredExpenses = useMemo(() => {
    if (expenseFilter === 'today') return branchExpenses.filter(e => e.date === today);
    if (expenseFilter === 'month') return branchExpenses.filter(e => e.date && e.date.slice(0, 7) === currentMonth);
    if (expenseFilter === 'custom' && expStartDate && expEndDate) {
      return branchExpenses.filter(e => e.date >= expStartDate && e.date <= expEndDate);
    }
    return branchExpenses;
  }, [branchExpenses, expenseFilter, today, currentMonth, expStartDate, expEndDate]);

  const filteredExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  return {
    expenseForm,
    setExpenseForm,
    handleSaveExpense,
    handleDeleteExpense,
    expenseFilter,
    setExpenseFilter,
    expStartDate,
    setExpStartDate,
    expEndDate,
    setExpEndDate,
    filteredExpenses,
    filteredExpensesTotal,
    todayExpenseTotal,
    currentMonthExpenseTotal
  };
}
