import React from 'react';
import {
  Text
} from 'react-native';

const ScreenHeader = ({
  title
}) => {

  return (
    <Text
      style={{
        fontSize:20,
        fontWeight:'700',
        marginBottom:10
      }}
    >
      {title}
    </Text>
  );
};

export default ScreenHeader;
