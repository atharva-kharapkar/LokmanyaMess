import React from 'react';
import {
  TouchableOpacity,
  Text
} from 'react-native';

const ActionButton = ({
  title,
  onPress,
  style,
  textStyle,
  disabled,
  S
}) => {

  return (
    <TouchableOpacity
      style={[S.btn,S.btnSm,style,{flex:1}, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[S.btnTW,{fontSize:12,textAlign:'center'},textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default ActionButton;