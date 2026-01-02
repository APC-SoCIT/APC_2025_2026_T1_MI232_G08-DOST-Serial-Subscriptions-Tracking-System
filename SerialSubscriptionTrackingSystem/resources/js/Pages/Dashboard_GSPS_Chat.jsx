// resources/js/Pages/Dashboard_GSPS_Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import GSPSLayout from '@/Layouts/GSPSLayout';
import { 
  IoSend, IoAttach, IoHappyOutline, IoSearch 
} from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { LuPlus } from "react-icons/lu";

function DashboardGSPS_Chat() {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Mock data for contacts (would come from API in real app)
  const mockContacts = [
    {
      id: 1,
      name: 'ABC Books Supplier',
      role: 'Supplier',
      lastMessage: 'Nature Vol 3 Issue 12 will be delivered tomorrow',
      time: '10:30 AM',
      unread: 2,
      color: '#004A98'
    },
    {
      id: 2,
      name: 'MedJournal Suppliers Inc.',
      role: 'Medical Supplier',
      lastMessage: 'The Lancet delivery confirmed',
      time: 'Yesterday',
      unread: 0,
      color: '#28a745'
    },
    {
      id: 3,
      name: 'Global Periodicals Co.',
      role: 'International Supplier',
      lastMessage: 'Science magazine shipped',
      time: 'Dec 15',
      unread: 1,
      color: '#17a2b8'
    },
    {
      id: 4,
      name: 'Business Publications Inc.',
      role: 'Business Supplier',
      lastMessage: 'Harvard Business Review update',
      time: 'Dec 14',
      unread: 0,
      color: '#6f42c1'
    },
    {
      id: 5,
      name: 'Creative Publications',
      role: 'Arts Supplier',
      lastMessage: 'Art Review delayed by 2 days',
      time: 'Dec 12',
      unread: 0,
      color: '#fd7e14'
    }
  ];

  // Mock data for messages (would come from API in real app)
  const mockMessages = [
    {
      id: 1,
      sender: 'ABC Books Supplier',
      content: 'Hello! Nature Vol 3 Issue 12 will be delivered tomorrow morning.',
      time: '10:30 AM',
      isOwn: false
    },
    {
      id: 2,
      sender: 'You',
      content: 'Thank you for the update. Please ensure it arrives before 12 PM.',
      time: '10:32 AM',
      isOwn: true
    },
    {
      id: 3,
      sender: 'ABC Books Supplier',
      content: 'Understood. The delivery is scheduled for 11 AM.',
      time: '10:33 AM',
      isOwn: false
    },
    {
      id: 4,
      sender: 'You',
      content: 'Perfect. Also, please send the invoice along with the delivery.',
      time: '10:35 AM',
      isOwn: true
    },
    {
      id: 5,
      sender: 'ABC Books Supplier',
      content: 'Yes, the invoice will be included with the package.',
      time: '10:36 AM',
      isOwn: false
    }
  ];

  // Initialize data
  useEffect(() => {
    setContacts(mockContacts);
    setMessages(mockMessages);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChatSelect = (index) => {
    setActiveChat(index);
    // In real app, fetch messages for selected contact
    setMessages(mockMessages); // Using same messages for demo
  };

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'You',
      content: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true
    };

    setMessages([...messages, newMessage]);
    setMessage('');

    // Update contact's last message
    const updatedContacts = [...contacts];
    updatedContacts[activeChat].lastMessage = message;
    updatedContacts[activeChat].time = 'Just now';
    setContacts(updatedContacts);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentContact = contacts[activeChat];

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: 12, 
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      height: 'calc(100vh - 200px)'
    }}>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Contacts Sidebar */}
        <div style={{
          width: 320,
          borderRight: '1px solid #eee',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8f9fa'
        }}>
          {/* Contacts Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #eee',
            background: '#fff'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#004A98', fontWeight: 600 }}>
              Messages
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f0f4f8',
              borderRadius: 8,
              padding: '8px 12px'
            }}>
              <IoSearch size={18} color="#666" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  marginLeft: 8,
                  outline: 'none',
                  flex: 1,
                  fontSize: 14,
                  color: '#333'
                }}
              />
            </div>
          </div>

          {/* Contacts List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredContacts.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                <p>No contacts found</p>
              </div>
            ) : (
              filteredContacts.map((contact, index) => (
                <div
                  key={contact.id}
                  onClick={() => handleChatSelect(index)}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    background: activeChat === index ? '#e3f2fd' : 'transparent',
                    borderBottom: '1px solid #eee',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => activeChat !== index && (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => activeChat !== index && (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: contact.color || '#004A98',
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
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: '#333',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {contact.name}
                      </h4>
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
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                      {contact.role}
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
          {currentContact ? (
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: currentContact.color || '#004A98',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  marginRight: 12
                }}>
                  {currentContact.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#333' }}>
                    {currentContact.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    {currentContact.role} • Online
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <BsThreeDotsVertical size={20} color="#666" style={{ cursor: 'pointer' }} />
              </div>
            </div>
          ) : (
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #eee',
              background: '#fff'
            }}>
              <p style={{ margin: 0, color: '#999' }}>Select a conversation</p>
            </div>
          )}

          {/* Messages Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            background: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {currentContact ? (
              <>
                <div style={{ marginBottom: 20, textAlign: 'center' }}>
                  <span style={{
                    background: '#e9ecef',
                    color: '#666',
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 12
                  }}>
                    Today
                  </span>
                </div>
                
                {messages.map((msg) => (
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
                      color: msg.isOwn ? '#fff' : '#333',
                      padding: '12px 16px',
                      borderRadius: 18,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      border: msg.isOwn ? 'none' : '1px solid #eee'
                    }}>
                      {!msg.isOwn && (
                        <p style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: 12, 
                          fontWeight: 600, 
                          color: '#004A98' 
                        }}>
                          {msg.sender}
                        </p>
                      )}
                      <p style={{ 
                        margin: 0, 
                        fontSize: 14, 
                        lineHeight: 1.5,
                        wordBreak: 'break-word'
                      }}>
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
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                color: '#999',
                flexDirection: 'column'
              }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: '#f0f4f8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <span style={{ fontSize: 32, color: '#004A98' }}>💬</span>
                </div>
                <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>No conversation selected</h4>
                <p style={{ margin: 0, color: '#999' }}>Select a supplier to start chatting</p>
              </div>
            )}
          </div>

          {/* Message Input */}
          {currentContact && (
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #eee',
              background: '#fff'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f0f4f8',
                borderRadius: 24,
                padding: '8px 16px'
              }}>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <LuPlus size={20} color="#666" />
                </button>
                
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    marginLeft: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IoAttach size={20} color="#666" />
                </button>
                
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 14,
                    padding: '8px 12px',
                    resize: 'none',
                    maxHeight: 100,
                    fontFamily: 'inherit',
                    lineHeight: 1.5
                  }}
                  rows={1}
                />
                
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    marginRight: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IoHappyOutline size={20} color="#666" />
                </button>
                
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  style={{
                    background: message.trim() ? '#004A98' : '#ccc',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: message.trim() ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => message.trim() && (e.currentTarget.style.background = '#003C7A')}
                  onMouseLeave={(e) => message.trim() && (e.currentTarget.style.background = '#004A98')}
                >
                  <IoSend size={18} color="#fff" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardGSPS_ChatWrapper() {
  return (
    <GSPSLayout title="GSPS Chat">
      <DashboardGSPS_Chat />
    </GSPSLayout>
  );
}