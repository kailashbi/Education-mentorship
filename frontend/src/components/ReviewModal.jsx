import React, { useState } from 'react';
import { X, Star, Send, Award } from 'lucide-react';
import { sessionsAPI } from '../api/sessions';

export const ReviewModal = ({ isOpen, onClose, session, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !session) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await sessionsAPI.submitReview(session.id, {
        rating,
        comment,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '520px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--neon-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <Star size={20} fill="#000" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Review Your Session</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                With {session.mentor_details?.full_name || session.mentor_details?.username}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-brutal btn-white" style={{ padding: '6px 10px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            color: '#b91c1c',
            fontWeight: '700',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Interactive Star Rating */}
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.9rem', marginBottom: '10px' }}>
              How was your experience?
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <Star
                    size={36}
                    color="#0f172a"
                    fill={(hoverRating || rating) >= star ? '#fbbf24' : '#e2e8f0'}
                  />
                </button>
              ))}
            </div>
            <span className="brutal-badge badge-amber" style={{ marginTop: '12px' }}>
              {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional' : rating === 4 ? '⭐⭐⭐⭐ Great' : rating === 3 ? '⭐⭐⭐ Good' : rating === 2 ? '⭐⭐ Fair' : '⭐ Needs Improvement'}
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '800', fontSize: '0.85rem', marginBottom: '6px' }}>
              Your Feedback & Takeaways
            </label>
            <textarea
              className="brutal-textarea"
              rows={4}
              placeholder="What did you learn? How helpful was the mentor? Your feedback helps other mentees..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-brutal btn-white">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-brutal btn-amber">
              <Send size={16} /> {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
