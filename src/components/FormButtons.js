import React from 'react';
import {
  View
} from 'react-native';

import ActionButton from './ActionButton';

const FormButtons = ({
  cancelText = 'Cancel',
  saveText = 'Save',
  onCancel,
  onSave,
  saveStyle,
  disabled,
  S
}) => {

  return (
    <View
      style={{
        flexDirection:'row',
        gap:8,
        marginTop:4,
        marginBottom:20
      }}
    >

      <ActionButton
        title={cancelText}
        onPress={onCancel}
        style={S.btnD}
        disabled={disabled}
        S={S}
      />

      <ActionButton
        title={saveText}
        onPress={onSave}
        style={saveStyle || S.btnP}
        disabled={disabled}
        S={S}
      />

    </View>
  );
};

export default FormButtons;