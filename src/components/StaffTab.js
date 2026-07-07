import React from 'react';
import {
  View,
  FlatList
} from 'react-native';

import PrimaryButton from './PrimaryButton';
import EmployeeCard from './EmployeeCard';
import ScreenHeader from './ScreenHeader';
import StatsCard from './StatsCard';
import SectionContainer from './SectionContainer';

const StaffTab = React.memo(({
  role,
  employees,
  openAddEmp,
  openEditEmp,
  markSal,
  markAllSal,
  deleteEmp,
  setConf,
  t,
  S,
  salaries,
  deleteSalary
}) => {

  return (
    <View style={S.flex1}>

      <SectionContainer>

        <ScreenHeader
          title={t.staff}
        />

        <PrimaryButton
          title={`+ ${t.addEmployee}`}
          onPress={openAddEmp}
          S={S}
        />

        <StatsCard
          title={t.totalEmployees}
          value={employees.length}
        />

        <FlatList
          data={employees}
          keyExtractor={(item)=>item.id}
          contentContainerStyle={{
            paddingBottom:160
          }}
          renderItem={({item})=>(
            <EmployeeCard
              item={item}
              openEditEmp={openEditEmp}
              markSal={markSal}
              deleteEmp={deleteEmp}
              salaries={salaries ? salaries.filter(s => s.empId === item.id) : []}
              deleteSalary={deleteSalary}
              role={role}
              S={S}
              t={t}
            />
          )}
        />

      </SectionContainer>

    </View>
  );
});

export default StaffTab;