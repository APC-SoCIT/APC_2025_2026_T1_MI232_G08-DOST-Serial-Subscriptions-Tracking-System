import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoSend, IoAttach, IoHappyOutline, IoClose, IoImage, IoDocument, IoTrash, IoPencil, IoCheckmark } from "react-icons/io5";
import { BsThreeDotsVertical, BsEmojiSmile } from "react-icons/bs";
import { BiSearch } from "react-icons/bi";
import { FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage } from "react-icons/fa";
import EmojiPicker from './EmojiPicker';
import ChatSkeleton from './ChatSkeleton';
import MessageStatus from './MessageStatus';

// Helper function to format timestamp in user's local timezone
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Helper function to format contact time (shows relative time or date)
const formatContactTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return formatTime(timestamp);
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

// Helper function for API calls using axios (ensures CSRF token is always fresh)
const apiGet = async (url) => {
  const response = await window.axios.get(url);
  return response.data;
};

const apiPost = async (url, data, isFormData = false) => {
  const config = isFormData ? {
    headers: { 'Content-Type': 'multipart/form-data' }
  } : {};
  
  const response = await window.axios.post(url, data, config);
  return response.data;
};

const POLL_INTERVAL = 5000; // Poll every 5 seconds for new messages (reduced to prevent flickering)

