import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity
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
      e.paidDate &&
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
      contentContainerStyle={{paddingBottom:120}}
      showsVerticalScrollIndicator={false}
    >

      <SectionContainer>

        <ScreenHeader title={t.dashboard} />

        <View style={{flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between'}}>
          <StatsCard
            title="Customers"
            value={customers.length}
          />

          <StatsCard
            title="Active"
            value={activeCount}
          />

          <StatsCard
            title="Expiring"
            value={expiringList.length}
          />

          <StatsCard
            title="Expired"
            value={expiredList.length}
          />

          <StatsCard
            title="Paid Staff"
            value={paidStaffCount}
          />

          <StatsCard
            title="Pending Staff"
            value={pendingStaffCount}
          />
        </View>

        <StatsCard
          title="Pending Amount"
          value={rupee(pendAmt)}
          fullWidth={true}
        />

        <View style={{marginTop:20}}>
          <Text
            style={{
              fontSize:16,
              fontWeight:'700',
              marginBottom:10
            }}
          >
            Quick Actions
          </Text>

          <View
            style={{
              flexDirection:'row',
              justifyContent:'space-between',
              marginBottom:10
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor:'#E3F2FD',
                width:'31%',
                padding:12,
                borderRadius:12,
                alignItems:'center'
              }}
              onPress={()=>setTab('customers')}
            >
              <Text style={{fontSize:22}}>👥</Text>
              <Text style={{marginTop:6,fontSize:12}}>
                Customers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor:'#E8F5E9',
                width:'31%',
                padding:12,
                borderRadius:12,
                alignItems:'center'
              }}
              onPress={()=>setTab('payments')}
            >
              <Text style={{fontSize:22}}>💳</Text>
              <Text style={{marginTop:6,fontSize:12}}>
                Payments
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor:'#FFF3E0',
                width:'31%',
                padding:12,
                borderRadius:12,
                alignItems:'center'
              }}
              onPress={()=>openWAModal()}
            >
              <Text style={{fontSize:22}}>📱</Text>
              <Text style={{marginTop:6,fontSize:12}}>
                Reminders
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{marginTop:20}}>
          <Text
            style={{
              fontSize:16,
              fontWeight:'700',
              marginBottom:10
            }}
          >
            {t.subscriptionAlerts}
          </Text>

          <View
            style={{
              flexDirection:'row',
              gap:8,
              marginBottom:12
            }}
          >
            <TouchableOpacity
              style={[
                S.btn,
                homeFilter==='all' && S.btnP
              ]}
              onPress={()=>setHomeFilter('all')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  homeFilter==='all'
                    ? S.btnTW
                    : S.btnT
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                S.btn,
                homeFilter==='expired' && S.btnP
              ]}
              onPress={()=>setHomeFilter('expired')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  homeFilter==='expired'
                    ? S.btnTW
                    : S.btnT
                ]}
              >
                Expired
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                S.btn,
                homeFilter==='expiring' && S.btnP
              ]}
              onPress={()=>setHomeFilter('expiring')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  homeFilter==='expiring'
                    ? S.btnTW
                    : S.btnT
                ]}
              >
                Expiring
              </Text>
            </TouchableOpacity>
          </View>

          {subCards.length===0 ? (
            <EmptyState message="No Alerts Found" />
          ) : (
            subCards.map((item)=>(
              <View
                key={item.id}
                style={{
                  backgroundColor:'#fff',
                  padding:14,
                  borderRadius:14,
                  marginBottom:12,
                  borderWidth:1,
                  borderColor:'#F1F1F1',
                  elevation:2,
                  shadowColor:'#000',
                  shadowOffset:{width:0,height:2},
                  shadowOpacity:0.05,
                  shadowRadius:3
                }}
              >
                <Text
                  style={{
                    fontSize:15,
                    fontWeight:'600'
                  }}
                >
                  {item.name}
                </Text>

                <View
                  style={{
                    flexDirection:'row',
                    justifyContent:'space-between',
                    alignItems:'center',
                    marginTop:4
                  }}
                >
                  <Text
                    style={{
                      fontSize:13,
                      color:'#666'
                    }}
                  >
                    {item.plan} • {rupee(item.amount)}
                  </Text>

                  <View
                    style={{
                      backgroundColor:
                        computeStatus(item.joinDate,item.plan)==='expired'
                          ? '#FFEBEE'
                          : '#FFF3E0',
                      paddingHorizontal:8,
                      paddingVertical:4,
                      borderRadius:20
                    }}
                  >
                    <Text
                      style={{
                        fontSize:11,
                        fontWeight:'700',
                        color:
                          computeStatus(item.joinDate,item.plan)==='expired'
                            ? '#D32F2F'
                            : '#F57C00'
                      }}
                    >
                      {computeStatus(item.joinDate,item.plan)==='expired'
                        ? 'EXPIRED'
                        : `${daysLeft(item.joinDate,item.plan)} DAYS`}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection:'row',
                    marginTop:10,
                    gap:8
                  }}
                >
                  <TouchableOpacity
                    style={[S.btn,S.btnP,S.btnSm]}
                    onPress={()=>openRecordPay(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[S.btnTW,{fontSize:12}]}>
                      Payment
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[S.btn,S.btnWA,S.btnSm]}
                    onPress={()=>waSingle(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[S.btnTW,{fontSize:12}]}>
                      WhatsApp
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

      </SectionContainer>

    </ScrollView>
  );
});

export default HomeTab;
