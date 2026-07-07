import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions
} from 'react-native';

import ScreenHeader from './ScreenHeader';
import EmptyState from './EmptyState';
import SectionContainer from './SectionContainer';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const PaymentsTab = React.memo(({
  customers,
  transactions,
  role,
  upiId,
  qrImg,
  openRecordPay,
  waSingle,
  pickImg,
  setQrImg,
  setUpiInput,
  setUpiModal,
  t,
  S
}) => {

  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false);
  const [customerSearch, setCustomerSearch] = React.useState('');

  const totalCollection = transactions.reduce(
    (sum, txn) => sum + (Number(txn.amount) || 0),
    0
  );

  const sortedTransactions = React.useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      const timeA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : Date.now();
      const timeB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()) : Date.now();
      return timeB - timeA;
    });
  }, [transactions]);

  const formatRupee = (value) =>
    `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

  const filteredCustomers = customers.filter((customer) =>
    (customer.name || '')
      .toLowerCase()
      .includes(customerSearch.trim().toLowerCase())
  );

  const openCustomerPicker = () => {
    if (!customers.length) {
      Alert.alert('', 'No customers available');
      return;
    }

    setCustomerSearch('');
    setCustomerPickerOpen(true);
  };

  const selectCustomerForPayment = (customer) => {
    setCustomerPickerOpen(false);
    setCustomerSearch('');
    openRecordPay(customer);
  };

  const recordPaymentForTransaction = (transaction) => {
    const customer = customers.find(c => c.id === transaction.custId);

    if (!customer) {
      Alert.alert('', 'Customer not found');
      return;
    }

    openRecordPay(customer);
  };

  const exportTransactions = async () => {
    try {
      if (!transactions || transactions.length === 0) {
        Alert.alert('', t.noTransactionsYet || 'No Transactions Yet');
        return;
      }

      // Generate CSV header
      let csvContent = 'Date,Customer Name,Plan,Amount,Payment Mode,Note\n';

      // Generate CSV rows
      transactions.forEach((txn) => {
        const date = txn.date || '';
        const name = (txn.custName || '').replace(/"/g, '""');
        const plan = (txn.plan || '').replace(/"/g, '""');
        const amount = txn.amount || 0;
        const mode = (txn.mode || '').replace(/"/g, '""');
        const note = (txn.note || '').replace(/"/g, '""');
        csvContent += `"${date}","${name}","${plan}",${amount},"${mode}","${note}"\n`;
      });

      const now = new Date();
      const fileName = `lokmanya_transactions_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: 'utf8',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Payments Report',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export report: ' + error.message);
    }
  };

  const renderTransaction = ({ item }) => (
    <View
      style={{
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '800',
              color: '#111827'
            }}
          >
            {item.custName || (t.customersLabel ? t.customersLabel.slice(0, -1) : 'Customer')}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
            <Feather name="calendar" size={13} color="#6B7280" />
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
              {t.dateLabel || 'Date'}: {item.date || '-'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
            <MaterialIcons name="payment" size={13} color="#6B7280" />
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
              {t.modeLabel || 'Mode'}: {item.mode || '-'}
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '800',
            color: '#10B981'
          }}
        >
          {formatRupee(item.amount)}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          S.btn,
          S.btnP,
          {
            borderRadius: 10,
            paddingVertical: 8,
            paddingHorizontal: 14,
            marginTop: 14,
            alignSelf: 'flex-start',
            borderWidth: 0,
          }
        ]}
        onPress={() => recordPaymentForTransaction(item)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialIcons name="refresh" size={14} color="#fff" />
          <Text style={[S.btnTW, { fontSize: 12, fontWeight: '700' }]}>
            {t.recordPayment}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={S.flex1}>
      <SectionContainer>
        <ScreenHeader title={t.payments} />

        {/* Totals Header Card */}
        <View
          style={{
            backgroundColor: '#D85A30', // Primary Brand Color
            borderRadius: 20,
            padding: 20,
            marginBottom: 14,
            elevation: 8,
            shadowColor: '#D85A30',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              opacity: 0.9,
            }}
          >
            💰 {t.totalCollection || 'Total Collection'}
          </Text>

          <Text
            style={{
              color: '#fff',
              fontSize: 32,
              fontWeight: '800',
              marginTop: 6
            }}
          >
            {formatRupee(totalCollection)}
          </Text>

          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              marginTop: 14,
              fontSize: 13,
              fontWeight: '600',
              borderTopWidth: 1,
              borderColor: 'rgba(255,255,255,0.15)',
              paddingTop: 10,
            }}
          >
            {t.totalTransactions || 'Total Transactions'}: {transactions.length}
          </Text>
        </View>

        {/* Buttons Action Grid */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <TouchableOpacity
            style={{
              flex: 1.1,
              backgroundColor: '#10B981',
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 8,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              elevation: 4,
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
            }}
            onPress={openCustomerPicker}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add-circle" size={16} color="#fff" />
            <Text style={[S.btnTW, { fontWeight: '700', fontSize: 13 }]} numberOfLines={1}>
              {t.recordPayment || 'Record Payment'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 0.9,
              backgroundColor: '#3B82F6',
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 8,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              elevation: 4,
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
            }}
            onPress={exportTransactions}
            activeOpacity={0.7}
          >
            <Feather name="download" size={16} color="#fff" />
            <Text style={[S.btnTW, { fontWeight: '700', fontSize: 13 }]} numberOfLines={1}>
              Export CSV
            </Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <View style={{ marginTop: 8 }}>
            <EmptyState message={t.noTransactionsYet} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: '#111827',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Recent Transactions
            </Text>

            <FlatList
              data={sortedTransactions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingBottom: 160
              }}
              showsVerticalScrollIndicator={false}
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={5}
              removeClippedSubviews={Platform.OS === 'android'}
              renderItem={renderTransaction}
            />
          </View>
        )}
      </SectionContainer>

      {/* Customer Picker Modal */}
      <Modal
        visible={customerPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCustomerPickerOpen(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={{
            flex: 1,
            backgroundColor: 'rgba(17, 24, 39, 0.6)',
            justifyContent: 'flex-end'
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 22,
              maxHeight: '78%'
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '800',
                    color: '#111827'
                  }}
                >
                  {t.selectCustomer || 'Select Customer'}
                </Text>

                <Text
                  style={{
                    fontSize: 13,
                    color: '#6B7280',
                    marginTop: 4,
                    fontWeight: '500'
                  }}
                >
                  {t.chooseCustomerPay || 'Choose a customer to record payment'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setCustomerPickerOpen(false)}
                activeOpacity={0.7}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <TextInput
              value={customerSearch}
              onChangeText={setCustomerSearch}
              placeholder={t.searchByName || "Search customer by name"}
              placeholderTextColor="#9CA3AF"
              style={{
                backgroundColor: '#F9FAFB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                marginBottom: 16,
                color: '#111827'
              }}
            />

            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingBottom: 24
              }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={(
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '600' }}>
                    {t.noMatchingCustomers || 'No matching customers'}
                  </Text>
                </View>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => selectCustomerForPayment(item)}
                  activeOpacity={0.75}
                  style={{
                    backgroundColor: '#fff',
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.02,
                    shadowRadius: 2
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#111827'
                    }}
                  >
                    {item.name || 'Customer'}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                    <Feather name="phone" size={12} color="#6B7280" />
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>
                      {item.phone || 'No phone number'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
});

export default PaymentsTab;
