import React from 'react';
import {
  View,
  Text
} from 'react-native';

const StatsCard = ({
  title,
  value,
  fullWidth = false
}) => {

  let bg = '#FAECE7'; // Default brand primary light
  let borderColor = '#F5D6CB';
  let textColor = '#993C1D';
  let icon = '👥';

  if (title.includes('Employees') || title.includes('Staff')) {
    bg = '#FAECE7';
    borderColor = '#F5D6CB';
    textColor = '#993C1D';
    icon = '👥';
  }

  else if (title.includes('Customers')) {
    bg = '#FAECE7';
    borderColor = '#F5D6CB';
    textColor = '#993C1D';
    icon = '👥';
  }

  else if (title.includes('Active')) {
    bg = '#E6F4EA'; // success light
    borderColor = '#A3E2B8';
    textColor = '#047857';
    icon = '✅';
  }

  else if (title.includes('Expiring')) {
    bg = '#FEF3C7'; // warning light
    borderColor = '#FDE68A';
    textColor = '#B45309';
    icon = '⏳';
  }

  else if (title.includes('Expired')) {
    bg = '#FEE2E2'; // danger light
    borderColor = '#FCA5A5';
    textColor = '#B91C1C';
    icon = '❌';
  }

  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: borderColor,
        borderWidth: 1,
        width: fullWidth ? '100%' : '48%',
        padding: 16,
        borderRadius: 18,
        marginTop: 12,
        elevation: 3,
        shadowColor: textColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4
      }}
    >
      <Text
        style={{
          fontSize: 24,
          marginBottom: 4
        }}
      >
        {icon}
      </Text>

      <Text
        style={{
          fontSize: 12,
          color: textColor,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.3
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 24,
          fontWeight: '800',
          color: textColor,
          marginTop: 6
        }}
      >
        {value}
      </Text>
    </View>
  );
};

export default StatsCard;