// resources/js/Pages/Dashboard_TPU_Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { IoSend, IoAttach, IoHappyOutline } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiSearch } from "react-icons/bi";
import { LuPlus } from "react-icons/lu";

// Chat Component
function TPUChat() {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // TPU-specific contacts (suppliers and internal departments)
  const contacts = [
    {
      id: 1,
      name: 'ABC Books Supplier',
      role: 'Supplier - Main Provider',
      lastMessage: 'Nature magazines shipped on time',
      time: '10:30 AM',
      unread: 2,
      avatarColor: '#004A98'
    },
    {
      id: 2,
      name: 'MedJournal Suppliers Inc.',
      role: 'Medical Journals Supplier',
      lastMessage: 'The Lancet delivery delayed by 2 days',
      time: 'Yesterday',
      unread: 1,
      avatarColor: '#dc3545'
    },
    {
      id: 3,
      name: 'Global Periodicals Co.',
      role: 'International Supplier',
      lastMessage: 'Science magazine Q4 issue received',
      time: '2 days ago',
      unread: 0,
      avatarColor: '#28a745'
    },
    {
      id: 4,
      name: 'GSPS Department',
      role: 'Internal - Serial Processing',
      lastMessage: 'Need inspection reports for November',
      time: 'Dec 15',
      unread: 0,
      avatarColor: '#ffc107'
    },
    {
      id: 5,
      name: 'Procurement Office',
      role: 'Internal - Purchasing',
      lastMessage: '2026 subscription budget approved',
      time: 'Dec 10',
      unread: 3,
      avatarColor: '#17a2b8'
    },
    {
      id: 6,
      name: 'Library Department',
      role: 'Internal - Distribution',
      lastMessage: 'All December deliveries received',
      time: 'Dec 5',
      unread: 0,
      avatarColor: '#6f42c1'
    },
  ];

  // Sample messages for each contact
  const chatMessages = {
    1: [
      { id: 1, sender: 'ABC Books Supplier', content: 'Hello, we have shipped the Nature magazines for December.', time: '09:15 AM', isOwn: false },
      { id: 2, sender: 'TPU Admin', content: 'Received, thank you. Were there any delays?', time: '09:30 AM', isOwn: true },
      { id: 3, sender: 'ABC Books Supplier', content: 'No delays. All items shipped on schedule.', time: '10:30 AM', isOwn: false },
      { id: 4, sender: 'TPU Admin', content: 'Perfect. We\'ll process the payment this week.', time: '11:00 AM', isOwn: true },
    ],
    2: [
      { id: 1, sender: 'MedJournal Suppliers Inc.', content: 'We need to inform you about a delay in The Lancet delivery.', time: 'Yesterday', isOwn: false },
      { id: 2, sender: 'TPU Admin', content: 'What\'s the estimated new delivery date?', time: 'Yesterday', isOwn: true },
      { id: 3, sender: 'MedJournal Suppliers Inc.', content: 'Estimated delivery is December 22 instead of 20.', time: 'Yesterday', isOwn: false },
    ],
    3: [
      { id: 1, sender: 'Global Periodicals Co.', content: 'Science magazine Q4 issue has been delivered.', time: '2 days ago', isOwn: false },
      { id: 2, sender: 'TPU Admin', content: 'Confirmed. The quality inspection passed.', time: '2 days ago', isOwn: true },
    ],
    4: [
      { id: 1, sender: 'GSPS Department', content: 'Please send inspection reports for November deliveries.', time: 'Dec 15', isOwn: false },
      { id: 2, sender: 'TPU Admin', content: 'Reports are being compiled. Will send by EOD.', time: 'Dec 15', isOwn: true },
    ],
    5: [
      { id: 1, sender: 'Procurement Office', content: 'The 2026 subscription budget has been approved.', time: 'Dec 10', isOwn: false },
      { id: 2, sender: 'TPU Admin', content: 'Great! When can we start processing renewals?', time: 'Dec 10', isOwn: true },
      { id: 3, sender: 'Procurement Office', content: 'Starting January 1st. Please prepare renewal requests.', time: 'Dec 10', isOwn: false },
      { id: 4, sender: 'Procurement Office', content: 'Also, need updated supplier performance reports.', time: 'Dec 10', isOwn: false },
    ],
    6: [
      { id: 1, sender: 'Library Department', content: 'All December deliveries have been received and processed.', time: 'Dec 5', isOwn: false },
      { id: 2, sender: 'TPU Admin', content: 'Excellent. Any issues with any deliveries?', time: 'Dec 5', isOwn: true },
    ],
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current messages for active chat
  const currentMessages = chatMessages[filteredContacts[activeChat]?.id] || [];

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // In a real app, this would send to backend
    const newMessage = {
      id: currentMessages.length + 1,
      sender: 'TPU Admin',
      content: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true
    };

    // Update the last message in contacts
    const updatedContacts = [...contacts];
    const contactIndex = contacts.findIndex(c => c.id === filteredContacts[activeChat].id);
    if (contactIndex !== -1) {
      updatedContacts[contactIndex] = {
        ...updatedContacts[contactIndex],
        lastMessage: message.length > 30 ? message.substring(0, 30) + '...' : message,
        time: 'Just now',
        unread: 0
      };
    }

    // Clear message input
    setMessage('');
    
    // Show success message
    alert('Message sent! In a real app, this would be saved to the database.');
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
    const updatedContacts = [...contacts];
    const contact = filteredContacts[index];
    const contactIndex = contacts.findIndex(c => c.id === contact.id);
    if (contactIndex !== -1) {
      updatedContacts[contactIndex].unread = 0;
    }
  };

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: '12px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      height: 'calc(100vh - 200px)',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar - Contacts */}
      <div style={{ 
        width: '320px', 
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column'
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

      {/* Right Side - Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        {filteredContacts[activeChat] && (
          <div style={{ 
            padding: '20px 24px', 
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff'
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
            currentMessages.map((msg) => (
              <div
                key={msg.id}
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
                  position: 'relative'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
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
            ))
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#6c757d'
            }}>
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>No messages yet</p>
              <p style={{ fontSize: '14px' }}>Start a conversation with {filteredContacts[activeChat]?.name || 'this contact'}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div style={{ 
          padding: '20px 24px', 
          borderTop: '1px solid #e9ecef',
          background: '#fff'
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
                  fontFamily: 'inherit'
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
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardTPUChat() {
  return (
    <TPULayout title="TPU Chat">
      <TPUChat />
    </TPULayout>
  );
}