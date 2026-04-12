import React from 'react';

/**
 * LoadingSpinner - A lightweight, fast loading indicator component
 * 
 * @param {string} size - Size variant: 'small', 'medium', 'large'
 * @param {string} color - Primary spinner color
 * @param {string} text - Optional loading text
 * @param {boolean} overlay - Whether to show as full-screen overlay
 * @param {boolean} inline - Whether to show inline (no centering)
 */
const LoadingSpinner = ({ 
  size = 'medium', 
  color = '#004A98', 
  text = '', 
  overlay = false,
  inline = false 
}) => {
  const sizes = {
    small: { width: 20, height: 20, border: 2 },
    medium: { width: 40, height: 40, border: 3 },
    large: { width: 60, height: 60, border: 4 },
  };

  const { width, height, border } = sizes[size] || sizes.medium;

  const spinnerStyle = {
    width,
    height,
    border: `${border}px solid #f3f3f3`,
    borderTop: `${border}px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const containerStyle = inline ? {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: text ? '20px' : '10px',
  };

  const overlayStyle = overlay ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  } : {};

  const content = (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      {text && (
        <span style={{ 
          color: '#666', 
          fontSize: size === 'small' ? '12px' : '14px',
          fontWeight: 500 
        }}>
          {text}
        </span>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (overlay) {
    return <div style={overlayStyle}>{content}</div>;
  }

  return content;
};

/**
 * LoadingOverlay - Full-screen overlay for major operations
 */
export const LoadingOverlay = ({ text = 'Loading...' }) => (
  <LoadingSpinner size="large" text={text} overlay />
);

/**
 * ButtonLoader - Small inline loader for buttons
 */
export const ButtonLoader = ({ color = '#ffffff' }) => (
  <LoadingSpinner size="small" color={color} inline />
);

/**
 * TableLoader - Skeleton loader for tables
 */
export const TableLoader = ({ rows = 5 }) => (
  <div style={{ padding: '16px' }}>
    {[...Array(rows)].map((_, i) => (
      <div 
        key={i}
        style={{
          height: '48px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          marginBottom: '8px',
        }}
      />
    ))}
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
);

/**
 * CardLoader - Skeleton loader for cards/stats
 */
export const CardLoader = () => (
  <div style={{
    height: '100px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px',
  }}>
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
);

export default LoadingSpinner;
