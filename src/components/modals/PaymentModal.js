import React from 'react';

import {
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

const PaymentModal = ({
  payModal,
  setPayModal,
  t,
  S
}) => {

  return (
    <Modal
      visible={payModal}
      animationType="slide"
      transparent
      onRequestClose={()=>setPayModal(false)}
    >

      <KeyboardAvoidingView
        behavior="padding"
      >

        <ScrollView
          style={S.sh}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          <ModalHeader
            title={t.recordPayment}
          />

        </ScrollView>

      </KeyboardAvoidingView>

    </Modal>
  );
};

export default PaymentModal;