import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  BookOpen, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert,
  CreditCard,
  Zap,
  Award
} from 'lucide-react';
import { sessionsAPI } from '../api/sessions';
import { useAuth } from '../context/AuthContext';
import { RazorpayDemoModal } from './RazorpayDemoModal';

export const SessionBookingModal = ({ isOpen, onClose, mentor, onSuccess }) => {
  const { user } = useAuth();

  // Selected Plan: 'single', '1_month', '3_months'
  const [selectedPlan, setSelectedPlan] = useState('1_month');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [duration, setDuration] = useState(60);

  const [activeSubscription, setActiveSubscription] = useState(null);
  const [checkingSub, setCheckingSub] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Razorpay Checkout Modal State
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);
  const [currentOrderData, setCurrentOrderData] = useState(null);

  // Check if mentee already has an active plan with this mentor
  useEffect(() => {
    if (!isOpen || !mentor) return;

    const checkActivePlan = async () => {
      try {
        setCheckingSub(true);
        const mentorId = mentor.user || mentor.id;
        const res = await sessionsAPI.checkSubscription(mentorId);
        if (res.is_subscribed && res.subscription) {
          setActiveSubscription(res.subscription);
        } else {
          setActiveSubscription(null);
        }
      } catch (err) {
        setActiveSubscription(null);
      } finally {
        setCheckingSub(false);
      }
    };

    checkActivePlan();
  }, [isOpen, mentor]);

  if (!isOpen || !mentor) return null;

  // Suspended Account Guard
  if (user?.is_suspended) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="modal-content" 
          style={{ maxWidth: '480px', padding: '32px', background: '#0f172a', border: '2px solid #ef4444', textAlign: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <ShieldAlert size={32} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#f87171', marginBottom: '8px' }}>
            Account Suspended
          </h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
            Your account has been suspended by the Administrator. You cannot book or request mentorship sessions. Please check your notifications for details.
          </p>
          <button onClick={onClose} className="btn-brutal btn-white" style={{ padding: '10px 24px' }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  // Unregistered / Guest Guard
  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="modal-content" 
          style={{ maxWidth: '480px', padding: '32px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)', textAlign: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '2px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <ShieldCheck size={32} color="#38bdf8" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#f8fafc', marginBottom: '8px' }}>
            Registration Required
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
            To book mentorship sessions, unlock 1-on-1 video coaching, and process payments, please register or sign in as a student.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <a href="/register" className="btn-brutal btn-lime" style={{ padding: '10px 20px', textDecoration: 'none' }}>
              Register as Student
            </a>
            <a href="/login" className="btn-brutal btn-white" style={{ padding: '10px 20px', textDecoration: 'none' }}>
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }


  const mentorId = mentor.user || mentor.id;
  const hourlyRate = parseFloat(mentor.hourly_rate) || 499;

  const monthlyRate = parseFloat(mentor.monthly_rate) || 1499;
  const quarterlyRate = parseFloat(mentor.quarterly_rate) || 3999;

  const planPricing = {
    single: { price: hourlyRate, title: 'Single 1-on-1 Session', desc: '60 mins dedicated video coaching' },
    '1_month': { price: monthlyRate, title: '1-Month Mentorship', desc: '4 Video Sessions + Direct Chat & Reviews' },
    '3_months': { price: quarterlyRate, title: '3-Month Transformation', desc: '12 Sessions + Full Project & Mock Interviews' },
  };

  const currentPrice = planPricing[selectedPlan]?.price || hourlyRate;

  // Razorpay Checkout Handler
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a session topic / goal.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // CASE A: User already has an active subscription -> Book directly without paying again!
      if (activeSubscription) {
        const verifyRes = await sessionsAPI.verifyPayment(mentorId, {
          is_already_subscribed: true,
          topic: topic.trim(),
          description: description.trim(),
          proposed_date: proposedDate || new Date(Date.now() + 86400000).toISOString(),
          duration_minutes: duration,
          plan_type: activeSubscription.plan_type
        });

        alert(`✅ Session request sent to mentor under your ${activeSubscription.plan_type.replace('_', ' ')} plan! The mentor will accept or confirm your schedule.`);
        if (onSuccess) onSuccess(verifyRes.session);
        onClose();
        return;
      }

      // CASE B: Create Razorpay Order
      const orderData = await sessionsAPI.createRazorpayOrder(mentorId, selectedPlan);

      if (orderData.is_already_subscribed) {
        alert(orderData.message);
        if (onSuccess) onSuccess();
        onClose();
        return;
      }

      // Store order and trigger Razorpay Checkout Modal
      setCurrentOrderData(orderData);
      setRazorpayModalOpen(true);
      setLoading(false);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize payment checkout.');
      setLoading(false);
    }
  };


  // Called when payment succeeds inside Razorpay modal
  const handlePaymentSuccess = async (response) => {
    try {
      setLoading(true);
      setRazorpayModalOpen(false);

      const verifyRes = await sessionsAPI.verifyPayment(mentorId, {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        plan_type: selectedPlan,
        topic: topic.trim(),
        description: description.trim(),
        proposed_date: proposedDate || new Date(Date.now() + 86400000).toISOString(),
        duration_minutes: duration
      });

      alert(`🎉 Payment Successful! Mentorship plan activated and 1-on-1 session confirmed.`);
      if (onSuccess) onSuccess(verifyRes.session);
      onClose();
    } catch (verErr) {
      setError(verErr.response?.data?.error || 'Payment signature verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="modal-content" 
          style={{ maxWidth: '640px', padding: '24px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.2)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--neon-lime)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #000',
                fontWeight: '900',
                color: '#0f172a'
              }}>
                ₹
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#f8fafc' }}>
                  Book Mentorship with {mentor.first_name} {mentor.last_name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Razorpay Test Mode • Secure Indian Gateway (UPI / Cards / Netbanking)
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="btn-brutal btn-white"
              style={{ padding: '6px 10px', borderRadius: '50%' }}
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              color: '#fca5a5',
              fontWeight: '700',
              fontSize: '0.85rem',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {/* Active Subscription Banner (No Double Pay) */}
          {activeSubscription ? (
            <div style={{
              padding: '14px 18px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid #22c55e',
              borderRadius: '14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle2 size={24} color="#22c55e" />
              <div>
                <h4 style={{ fontWeight: '800', fontSize: '0.95rem', color: '#f8fafc' }}>
                  Active {activeSubscription.plan_type === '3_months' ? '3-Month' : '1-Month'} Mentorship Subscribed!
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  You have already subscribed to this mentor. No payment required (₹0 Checkout)!
                </p>
              </div>
            </div>
          ) : (
            /* Mentorship Plan Selection Cards */
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', color: '#f8fafc', marginBottom: '10px' }}>
                Select Mentorship Plan:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                {/* Single Session Plan */}
                <div 
                  onClick={() => setSelectedPlan('single')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: selectedPlan === 'single' ? '2px solid var(--neon-lime)' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: selectedPlan === 'single' ? 'rgba(190, 242, 100, 0.15)' : '#1e293b',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#f8fafc' }}>Single Session</span>
                    <Zap size={14} color="var(--neon-lime)" />
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--neon-lime)' }}>
                    ₹{hourlyRate}
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                    1 Video Call (60 min)
                  </p>
                </div>

                {/* 1-Month Plan */}
                <div 
                  onClick={() => setSelectedPlan('1_month')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: selectedPlan === '1_month' ? '2px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: selectedPlan === '1_month' ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="brutal-badge badge-cyan" style={{ position: 'absolute', top: '-8px', right: '6px', fontSize: '0.6rem', padding: '1px 5px' }}>
                    Popular
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#f8fafc' }}>1 Month Plan</span>
                    <BookOpen size={14} color="var(--neon-cyan)" />
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--neon-cyan)' }}>
                    ₹{monthlyRate}
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                    4 Calls + Chat Access
                  </p>
                </div>

                {/* 3-Month Plan */}
                <div 
                  onClick={() => setSelectedPlan('3_months')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: selectedPlan === '3_months' ? '2px solid var(--neon-purple)' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: selectedPlan === '3_months' ? 'rgba(192, 132, 252, 0.15)' : '#1e293b',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="brutal-badge badge-purple" style={{ position: 'absolute', top: '-8px', right: '6px', fontSize: '0.6rem', padding: '1px 5px' }}>
                    Best Value
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#f8fafc' }}>3 Months Plan</span>
                    <Award size={14} color="var(--neon-purple)" />
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--neon-purple)' }}>
                    ₹{quarterlyRate}
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                    12 Calls + Mock Interviews
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Booking Form Details */}
          <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', color: '#f8fafc', marginBottom: '6px' }}>
                Session Topic / Learning Goal *
              </label>
              <input
                type="text"
                className="brutal-input"
                placeholder="e.g., Full Stack Architecture & Mock System Design Interview"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                style={{ background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', color: '#f8fafc', marginBottom: '6px' }}>
                  Preferred Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="brutal-input"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  style={{ background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', color: '#f8fafc', marginBottom: '6px' }}>
                  Call Duration
                </label>
                <select
                  className="brutal-input"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  style={{ background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes (Standard)</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', color: '#f8fafc', marginBottom: '6px' }}>
                Notes for Mentor (Optional)
              </label>
              <textarea
                className="brutal-input"
                rows={2}
                placeholder="Share your background, resume links, or specific questions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              />
            </div>

            {/* Checkout Action Button */}
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Payable:</span>
                <p style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--neon-lime)' }}>
                  {activeSubscription ? '₹0 (Active Plan)' : `₹${currentPrice}`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-brutal btn-white"
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-brutal btn-lime"
                  style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <CreditCard size={18} />
                  {loading ? 'Opening Razorpay...' : activeSubscription ? 'Book Session (₹0)' : `Pay with Razorpay (₹${currentPrice})`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Razorpay Interactive Test Checkout Modal */}
      {razorpayModalOpen && currentOrderData && (
        <RazorpayDemoModal
          isOpen={razorpayModalOpen}
          onClose={() => setRazorpayModalOpen(false)}
          orderData={currentOrderData}
          mentorName={`${mentor.first_name || ''} ${mentor.last_name || mentor.username}`}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default SessionBookingModal;
