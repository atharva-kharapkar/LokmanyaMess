import React from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity
} from 'react-native';

import ActionButton from './ActionButton';

const EmployeeCard = ({
  item,
  openEditEmp,
  markSal,
  deleteEmp,
  salaries,
  deleteSalary,
  role,
  t,
  S
}) => {
  const [showHistory, setShowHistory] = React.useState(false);

  const handleDelete = () => {
    Alert.alert(
      t.deleteEmployee || 'Delete Employee',
      `${t.cannotUndo || 'This cannot be undone.'}\n\nDelete ${item.name}?`,
      [
        {
          text: t.cancel || 'Cancel',
          style: 'cancel'
        },
        {
          text: t.delete || 'Delete',
          style: 'destructive',
          onPress: () => deleteEmp(item.id)
        }
      ]
    );
  };

  const salaryText =
    `${t.salaryLabel || 'Salary'}: Rs ${Number(item.salary || 0).toLocaleString('en-IN')}`;

  return (
    <View
      style={{
        backgroundColor:'#fff',
        padding:16,
        borderRadius:18,
        marginTop:12,
        marginBottom:6,
        borderWidth:1,
        borderColor:'#F3F4F6',
        elevation:3,
        shadowColor:'#000',
        shadowOffset:{width:0,height:3},
        shadowOpacity:0.04,
        shadowRadius:6
      }}
    >
      <View
        style={{
          flexDirection:'row',
          alignItems:'center'
        }}
      >
        <View
          style={{
            width:44,
            height:44,
            borderRadius:22,
            backgroundColor:'#FAECE7', // Light brand accent
            justifyContent:'center',
            alignItems:'center',
            marginRight:12,
            borderWidth: 1,
            borderColor: '#F5D6CB'
          }}
        >
          <Text
            style={{
              color:'#993C1D', // Dark brand terracotta
              fontWeight:'800',
              fontSize: 15
            }}
          >
            {item.name
              ?.split(' ')
              ?.map(x => x[0])
              ?.slice(0,2)
              ?.join('')
              ?.toUpperCase()}
          </Text>
        </View>

        <View>
          <Text
            style={{
              fontSize:16,
              fontWeight:'800',
              color: '#111827'
            }}
          >
            {item.name}
          </Text>

          <Text
            style={{
              fontSize:12,
              color:'#6B7280',
              fontWeight: '600',
              marginTop: 2
            }}
          >
            {t.role || 'Role'}: {item.role}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection:'row',
          justifyContent:'space-between',
          alignItems:'center',
          marginTop:14,
          padding: 12,
          backgroundColor: '#F9FAFB',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#F3F4F6',
        }}
      >
        <Text
          style={{
            fontSize:13,
            fontWeight:'700',
            color:'#374151'
          }}
        >
          {salaryText}
        </Text>

        {(() => {
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

          const paidMonth = typeof item.paidDate === 'string' ? item.paidDate.slice(0, 7) : null;

          const isPaidThisMonth =
            item.paid &&
            paidMonth === currentMonth;

          return (
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: isPaidThisMonth ? '#10B981' : '#EF4444' // Emerald / Coral
                }}
              >
                {isPaidThisMonth
                  ? (t.salaryPaid || 'Salary Paid').toUpperCase()
                  : (t.salaryPending || 'Salary Pending').toUpperCase()}
              </Text>

              {item.paidDate && (
                <Text
                  style={{
                    fontSize: 11,
                    color: '#6B7280',
                    marginTop: 2,
                    fontWeight: '500'
                  }}
                >
                  {t.lastPaid || 'Last Paid'}: {item.paidDate}
                </Text>
              )}
            </View>
          );
        })()}
      </View>

      {/* History Toggle */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <TouchableOpacity
          onPress={() => setShowHistory(!showHistory)}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Text style={{ fontSize: 13, color: '#D85A30', fontWeight: '700' }}>
            {showHistory ? "✕ Hide History" : "⏳ View History (" + (salaries?.length || 0) + ")"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      {showHistory && (
        <View style={{ marginTop: 10, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t.salaryHistory || 'Salary Paid History'}
          </Text>
          {salaries && salaries.length > 0 ? (
            salaries.map((s, idx) => (
              <View key={s.id || idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: idx < salaries.length - 1 ? 1 : 0, borderColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>📅 {s.paidDate}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 13, color: '#111827', fontWeight: '800' }}>₹{Number(s.amount).toLocaleString('en-IN')}</Text>
                  {role === 'owner' && (
                    <TouchableOpacity 
                      onPress={() => {
                        Alert.alert(
                          t.deleteRecord || 'Delete Record',
                          t.deleteSalaryConfirm || 'Are you sure you want to delete this salary record?',
                          [
                            { text: t.cancel || 'Cancel', style: 'cancel' },
                            { 
                              text: t.delete || 'Delete', 
                              style: 'destructive', 
                              onPress: () => deleteSalary(s.id) 
                            }
                          ]
                        );
                      }}
                      style={{ padding: 4 }}
                    >
                      <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '900' }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginTop: 4 }}>
              {t.noSalaryHistory || 'No salary history recorded yet.'}
            </Text>
          )}
        </View>
      )}

      <View
        style={{
          flexDirection:'row',
          marginTop:14,
          gap:8
        }}
      >
        <ActionButton
          title={t.edit || "Edit"}
          onPress={()=>openEditEmp(item)}
          style={S.btnP}
          S={S}
        />

        <ActionButton
          title={t.paySalary || "Salary"}
          onPress={()=>markSal(item.id)}
          style={S.btnS}
          S={S}
        />

        <ActionButton
          title={t.delete || "Delete"}
          onPress={handleDelete}
          style={S.btnD}
          S={S}
        />
      </View>

    </View>
  );
};

export default EmployeeCard;
