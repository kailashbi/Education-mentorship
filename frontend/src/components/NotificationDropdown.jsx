import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  Info, 
  Check, 
  X, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { authAPI } from '../api/auth';

export const NotificationDropdown = ({ 
  isOpen, 
  onClose, 
  notifications, 
  unreadCount, 
  onRefresh 
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await authAPI.markAllNotificationsRead();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to mark all notifications read', err);
    }
  };

  const handleItemClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await authAPI.markNotificationRead(notif.id);
        if (onRefresh) onRefresh();
      }
      if (notif.link) {
        navigate(notif.link);
        onClose();
      }
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'suspension':
        return <ShieldAlert size={18} color="#ef4444" />;
      case 'approval':
        return <CheckCircle2 size={18} color="#22c55e" />;
      case 'session_request':
      case 'session_accepted':
        return <Calendar size={18} color="#38bdf8" />;
      default:
        return <Sparkles size={18} color="#a855f7" />;
    }
  };

  const getBorderColor = (type, isRead) => {
    if (isRead) return 'rgba(255, 255, 255, 0.08)';
    switch (type) {
      case 'warning':
        return '#f59e0b';
      case 'suspension':
        return '#ef4444';
      case 'approval':
        return '#22c55e';
      default:
        return 'var(--neon-purple)';
    }
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: '60px',
        right: '10px',
        width: '380px',
        maxWidth: '92vw',
        background: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        zIndex: 1100,
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="var(--neon-lime)" />
          <h4 style={{ fontWeight: '900', fontSize: '1rem', color: '#f8fafc', margin: 0 }}>
            Notifications
          </h4>
          {unreadCount > 0 && (
            <span className="brutal-badge badge-coral" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
              {unreadCount} new
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--neon-cyan)',
                fontSize: '0.75rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Check size={12} /> Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{
        maxHeight: '380px',
        overflowY: 'auto',
        padding: '8px'
      }}>
        {notifications && notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                marginBottom: '6px',
                background: notif.is_read ? 'rgba(30, 41, 59, 0.5)' : 'rgba(30, 41, 59, 0.95)',
                borderLeft: `4px solid ${getBorderColor(notif.notification_type, notif.is_read)}`,
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.9)'}
              onMouseLeave={(e) => e.currentTarget.style.background = notif.is_read ? 'rgba(30, 41, 59, 0.5)' : 'rgba(30, 41, 59, 0.95)'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                  {getIcon(notif.notification_type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h5 style={{ 
                      fontSize: '0.88rem', 
                      fontWeight: notif.is_read ? '700' : '900', 
                      color: notif.notification_type === 'warning' ? '#fbbf24' : (notif.notification_type === 'suspension' ? '#f87171' : '#f8fafc'),
                      margin: '0 0 2px 0' 
                    }}>
                      {notif.title}
                    </h5>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0 }}>
                      {notif.time_ago}
                    </span>
                  </div>
                  <p style={{ 
                    fontSize: '0.8rem', 
                    color: '#cbd5e1', 
                    margin: 0, 
                    lineHeight: '1.4',
                    wordBreak: 'break-word'
                  }}>
                    {notif.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
            <Sparkles size={28} style={{ margin: '0 auto 8px auto', color: '#94a3b8' }} />
            <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>All caught up! No notifications.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;
