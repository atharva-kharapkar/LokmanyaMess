import React from 'react';

import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const PinModal = ({
  pinModal,
  setPinModal,
  newOwnerPin,
  setNewOwnerPin,
  newWorkerPin,
  setNewWorkerPin,
  saveOwnerPin,
  saveWorkerPin,
  S,
  C,
  t
}) => {

  return (
    <Modal
      visible={pinModal}
      animationType="slide"
      transparent
      onRequestClose={()=>setPinModal(false)}
    >

      <KeyboardAvoidingView
        behavior="padding"
        style={S.covOv}
      >

        <View
          style={[
            S.cBox,
            {
              width:'92%',
              maxWidth:380,
              borderRadius:24,
              padding:22
            }
          ]}
        >

          <View
            style={{
              width:70,
              height:70,
              borderRadius:35,
              backgroundColor:C.pl,
              alignSelf:'center',
              alignItems:'center',
              justifyContent:'center',
              marginBottom:14
            }}
          >
            <Ionicons
              name="key-outline"
              size={34}
              color={C.primary}
            />
          </View>

          <Text
            style={{
              fontSize:22,
              fontWeight:'800',
              color:C.text,
              textAlign:'center',
              marginBottom:6
            }}
          >
            {t.changePin || 'Change PIN'}
          </Text>

          <Text
            style={{
              fontSize:13,
              color:C.t2,
              textAlign:'center',
              marginBottom:22,
              lineHeight:20
            }}
          >
            {t.changePin !== 'Change PIN' ? 'मालक आणि कर्मचारी सुरक्षा PIN अपडेट करा' : 'Update Owner and Worker security PINs'}
          </Text>

          <Text style={S.label}>
            {t.owner || 'Owner'} PIN
          </Text>

          <TextInput
            placeholder={t.changePin !== 'Change PIN' ? '६ अंकी मालक PIN प्रविष्ट करा' : 'Enter 6 digit owner PIN'}
            value={newOwnerPin}
            onChangeText={setNewOwnerPin}
            keyboardType="number-pad"
            maxLength={6}
            style={S.input}
            placeholderTextColor={C.t2}
          />

          <View style={{height:12}} />

          <Text style={S.label}>
            {t.worker || 'Worker'} PIN
          </Text>

          <TextInput
            placeholder={t.changePin !== 'Change PIN' ? '६ अंकी कर्मचारी PIN प्रविष्ट करा' : 'Enter 6 digit worker PIN'}
            value={newWorkerPin}
            onChangeText={setNewWorkerPin}
            keyboardType="number-pad"
            maxLength={6}
            style={S.input}
            placeholderTextColor={C.t2}
          />

          <View
            style={{
              flexDirection:'column',
              gap:10,
              marginTop:22
            }}
          >

            <TouchableOpacity
              style={[S.btn,S.btnP]}
              onPress={saveOwnerPin}
              activeOpacity={0.7}
            >
              <Text style={S.btnTW}>
                {t.changePin !== 'Change PIN' ? 'मालक PIN जतन करा' : 'Save Owner PIN'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[S.btn,S.btnS]}
              onPress={saveWorkerPin}
              activeOpacity={0.7}
            >
              <Text style={S.btnTW}>
                {t.changePin !== 'Change PIN' ? 'कर्मचारी PIN जतन करा' : 'Save Worker PIN'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[S.btn]}
              onPress={()=>setPinModal(false)}
              activeOpacity={0.7}
            >
              <Text style={S.btnT}>
                {t.cancel || 'Cancel'}
              </Text>
            </TouchableOpacity>

          </View>

        </View>

      </KeyboardAvoidingView>

    </Modal>
  );
};

export default PinModal;