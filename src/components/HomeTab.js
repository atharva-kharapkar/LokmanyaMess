import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

import ScreenHeader from './ScreenHeader';
import StatsCard from './StatsCard';
import SectionContainer from './SectionContainer';
import EmptyState from './EmptyState';

const HomeTab = React.memo(({
  role,
  setRole,
  setScreen,
  setPinInput,
  setTab,
  customers,
  employees,
  expiredList,
  expiringList,
  activeCount,
  pendAmt,
  homeFilter,
  setHomeFilter,
  openRecordPay,
  waSingle,
  openWAModal,
  t,
  S,
  C,
  Av,
  rupee,
  computeStatus,
  daysLeft,
  expiryStr
}) => {

  const paidStaffCount = employees.filter(e => {
    const currentMonth = new Date()
      .toISOString()
      .split('T')[0]
      .slice(0, 7);

    return (
      e.paid &&
      typeof e.paidDate === 'string' &&
      e.paidDate.slice(0, 7) === currentMonth
    );
  }).length;

  const pendingStaffCount =
    employees.length - paidStaffCount;

  const subCards =
    homeFilter==='expired'
      ? expiredList
      : homeFilter==='expiring'
      ? expiringList
      : [...expiredList,...expiringList];

  return (
    <ScrollView
      style={S.scroll}
      contentContainerStyle={{paddingBottom:140}}
      showsVerticalScrollIndicator={false}
    >
      <SectionContainer>
        <ScreenHeader title={t.dashboard} />

        {/* Welcome Card Banner */}
        <View
          style={{
            backgroundColor: C.primary,
            padding: 20,
            borderRadius: 20,
            marginTop: 12,
            marginBottom: 16,
            elevation: 8,
            shadowColor: C.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 24,
              fontWeight: '800',
              letterSpacing: 0.2,
            }}
          >
            👋 {t.welcome || 'Welcome'},
          </Text>
          <Text
            style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: '600',
              marginTop: 2,
              opacity: 0.9,
            }}
          >
            {role === 'owner' ? (t.owner || 'Owner') : (t.worker || 'Worker')}
          </Text>
          
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 18,
              paddingTop: 14,
              borderTopWidth: 1,
              borderColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                {t.customersLabel || 'Customers'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 }}>
                {customers.length}
              </Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                {t.activeLabel || 'Active'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 }}>
                {activeCount}
              </Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                {t.staff || 'Staff'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 }}>
                {employees.length}
              </Text>
            </View>
          </View>
        </View>

        {/* 6-Grid Stats Widgets */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          {/* Card: Customers */}
          <View
            style={{
              width: '48%',
              backgroundColor: C.pl,
              borderWidth: 1,
              borderColor: '#F5D6CB',
              padding: 16,
              borderRadius: 18,
              elevation: 2,
              shadowColor: C.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>👥</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.pd }}>
              {customers.length}
            </Text>
            <Text style={{ color: C.pd, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
              {t.customersLabel || 'Customers'}
            </Text>
          </View>

          {/* Card: Active */}
          <View
            style={{
              width: '48%',
              backgroundColor: C.sl,
              borderWidth: 1,
              borderColor: '#A3E2B8',
              padding: 16,
              borderRadius: 18,
              elevation: 2,
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>✅</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#047857' }}>
              {activeCount}
            </Text>
            <Text style={{ color: '#047857', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
              {t.activeLabel || 'Active'}
            </Text>
          </View>

          {/* Card: Expiring */}
          <View
            style={{
              width: '48%',
              backgroundColor: C.wl,
              borderWidth: 1,
              borderColor: '#FDE68A',
              padding: 16,
              borderRadius: 18,
              elevation: 2,
              shadowColor: '#F59E0B',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>⏳</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#B45309' }}>
              {expiringList.length}
            </Text>
            <Text style={{ color: '#B45309', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
              {t.expiringLabel2 || 'Expiring'}
            </Text>
          </View>

          {/* Card: Expired */}
          <View
            style={{
              width: '48%',
              backgroundColor: C.dl,
              borderWidth: 1,
              borderColor: '#FCA5A5',
              padding: 16,
              borderRadius: 18,
              elevation: 2,
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>❌</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#B91C1C' }}>
              {expiredList.length}
            </Text>
            <Text style={{ color: '#B91C1C', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
              {t.expiredLabel2 || 'Expired'}
            </Text>
          </View>

          {/* Card: Paid Staff */}
          <View
            style={{
              width: '48%',
              backgroundColor: C.sl,
              borderWidth: 1,
              borderColor: '#A3E2B8',
              padding: 16,
              borderRadius: 18,
              elevation: 2,
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>💰</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#047857' }}>
              {paidStaffCount}
            </Text>
            <Text style={{ color: '#047857', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
              {t.paidStaff || 'Paid Staff'}
            </Text>
          </View>

          {/* Card: Pending Staff */}
          <View
            style={{
              width: '48%',
              backgroundColor: C.wl,
              borderWidth: 1,
              borderColor: '#FDE68A',
              padding: 16,
              borderRadius: 18,
              elevation: 2,
              shadowColor: '#F59E0B',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>📋</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#B45309' }}>
              {pendingStaffCount}
            </Text>
            <Text style={{ color: '#B45309', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
              {t.pendingStaff || 'Pending Staff'}
            </Text>
          </View>
        </View>
        
        {/* Pending Amount Card */}
        <View
          style={{
            backgroundColor: '#FFFBEB',
            padding: 16,
            borderRadius: 18,
            marginTop: 14,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: '#FDE68A',
            elevation: 2,
            shadowColor: '#D97706',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: '#B45309',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            💵 {t.pendingAmountLabel || 'Pending Amount'}
          </Text>

          <Text
            style={{
              fontSize: 30,
              fontWeight: '800',
              color: '#92400E',
              marginTop: 6,
            }}
          >
            {rupee(pendAmt)}
          </Text>
        </View>        

        {/* Quick Actions Panel */}
        <View style={{marginTop: 12}}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: C.text,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            ⚡ {t.quickActions || 'Quick Actions'}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 14
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: C.pl,
                borderWidth: 1,
                borderColor: '#F5D6CB',
                width: '31%',
                padding: 14,
                borderRadius: 16,
                alignItems: 'center',
                elevation: 2,
                shadowColor: C.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
              }}
              onPress={() => setTab('customers')}
              activeOpacity={0.7}
            >
              <Text style={{fontSize:24}}>👥</Text>
              <Text style={{marginTop:8, fontSize:12, fontWeight: '700', color: C.pd}}>
                {t.customersLabel || 'Customers'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: C.sl,
                borderWidth: 1,
                borderColor: '#A3E2B8',
                width: '31%',
                padding: 14,
                borderRadius: 16,
                alignItems: 'center',
                elevation: 2,
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
              }}
              onPress={() => setTab('payments')}
              activeOpacity={0.7}
            >
              <Text style={{fontSize:24}}>💳</Text>
              <Text style={{marginTop:8, fontSize:12, fontWeight: '700', color: '#047857'}}>
                {t.payments || 'Payments'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: C.wl,
                borderWidth: 1,
                borderColor: '#FDE68A',
                width: '31%',
                padding: 14,
                borderRadius: 16,
                alignItems: 'center',
                elevation: 2,
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
              }}
              onPress={() => openWAModal()}
              activeOpacity={0.7}
            >
              <Text style={{fontSize:24}}>📱</Text>
              <Text style={{marginTop:8, fontSize:12, fontWeight: '700', color: '#B45309'}}>
                {t.reminders || 'Reminders'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription Alerts */}
        <View style={{marginTop: 12}}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: C.text,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            ⏰ {t.subscriptionAlerts}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginBottom: 14
            }}
          >
            <TouchableOpacity
              style={[
                S.btn,
                S.btnSm,
                homeFilter==='all' && S.btnP
              ]}
              onPress={() => setHomeFilter('all')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  { fontSize: 12 },
                  homeFilter==='all' ? S.btnTW : S.btnT
                ]}
              >
                {t.all || 'All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                S.btn,
                S.btnSm,
                homeFilter==='expired' && S.btnP
              ]}
              onPress={() => setHomeFilter('expired')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  { fontSize: 12 },
                  homeFilter==='expired' ? S.btnTW : S.btnT
                ]}
              >
                {t.expiredLabel2 || 'Expired'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                S.btn,
                S.btnSm,
                homeFilter==='expiring' && S.btnP
              ]}
              onPress={() => setHomeFilter('expiring')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  { fontSize: 12 },
                  homeFilter==='expiring' ? S.btnTW : S.btnT
                ]}
              >
                {t.expiringLabel2 || 'Expiring'}
              </Text>
            </TouchableOpacity>
          </View>

          {subCards.length===0 ? (
            <EmptyState message={t.noAlerts || "No Alerts Found"} />
          ) : (
            subCards.map((item) => {
              const itemStatus = computeStatus(item.joinDate, item.plan);
              const isExpired = itemStatus === 'expired';
              const indicatorColor = isExpired ? '#EF4444' : '#F59E0B';
              const textAccentColor = isExpired ? '#B91C1C' : '#B45309';
              const alertBg = isExpired ? C.dl : C.wl;

              return (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    flexDirection: 'row',
                    overflow: 'hidden',
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                  }}
                >
                  {/* Left Accent Bar */}
                  <View style={{ width: 6, backgroundColor: indicatorColor }} />
                  
                  {/* Card Main Info */}
                  <View style={{ flex: 1, padding: 14 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: C.text,
                      }}
                    >
                      {item.name}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 6
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: C.t2,
                          fontWeight: '500',
                        }}
                      >
                        {item.plan} • {rupee(item.amount)}
                      </Text>

                      <View
                        style={{
                          backgroundColor: alertBg,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 20
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '800',
                            color: textAccentColor
                          }}
                        >
                          {isExpired
                            ? (t.expiredLabel2 || 'Expired').toUpperCase()
                            : `${daysLeft(item.joinDate,item.plan)} ${daysLeft(item.joinDate,item.plan) === 1 ? (t.dayLeft || 'day left') : (t.daysLeft || 'days left')}`}
                        </Text>
                      </View>
                    </View>

                    {/* Quick Button Row */}
                    <View
                      style={{
                        flexDirection: 'row',
                        marginTop: 12,
                        gap: 8
                      }}
                    >
                      <TouchableOpacity
                        style={[S.btn, S.btnP, S.btnSm, { flex: 1, paddingVertical: 6 }]}
                        onPress={() => openRecordPay(item)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MaterialIcons name="payment" size={13} color="#fff" />
                          <Text style={[S.btnTW, { fontSize: 11, fontWeight: '700' }]}>
                            {t.payment || 'Payment'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[S.btn, S.btnWA, S.btnSm, { flex: 1, paddingVertical: 6 }]}
                        onPress={() => waSingle(item)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <FontAwesome5 name="whatsapp" size={12} color="#fff" />
                          <Text style={[S.btnTW, { fontSize: 11, fontWeight: '700' }]}>
                            {t.whatsapp || 'WhatsApp'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </SectionContainer>
    </ScrollView>
  );
});

export default HomeTab;