import React, { useState, useEffect, useRef } from 'react';
import { MdNotifications, MdLocalShipping, MdDoneAll, MdPendingActions, MdInventory } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { FaTruck, FaBoxOpen, FaClipboardCheck, FaUserCheck, FaBuilding } from 'react-icons/fa';

const POLL_INTERVAL = 30000; // 30 seconds for notifications
const PRIMARY_COLOR = '#004A98';

const formatTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'incoming':
      return <FaTruck size={18} color="#17a2b8" />;
    case 'received':
      return <FaBoxOpen size={18} color="#28a745" />;
    case 'inspection':
      return <FaClipboardCheck size={18} color="#ffc107" />;
    case 'prepare':
      return <MdInventory size={18} color="#6c757d" />;
    case 'account_approval':
      return <FaUserCheck size={18} color="#9c27b0" />;
    default:
      return <MdLocalShipping size={18} color={PRIMARY_COLOR} />;
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'incoming':
      return { bg: '#e7f6f8', border: '#17a2b8' };
    case 'received':
      return { bg: '#e8f5e9', border: '#28a745' };
    case 'inspection':
      return { bg: '#fff8e1', border: '#ffc107' };
    case 'prepare':
      return { bg: '#f5f5f5', border: '#6c757d' };
    case 'account_approval':
      return { bg: '#f3e5f5', border: '#9c27b0' };
    default:
      return { bg: '#e3f2fd', border: PRIMARY_COLOR };
  }
};

/**
 * Serials Notification Component
 * Displays incoming serial notifications in the header notification bell
 */
export default function SerialsNotification({ isMobile = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const pollRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await window.axios.get('/api/notifications/incoming-serials');
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Initial fetch and polling setup
  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications
    pollRef.current = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await window.axios.post('/api/notifications/mark-all-read');
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Refresh notifications when opening
      fetchNotifications();
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Notification Bell Icon */}
      <button
        onClick={toggleDropdown}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Serial Notifications"
      >
        <MdNotifications size={24} color={isOpen ? PRIMARY_COLOR : '#333'} />
        
        {/* Badge Counter */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            background: '#dc3545',
            color: '#fff',
            borderRadius: '50%',
            minWidth: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 600,
            padding: '0 4px',
            border: '2px solid #fff'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          width: isMobile ? 300 : 360,
          maxHeight: 480,
          overflow: 'hidden',
          zIndex: 10000,
          border: '1px solid #e9ecef'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8f9fa'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MdNotifications size={20} color={PRIMARY_COLOR} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#212529' }}>
                Notifications
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: PRIMARY_COLOR,
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 4
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e7f1ff'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  color: '#6c757d'
                }}
              >
                <IoClose size={20} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{
            maxHeight: 400,
            overflowY: 'auto'
          }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6c757d' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  border: '3px solid #e9ecef',
                  borderTopColor: PRIMARY_COLOR,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: '48px 20px',
                textAlign: 'center',
                color: '#6c757d'
              }}>
                <MdDoneAll size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: 14 }}>No new notifications</p>
                <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.8 }}>
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const colors = getNotificationColor(notification.notification_type);
                return (
                  <div
                    key={notification.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid #f0f0f0',
                      borderLeft: `4px solid ${colors.border}`,
                      background: notification.is_read ? '#fff' : colors.bg,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = notification.is_read ? '#fff' : colors.bg}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${colors.border}`,
                        flexShrink: 0
                      }}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#212529',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {notification.serial_title}
                        </p>
                        <p style={{
                          margin: '4px 0 0',
                          fontSize: 12,
                          color: '#6c757d'
                        }}>
                          {notification.message}
                        </p>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 6
                        }}>
                          <span style={{
                            fontSize: 11,
                            color: notification.notification_type === 'account_approval' ? '#9c27b0' : '#6c757d',
                            background: notification.notification_type === 'account_approval' ? '#f3e5f5' : '#f0f0f0',
                            padding: '2px 8px',
                            borderRadius: 4
                          }}>
                            {notification.notification_type === 'account_approval' 
                              ? (notification.email || 'Pending Approval')
                              : notification.supplier_name}
                          </span>
                          <span style={{ fontSize: 11, color: '#adb5bd' }}>
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #e9ecef',
              background: '#f8f9fa',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: 12, color: '#6c757d' }}>
                Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
