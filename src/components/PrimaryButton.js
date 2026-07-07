import React from 'react';
import {
  TouchableOpacity,
  Text
} from 'react-native';

const PrimaryButton = ({
  title,
  onPress,
  S
}) => {

  return (
    <TouchableOpacity
      style={[S.btn,S.btnP,S.btnSm]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[S.btnTW,{fontSize:12}]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default PrimaryButton;