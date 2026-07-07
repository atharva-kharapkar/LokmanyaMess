import React from 'react';
import {
  View,
  Text
} from 'react-native';

const EmptyState = ({
  message
}) => {

  return (
    <View
      style={{
        backgroundColor:'#fff',
        padding:20,
        borderRadius:10,
        marginTop:20,
        alignItems:'center'
      }}
    >

      <Text
        style={{
          fontSize:14,
          color:'#666'
        }}
      >
        {message}
      </Text>

    </View>
  );
};

export default EmptyState;