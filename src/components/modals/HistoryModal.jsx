import React from 'react';
import { X, History } from 'lucide-react';
import { formatDisplayDate } from '../../utils/formatters';

export default function HistoryModal({
  customer,
  transactions = [],
  db,
  onClose
}) {
  if (!customer) return null;
  const isMarathi = db.settings?.lang === 'mr';

  const custTxns = transactions.filter(t => t.custId === customer.id);

  return (
    <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 }} onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px', width: '90%', borderRadius: '16px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
              {customer.name} - {isMarathi ? 'जमा इतिहास' : 'Payment History'}
            </h2>
          </div>
          <button className="btn btn-sm btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {custTxns.map((t) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>
                  ₹{t.amount} ({t.paymentMode || 'Cash'})
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  📅 {formatDisplayDate(t.date)}
                </div>
                {t.note && (
                  <div style={{ fontSize: '11px', color: 'var(--primary)', fontStyle: 'italic' }}>
                    Note: {t.note}
                  </div>
                )}
              </div>
              <span className="badge badge-active" style={{ fontSize: '10px' }}>
                {isMarathi ? 'यशस्वी' : 'Success'}
              </span>
            </div>
          ))}

          {custTxns.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
              {isMarathi ? 'कोणताही जमा इतिहास सापडला नाही.' : 'No payment history found.'}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn" onClick={onClose}>
            {isMarathi ? 'बंद करा' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
