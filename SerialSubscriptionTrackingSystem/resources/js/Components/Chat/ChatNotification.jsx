import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { IoClose } from 'react-icons/io5';
import { router } from '@inertiajs/react';
import { useRole } from '@/Components/RequireRole';

const POLL_INTERVAL = 5000;
const PRIMARY_COLOR = '#004A98';

const formatContactTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

/**
 * Global Chat Notification component.
 * Renders toast notifications for new chat messages on every page.
 * Should be placed inside each role-specific layout.
 */
export default function ChatNotification() {
  const { userRole } = useRole();
  const [notifications, setNotifications] = useState([]);
  const prevContactsRef = useRef([]);
  const initialLoadDoneRef = useRef(false);
  const pollRef = useRef(null);
  const userRoleRef = useRef(userRole);

  // Keep role ref in sync so polling closures always see the latest value
  useEffect(() => {
    userRoleRef.current = userRole;
  }, [userRole]);

  // Determine chat page URL based on user role
  const getChatUrl = () => {
    const role = userRoleRef.current;
    const roleRoutes = {
      tpu: '/dashboard-tpu-chat',
      gsps: '/dashboard-gsps-chat',
      supplier: '/dashboard-supplier-chat',
      inspection: '/inspection-chat',
      admin: '/dashboard-admin',
    };
    return roleRoutes[role] || null;
  };

  // Check if user is currently on ANY chat page (role-independent)
  const isOnChatPage = () => {
    const path = window.location.pathname;
    return (
      path === '/dashboard-tpu-chat' ||
      path === '/dashboard-gsps-chat' ||
      path === '/dashboard-supplier-chat' ||
      path === '/inspection-chat'
    );
  };

  useEffect(() => {
    // Initial fetch
    fetchAndNotify();

    // Poll for new messages
    pollRef.current = setInterval(() => {
      fetchAndNotify();
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fetchAndNotify = async () => {
    try {
      const response = await window.axios.get('/api/chats');
      const data = response.data;
      const prev = prevContactsRef.current;

      // On first load, show notifications for existing unreads (only if NOT on chat page)
      if (!initialLoadDoneRef.current) {
        initialLoadDoneRef.current = true;
        if (!isOnChatPage()) {
          data.forEach(chat => {
            if (chat.unread > 0) {
              setNotifications(n => [
                ...n,
                {
                  id: `notif_${Date.now()}_${chat.id}`,
                  chatId: chat.id,
                  name: chat.name,
                  role: chat.role,
                  message: chat.lastMessage,
                  timestamp: new Date().toISOString(),
                }
              ]);
            }
          });
        }
        prevContactsRef.current = data;
        return;
      }

      // Subsequent polls: detect NEW unread messages
      data.forEach(chat => {
        const prevChat = prev.find(c => c.id === chat.id);
        const prevUnread = prevChat?.unread || 0;
        if (chat.unread > prevUnread) {
          // Don't show notification if user is on the chat page (ChatComponent handles it)
          if (!isOnChatPage()) {
            setNotifications(n => [
              ...n,
              {
                id: `notif_${Date.now()}_${chat.id}`,
                chatId: chat.id,
                name: chat.name,
                role: chat.role,
                message: chat.lastMessage,
                timestamp: new Date().toISOString(),
              }
            ]);
          }
        }
      });

      prevContactsRef.current = data;
    } catch (e) {
      // silent - user may not be authenticated yet
    }
  };

  // Auto-dismiss notifications after 6 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [notifications]);

  const dismissNotification = (notifId) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const handleReply = (notif) => {
    dismissNotification(notif.id);
    // Navigate to the chat page for the user's role
    const chatUrl = getChatUrl();
    if (chatUrl) {
      router.visit(chatUrl);
    }
  };

  if (notifications.length === 0) return null;

  return ReactDOM.createPortal(
    <>
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 12,
      }}>
        {notifications.slice(0, 3).map((notif) => (
          <div
            key={notif.id}
            style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)',
              padding: '16px 20px',
              width: 360,
              animation: 'chatNotifSlideIn 0.3s ease-out',
              borderLeft: `4px solid ${PRIMARY_COLOR}`,
              position: 'relative'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => dismissNotification(notif.id)}
              style={{
                position: 'absolute',
                top: 10,
                right: 12,
                background: 'transparent',
                border: 'none',
                color: '#adb5bd',
                cursor: 'pointer',
                fontSize: 16,
                padding: 2,
                lineHeight: 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#495057'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#adb5bd'}
            >
              <IoClose />
            </button>

            {/* Header: avatar + name + time */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, paddingRight: 20 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: PRIMARY_COLOR,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14,
                marginRight: 10,
                flexShrink: 0
              }}>
                {notif.name?.charAt(0) || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#212529' }}>
                  {notif.name}
                </span>
                <span style={{ fontSize: 12, color: '#6c757d', marginLeft: 8 }}>
                  {formatContactTime(notif.timestamp)}
                </span>
              </div>
            </div>

            {/* Message preview */}
            <p style={{
              margin: '0 0 12px 46px',
              fontSize: 13,
              color: '#495057',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.4
            }}>
              {notif.message}
            </p>

            {/* Reply button */}
            <div style={{ marginLeft: 46 }}>
              <button
                onClick={() => handleReply(notif)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: PRIMARY_COLOR,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '4px 0',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Reply
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Notification animation styles */}
      <style>{`
        @keyframes chatNotifSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>,
    document.body
  );
}
