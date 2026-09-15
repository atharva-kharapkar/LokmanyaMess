export const todayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toLocalYYYYMMDD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Convert internal YYYY-MM-DD string to DD/MM/YYYY for display only. */
export const formatDisplayDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr ?? '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

export const normalizeText = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
export const isBlank = (value) => normalizeText(value).length === 0;
export const isExactDigits = (value, length) => new RegExp(`^\\d{${length}}$`).test(String(value ?? ''));
export const isArchivePinValid = (value) => /^\d{4}$/.test(String(value ?? ''));
export const toAmountNumber = (value) => {
  const str = String(value ?? '').trim().replace(/[^\d.]/g, '');
  const num = parseFloat(str);
  return Number.isFinite(num) ? num : 0;
};
