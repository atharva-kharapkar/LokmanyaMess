import React from 'react';
import {
  View,
  Text,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const AV_COLORS = [
  { bg: '#FAECE7', tc: '#993C1D' },
  { bg: '#E6F4EA', tc: '#047857' },
  { bg: '#E6F1FB', tc: '#0C447C' },
  { bg: '#FEF3C7', tc: '#B45309' },
];

const PLAN_DAYS = { Monthly: 30, Weekly: 7, Daily: 1, Custom: 30 };

const getExpiryDateStr = (joinDate, plan) => {
  if (!joinDate) return '';
  try {
    const d = new Date(joinDate);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + (PLAN_DAYS[plan] || 30));
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return '';
  }
};

const formatDateStr = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
};

const CustomerCard = ({
  item,
  role,
  openEditCust,
  openRecordPay,
  waSingle,
  deleteCust,
  computeStatus,
  t,
  S,
  custTxns
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleDelete = () => {
    Alert.alert(
      t.delete || 'Delete',
      `${t.cannotUndo || 'This cannot be undone.'}\n\nDelete ${item.name}?`,
      [
        {
          text: t.cancel || 'Cancel',
          style: 'cancel'
        },
        {
          text: t.delete || 'Delete',
          style: 'destructive',
          onPress: () => deleteCust(item.id)
        }
      ]
    );
  };

  const status = computeStatus
    ? computeStatus(item.joinDate, item.plan)
    : 'active';

  const avColor = AV_COLORS[(item.avIndex || 0) % 4];

  const badgeStyle = {
    active: { bg: '#E6F4EA', color: '#047857', label: t.active },
    expiring: { bg: '#FEF3C7', color: '#B45309', label: t.expiringSoon },
    expired: { bg: '#FEE2E2', color: '#FF0000', label: t.expiredLabel }
  }[status] || { bg: '#E6F4EA', color: '#047857', label: t.active };

  return (
    <View
      style={{
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 18,
        marginTop: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      }}
    >
      {/* Top Section */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          {/* Avatar / Photo */}
          <View style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: avColor.bg,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginRight: 12,
            borderWidth: item.photo ? 1 : 0,
            borderColor: '#E5E7EB'
          }}>
            {item.photo ? (
              <Image source={{ uri: item.photo }} style={{ width: 46, height: 46 }} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '700', color: avColor.tc }}>
                {getInitials(item.name)}
              </Text>
            )}
          </View>

          {/* Name & Phone */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 2 }}>
              {item.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="phone" size={12} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                {item.phone || 'No Phone'}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Badge */}
        <View style={{
          backgroundColor: badgeStyle.bg,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 20
        }}>
          <Text style={{
            color: badgeStyle.color,
            fontSize: 10,
            fontWeight: '800',
            textTransform: 'uppercase'
          }}>
            {badgeStyle.label}
          </Text>
        </View>
      </View>

      {/* Middle Section - Details Grid */}
      <View style={{
        marginTop: 14,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
      }}>
        {/* Plan Info */}
        <View style={{ width: '50%' }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Plan
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 }}>
            {item.plan}
          </Text>
        </View>

        {/* Amount Info */}
        <View style={{ width: '50%' }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Amount
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#D85A30', marginTop: 2 }}>
            ₹{item.amount}
          </Text>
        </View>

        {/* Joining Date Info */}
        <View style={{ width: '50%' }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Joining Date
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 2 }}>
            {formatDateStr(item.joinDate)}
          </Text>
        </View>

        {/* Expiry Date Info */}
        <View style={{ width: '50%' }}>
          <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Expiry Date
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 2 }}>
            {getExpiryDateStr(item.joinDate, item.plan) || 'N/A'}
          </Text>
        </View>
      </View>

      {/* Collapsible Payment History */}
      {custTxns.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 10,
              paddingHorizontal: 14,
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="history" size={16} color="#6B7280" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>
                {t.recentTxns || 'Recent Transactions'} ({custTxns.length})
              </Text>
            </View>
            <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
          </TouchableOpacity>

          {expanded && (
            <View style={{
              marginTop: 6,
              backgroundColor: '#FFF',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              padding: 12,
              maxHeight: 180,
            }}>
              <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                {custTxns.map((txn, idx) => (
                  <View
                    key={txn.id || idx}
                    style={{
                      paddingVertical: 8,
                      borderBottomWidth: idx === custTxns.length - 1 ? 0 : 1,
                      borderBottomColor: '#F3F4F6',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#10B981' }}>
                          ₹{txn.amount}
                        </Text>
                        <View style={{
                          backgroundColor: txn.mode === 'UPI' ? '#E0F2FE' : txn.mode === 'Cash' ? '#E6F4EA' : '#FEF3C7',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}>
                          <Text style={{
                            fontSize: 10,
                            fontWeight: '800',
                            color: txn.mode === 'UPI' ? '#0369A1' : txn.mode === 'Cash' ? '#047857' : '#B45309'
                          }}>
                            {txn.mode === 'UPI' ? (t.upiPay || 'UPI / QR') : txn.mode === 'Cash' ? (t.cash || 'Cash') : txn.mode === 'Bank' ? (t.bank || 'Bank Transfer') : txn.mode}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>
                        {formatDateStr(txn.date)}
                      </Text>
                    </View>
                    {txn.note ? (
                      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontStyle: 'italic' }}>
                        Note: {txn.note}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Bottom Section - Action Buttons */}
      <View
        style={{
          flexDirection: 'row',
          marginTop: 14,
          gap: 6
        }}
      >
        {role === 'owner' && (
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#D85A30', // Brand Primary Orange
              paddingVertical: 10,
              borderRadius: 10,
              elevation: 2,
              shadowColor: '#D85A30',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 3,
            }}
            onPress={() => openEditCust(item)}
            activeOpacity={0.7}
          >
            <Feather name="edit-2" size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text 
              style={{ color: '#fff', fontSize: 11, fontWeight: '700' }} 
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumScaleFactor={0.85}
            >
              {t.edit}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{
            flex: 1.25,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#10B981', // Emerald Success Green
            paddingVertical: 10,
            borderRadius: 10,
            elevation: 2,
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
          }}
          onPress={() => openRecordPay(item)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="payment" size={13} color="#fff" style={{ marginRight: 4 }} />
          <Text 
            style={{ color: '#fff', fontSize: 11, fontWeight: '700' }} 
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumScaleFactor={0.85}
          >
            {t.payment}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1.25,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#25D366', // WhatsApp Green
            paddingVertical: 10,
            borderRadius: 10,
            elevation: 2,
            shadowColor: '#25D366',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
          }}
          onPress={() => waSingle(item)}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="whatsapp" size={13} color="#fff" style={{ marginRight: 4 }} />
          <Text 
            style={{ color: '#fff', fontSize: 11, fontWeight: '700' }} 
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumScaleFactor={0.85}
          >
            {t.whatsapp}
          </Text>
        </TouchableOpacity>

        {role === 'owner' && (
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#EF4444', // Coral Danger Red
              paddingVertical: 10,
              borderRadius: 10,
              elevation: 2,
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 3,
            }}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text 
              style={{ color: '#fff', fontSize: 11, fontWeight: '700' }} 
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumScaleFactor={0.85}
            >
              {t.delete || 'Delete'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const areEqual = (prev, next) => {
  if (prev.item !== next.item) return false;
  if (prev.role !== next.role) return false;
  if (prev.S !== next.S) return false;
  if (prev.t !== next.t) return false;
  
  const prevTxns = prev.custTxns || [];
  const nextTxns = next.custTxns || [];
  if (prevTxns.length !== nextTxns.length) return false;
  for (let i = 0; i < prevTxns.length; i++) {
    if (prevTxns[i].id !== nextTxns[i].id || 
        prevTxns[i].amount !== nextTxns[i].amount || 
        prevTxns[i].date !== nextTxns[i].date ||
        prevTxns[i].mode !== nextTxns[i].mode) {
      return false;
    }
  }
  return true;
};

export default React.memo(CustomerCard, areEqual);