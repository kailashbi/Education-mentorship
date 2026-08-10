import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';

export const RejectReasonModal = ({ isOpen, onClose, mentorName, onConfirm, loading }) => {
  const [reason, setReason] = useState('Profile credentials or demo video does not meet current verification standards.');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '480px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--neon-coral)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              color: '#ffffff'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Reject Application</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>For {mentorName}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-brutal btn-white" style={{ padding: '6px 10px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
              Reason for Rejection (Visible to applicant)
            </label>
            <textarea
              className="brutal-textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn-brutal btn-white">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-brutal btn-coral">
              <Send size={16} /> {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
