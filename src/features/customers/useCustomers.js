import { useState, useMemo } from 'react';
import { isBlank, normalizeText, toAmountNumber, isValidDate, getCustomerDues, parseLocalDate } from '../../utils/helpers';
import { addCustomArea, deleteCustomArea, deleteAllCustomAreas } from '../../utils/areaHelpers';
import { DEFAULT_MEAL_TYPE, DEFAULT_MEAL_SLOT } from '../../utils/mealConfig';

export function useCustomers({ db, saveDb, showToast, activeBranch, currentTab, role, isOwnerRole }) {
  const [custSearch, setCustSearch] = useState('');
  const [tiffinAreaFilter, setTiffinAreaFilter] = useState('all');
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [editCustId, setEditCustId] = useState(null);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const [custFormToEdit, setCustFormToEdit] = useState({
    name: '',
    phone: '',
    aadhar: '',
    plan: 'Monthly',
    amount: '1500',
    deposited: '0',
    joinDate: new Date().toISOString().slice(0, 10),
    addr: '',
    photo: '',
    mealType: DEFAULT_MEAL_TYPE,
    mealSlot: DEFAULT_MEAL_SLOT,
    area: ''
  });

  const openAddCust = (explicitCategory) => {
    let rawCat = typeof explicitCategory === 'string' ? explicitCategory : currentTab;
    let cat = 'dinein';
    if (rawCat === 'tiffin') cat = 'tiffin';
    else if (rawCat === 'shortterm') cat = 'shortterm';
    else cat = 'dinein';

    setCustSearch('');

    setEditCustId(null);
    setCustFormToEdit({
      name: '',
      phone: '',
      aadhar: '',
      plan: cat === 'shortterm' ? 'Daily' : 'Monthly',
      amount: cat === 'shortterm' ? '100' : '1500',
      deposited: '0',
      joinDate: new Date().toISOString().slice(0, 10),
      addr: '',
      photo: '',
      mealType: DEFAULT_MEAL_TYPE,
      mealSlot: DEFAULT_MEAL_SLOT,
      category: cat,
      area: ''
    });
    setIsCustModalOpen(true);
  };

  const openEditCust = (customer) => {
    if (!customer) return;
    setEditCustId(customer.id);
    let cat = customer.category || 'dinein';
    if (cat === 'dine_in' || cat === 'customers') cat = 'dinein';

    setCustFormToEdit({
      name: customer.name || '',
      phone: customer.phone || '',
      aadhar: customer.aadhar || '',
      plan: customer.plan || 'Monthly',
      amount: String(customer.amount || 0),
      deposited: String(customer.deposited || 0),
      joinDate: customer.joinDate || new Date().toISOString().slice(0, 10),
      addr: customer.addr || '',
      photo: customer.photo || '',
      mealType: customer.mealType || DEFAULT_MEAL_TYPE,
      mealSlot: customer.mealSlot || DEFAULT_MEAL_SLOT,
      category: cat,
      area: customer.area || ''
    });
    setIsCustModalOpen(true);
  };

  const saveCustomer = async (formData, shortTermDaysVal, shortTermMealsVal) => {
    const isMarathi = db.settings && db.settings.lang === 'mr';
    if (isSavingCustomer) return;
    if (editCustId && typeof isOwnerRole === 'function' && !isOwnerRole(role)) {
      showToast(isMarathi ? 'ग्राहक बदलण्यासाठी मालक प्रवेश आवश्यक आहे.' : 'Owner access is required to modify customers.', 'error');
      return;
    }
    setIsSavingCustomer(true);

    try {
      if (isBlank(formData.name) || isBlank(formData.phone)) {
        showToast(isMarathi ? 'नाव आणि फोन आवश्यक आहेत.' : 'Name and Phone are required.', 'error');
        return;
      }

      let phoneInput = String(formData.phone || '');
      const devanagariMap = {
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
        '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
      };
      phoneInput = phoneInput.split('').map(char => devanagariMap[char] || char).join('');

      let digits = phoneInput.replace(/\D/g, '');
      while (digits.startsWith('0')) {
        digits = digits.slice(1);
      }
      if (digits.length === 14 && digits.startsWith('9191')) digits = digits.slice(2);
      if (digits.length === 13 && digits.startsWith('910')) digits = '91' + digits.slice(3);
      if (digits.length === 10) digits = '91' + digits;

      if (digits.length < 10) {
        digits = digits.padStart(10, '0');
        digits = '91' + digits;
      } else if (!digits.startsWith('91')) {
        digits = '91' + digits;
      }

      const cleanPhone = '+' + digits;

      if (!isValidDate(formData.joinDate)) {
        showToast(isMarathi ? 'सुरुवात तारीख YYYY-MM-DD स्वरूपात असावी.' : 'Joining Date must be a valid date in YYYY-MM-DD format.', 'error');
        return;
      }

      let targetCat = formData.category;
      if (!targetCat) {
        if (currentTab === 'tiffin') targetCat = 'tiffin';
        else if (currentTab === 'shortterm') targetCat = 'shortterm';
        else if (editCustId) {
          const orig = (db.customers || []).find(c => c.id === editCustId);
          targetCat = orig ? (orig.category || 'dinein') : 'dinein';
        } else {
          targetCat = 'dinein';
        }
      }
      if (targetCat === 'dine_in' || targetCat === 'customers') targetCat = 'dinein';

      if (targetCat === 'tiffin' && isBlank(formData.addr)) {
        showToast(isMarathi ? 'टिफिन ग्राहकांसाठी पत्ता आवश्यक आहे.' : 'Address is required for Tiffin customers.', 'error');
        return;
      }

      const amount = toAmountNumber(formData.amount);
      const deposited = toAmountNumber(formData.deposited);

      const finalForm = {
        ...formData,
        phone: cleanPhone,
        amount,
        deposited,
        category: targetCat,
        mealType: formData.mealType && formData.mealType !== 'NONE' ? formData.mealType : (targetCat === 'tiffin' ? DEFAULT_MEAL_TYPE : 'NONE'),
        mealSlot: formData.mealSlot && formData.mealSlot !== 'NONE' ? formData.mealSlot : (targetCat === 'tiffin' ? DEFAULT_MEAL_SLOT : 'NONE'),
        area: formData.area || ''
      };

      await saveDb((currentDb) => {
        const existingCusts = currentDb.customers || [];
        if (editCustId) {
          return {
            ...currentDb,
            customers: existingCusts.map(c => {
              if (c.id === editCustId) {
                const updatedCust = {
                  ...c,
                  ...finalForm,
                  category: targetCat,
                  branch: c.branch || activeBranch || 'Branch 1'
                };
                if (targetCat === 'shortterm') {
                  updatedCust.shortTermDays = Number(shortTermDaysVal || 0);
                  updatedCust.shortTermMeals = Number(shortTermMealsVal || 0);
                } else {
                  delete updatedCust.shortTermDays;
                  delete updatedCust.shortTermMeals;
                }
                return updatedCust;
              }
              return c;
            })
          };
        }

        const newCust = {
          ...finalForm,
          id: 'cust_' + Date.now(),
          category: targetCat,
          branch: activeBranch || 'Branch 1',
          status: 'active'
        };
        if (targetCat === 'shortterm') {
          newCust.shortTermDays = Number(shortTermDaysVal || 0);
          newCust.shortTermMeals = Number(shortTermMealsVal || 0);
        }

        const nextTxns = [...(currentDb.transactions || [])];
        if (newCust.deposited > 0) {
          nextTxns.push({
            id: 'txn_' + Date.now() + '_init',
            custId: newCust.id,
            custName: newCust.name,
            amount: newCust.deposited,
            date: newCust.joinDate,
            mode: 'Cash',
            branch: newCust.branch
          });
        }

        return {
          ...currentDb,
          customers: [newCust, ...existingCusts],
          transactions: nextTxns
        };
      });

      showToast(isMarathi ? 'ग्राहक माहिती यशस्वीरित्या जतन केली!' : 'Customer saved successfully!', 'success');
      setIsCustModalOpen(false);
      setEditCustId(null);
      setCustSearch('');
    } catch (err) {
      console.error('saveCustomer error:', err);
      showToast(isMarathi ? 'ग्राहक जतन करताना त्रुटी आली: ' + err.message : 'Error saving customer: ' + err.message, 'error');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const deleteCustomer = async (id) => {
    const isMarathi = db.settings && db.settings.lang === 'mr';
    const targetCust = (db.customers || []).find((c) => c.id === id);
    if (!targetCust) return;

    const isAlreadyArchived = targetCust.status === 'archived' || targetCust.status === 'old' || currentTab === 'oldcustomers';

    if (isAlreadyArchived) {
      if (!confirm(isMarathi ? 'आपण हा ग्राहक डेटाबेसमधून कायमचा हटवू इच्छिता?' : 'Are you sure you want to PERMANENTLY delete this customer record?')) return;

      await saveDb((currentDb) => ({
        ...currentDb,
        customers: (currentDb.customers || []).filter((c) => c.id !== id)
      }));

      showToast(isMarathi ? 'ग्राहक डेटाबेसमधून कायमचा हटवला गेला!' : 'Customer permanently deleted!', 'success');
    } else {
      if (!confirm(isMarathi ? 'आपण हा ग्राहक जुन्या ग्राहकांच्या अर्काइव्हमध्ये हलवू इच्छिता?' : 'Are you sure you want to move this customer to Old Customers Archive?')) return;

      await saveDb((currentDb) => ({
        ...currentDb,
        customers: (currentDb.customers || []).map((c) => c.id === id ? { ...c, status: 'archived', archivedDate: new Date().toISOString().slice(0, 10) } : c)
      }));

      showToast(isMarathi ? 'ग्राहक जुन्या ग्राहकांच्या अर्काइव्हमध्ये पाठवला गेला!' : 'Customer moved to Old Customers Archive!', 'success');
    }
  };

  const restoreCustomer = async (id) => {
    const isMarathi = db.settings && db.settings.lang === 'mr';
    if (typeof isOwnerRole === 'function' && !isOwnerRole(role)) {
      showToast(isMarathi ? 'ग्राहक पुनर्संचयित करण्यासाठी मालक प्रवेश आवश्यक आहे.' : 'Owner access is required to restore customers.', 'error');
      return;
    }
    await saveDb((currentDb) => ({
      ...currentDb,
      customers: (currentDb.customers || []).map((c) => c.id === id ? { ...c, status: 'active', archivedDate: undefined } : c)
    }));

    showToast(isMarathi ? 'ग्राहक यशस्वीरित्या पुनर्संचयित केला गेला!' : 'Customer restored successfully!', 'success');
  };

  const filteredCustomers = useMemo(() => {
    let list = (db.customers || []).filter((c) => {
      if (!activeBranch || activeBranch === 'All') return true;
      return (c.branch || 'Branch 1') === activeBranch;
    });

    if (currentTab === 'oldcustomers') {
      list = list.filter((c) => c.status === 'archived' || c.status === 'old');
    } else {
      list = list.filter((c) => c.status !== 'archived' && c.status !== 'old');

      if (currentTab === 'tiffin') {
        list = list.filter((c) => (c.category || '').toLowerCase() === 'tiffin');
        if (tiffinAreaFilter && tiffinAreaFilter !== 'all' && tiffinAreaFilter !== 'All Areas') {
          list = list.filter((c) => String(c.area || '').trim().toLowerCase() === tiffinAreaFilter.toLowerCase());
        }
      } else if (currentTab === 'shortterm') {
        list = list.filter((c) => (c.category || '').toLowerCase() === 'shortterm');
      } else if (currentTab === 'customers' || currentTab === 'dinein') {
        list = list.filter((c) => {
          const cat = (c.category || 'dinein').toLowerCase();
          return cat === 'dinein' || cat === 'dine_in' || cat === 'customers';
        });
      }
    }

    if (custSearch) {
      const q = normalizeText(custSearch);
      list = list.filter((c) => 
        normalizeText(c.name).includes(q) || 
        normalizeText(c.phone).includes(q) ||
        normalizeText(c.area || '').includes(q) ||
        normalizeText(c.addr || '').includes(q)
      );
    }

    // Smart Customer Sorting: Dues Pending (> ₹0) ON TOP, Fully Paid (₹0) AT BOTTOM
    list.sort((a, b) => {
      const duesA = typeof getCustomerDues === 'function' ? getCustomerDues(a) : Math.max(0, Number(a.amount || 0) - Number(a.deposited || 0));
      const duesB = typeof getCustomerDues === 'function' ? getCustomerDues(b) : Math.max(0, Number(b.amount || 0) - Number(b.deposited || 0));

      const hasDuesA = duesA > 0 ? 1 : 0;
      const hasDuesB = duesB > 0 ? 1 : 0;

      // 1. Pending dues customers (> ₹0) come FIRST (TOP)
      if (hasDuesA !== hasDuesB) {
        return hasDuesB - hasDuesA;
      }

      // 2. Higher pending dues amount appears higher
      if (duesA !== duesB) {
        return duesB - duesA;
      }

      // 3. Alphabetical secondary sort by name
      return (a.name || '').localeCompare(b.name || '');
    });

    return list;
  }, [db.customers, activeBranch, currentTab, tiffinAreaFilter, custSearch]);

  const [pauseModalCust, setPauseModalCust] = useState(null);

  const handlePauseCustomer = async (customer, pauseStartDate, pauseReason) => {
    const isMarathi = db?.settings?.lang === 'mr';
    if (!customer) return;
    try {
      await saveDb(currentDb => ({
        ...currentDb,
        customers: (currentDb.customers || []).map(c => {
          if (c.id === customer.id) {
            return {
              ...c,
              isPaused: true,
              pauseStartDate: pauseStartDate || new Date().toISOString().slice(0, 10),
              pauseReason: pauseReason || ''
            };
          }
          return c;
        })
      }));
      showToast(isMarathi ? `${customer.name} चा प्लॅन सुट्टीवर ठेवला!` : `Paused plan for ${customer.name}`, 'success');
    } catch (err) {
      showToast(isMarathi ? 'पॉझ करताना त्रुटी आली.' : 'Error pausing plan.', 'error');
    }
  };

  const handleResumeCustomer = async (customer) => {
    const isMarathi = db?.settings?.lang === 'mr';
    if (!customer || !customer.isPaused) return;
    try {
      const today = new Date();
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const pauseStart = customer.pauseStartDate ? parseLocalDate(customer.pauseStartDate) : todayMidnight;
      const pausedDays = Math.max(0, Math.round((todayMidnight - pauseStart) / 86400000));
      const newTotalPausedDays = Number(customer.totalPausedDays || 0) + pausedDays;

      await saveDb(currentDb => ({
        ...currentDb,
        customers: (currentDb.customers || []).map(c => {
          if (c.id === customer.id) {
            return {
              ...c,
              isPaused: false,
              pauseStartDate: null,
              pauseReason: '',
              totalPausedDays: newTotalPausedDays
            };
          }
          return c;
        })
      }));
      showToast(isMarathi ? `${customer.name} चा प्लॅन पुन्हा सुरू झाला! (प्लॅन ${pausedDays} दिवसांनी वाढवला)` : `Resumed plan for ${customer.name}! (Extended by ${pausedDays} days)`, 'success');
    } catch (err) {
      showToast(isMarathi ? 'रिझ्युम करताना त्रुटी आली.' : 'Error resuming plan.', 'error');
    }
  };

  return {
    custSearch,
    setCustSearch,
    tiffinAreaFilter,
    setTiffinAreaFilter,
    isCustModalOpen,
    setIsCustModalOpen,
    editCustId,
    setEditCustId,
    custFormToEdit,
    setCustFormToEdit,
    isSavingCustomer,
    pauseModalCust,
    setPauseModalCust,
    handlePauseCustomer,
    handleResumeCustomer,
    openAddCust,
    openEditCust,
    saveCustomer,
    deleteCustomer,
    restoreCustomer,
    filteredCustomers,
    handleAddArea: async (areaName) => {
      const isMarathi = db?.settings?.lang === 'mr';
      const success = await addCustomArea(db, saveDb, areaName, activeBranch);
      if (success) {
        showToast(isMarathi ? 'एरिया जोडला गेला!' : 'Area added successfully!', 'success');
      }
    },
    handleDeleteArea: async (areaName) => {
      const isMarathi = db?.settings?.lang === 'mr';
      const success = await deleteCustomArea(db, saveDb, areaName, activeBranch);
      if (success) {
        showToast(isMarathi ? 'एरिया यशस्वीरित्या हटवला गेला!' : 'Delivery area deleted successfully!', 'success');
      }
    },
    handleDeleteAllAreas: async () => {
      const isMarathi = db?.settings?.lang === 'mr';
      const success = await deleteAllCustomAreas(db, saveDb, activeBranch);
      if (success) {
        showToast(isMarathi ? 'सर्व एरिया यशस्वीरित्या हटवले गेले!' : 'All delivery areas deleted successfully!', 'success');
      }
    }
  };
}