export default function ChatComponent({ 
  primaryColor = '#004A98',
  currentUserRole = 'user'
}) {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]); // Users available to start new chat with
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const currentChatIdRef = useRef(null); // Track current chat ID for async operations

  // Fetch contacts and available users on component mount
  useEffect(() => {
    fetchContacts();
    fetchAvailableUsers();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages when a chat is active
  useEffect(() => {
    // Update the ref whenever currentChatId changes
    currentChatIdRef.current = currentChatId;
    
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    if (currentChatId) {
      // Clear messages first to prevent overlap
      setMessages([]);
      
      // Fetch immediately when chat is selected
      fetchMessagesForChat(currentChatId);
      
      // Set up polling with the current chat ID captured
      pollIntervalRef.current = setInterval(() => {
        // Only fetch if we're still on the same chat
        if (currentChatIdRef.current === currentChatId) {
          fetchMessagesForChat(currentChatId);
        }
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [currentChatId]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/chats');
      setContacts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const data = await apiGet('/api/users/available');
      setAvailableUsers(data);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const fetchMessagesForChat = async (chatId) => {
    try {
      const data = await apiGet(`/api/chats/${chatId}/messages`);
      // Only update if this is still the active chat (use ref for accurate check)
      if (chatId === currentChatIdRef.current) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleChatSelect = (index) => {
    // Prevent re-selecting the same chat
    if (activeChat === index) return;
    
    setActiveChat(index);
    const selectedContact = filteredContacts[index];
    if (selectedContact) {
      const newChatId = selectedContact.id;
      // Clear messages immediately to prevent overlap
      setMessages([]);
      // Update the ref first
      currentChatIdRef.current = newChatId;
      // Then update state (this will trigger the useEffect)
      setCurrentChatId(newChatId);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || !currentChatId || sending) {
      return;
    }

    setSending(true);

    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      content: message,
      attachment: selectedFile ? URL.createObjectURL(selectedFile) : null,
      attachment_name: selectedFile ? selectedFile.name : null,
      sender: 'You',
      isOwn: true,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    setMessages(prev => [...prev, tempMessage]);
    setMessage('');
    setSelectedFile(null);
    setAttachmentPreview(null);

    try {
      const formData = new FormData();
      if (message.trim()) {
        formData.append('content', message);
      }
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      const newMessage = await apiPost(`/api/chats/${currentChatId}/messages`, formData, true);

      setMessages(prev => prev.map(msg => (msg.id === tempId ? { ...newMessage, status: 'sent' } : msg)));
      fetchContacts();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => (msg.id === tempId ? { ...msg, status: 'failed' } : msg)));
      alert('Error sending message: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachmentPreview({
            type: 'image',
            name: file.name,
            url: reader.result,
            size: formatFileSize(file.size)
          });
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview({
          type: 'file',
          name: file.name,
          size: formatFileSize(file.size),
          extension: file.name.split('.').pop().toLowerCase()
        });
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeAttachment = () => {
    setSelectedFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getFileIcon = (extension) => {
    const iconStyle = { fontSize: '24px' };
    switch (extension) {
      case 'pdf':
        return <FaFilePdf style={{ ...iconStyle, color: '#dc3545' }} />;
      case 'doc':
      case 'docx':
        return <FaFileWord style={{ ...iconStyle, color: '#2b579a' }} />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel style={{ ...iconStyle, color: '#217346' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FaFileImage style={{ ...iconStyle, color: '#17a2b8' }} />;
      default:
        return <FaFileAlt style={{ ...iconStyle, color: '#6c757d' }} />;
    }
  };

  const startNewChat = async (contact) => {
    try {
      console.log('Starting new chat with:', contact);
      
      const data = await apiPost('/api/chats/get-or-create', {
        other_user_id: contact.id,
        other_user_name: contact.name,
        other_user_role: contact.role,
      });

      console.log('Chat created/found:', data);
      setCurrentChatId(data.chat_id);
      setMessages(data.messages || []);
      setShowNewChatModal(false);
      
      // Refresh contacts and select the new chat
      await fetchContacts();
      
      // Find and select the chat in the list
      setActiveChat(0); // Select first chat (most recent)
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error creating chat: ' + (error.response?.data?.error || error.message));
    }
  };

  // Delete message handler
  const handleDeleteMessage = async (messageId) => {
    try {
      await window.axios.delete(`/api/messages/${messageId}`);
      
      // Remove message from state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setShowDeleteConfirm(null);
      fetchContacts(); // Refresh contacts to update last message
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message: ' + (error.response?.data?.error || error.message));
    }
  };

  // Edit message handler
  const handleEditMessage = async (messageId) => {
    if (!editingContent.trim()) return;
    
    try {
      console.log('Editing message:', messageId, 'with content:', editingContent);
      
      const response = await window.axios.put(`/api/messages/${messageId}`, {
        content: editingContent
      });
      
      console.log('Edit response:', response.data);
      
      // Update message in state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, content: response.data.content, isEdited: true } : msg
      ));
      
      setEditingMessageId(null);
      setEditingContent('');
      fetchContacts(); // Refresh contacts to update last message
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Error editing message: ' + (error.response?.data?.error || error.message));
    }
  };

  // Start editing a message
  const startEditingMessage = (msg) => {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if we need a date separator
  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();
    return currentDate !== prevDate;
  };

  // Format date for separator
  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long' });
  };

  // Check if should show sender info (first message in a group from same sender)
  const shouldShowSenderInfo = (index) => {
    if (index === 0) return true;
    const prevMsg = messages[index - 1];
    const currentMsg = messages[index];
    return prevMsg.sender !== currentMsg.sender || shouldShowDateSeparator(currentMsg, prevMsg);
  };

  const renderMessage = (msg, index) => {
    const isImage = msg.attachment && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.attachment);
    const fileExtension = msg.attachment ? msg.attachment.split('.').pop().toLowerCase() : null;
    const isHovered = hoveredMessageId === msg.id;
    const isEditing = editingMessageId === msg.id;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);
    const showSenderInfo = shouldShowSenderInfo(index);
    const isOneOnOne = true; // Set to true for one-on-one chat

    return (
      <div key={msg.id}>
        {/* Date Separator */}
        {showDateSeparator && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16,
            margin: '24px 0 20px 0',
            color: '#999'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#999' }}>{formatDateSeparator(msg.timestamp)}</span>
            <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
          </div>
        )}

        {/* Message Row */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 12,
            alignItems: 'flex-start',
            justifyContent: msg.isOwn ? 'flex-end' : 'flex-start'
          }}
          onMouseEnter={() => setHoveredMessageId(msg.id)}
          onMouseLeave={() => setHoveredMessageId(null)}
        >
          {/* Avatar - only for received messages in one-on-one chat, and only first message from sender */}
          {!msg.isOwn && showSenderInfo && (
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 16,
              flexShrink: 0,
              marginTop: 4
            }}>
              {msg.sender?.charAt(0) || '?'}
            </div>
          )}

          {/* Spacer for consecutive messages from same sender */}
          {!msg.isOwn && !showSenderInfo && (
            <div style={{ width: 40, flexShrink: 0 }} />
          )}

          {/* Message Content Container */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.isOwn ? 'flex-end' : 'flex-start',
            maxWidth: '70%'
          }}>
            {/* Message Bubble */}
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    fontSize: 14,
                    resize: 'none',
                    minHeight: 70,
                    color: '#222',
                    fontFamily: 'inherit'
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={cancelEditing}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#666'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditMessage(msg.id)}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: 6,
                      background: '#28a745',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <IoCheckmark size={16} /> Save
                  </button>
                </div>
              </div>
            ) : (
              msg.content && (
                <div style={{
                  background: msg.isOwn ? primaryColor : '#f0f0f0',
                  color: msg.isOwn ? '#fff' : '#222',
                  padding: '10px 14px',
                  borderRadius: 10,
                  position: 'relative',
                  display: 'inline-block'
                }}
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                >
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </p>
                  {msg.isEdited && (
                    <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 6 }}>(edited)</span>
                  )}

                  {/* Hover Actions for own messages */}
                  {isHovered && msg.isOwn && (
                    <div style={{
                      position: 'absolute',
                      right: '100%',
                      top: 0,
                      display: 'flex',
                      gap: 8,
                      marginRight: 8
                    }}>
                      <button
                        onClick={() => startEditingMessage(msg)}
                        style={{
                          background: '#f0f0f0',
                          border: 'none',
                          borderRadius: '6px',
                          width: 36,
                          height: 36,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#666',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
                        title="Edit"
                      >
                        <IoPencil size={16} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(msg.id)}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          borderRadius: '6px',
                          width: 36,
                          height: 36,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#dc3545',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                        title="Delete"
                      >
                        <IoTrash size={16} />
                      </button>
                    </div>
                  )}

                  {/* Delete Confirmation */}
                  {showDeleteConfirm === msg.id && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-120px',
                      right: 0,
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      padding: '12px 16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 100,
                      minWidth: 200
                    }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: 13, color: '#333' }}>Delete message?</p>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid #ddd',
                            borderRadius: 5,
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: 5,
                            background: '#dc3545',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Attachment */}
            {msg.attachment && (
              <div style={{ marginTop: 8, marginBottom: msg.content ? 0 : 8 }}>
                {isImage ? (
                  <a href={msg.attachment} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={msg.attachment} 
                      alt="attachment" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '240px', 
                        borderRadius: 8,
                        cursor: 'pointer'
                      }} 
                    />
                  </a>
                ) : (
                  <a 
                    href={msg.attachment} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: '#f0f0f0',
                      borderRadius: 6,
                      textDecoration: 'none',
                      color: '#333',
                      width: 'fit-content'
                    }}
                  >
                    {getFileIcon(fileExtension)}
                    <span style={{ fontSize: 14 }}>
                      {msg.attachment.split('/').pop()}
                    </span>
                  </a>
                )}
              </div>
            )}

            {/* Time - below message for own messages */}
            {msg.isOwn && (
              <div style={{ 
                fontSize: 12, 
                color: '#999',
                marginTop: 4,
                textAlign: 'right'
              }}>
                {new Date(msg.timestamp).toLocaleString([], { 
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
                {msg.isOwn && <span style={{marginLeft: '8px'}}><MessageStatus status={msg.status} /></span>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <ChatSkeleton />;
  }

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
        {/* Header with Search */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 20, color: primaryColor, fontWeight: 600 }}>Chat</h3>
            {availableUsers.length > 0 && (
              <button
                onClick={() => setShowNewChatModal(true)}
                style={{
                  background: primaryColor,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="New Chat"
              >
                +
              </button>
            )}
          </div>
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
          {filteredContacts.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
              <p style={{ marginBottom: 8 }}>No conversations yet</p>
              {availableUsers.length > 0 && (
                <button
                  onClick={() => setShowNewChatModal(true)}
                  style={{
                    background: primaryColor,
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Start a new chat
                </button>
              )}
            </div>
          ) : (
            filteredContacts.map((contact, index) => (
              <div
                key={contact.id}
                onClick={() => handleChatSelect(index)}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f8f9fa',
                  cursor: 'pointer',
                  background: activeChat === index ? '#e7f1ff' : 'transparent',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeChat !== index) e.currentTarget.style.background = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  if (activeChat !== index) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: primaryColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    marginRight: '12px',
                    flexShrink: 0
                  }}>
                    {contact.name?.charAt(0) || '?'}
                  </div>
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
                        {formatContactTime(contact.timestamp)}
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
                          background: primaryColor,
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
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        {activeChat !== null && filteredContacts[activeChat] ? (
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
                background: primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '18px',
                marginRight: '12px'
              }}>
                {filteredContacts[activeChat].name?.charAt(0) || '?'}
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
        ) : (
          <div style={{ 
            padding: '20px 24px', 
            borderBottom: '1px solid #e9ecef',
            background: '#fff'
          }}>
            <p style={{ margin: 0, color: '#999' }}>Select a conversation to start chatting</p>
          </div>
        )}

        {/* Messages Area */}
        <div style={{ 
          flex: 1, 
          padding: '0',
          overflowY: 'auto',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {activeChat !== null ? (
            <>
              {messages.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: '#6c757d',
                  padding: '24px'
                }}>
                  <p style={{ fontSize: '16px', marginBottom: '8px' }}>No messages yet</p>
                  <p style={{ fontSize: '14px' }}>Start a conversation!</p>
                </div>
              ) : (
                <div style={{ 
                  flex: 1, 
                  padding: '24px 40px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end'
                }}>
                  {messages.map((msg, index) => renderMessage(msg, index))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#6c757d'
            }}>
              <p style={{ fontSize: '16px' }}>Select a conversation to view messages</p>
            </div>
          )}
        </div>

        {/* Attachment Preview */}
        {attachmentPreview && (
          <div style={{
            padding: '12px 40px',
            background: '#f8f9fa',
            borderTop: '1px solid #e9ecef',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            {attachmentPreview.type === 'image' ? (
              <img 
                src={attachmentPreview.url} 
                alt="preview" 
                style={{ width: 50, height: 50, borderRadius: 6, objectFit: 'cover' }} 
              />
            ) : (
              <div style={{
                width: 50,
                height: 50,
                borderRadius: 6,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #dee2e6'
              }}>
                {getFileIcon(attachmentPreview.extension)}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{attachmentPreview.name}</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6c757d' }}>{attachmentPreview.size}</p>
            </div>
            <button
              onClick={removeAttachment}
              style={{
                background: '#e9ecef',
                color: '#6c757d',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#dee2e6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#e9ecef';
              }}
            >
              <IoClose size={14} /> Remove
            </button>
          </div>
        )}

        {/* Message Input */}
        <div style={{ 
          padding: '16px 40px', 
          borderTop: '1px solid #e9ecef',
          background: '#fff',
          opacity: activeChat !== null ? 1 : 0.5,
          pointerEvents: activeChat !== null ? 'auto' : 'none'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* File Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6c757d',
                cursor: 'pointer',
                fontSize: '22px',
                padding: '10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s',
                height: '40px',
                width: '40px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}
              title="Attach file or image"
            >
              <IoAttach />
            </button>
            
            {/* Message Input */}
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                style={{
                  width: '100%',
                  padding: '10px 50px 10px 16px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  fontSize: '14px',
                  resize: 'none',
                  minHeight: '40px',
                  maxHeight: '100px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = primaryColor}
                onBlur={(e) => e.currentTarget.style.borderColor = '#dee2e6'}
                rows={1}
              />
              
              {/* Emoji Button */}
              <div ref={emojiPickerRef} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6c757d',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '6px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffc107'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}
                  title="Add emoji"
                >
                  <IoHappyOutline />
                </button>
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    right: 0,
                    zIndex: 100
                  }}>
                    <EmojiPicker onSelect={handleEmojiSelect} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={(!message.trim() && !selectedFile) || sending}
              style={{
                background: (message.trim() || selectedFile) && !sending ? primaryColor : '#e9ecef',
                border: 'none',
                color: (message.trim() || selectedFile) && !sending ? '#fff' : '#adb5bd',
                cursor: (message.trim() || selectedFile) && !sending ? 'pointer' : 'not-allowed',
                fontSize: '20px',
                padding: '10px',
                height: '40px',
                width: '40px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if ((message.trim() || selectedFile) && !sending) {
                  e.currentTarget.style.background = '#003c7a';
                }
              }}
              onMouseLeave={(e) => {
                if ((message.trim() || selectedFile) && !sending) {
                  e.currentTarget.style.background = primaryColor;
                }
              }}
              title="Send message (Enter)"
            >
              {sending ? (
                <span style={{ fontSize: 14 }}>...</span>
              ) : (
                <IoSend />
              )}
            </button>
          </div>
          
          <div style={{ 
            marginTop: '8px', 
            fontSize: '11px', 
            color: '#adb5bd',
            textAlign: 'left'
          }}>
            Press Enter to send • Attach images & files • Use emojis
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && availableUsers.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            width: '400px',
            maxHeight: '80vh',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#212529' }}>Start New Chat</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                  color: '#6c757d'
                }}
              >
                <IoClose />
              </button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => startNewChat(user)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f8f9fa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: primaryColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    marginRight: 12
                  }}>
                    {user.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#212529' }}>
                      {user.name}
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6c757d', textTransform: 'capitalize' }}>
                      {user.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
