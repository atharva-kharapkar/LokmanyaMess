import React from 'react';
import {
  View
} from 'react-native';

const SectionContainer = ({
  children
}) => {

  return (
    <View
      style={{
        padding:12,
        flex:1
      }}
    >
      {children}
    </View>
  );
};

export default SectionContainer;