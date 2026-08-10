import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Smartphone, 
  CreditCard, 
  Building2, 
  Wallet, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';

export const RazorpayDemoModal = ({ 
  isOpen, 
  onClose, 
  orderData, 
  mentorName, 
  onPaymentSuccess 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking', 'wallet'
  const [upiId, setUpiId] = useState('success@razorpay');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');

  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('checkout'); // 'checkout', 'processing', 'success'

  if (!isOpen || !orderData) return null;

  const amountInRupees = orderData.amount_in_rupees || (orderData.amount ? orderData.amount / 100 : 499);
  const planName = orderData.plan_name || 'Mentorship Plan';

  const handlePayNow = () => {
    setProcessing(true);
    setStep('processing');

    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        const paymentResponse = {
          razorpay_payment_id: `pay_test_${Math.random().toString(36).substring(2, 10)}${Date.now().toString().slice(-4)}`,
          razorpay_order_id: orderData.order_id || `order_${Math.random().toString(36).substring(2, 12)}`,
          razorpay_signature: 'test_sig_sandbox_valid_hash',
        };
        if (onPaymentSuccess) {
          onPaymentSuccess(paymentResponse);
        }
      }, 1000);
    }, 1500);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 99999, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '520px', 
          padding: '0', 
          background: '#0c1322', 
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Razorpay Brand Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#ffffff',
              color: '#0284c7',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '1.2rem'
            }}>
              R
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h4 style={{ fontWeight: '900', fontSize: '1rem', letterSpacing: '0.3px', margin: 0 }}>Razorpay</h4>
                <span style={{ 
                  background: '#fef08a', 
                  color: '#854d0e', 
                  fontSize: '0.62rem', 
                  fontWeight: '800', 
                  padding: '1px 6px', 
                  borderRadius: '4px' 
                }}>
                  TEST MODE
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', opacity: 0.9, margin: 0 }}>Trusted by 80 Lakh+ Indian Businesses</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            disabled={processing}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', color: '#fff', padding: '6px', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Order Details Ribbon */}
        <div style={{
          background: '#131e36',
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Paying to MentorHub</p>
            <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
              {planName} • {mentorName}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total Payable</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#38bdf8', margin: 0 }}>
              ₹{amountInRupees}
            </h3>
          </div>
        </div>

        {/* Modal Body State */}
        {step === 'processing' && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{
              width: '52px',
              height: '52px',
              border: '4px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38bdf8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px auto'
            }} />
            <h4 style={{ fontWeight: '800', fontSize: '1.1rem', color: '#f8fafc' }}>Processing Test Payment...</h4>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '6px' }}>
              Connecting with Razorpay sandbox gateway
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {step === 'success' && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid #22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle2 size={36} color="#22c55e" />
            </div>
            <h4 style={{ fontWeight: '900', fontSize: '1.25rem', color: '#22c55e' }}>Payment Successful!</h4>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '6px' }}>
              Verifying cryptographic signature on backend...
            </p>
          </div>
        )}

        {step === 'checkout' && (
          <div style={{ padding: '16px 20px' }}>
            {/* Payment Method Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                style={{
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: paymentMethod === 'upi' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: paymentMethod === 'upi' ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                  color: paymentMethod === 'upi' ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Smartphone size={16} /> UPI / QR
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: paymentMethod === 'card' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: paymentMethod === 'card' ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                  color: paymentMethod === 'card' ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CreditCard size={16} /> Cards
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('netbanking')}
                style={{
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: paymentMethod === 'netbanking' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: paymentMethod === 'netbanking' ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                  color: paymentMethod === 'netbanking' ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Building2 size={16} /> NetBanking
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                style={{
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: paymentMethod === 'wallet' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: paymentMethod === 'wallet' ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                  color: paymentMethod === 'wallet' ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Wallet size={16} /> Wallets
              </button>
            </div>

            {/* TAB CONTENT: UPI */}
            {paymentMethod === 'upi' && (
              <div style={{ background: '#131e36', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: '800', color: '#f8fafc', marginBottom: '10px' }}>
                  Popular UPI Apps (Google Pay / PhonePe / Paytm / BHIM)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                    <div 
                      key={app} 
                      onClick={() => setUpiId(`${app.toLowerCase().replace(' ', '')}@razorpay`)}
                      style={{
                        padding: '8px 4px',
                        background: '#1e293b',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: '#cbd5e1',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer'
                      }}
                    >
                      {app}
                    </div>
                  ))}
                </div>

                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Or enter your UPI ID
                </label>
                <input
                  type="text"
                  className="brutal-input"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@upi"
                  style={{ background: '#0c1322', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.85rem' }}
                />
              </div>
            )}

            {/* TAB CONTENT: CARDS */}
            {paymentMethod === 'card' && (
              <div style={{ background: '#131e36', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: '800', color: '#f8fafc' }}>Test Card Details</p>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Visa / MasterCard / RuPay</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    className="brutal-input"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Card Number"
                    style={{ background: '#0c1322', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    className="brutal-input"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    style={{ background: '#0c1322', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.85rem' }}
                  />
                  <input
                    type="password"
                    className="brutal-input"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="CVV"
                    maxLength={3}
                    style={{ background: '#0c1322', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: NETBANKING */}
            {paymentMethod === 'netbanking' && (
              <div style={{ background: '#131e36', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>Select Bank</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((b) => (
                    <div 
                      key={b}
                      onClick={() => setSelectedBank(b)}
                      style={{
                        padding: '10px',
                        background: selectedBank === b ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                        border: selectedBank === b ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: selectedBank === b ? '#38bdf8' : '#cbd5e1',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: WALLETS */}
            {paymentMethod === 'wallet' && (
              <div style={{ background: '#131e36', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>Select Wallet</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['Paytm', 'Mobikwik', 'Amazon Pay'].map((w) => (
                    <div 
                      key={w}
                      onClick={() => setSelectedWallet(w)}
                      style={{
                        padding: '10px',
                        background: selectedWallet === w ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                        border: selectedWallet === w ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: selectedWallet === w ? '#38bdf8' : '#cbd5e1',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayNow}
              disabled={processing}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Lock size={16} /> Pay ₹{amountInRupees} [Razorpay Test Mode]
            </button>

            {/* Security Footer */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '12px', color: '#64748b', fontSize: '0.72rem' }}>
              <ShieldCheck size={14} color="#22c55e" /> 256-bit SSL Encrypted • Test Mode Sandbox
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RazorpayDemoModal;
