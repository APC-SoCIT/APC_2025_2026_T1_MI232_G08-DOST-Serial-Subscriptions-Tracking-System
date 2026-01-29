import React, { useState, useEffect, useRef } from "react";
import SupplierLayout from '@/Layouts/SupplierLayout';
import { IoSend, IoAttach, IoHappyOutline } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiSearch } from "react-icons/bi";

// Chat Component following TPU Design Structure
function SupplierChat() {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const messagesEndRef = useRef(null);

  // Dummy data for Supplier contacts (TPU, Inspection, GSPS)
  const initialContacts = [
    {
      id: 1,
      name: 'TPU Department',
      role: 'Technical Processing Unit',
      lastMessage: 'Need delivery status for December shipments',
      time: '10:30 AM',
      unread: 2,
      avatarColor: '#004A98'
    },
    {
      id: 2,
      name: 'Inspection Department',
      role: 'Quality Control',
      lastMessage: 'Quality issues reported in latest batch',
      time: 'Yesterday',
      unread: 1,
      avatarColor: '#dc3545'
    },
    {
      id: 3,
      name: 'GSPS Department',
      role: 'Government Serials Processing',
      lastMessage: 'January delivery schedule confirmed',
      time: '2 days ago',
      unread: 0,
      avatarColor: '#28a745'
    },
    {
      id: 4,
      name: 'Procurement Office',
      role: 'Internal - Purchasing',
      lastMessage: '2026 contract renewal discussion',
      time: 'Dec 15',
      unread: 0,
      avatarColor: '#ffc107'
    },
    {
      id: 5,
      name: 'Library Department',
      role: 'Internal - Distribution',
      lastMessage: 'All serials received and processed',
      time: 'Dec 10',
      unread: 3,
      avatarColor: '#17a2b8'
    },
    {
      id: 6,
      name: 'Accounting Department',
      role: 'Finance',
      lastMessage: 'Invoice #4567 needs correction',
      time: 'Dec 5',
      unread: 0,
      avatarColor: '#6f42c1'
    },
  ];

  // Dummy messages for each department
  const initialChatMessages = {
    1: [
      { id: 1, sender: 'TPU Department', content: 'Hello, can you provide the delivery status for December shipments?', time: '09:15 AM', isOwn: false },
      { id: 2, sender: 'Supplier', content: 'All December shipments are on schedule. Will deliver by Dec 20.', time: '09:30 AM', isOwn: true },
      { id: 3, sender: 'TPU Department', content: 'Good to hear. Please share tracking numbers when available.', time: '10:30 AM', isOwn: false },
    ],
    2: [
      { id: 1, sender: 'Inspection Department', content: 'We found quality issues in the latest batch of Nature magazines.', time: 'Yesterday', isOwn: false },
      { id: 2, sender: 'Supplier', content: 'Please specify the issues. We will check immediately.', time: 'Yesterday', isOwn: true },
      { id: 3, sender: 'Inspection Department', content: 'Pages 45-50 are misprinted in 3 copies.', time: 'Yesterday', isOwn: false },
    ],
    3: [
      { id: 1, sender: 'GSPS Department', content: 'January delivery schedule has been confirmed.', time: '2 days ago', isOwn: false },
      { id: 2, sender: 'Supplier', content: 'Confirmed. Will deliver on January 10th as scheduled.', time: '2 days ago', isOwn: true },
      { id: 3, sender: 'GSPS Department', content: 'Perfect. Please ensure all serials are properly labeled.', time: '2 days ago', isOwn: false },
    ],
    4: [
      { id: 1, sender: 'Procurement Office', content: 'We need to discuss the 2026 contract renewal.', time: 'Dec 15', isOwn: false },
      { id: 2, sender: 'Supplier', content: 'Available for meeting next week. Please share agenda.', time: 'Dec 15', isOwn: true },
    ],
    5: [
      { id: 1, sender: 'Library Department', content: 'All December serials have been received and processed.', time: 'Dec 10', isOwn: false },
      { id: 2, sender: 'Supplier', content: 'Great! Any missing issues to report?', time: 'Dec 10', isOwn: true },
      { id: 3, sender: 'Library Department', content: 'Science December issue missing 2 copies.', time: 'Dec 10', isOwn: false },
      { id: 4, sender: 'Library Department', content: 'Please check and resend if possible.', time: 'Dec 10', isOwn: false },
    ],
    6: [
      { id: 1, sender: 'Accounting Department', content: 'Invoice #4567 has incorrect pricing for Nature subscription.', time: 'Dec 5', isOwn: false },
      { id: 2, sender: 'Supplier', content: 'Will correct and resend invoice today.', time: 'Dec 5', isOwn: true },
    ],
  };

  // Initialize data
  useEffect(() => {
    setContacts(initialContacts);
    setChatMessages(initialChatMessages);
  }, []);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current messages for active chat
  const currentContactId = filteredContacts[activeChat]?.id;
  const currentMessages = chatMessages[currentContactId] || [];

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: currentMessages.length + 1,
      sender: 'Supplier',
      content: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true
    };

    // Update messages for the active chat
    const updatedChatMessages = {
      ...chatMessages,
      [currentContactId]: [...(chatMessages[currentContactId] || []), newMessage]
    };
    setChatMessages(updatedChatMessages);

    // Update the last message in contacts
    const updatedContacts = contacts.map(contact => {
      if (contact.id === currentContactId) {
        return {
          ...contact,
          lastMessage: message.length > 30 ? message.substring(0, 30) + '...' : message,
          time: 'Just now',
          unread: 0
        };
      }
      return contact;
    });
    setContacts(updatedContacts);

    // Clear message input
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    alert('File upload feature would open file dialog. In a real app, this would upload files to the server.');
  };

  const handleSelectChat = (index) => {
    setActiveChat(index);
    // Mark as read when selecting chat
    const updatedContacts = contacts.map(contact => {
      if (contact.id === filteredContacts[index]?.id) {
        return { ...contact, unread: 0 };
      }
      return contact;
    });
    setContacts(updatedContacts);
  };

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: '0', 
      boxShadow: 'none',
      height: '100%',
      display: 'flex',
      overflow: 'hidden',
      flexDirection: 'row'
    }}>
      {/* Left Sidebar - Contacts (TPU Design Structure) */}
      <div style={{ 
        width: '320px', 
        minWidth: '280px',
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        flex: '0 0 320px',
        height: '100%'
      }}>
        {/* Search Bar */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e9ecef' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '10px 16px'
          }}>
            <BiSearch style={{ color: '#6c757d', marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                color: '#495057'
              }}
            />
          </div>
        </div>

        {/* Contacts List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredContacts.map((contact, index) => (
            <div
              key={contact.id}
              onClick={() => handleSelectChat(index)}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f8f9fa',
                cursor: 'pointer',
                background: activeChat === index ? '#e7f1ff' : 'transparent',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                if (activeChat !== index) e.currentTarget.style.background = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                if (activeChat !== index) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: contact.avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '18px',
                marginRight: '12px',
                flexShrink: 0
              }}>
                {contact.name.charAt(0)}
              </div>

              {/* Contact Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '15px', 
                    fontWeight: '600',
                    color: '#212529',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {contact.name}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#6c757d' }}>
                    {contact.time}
                  </span>
                </div>
                <p style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '13px', 
                  color: '#6c757d',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {contact.role}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '13px', 
                    color: '#495057',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1
                  }}>
                    {contact.lastMessage}
                  </p>
                  {contact.unread > 0 && (
                    <span style={{
                      background: '#004A98',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Chat Area (TPU Design Structure) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        {/* Chat Header */}
        {filteredContacts[activeChat] && (
          <div style={{ 
            padding: '20px 24px', 
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: filteredContacts[activeChat].avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '18px',
                marginRight: '12px'
              }}>
                {filteredContacts[activeChat].name.charAt(0)}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#212529', fontWeight: '600' }}>
                  {filteredContacts[activeChat].name}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                  {filteredContacts[activeChat].role}
                </p>
              </div>
            </div>
            <BsThreeDotsVertical style={{ color: '#6c757d', cursor: 'pointer', fontSize: '20px' }} />
          </div>
        )}

        {/* Messages Area */}
        <div style={{ 
          flex: 1, 
          padding: '24px',
          overflowY: 'auto',
          background: '#f8f9fa'
        }}>
          {currentMessages.length > 0 ? (
            <>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <span style={{
                  background: '#e9ecef',
                  color: '#666',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  Today
                </span>
              </div>
              
              {currentMessages.map((msg) => (
                <div
                  key={`${currentContactId}-${msg.id}`}
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.isOwn ? 'flex-end' : 'flex-start'
                  }}
                >
                  {!msg.isOwn && (
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#6c757d', 
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      {msg.sender}
                    </span>
                  )}
                  <div style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: msg.isOwn ? '#004A98' : '#fff',
                    color: msg.isOwn ? '#fff' : '#212529',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    position: 'relative',
                    border: msg.isOwn ? 'none' : '1px solid #e9ecef'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' }}>
                      {msg.content}
                    </p>
                    <span style={{
                      display: 'block',
                      fontSize: '11px',
                      color: msg.isOwn ? 'rgba(255,255,255,0.7)' : '#6c757d',
                      textAlign: 'right',
                      marginTop: '6px'
                    }}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </>
          ) : filteredContacts[activeChat] ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#6c757d'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#f0f4f8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '32px', color: '#004A98' }}>💬</span>
              </div>
              <p style={{ fontSize: '16px', marginBottom: '8px', color: '#666' }}>Start a conversation</p>
              <p style={{ fontSize: '14px', color: '#999' }}>Send your first message to {filteredContacts[activeChat]?.name}</p>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#6c757d'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#f0f4f8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '32px', color: '#004A98' }}>💬</span>
              </div>
              <p style={{ fontSize: '16px', marginBottom: '8px', color: '#666' }}>No conversation selected</p>
              <p style={{ fontSize: '14px', color: '#999' }}>Select a department to start chatting</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {filteredContacts[activeChat] && (
          <div style={{ 
            padding: '20px 24px', 
            borderTop: '1px solid #e9ecef',
            background: '#fff',
            flexShrink: 0
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                onClick={handleFileUpload}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6c757d',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Attach file"
              >
                <IoAttach />
              </button>
              
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    fontSize: '14px',
                    resize: 'none',
                    minHeight: '50px',
                    maxHeight: '120px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                  rows={2}
                />
                <button
                  style={{
                    position: 'absolute',
                    right: '12px',
                    bottom: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#6c757d',
                    cursor: 'pointer',
                    fontSize: '20px'
                  }}
                  title="Emoji"
                >
                  <IoHappyOutline />
                </button>
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                style={{
                  background: message.trim() ? '#004A98' : '#6c757d',
                  border: 'none',
                  color: '#fff',
                  cursor: message.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '20px',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (message.trim()) e.currentTarget.style.background = '#003d7a';
                }}
                onMouseLeave={(e) => {
                  if (message.trim()) e.currentTarget.style.background = '#004A98';
                }}
                title="Send message"
              >
                <IoSend />
              </button>
            </div>
            
            <div style={{ 
              marginTop: '12px', 
              fontSize: '12px', 
              color: '#6c757d',
              textAlign: 'center'
            }}>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard_Supplier_Chat() {
  return (
    <SupplierLayout title="Supplier Chat">
      <SupplierChat />
    </SupplierLayout>
  );
}