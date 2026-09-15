export const MEAL_TYPES = {
  NONE: 'NONE',
  ONE_TIME_FULL: '1_TIME_FULL',
  TWO_TIME_FULL: '2_TIME_FULL',
  ONE_TIME_HALF: '1_TIME_HALF',
  TWO_TIME_HALF: '2_TIME_HALF',
};

export const MEAL_SLOTS = {
  NONE: 'NONE',
  MORNING: 'MORNING',
  NIGHT: 'NIGHT',
  BOTH: 'BOTH',
};

export const DEFAULT_MEAL_TYPE = MEAL_TYPES.TWO_TIME_FULL;
export const DEFAULT_MEAL_SLOT = MEAL_SLOTS.BOTH;

export function normalizeMealType(type) {
  if (!type || type === 'NONE' || type === 'none' || type === 'null' || type === 'undefined') return 'NONE';
  const str = String(type).toUpperCase().trim();
  
  if (str.includes('1') && (str.includes('HALF') || str.includes('अर्धे'))) return MEAL_TYPES.ONE_TIME_HALF;
  if (str.includes('2') && (str.includes('HALF') || str.includes('अर्धे'))) return MEAL_TYPES.TWO_TIME_HALF;
  if (str.includes('1') && (str.includes('FULL') || str.includes('पूर्ण') || str.includes('MEAL') || str.includes('TIME'))) return MEAL_TYPES.ONE_TIME_FULL;
  if (str.includes('2') && (str.includes('FULL') || str.includes('पूर्ण') || str.includes('MEAL') || str.includes('TIME'))) return MEAL_TYPES.TWO_TIME_FULL;

  if (str === '1TIME_FULL' || str === '1_TIME_FULL' || str === '1 MEAL PER DAY' || str === '1 MEAL') return MEAL_TYPES.ONE_TIME_FULL;
  if (str === '2TIME_FULL' || str === '2_TIME_FULL' || str === '2 MEAL PER DAY' || str === '2 MEAL') return MEAL_TYPES.TWO_TIME_FULL;
  if (str === '1TIME_HALF' || str === '1_TIME_HALF' || str === '1 HALF MEAL') return MEAL_TYPES.ONE_TIME_HALF;
  if (str === '2TIME_HALF' || str === '2_TIME_HALF' || str === '2 HALF MEAL') return MEAL_TYPES.TWO_TIME_HALF;

  return 'NONE';
}

export function normalizeMealSlot(slot) {
  if (!slot || slot === 'NONE' || slot === 'none' || slot === '' || slot === 'Blank' || slot === 'null' || slot === 'undefined') return MEAL_SLOTS.NONE;
  const str = String(slot).toUpperCase().trim();
  
  if (str.includes('MORN') || str.includes('DAY') || str.includes('LUNCH') || str.includes('सकाळ')) return MEAL_SLOTS.MORNING;
  if (str.includes('NIGH') || str.includes('EVEN') || str.includes('DINNER') || str.includes('रात्र')) return MEAL_SLOTS.NIGHT;
  if (str.includes('BOTH') || str.includes('दोन्ही')) return MEAL_SLOTS.BOTH;

  return MEAL_SLOTS.NONE;
}

export function getMealTypeLabel(type, lang = 'en') {
  const norm = normalizeMealType(type);
  const isMr = lang === 'mr';
  switch (norm) {
    case MEAL_TYPES.NONE:
      return '';
    case MEAL_TYPES.ONE_TIME_FULL:
      return isMr ? '१ वेळ पूर्ण जेवण' : '1 Time Full Meal';
    case MEAL_TYPES.TWO_TIME_FULL:
      return isMr ? '२ वेळा पूर्ण जेवण' : '2 Time Full Meal';
    case MEAL_TYPES.ONE_TIME_HALF:
      return isMr ? '१ वेळ अर्धे जेवण' : '1 Time Half Meal';
    case MEAL_TYPES.TWO_TIME_HALF:
      return isMr ? '२ वेळा अर्धे जेवण' : '2 Time Half Meal';
    default:
      return '';
  }
}

export function getMealSlotLabel(slot, lang = 'en') {
  const norm = normalizeMealSlot(slot);
  const isMr = lang === 'mr';
  switch (norm) {
    case MEAL_SLOTS.NONE:
      return '';
    case MEAL_SLOTS.MORNING:
      return isMr ? 'सकाळ' : 'Morning';
    case MEAL_SLOTS.NIGHT:
      return isMr ? 'रात्र' : 'Night';
    case MEAL_SLOTS.BOTH:
      return isMr ? 'दोन्ही' : 'Both';
    default:
      return '';
  }
}

export const ALL_MEAL_TYPES = [
  MEAL_TYPES.ONE_TIME_FULL,
  MEAL_TYPES.TWO_TIME_FULL,
  MEAL_TYPES.ONE_TIME_HALF,
  MEAL_TYPES.TWO_TIME_HALF
];
export const ALL_MEAL_SLOTS = [
  MEAL_SLOTS.MORNING,
  MEAL_SLOTS.NIGHT,
  MEAL_SLOTS.BOTH
];
