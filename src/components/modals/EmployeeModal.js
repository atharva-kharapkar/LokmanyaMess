import React from 'react';

import {
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

const EmployeeModal = ({
  empModal,
  setEmpModal,
  editEmpId,
  t,
  S,
  pickImg,
  empForm,
  setEmpForm,
  saveEmp,
  ModalHeader,
  PPicker,
  StableInput,
  PlanPicker,
  FormButtons,
  savingEmp
}) => {

  return (
    <Modal
      visible={empModal}
      animationType="slide"
      transparent
      onRequestClose={()=>setEmpModal(false)}
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
              editEmpId
                ? t.editEmployee
                : t.addEmployee
            }
          />

          <PPicker
            photo={empForm.photo}
            onCam={async()=>{
              const u = await pickImg('camera');

              if(u){
                setEmpForm(f=>({
                  ...f,
                  photo:u
                }));
              }
            }}
            onGal={async()=>{
              const u = await pickImg('gallery');

              if(u){
                setEmpForm(f=>({
                  ...f,
                  photo:u
                }));
              }
            }}
            t={t}
          />

          <StableInput
            label={t.fullName}
            value={empForm.name}
            onChangeText={v=>
              setEmpForm(f=>({
                ...f,
                name:v
              }))
            }
            placeholder="e.g. Rahul Patil"
          />

          <PlanPicker
            label={t.role}
            opts={[
              {
                v:'Cook',
                l:'Cook'
              },
              {
                v:'Manager',
                l:'Manager'
              },
              {
                v:'Helper',
                l:'Helper'
              },
              {
                v:'Cleaner',
                l:'Cleaner'
              }
            ]}
            val={empForm.role}
            onSel={v=>
              setEmpForm(f=>({
                ...f,
                role:v
              }))
            }
          />

          <StableInput
            label={t.salary}
            value={empForm.salary}
            onChangeText={v=>
              setEmpForm(f=>({
                ...f,
                salary:
                  v.replace(/[^0-9]/g,'')
              }))
            }
            placeholder="12000"
            keyboardType="numeric"
          />

          <StableInput
            label={t.phoneNo}
            value={empForm.phone}
            onChangeText={v=>
              setEmpForm(f=>({
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
            value={empForm.aadhar}
            onChangeText={v=>
              setEmpForm(f=>({
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

          <FormButtons
            cancelText={t.cancel}
            saveText={savingEmp ? 'Saving...' : t.save}
            onCancel={()=>setEmpModal(false)}
            onSave={saveEmp}
            saveStyle={S.btnP}
            disabled={savingEmp}
            S={S}
          />

        </ScrollView>

      </KeyboardAvoidingView>

    </Modal>
  );
};

export default EmployeeModal;