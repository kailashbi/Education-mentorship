import React, { useState } from 'react';
import { X, AlertTriangle, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { authAPI } from '../api/auth';

export const ReportUserModal = ({ isOpen, onClose, reportedUser, chatRoomId = null, onSuccess }) => {
  const [category, setCategory] = useState('chat_abuse');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen || !reportedUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide specific details about the incident.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await authAPI.reportUser({
        reported_user_id: reportedUser.id || reportedUser.user,
        category,
        description,
        chat_room_id: chatRoomId,
      });

      setSuccessMessage('Report submitted successfully! The admin team will inspect the user profile and chat history.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setSuccessMessage('');
        setDescription('');
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '540px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--neon-coral)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              color: '#ffffff'
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Report User / Chat Issue</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Reporting: <b>{reportedUser.full_name || reportedUser.first_name || reportedUser.username}</b>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-brutal btn-white" style={{ padding: '6px 10px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {successMessage ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            background: '#dcfce7',
            border: '2px solid #22c55e',
            borderRadius: '16px',
            color: '#15803d'
          }}>
            <CheckCircle2 size={36} style={{ margin: '0 auto 8px auto' }} />
            <h4 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '4px' }}>Thank You</h4>
            <p style={{ fontSize: '0.9rem' }}>{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{
                padding: '10px 14px',
                background: '#fee2e2',
                border: '2px solid #ef4444',
                borderRadius: '10px',
                color: '#b91c1c',
                fontWeight: '700',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                Reason Category *
              </label>
              <select
                className="brutal-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="chat_abuse">Harassment / Abusive Messages in Chat</option>
                <option value="inappropriate_behavior">Inappropriate / Unprofessional Behavior</option>
                <option value="scam_fraud">Financial Scam / Off-platform Payment Fraud</option>
                <option value="no_show">No-Show / Unresponsive for Scheduled Call</option>
                <option value="policy_violation">Platform Rules & Terms Violation</option>
                <option value="other">Other Issue</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
                Description & Evidence *
              </label>
              <textarea
                className="brutal-textarea"
                rows={4}
                placeholder="Describe what occurred. If related to chat messages or a live session, explain what was said so the admin can review the conversation logs..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div style={{
              background: 'rgba(254, 240, 138, 0.4)',
              border: '2px dashed var(--color-border)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '0.82rem',
              color: '#713f12'
            }}>
              🛡️ <b>Admin Investigation:</b> Submitting this report enables platform administrators to analyze the full chat transcript and session details. Accounts confirmed to violate safety guidelines will be suspended immediately.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} className="btn-brutal btn-white">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-brutal btn-coral">
                <Send size={16} /> {loading ? 'Submitting Report...' : 'Submit Incident Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
