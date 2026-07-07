import React from 'react';
import {
  View,
  Text,
  TouchableOpacity
} from 'react-native';

const TransactionCard = ({
  item,
  openRecordPay,
  t,
  S
}) => {

  return (
    <View
      style={{
        backgroundColor:'#fff',
        padding:12,
        borderRadius:10,
        marginTop:12
      }}
    >

      <Text
        style={{
          fontSize:15,
          fontWeight:'600'
        }}
      >
        {item.custName}
      </Text>

      <Text
        style={{
          fontSize:13,
          color:'#666',
          marginTop:4
        }}
      >
        ₹{item.amount}
      </Text>

      <View
        style={{
          flexDirection:'row',
          marginTop:10
        }}
      >

        <TouchableOpacity
          style={[S.btn,S.btnP,S.btnSm]}
          onPress={()=>openRecordPay(item)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              S.btnTW,
              {fontSize:12}
            ]}
          >
            {t.recordPayment}
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
};

export default TransactionCard;