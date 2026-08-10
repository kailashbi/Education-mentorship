import React from 'react';
import { X, Play, Video as VideoIcon, ExternalLink } from 'lucide-react';

export const VideoPlayerModal = ({ isOpen, onClose, videoUrl, videoTitle = 'Mentor Demo Pitch' }) => {
  if (!isOpen) return null;

  const isExternalUrl = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('loom.com') || videoUrl.includes('vimeo.com'));

  // Format YouTube Embed
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('loom.com/share/')) {
      return url.replace('share/', 'embed/');
    }
    return url;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '780px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
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
              <VideoIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{videoTitle}</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Demo Pitch & Teaching Intro Video</p>
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

        {/* Video Player */}
        <div className="video-container" style={{ width: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {videoUrl ? (
            isExternalUrl ? (
              <iframe
                src={getEmbedUrl(videoUrl)}
                title={videoTitle}
                style={{ width: '100%', height: '420px', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video 
                controls 
                autoPlay 
                playsInline
                style={{ width: '100%', maxHeight: '450px', background: '#000' }}
                src={videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            )
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <VideoIcon size={48} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontWeight: '700' }}>No video preview available</p>
              <p style={{ fontSize: '0.85rem' }}>The applicant did not attach an embedded video stream.</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {videoUrl && (
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noreferrer"
              style={{ fontSize: '0.85rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
            >
              <ExternalLink size={14} /> Open in new tab
            </a>
          )}
          <button onClick={onClose} className="btn-brutal btn-dark" style={{ marginLeft: 'auto' }}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
