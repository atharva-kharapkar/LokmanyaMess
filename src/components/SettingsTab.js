import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';

const SettingsTab = React.memo(({
  role,
  setPinModal,
  admin,
  lang,
  setLang,
  setAdminForm,
  setAdminModal,
  setTplInput,
  setTplModal,
  setUpiInput,
  setUpiModal,
  upiId,
  qrImg,
  waTemplate,
  pickImg,
  setAdmin,
  setScreen,
  setTab,
  setRole,
  setPinInput,
  t,
  S,
  C,
  Av,
  resetCollections,
  backupExists,
  undoResetCollections
}) => {

  return (
    <ScrollView 
      style={S.flex1}
      contentContainerStyle={{ paddingBottom: 160 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{padding:12}}>

        {/* Title Header Card */}
        <View
          style={{
            backgroundColor:'#D85A30', // Brand Primary Orange
            padding:20,
            borderRadius:20,
            marginBottom:16,
            elevation: 8,
            shadowColor: '#D85A30',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
          }}
        >
          <Text
            style={{
              color:'#fff',
              fontSize:22,
              fontWeight:'800',
              letterSpacing: 0.3
            }}
          >
            {t.settings || 'Settings'}
          </Text>

          <Text
            style={{
              color:'rgba(255,255,255,0.85)',
              marginTop:6,
              fontSize:13,
              fontWeight: '500'
            }}
          >
            {t.manageProfile || 'Manage your mess profile and preferences'}
          </Text>
        </View>

        {/* Owner Info Details Card */}
        <View
          style={{
            backgroundColor:'#fff',
            padding:18,
            borderRadius:18,
            marginBottom:16,
            borderWidth:1,
            borderColor:'#E5E7EB',
            elevation:3,
            shadowColor:'#000',
            shadowOffset:{width:0,height:3},
            shadowOpacity:0.04,
            shadowRadius:6
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Av name={admin?.name || 'Mess Owner'} photo={admin?.photo} index={0} size={50} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '800',
                  color: '#111827'
                }}
              >
                {admin?.name || 'Mess Owner'}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 }}>
                {role === 'owner' ? (t.owner || 'Owner') : (t.worker || 'Worker')}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 12, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>{t.messName || 'Mess Name'}:</Text>
              <Text style={{ fontSize: 13, color: '#111827', fontWeight: '700' }}>{admin?.mess || 'Lokmanya Mess'}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>{t.phoneNo || 'Phone'}:</Text>
              <Text style={{ fontSize: 13, color: '#111827', fontWeight: '700' }}>{admin?.phone || (t.noPhone || 'No phone number')}</Text>
            </View>
          </View>
        </View>

        {role === 'owner' && (
          <View style={{ gap: 10 }}>
            {/* Owner Profile Button */}
            <TouchableOpacity
              style={{
                backgroundColor:'#FAECE7', // Light brand accent
                padding:16,
                borderRadius:16,
                borderWidth:1,
                borderColor:'#F5D6CB',
                elevation: 1,
                shadowColor: '#D85A30',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 2
              }}
              onPress={()=>{
                const cleanPhone = (admin?.phone || '').replace(/\D/g, '');
                const displayPhone = cleanPhone.length === 12 && cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone;
                setAdminForm({
                  name: admin?.name || 'Mess Owner',
                  phone: displayPhone,
                  mess: admin?.mess || 'Lokmanya Mess',
                  photo: admin?.photo || null
                });
                setAdminModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={{fontSize:15,fontWeight:'700',color:'#993C1D'}}>
                👤 {t.editProfile || 'Owner Profile'}
              </Text>
            </TouchableOpacity>

            {/* UPI Settings Button */}
            <TouchableOpacity
              style={{
                backgroundColor:'#E6F4EA', // Success light green
                padding:16,
                borderRadius:16,
                borderWidth:1,
                borderColor:'#A3E2B8',
                elevation: 1,
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 2
              }}
              onPress={()=>{
                setUpiInput(upiId);
                setUpiModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={{fontSize:15,fontWeight:'700',color:'#047857'}}>
                💳 {t.upiSetup || 'UPI Settings'}
              </Text>
            </TouchableOpacity>

            {/* WhatsApp Template Button */}
            <TouchableOpacity
              style={{
                backgroundColor:'#FEF3C7', // Warning light yellow
                padding:16,
                borderRadius:16,
                borderWidth:1,
                borderColor:'#FDE68A',
                elevation: 1,
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 2
              }}
              onPress={()=>{
                setTplInput(waTemplate);
                setTplModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={{fontSize:15,fontWeight:'700',color:'#B45309'}}>
                💬 {t.waTemplate || 'WhatsApp Template'}
              </Text>
            </TouchableOpacity>

            {/* Change PIN Button */}
            <TouchableOpacity
              style={{
                backgroundColor:'#DBEAFE', // Info light blue
                padding:16,
                borderRadius:16,
                borderWidth:1,
                borderColor:'#BFDBFE',
                elevation: 1,
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 2
              }}
              onPress={()=>setPinModal(true)}
              activeOpacity={0.7}
            >
              <Text style={{fontSize:15,fontWeight:'700',color:'#1D4ED8'}}>
                🔑 {t.changePin || 'Change PIN'}
              </Text>
            </TouchableOpacity>

            {/* Reset Collections Button */}
            <TouchableOpacity
              style={{
                backgroundColor:'#FEE2E2', // Danger light red
                padding:16,
                borderRadius:16,
                borderWidth:1,
                borderColor:'#FCA5A5',
                elevation: 1,
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 2
              }}
              onPress={resetCollections}
              activeOpacity={0.7}
            >
              <Text style={{fontSize:15,fontWeight:'700',color:'#B91C1C'}}>
                ⚠️ {t.resetCollections || 'Reset Collections'}
              </Text>
            </TouchableOpacity>

            {/* Undo Reset Collections Button */}
            <TouchableOpacity
              style={{
                backgroundColor: backupExists ? '#E1F5EE' : '#F3F4F6', // Light green / Light grey
                padding:16,
                borderRadius:16,
                borderWidth:1,
                borderColor: backupExists ? '#A9DFBF' : '#E5E7EB',
                elevation: backupExists ? 1 : 0,
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 2,
                marginTop: 10,
                opacity: backupExists ? 1 : 0.65
              }}
              onPress={backupExists ? undoResetCollections : () => Alert.alert('', 'No backup found to restore.')}
              activeOpacity={backupExists ? 0.7 : 1}
            >
              <Text style={{fontSize:15,fontWeight:'700',color: backupExists ? '#085041' : '#9CA3AF'}}>
                ↩️ {t.undoReset || 'Undo Reset Collections'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={{
            backgroundColor:'#F9FAFB',
            padding:16,
            borderRadius:16,
            marginTop:16,
            borderWidth:1,
            borderColor:'#E5E7EB',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 4
          }}
          onPress={()=>{
            setRole(null);
            setPinInput('');
            setTab('home');
            setScreen('pin');
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize:15,
              fontWeight:'700',
              color:'#4B5563',
              textAlign: 'center'
            }}
          >
            {t.logout || 'Logout'}
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            marginTop:20,
            fontSize:13,
            color:'#9CA3AF',
            textAlign: 'center',
            fontWeight: '600'
          }}
        >
          {t.currentLanguage}: {lang.toUpperCase()}
        </Text>

      </View>
    </ScrollView>
  );
});

export default SettingsTab;
