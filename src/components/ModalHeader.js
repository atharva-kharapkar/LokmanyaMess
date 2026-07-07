import React from 'react';
import {
  Text
} from 'react-native';

const ModalHeader = ({
  title
}) => {

  return (
    <Text
      style={{
        fontSize:18,
        fontWeight:'700',
        marginBottom:16
      }}
    >
      {title}
    </Text>
  );
};

export default ModalHeader;
