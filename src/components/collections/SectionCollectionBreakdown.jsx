import React from 'react';
import { Utensils, ShoppingBag } from 'lucide-react';

export default function SectionCollectionBreakdown({
  filteredTxns = [],
  db = { customers: [] },
  isMarathi
}) {
  const customers = db.customers || [];

  // Group transactions by customer category
  let tiffinTotal = 0;
  let tiffinTxCount = 0;
  let dineInTotal = 0;
  let dineInTxCount = 0;

  filteredTxns.forEach((tx) => {
    const cust = tx.customer || customers.find(c => c.id === tx.customerId || c.name === tx.custName || c.phone === tx.custPhone);
    const category = cust?.category || 'tiffin';
    const amt = Number(tx.amount || 0);

    if (category === 'tiffin') {
      tiffinTotal += amt;
      tiffinTxCount += 1;
    } else {
      dineInTotal += amt;
      dineInTxCount += 1;
    }
  });

  const grandTotal = tiffinTotal + dineInTotal;
  const tiffinPercent = grandTotal > 0 ? Math.round((tiffinTotal / grandTotal) * 100) : 0;
  const dineInPercent = grandTotal > 0 ? Math.round((dineInTotal / grandTotal) * 100) : 0;

  return (
    <div 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '16px',
        marginBottom: '20px' 
      }}
    >
      {/* 🍱 Tiffin Section Collections Card */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, rgba(216, 90, 48, 0.08) 0%, rgba(216, 90, 48, 0.02) 100%)', 
          border: '1.5px solid rgba(216, 90, 48, 0.3)', 
          borderRadius: '16px', 
          padding: '18px 20px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(216, 90, 48, 0.15)', color: '#d85a30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#d85a30', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🍱 {isMarathi ? 'टिफिन जमा रक्कम' : 'Tiffin Collections'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {tiffinTxCount} {isMarathi ? 'व्यवहारांमधून' : 'transactions'} ({tiffinPercent}%)
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '26px', fontWeight: '800', color: '#d85a30', letterSpacing: '-0.5px' }}>
          ₹{tiffinTotal.toLocaleString('en-IN')}
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(216, 90, 48, 0.15)', borderRadius: '4px', marginTop: '12px', overflow: 'hidden' }}>
          <div style={{ width: `${tiffinPercent}%`, height: '100%', backgroundColor: '#d85a30', borderRadius: '4px', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* 🍽️ Dine-In Section Collections Card */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)', 
          border: '1.5px solid rgba(139, 92, 246, 0.3)', 
          borderRadius: '16px', 
          padding: '18px 20px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🍽️ {isMarathi ? 'डायनिंग जमा रक्कम' : 'Dine-In Collections'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {dineInTxCount} {isMarathi ? 'व्यवहारांमधून' : 'transactions'} ({dineInPercent}%)
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '26px', fontWeight: '800', color: '#8b5cf6', letterSpacing: '-0.5px' }}>
          ₹{dineInTotal.toLocaleString('en-IN')}
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(139, 92, 246, 0.15)', borderRadius: '4px', marginTop: '12px', overflow: 'hidden' }}>
          <div style={{ width: `${dineInPercent}%`, height: '100%', backgroundColor: '#8b5cf6', borderRadius: '4px', transition: 'width 0.3s ease' }} />
        </div>
      </div>
    </div>
  );
}
