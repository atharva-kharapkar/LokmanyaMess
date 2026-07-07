import React from 'react';

import {
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const CustomerModal = ({
  custModal,
  setCustModal,
  editCustId,
  t,
  S,
  pickImg,
  custForm,
  setCustForm,
  PLAN_AMT,
  saveCust,
  ModalHeader,
  PPicker,
  StableInput,
  PlanPicker,
  FormButtons,
  savingCust
}) => {
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setCustForm(f => ({ ...f, joinDate: `${yyyy}-${mm}-${dd}` }));
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  return (
    <Modal
      visible={custModal}
      animationType="slide"
      transparent
      onRequestClose={()=>setCustModal(false)}
    >

      <KeyboardAvoidingView
        behavior="padding"
        style={S.ov}
      >

        <ScrollView
          style={S.sh}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >

          <ModalHeader
            title={
              editCustId
                ? t.editCustomer
                : t.addCustomer
            }
          />

          <PPicker
            photo={custForm.photo}
            onCam={async()=>{
              const u = await pickImg('camera');

              if(u){
                setCustForm(f=>({
                  ...f,
                  photo:u
                }));
              }
            }}
            onGal={async()=>{
              const u = await pickImg('gallery');

              if(u){
                setCustForm(f=>({
                  ...f,
                  photo:u
                }));
              }
            }}
            t={t}
          />

          <StableInput
            label={t.fullName}
            value={custForm.name}
            onChangeText={v=>
              setCustForm(f=>({
                ...f,
                name:v
              }))
            }
            placeholder="e.g. Rahul Kulkarni"
          />

          <StableInput
            label={t.whatsappNo}
            value={custForm.phone}
            onChangeText={v=>
              setCustForm(f=>({
                ...f,
                phone:
                  v
                    .replace(/[^0-9]/g,'')
                    .slice(0,10)
              }))
            }
            placeholder="XXXXXXXXXX"
            keyboardType="phone-pad"
            prefix="+91"
          />

          <StableInput
            label={t.aadharId}
            value={custForm.aadhar}
            onChangeText={v=>
              setCustForm(f=>({
                ...f,
                aadhar:
                  v
                    .replace(/[^0-9]/g,'')
                    .slice(0,12)
              }))
            }
            placeholder="XXXX XXXX XXXX"
            keyboardType="numeric"
          />

          <PlanPicker
            label={t.plan}
            opts={[
              {
                v:'Monthly',
                l:t.monthly
              },
              {
                v:'Weekly',
                l:t.weekly
              },
              {
                v:'Daily',
                l:t.daily
              },
              {
                v:'Custom',
                l:t.custom
              }
            ]}
            val={custForm.plan}
            onSel={v=>
              setCustForm(f=>({
                ...f,
                plan:v,
                amount:
                  v!=='Custom'
                    ? String(PLAN_AMT[v])
                    : f.amount
              }))
            }
          />

          <StableInput
  label={t.amount}
  value={custForm.amount}
  onChangeText={v=>
    setCustForm(f=>({
      ...f,
      amount:
        v
          .replace(/[^0-9]/g,'')
          .slice(0,4)
    }))
  }
  placeholder="1500"
  keyboardType="numeric"
/>

          <View style={{ marginBottom: 13 }}>
            <Text style={S.label}>{t.joiningDate}</Text>
            <TouchableOpacity
              style={[S.input, { justifyContent: 'center' }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, color: custForm.joinDate ? '#1A1A1A' : '#6E6E73' }}>
                {custForm.joinDate || 'Select Date'}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={parseDate(custForm.joinDate)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
            />
          )}

          <StableInput
            label={t.address}
            value={custForm.addr}
            onChangeText={v=>
              setCustForm(f=>({
                ...f,
                addr:v
              }))
            }
            placeholder="Room no. / Building"
          />

          <FormButtons
            cancelText={t.cancel}
            saveText={savingCust ? 'Saving...' : t.save}
            onCancel={()=>setCustModal(false)}
            onSave={saveCust}
            saveStyle={S.btnP}
            disabled={savingCust}
            S={S}
          />

        </ScrollView>

      </KeyboardAvoidingView>

    </Modal>
  );
};

export default CustomerModal;