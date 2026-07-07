import React from 'react';
import {
  View,
  Text
} from 'react-native';

import ActionButton from './ActionButton';
import CardContainer from './CardContainer';

const CustomerCard = ({
  item,
  openEditCust,
  openRecordPay,
  waSingle,
  S
}) => {

  return (
    <CardContainer
      style={{marginBottom:4}}
    >

      <Text style={{fontSize:16,fontWeight:'600'}}>
        {item.name}
      </Text>

      <Text style={{fontSize:13,color:'#666',marginTop:4}}>
        {item.plan} • ₹{item.amount}
      </Text>

      <View style={{flexDirection:'row',marginTop:10,gap:8}}>

        <ActionButton
          title="Edit"
          onPress={()=>openEditCust(item)}
          style={S.btnP}
          S={S}
        />

        <ActionButton
          title="Payment"
          onPress={()=>openRecordPay(item)}
          style={S.btnWA}
          S={S}
        />

        <ActionButton
          title="WhatsApp"
          onPress={()=>waSingle(item)}
          style={S.btnWA}
          S={S}
        />

      </View>

    </CardContainer>
  );
};

export default CustomerCard;