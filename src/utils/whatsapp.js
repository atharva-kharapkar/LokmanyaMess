import { getCustomerDuesBreakdown } from './helpers';

export function normalizeWhatsAppPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

export function buildCustomerReminderMessage(customer, duesAmount, settings = {}) {
  const isMarathi = settings.lang === 'mr';
  const name = customer?.name || 'Customer';
  const messName = settings.messName || 'Lokmanya Mess';
  const upiId = settings.upiId || '9112083787-2@axl';

  let customTemplate = (settings.whatsappDuesTemplate || '').trim();

  // Deduplicate custom template if present
  if (customTemplate) {
    let cleanTemplate = customTemplate;
    if (cleanTemplate.includes('Hi ') && cleanTemplate.lastIndexOf('Hi ') > 0) {
      cleanTemplate = cleanTemplate.substring(0, cleanTemplate.lastIndexOf('Hi ')).trim();
    } else if (cleanTemplate.includes('Dear ') && cleanTemplate.lastIndexOf('Dear ') > 0) {
      cleanTemplate = cleanTemplate.substring(0, cleanTemplate.lastIndexOf('Dear ')).trim();
    } else if (cleanTemplate.includes('नमस्कार ') && cleanTemplate.lastIndexOf('नमस्कार ') > 0) {
      cleanTemplate = cleanTemplate.substring(0, cleanTemplate.lastIndexOf('नमस्कार ')).trim();
    }

    return cleanTemplate
      .replace(/({NAME}|\[NAME\])/gi, name)
      .replace(/({DUES}|\[DUES\])/gi, String(duesAmount || 0))
      .replace(/({UPI}|\[UPI\]|\[UPILINK\]|{UPILINK})/gi, upiId)
      .replace(/({PHONE}|\[PHONE\])/gi, settings.paymentPhone || '')
      .replace(/({MESS_NAME}|\[MESSNAME\]|{MESSNAME})/gi, messName);
  }

  // Calculate dues breakdown
  const breakdown = typeof getCustomerDuesBreakdown === 'function' ? getCustomerDuesBreakdown(customer) : { prevDues: 0, currentDues: duesAmount, totalDues: duesAmount };
  const totalDues = breakdown.totalDues || duesAmount || 0;
  const prevDues = breakdown.prevDues || 0;
  const currentDues = breakdown.currentDues || totalDues;

  const breakdownStr = prevDues > 0 
    ? `\n(Previous Balance: Rs ${prevDues}, Current Month: Rs ${currentDues})` 
    : '';

  const marathiBreakdownStr = prevDues > 0 
    ? `\n(मागील बाकी: ₹${prevDues}, या महिन्याचे: ₹${currentDues})` 
    : '';

  // Construct online payment link
  const payloadObj = {
    pa: upiId,
    pn: messName,
    am: totalDues,
    tn: `${messName} reminder for ${name}`,
    tr: `LMcust_${customer?.id || Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    lang: isMarathi ? 'mr' : 'en',
    ph: customer?.phone || ''
  };

  let payUrl = '';
  try {
    const encodedPayload = btoa(JSON.stringify(payloadObj));
    const nonce = Math.random().toString(36).substring(2, 9);
    payUrl = `https://atharva-kharapkar.github.io/LokmanyaMess/public/pay/?d=${encodedPayload}&r=${nonce}`;
  } catch (err) {
    payUrl = `UPI ID: ${upiId}`;
  }

  if (isMarathi) {
    return `Hi ${name},\n\n` +
      `${messName} मधील आपली थकीत रक्कम ₹${totalDues} आहे.${marathiBreakdownStr}\n\n` +
      `कृपया खालील लिंकीवर क्लिक करून कोणत्याही UPI ॲपने पेमेंट करा:\n${payUrl}\n\n` +
      `Thank you,\n${messName}`;
  }

  return `Hi ${name},\n\n` +
    `Your pending dues for ${messName} are Rs ${totalDues}.${breakdownStr}\n\n` +
    `Please pay here using any UPI app:\n${payUrl}\n\n` +
    `Thank you,\n${messName}`;
}

export function openWhatsAppWithTypedMessage(phone, message, mode = 'desktop') {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  const encodedMsg = encodeURIComponent(message || '');
  let url = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
  if (mode === 'web') {
    url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}
