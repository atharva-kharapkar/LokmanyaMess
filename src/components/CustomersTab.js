import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import PrimaryButton from './PrimaryButton';
import SearchBar from './SearchBar';
import CustomerCard from './CustomerCard';
import ScreenHeader from './ScreenHeader';
import SectionContainer from './SectionContainer';

const CustomersTab = React.memo(({
  customers,
  filtCusts,
  custSearch,
  setCustSearch,
  custFilter,
  setCustFilter,
  selectedIds,
  setSelectedIds,
  role,
  openAddCust,
  openEditCust,
  openRecordPay,
  waSingle,
  openWAModal,
  deleteSelected,
  deleteCust,
  computeStatus,
  setConf,
  t,
  S,
  transactions,
  exportCustomers
}) => {
  const txnsByCustId = React.useMemo(() => {
    const map = {};
    (transactions || []).forEach(txn => {
      if (txn.custId) {
        if (!map[txn.custId]) map[txn.custId] = [];
        map[txn.custId].push(txn);
      }
    });
    
    // Sort transactions for each customer: newest first
    Object.keys(map).forEach(custId => {
      map[custId].sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
        const timeA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : Date.now();
        const timeB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()) : Date.now();
        return timeB - timeA;
      });
    });
    return map;
  }, [transactions]);

  const activeCustomers = customers.filter(
    c => computeStatus(c.joinDate, c.plan) === 'active'
  ).length;

  const expiringCustomers = customers.filter(
    c => computeStatus(c.joinDate, c.plan) === 'expiring'
  ).length;

  const expiredCustomers = customers.filter(
    c => computeStatus(c.joinDate, c.plan) === 'expired'
  ).length;

  const filterOpts = [
    { k: 'all', l: t.all || 'All', c: customers.length },
    { k: 'active', l: t.activeLabel || 'Active', c: activeCustomers },
    { k: 'expiring', l: t.expiringLabel2 || 'Expiring', c: expiringCustomers },
    { k: 'expired', l: t.expiredLabel2 || 'Expired', c: expiredCustomers }
  ];

  return (
    <View style={S.flex1}>
      <SectionContainer>
        <ScreenHeader title={t.customers} />

        {/* Search Bar */}
        <SearchBar
          value={custSearch}
          onChangeText={setCustSearch}
          t={t}
        />

        {/* Add & Export Customer Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={{ flex: 3 }}>
            <PrimaryButton
              title={`+ ${t.addCustomer}`}
              onPress={openAddCust}
              S={S}
            />
          </View>
          {role === 'owner' && (
            <TouchableOpacity
              style={[S.btn, S.btnS, { flex: 2, flexDirection: 'row', gap: 6, paddingVertical: 12 }]}
              onPress={exportCustomers}
              activeOpacity={0.7}
            >
              <Feather name="download" size={16} color="#fff" />
              <Text style={S.btnTW}>{t.export || 'Export'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Filter Chips Bar */}
        <View style={{ marginBottom: 14 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
              {filterOpts.map(opt => {
                const isActive = custFilter === opt.k;
                return (
                  <TouchableOpacity
                    key={opt.k}
                    style={[
                      S.btn,
                      S.btnSm,
                      isActive && S.btnP,
                      { paddingHorizontal: 12, paddingVertical: 6 }
                    ]}
                    onPress={() => setCustFilter(opt.k)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        { fontSize: 12, fontWeight: '700' },
                        isActive ? S.btnTW : S.btnT
                      ]}
                    >
                      {opt.l} ({opt.c})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Info Stats Card */}
        <View
          style={{
            backgroundColor: '#D85A30', // Brand Primary
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            elevation: 6,
            shadowColor: '#D85A30',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '800'
            }}
          >
            👥 {t.customersLabel || 'Customers'}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12 }}>
            <View style={{ minWidth: '45%' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' }}>
                {t.totalCustomers || 'Total Customers'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 }}>
                {customers.length}
              </Text>
            </View>

            <View style={{ minWidth: '45%' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' }}>
                {t.showing || 'Showing'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 }}>
                {filtCusts.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Listing */}
        <FlatList
          data={filtCusts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingBottom: 160
          }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={({ item }) => (
            <CustomerCard
              item={item}
              role={role}
              openEditCust={openEditCust}
              openRecordPay={openRecordPay}
              waSingle={waSingle}
              deleteCust={deleteCust}
              computeStatus={computeStatus}
              S={S}
              t={t}
              custTxns={txnsByCustId[item.id] || []}
            />
          )}
        />
      </SectionContainer>
    </View>
  );
});

export default CustomersTab;