import React from 'react';
import {
  View,
  TextInput
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const SearchBar = ({
  value,
  onChangeText,
  t
}) => {

  return (
    <View
      style={{
        flexDirection:'row',
        alignItems:'center',
        backgroundColor:'#fff',
        borderWidth:1,
        borderColor:'#E5E7EB',
        borderRadius:14,
        paddingHorizontal:14,
        marginBottom:12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      }}
    >
      <Feather name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
      <TextInput
        style={{
          flex:1,
          paddingVertical:12,
          fontSize:15,
          color: '#111827'
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={t.search || 'Search...'}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
};

export default SearchBar;