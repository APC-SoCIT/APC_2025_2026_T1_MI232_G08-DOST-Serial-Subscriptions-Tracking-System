import React, { useState, useEffect, useRef } from "react";
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { FaTruckFast } from "react-icons/fa6";
import { TbTruckOff } from "react-icons/tb";
import { FaTruckLoading } from "react-icons/fa";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { IoSend, IoAttach, IoHappyOutline } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiSearch } from "react-icons/bi";
import { BsFillChatTextFill } from "react-icons/bs";
import { LuPlus } from "react-icons/lu";
import { Link, router } from "@inertiajs/react";



const sidebarItems = [
  { icon: <GoHomeFill />, label: 'Dashboard', route: '/dashboard-supplier' },
  { icon: <BsFillChatTextFill />, label: 'Chat', route: '/dashboard-supplier-chat' },
  { icon: <HiUsers />, label: 'List of Serials', route: '/dashboard-supplier-listofserial' },
  { icon: <FaTruckFast />, label: 'Late', route: '/dashboard-supplier-late' },
  { icon: <TbTruckOff />, label: 'Undelivered', route: '/dashboard-supplier-undelivered' },
  { icon: <FaTruckLoading />, label: 'Delivered', route: '/dashboard-supplier-delivered' },
];

function Sidebar({ active, setActive }) {
  return (
    <div
      style={{
        background: "#004A98",
        color: "#fff",
        width: 160,
        minHeight: "100vh",
        padding: "20px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <img
          src="/images/dost-logo1.png"
          alt="LOGO"
          style={{
            width: 55,
            height: 55,
            borderRadius: 12,
          }}
        />
        <div
          style={{
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: 1,
            fontFamily: "Montserrat Bold",
            textAlign: "left",
          }}
        >
          DOST <br />
          STII
        </div>
      </div>
      <nav style={{ width: "100%" }}>
        <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
          {sidebarItems.map((item, idx) => (
            <li key={item.label}>
              <Link
                href={item.route}
                style={{
                  margin: "10px 0",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "#fff",
                  background: active === idx ? "#0062f4ff" : "transparent",
                  borderRadius: 6,
                  padding: "8px 12px",
                  width: "140px",
                  marginLeft: "10px",
                  transition: "background 0.2s, transform 0.1s",
                  boxShadow: active === idx ? "0 3px 6px rgba(0,0,0,0.15)" : "none",
                  textDecoration: "none",
                }}
                onClick={() => setActive(idx)}
              >
                <span style={{ marginRight: 15 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function TopBar() {
  const [activeIcon, setActiveIcon] = useState(null);

  const handleIconClick = (icon) => {
    setActiveIcon(activeIcon === icon ? null : icon);
  };

  const popupStyle = {
    position: 'absolute',
    top: 60,
    right: 20,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
    padding: 16,
    width: 260,
    zIndex: 10000,
  };

  return (
    <div
      style={{
        fontSize: 22,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 32px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 9
      }}
    >
      <h2 style={{ color: '#0B4DA1', fontWeight: 600, fontSize: 20 }}>Serial Subscription Tracking System</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
        <span onClick={() => handleIconClick('notifications')} style={{ cursor: 'pointer' }}>
          <MdOutlineNotificationsActive />
        </span>
        {activeIcon === 'notifications' && (
          <div style={popupStyle}>
            <h4 style={{ margin: '0 0 8px' }}>Notifications</h4>
            <p style={{ fontSize: 14, color: '#555' }}>You're all caught up!</p>
          </div>
        )}

        <span onClick={() => handleIconClick('account')} style={{ cursor: 'pointer', position: 'relative' }}>
          <VscAccount size={22} />
          {activeIcon === 'account' && (
            <div
              style={{
                position: 'absolute',
                top: '35px',
                right: 0,
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                width: 200,
                padding: '16px 18px',
                zIndex: 100,
                transition: 'all 0.2s ease',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#0B4DA1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    marginRight: 10,
                  }}
                >
                  S
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, color: '#222' }}>Supplier</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#777' }}>Supplier Account</p>
                </div>
              </div>

              <button
                style={{
                  width: '100%',
                  background: '#0B4DA1',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 0',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'background 0.2s ease',
                }}
                onMouseOver={(e) => (e.target.style.background = '#093a7a')}
                onMouseOut={(e) => (e.target.style.background = '#0B4DA1')}
              >
                Logout
              </button>
            </div>
          )}
        </span>
      </div>
    </div>
  );
}

function ChatPage() {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages when a chat is active
  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
      // Poll for new messages every 2 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(currentChatId);
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [currentChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chats');
      const data = await response.json();
      setContacts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleChatSelect = (index) => {
    setActiveChat(index);
    const selectedContact = contacts[index];
    if (selectedContact) {
      setCurrentChatId(selectedContact.id);
      fetchMessages(selectedContact.id);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !currentChatId) return;

    try {
      const response = await fetch(`/api/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content,
        },
        body: JSON.stringify({ content: message }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages([...messages, newMessage]);
        setMessage('');
        // Refresh contacts to update last message
        fetchContacts();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#fff' }}>
      {/* Contacts List */}
      <div style={{
        width: 320,
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8f9fa'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          background: '#fff'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 20, color: '#0B4DA1' }}>Chat</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f0f0f0',
            borderRadius: 8,
            fontWeight: 'bold',
            padding: '8px 12px'
          }}>
            <BiSearch size={18} color="#666" />
            <input 
              placeholder="Search conversations..."
              style={{
                border: 'none',
                background: 'transparent',
                marginLeft: 8,
                outline: 'none',
                flex: 1,
                fontSize: 14
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {contacts.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              <p>No chats yet. Start a conversation!</p>
            </div>
          ) : (
            contacts.map((contact, idx) => (
              <div
                key={idx}
                onClick={() => handleChatSelect(idx)}
                style={{
                  padding: '16px 20px',
                  cursor: 'pointer',
                  background: activeChat === idx ? '#e3f2fd' : 'transparent',
                  borderBottom: '1px solid #e0e0e0',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => activeChat !== idx && (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={(e) => activeChat !== idx && (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#004A98',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    marginRight: 12,
                    fontSize: 16
                  }}>
                    {contact.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#222' }}>{contact.name}</h4>
                      <span style={{ fontSize: 12, color: '#666' }}>{contact.time}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <p style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {contact.lastMessage}
                      </p>
                      {contact.unread > 0 && (
                        <span style={{
                          background: '#004A98',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 'bold',
                          marginLeft: 8
                        }}>
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff'
        }}>
          {activeChat !== null && contacts[activeChat] ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#004A98',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  marginRight: 12
                }}>
                  {contacts[activeChat].name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#222' }}>
                    {contacts[activeChat].name}
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    {contacts[activeChat].role}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <BsThreeDotsVertical size={20} color="#666" style={{ cursor: 'pointer' }} />
              </div>
            </>
          ) : (
            <p style={{ color: '#999' }}>Select a chat to start messaging</p>
          )}
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: '#f8f9fa'
        }}>
          {activeChat !== null ? (
            <>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.isOwn ? 'flex-end' : 'flex-start',
                      marginBottom: 16
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      background: msg.isOwn ? '#004A98' : '#fff',
                      color: msg.isOwn ? '#fff' : '#222',
                      padding: '12px 16px',
                      borderRadius: 12,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      {!msg.isOwn && (
                        <p style={{ margin: '0 0 4px 0', fontSize: 12, fontWeight: 600, color: '#004A98' }}>
                          {msg.sender}
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                        {msg.content}
                      </p>
                      <p style={{
                        margin: '6px 0 0 0',
                        fontSize: 11,
                        opacity: 0.7,
                        textAlign: 'right'
                      }}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
              <p>Select a chat to view messages</p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e0e0e0',
          background: '#fff'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f0f0f0',
            borderRadius: 24,
            padding: '8px 16px',
            opacity: activeChat !== null ? 1 : 0.5,
            pointerEvents: activeChat !== null ? 'auto' : 'none'
          }}>
            <LuPlus size={20} color="#666" style={{ cursor: 'pointer', marginRight: 12 }} />
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={activeChat !== null ? "Type a message..." : "Select a chat first..."}
              disabled={activeChat === null}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 14,
                padding: '8px 0'
              }}
            />
            <IoHappyOutline size={20} color="#666" style={{ cursor: 'pointer', marginLeft: 12, marginRight: 12 }} />
            <div
              onClick={handleSend}
              style={{
                background: activeChat !== null ? '#004A98' : '#ccc',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeChat !== null ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => activeChat !== null && (e.currentTarget.style.background = '#003d7a')}
              onMouseLeave={(e) => activeChat !== null && (e.currentTarget.style.background = '#004A98')}
            >
              <IoSend size={18} color="#fff" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard_Supplier_Chat() {
  const [activeSidebar, setActiveSidebar] = useState(1);

  return (
    <div style={{ display: "flex", background: "#F5F6FA", minHeight: "100vh" }}>
      <Sidebar active={activeSidebar} setActive={setActiveSidebar} />
      <div style={{ flex: 1 }}>
        <TopBar />
        {activeSidebar === 1 && <ChatPage />}
      </div>
    </div>
  );
}

export default Dashboard_Supplier_Chat;