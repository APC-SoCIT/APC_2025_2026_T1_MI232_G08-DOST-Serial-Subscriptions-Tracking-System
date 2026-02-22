import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoSend, IoAttach, IoHappyOutline, IoClose, IoImage, IoDocument, IoTrash, IoPencil, IoCheckmark, IoDownload } from "react-icons/io5";
import { BsThreeDotsVertical, BsEmojiSmile } from "react-icons/bs";
import { BiSearch } from "react-icons/bi";
import { FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFolder } from "react-icons/fa";
import { MdChat, MdInsertDriveFile } from "react-icons/md";
import EmojiPicker from './EmojiPicker';
import ChatSkeleton from './ChatSkeleton';
import MessageStatus from './MessageStatus';
import Swal from 'sweetalert2';
import 'animate.css';

// File validation constants
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const MAX_FILE_SIZE_MB = 10;

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

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

const POLL_INTERVAL = 5000;

export default function ChatComponent({ 
  primaryColor = '#004A98',
  currentUserRole = 'user'
}) {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
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
  const [newChatSearchTerm, setNewChatSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'files'
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const contactsPollRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const currentChatIdRef = useRef(null);

  useEffect(() => {
    fetchContacts();
    fetchAvailableUsers();

    // Poll contacts to keep sidebar up to date
    contactsPollRef.current = setInterval(async () => {
      try {
        const data = await apiGet('/api/chats');
        setContacts(data);
      } catch (e) {
        // silent
      }
    }, POLL_INTERVAL);

    return () => {
      if (contactsPollRef.current) {
        clearInterval(contactsPollRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    currentChatIdRef.current = currentChatId;
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    if (currentChatId) {
      setMessages([]);
      fetchMessagesForChat(currentChatId);
      
      pollIntervalRef.current = setInterval(() => {
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
      if (chatId === currentChatIdRef.current) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Fetch shared files for a chat
  const fetchSharedFiles = async (chatId) => {
    try {
      setLoadingFiles(true);
      const data = await apiGet(`/api/chats/${chatId}/files`);
      setSharedFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching shared files:', error);
      setSharedFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleChatSelect = async (index) => {
    if (activeChat === index) return;
    
    setActiveChat(index);
    setActiveTab('chat'); // Reset to chat tab when switching conversations
    const selectedContact = filteredContacts[index];
    if (selectedContact) {
      const newChatId = selectedContact.id;
      setMessages([]);
      setSharedFiles([]);
      currentChatIdRef.current = newChatId;
      setCurrentChatId(newChatId);

      // Fetch shared files for this chat
      fetchSharedFiles(newChatId);

      // Mark messages as read
      if (selectedContact.unread > 0) {
        try {
          await apiPost(`/api/chats/${newChatId}/read`, {});
          // Update the contact's unread count locally
          setContacts(prev => prev.map(c => 
            c.id === newChatId ? { ...c, unread: 0 } : c
          ));
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
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
      Swal.fire({ title: 'Error sending message: ' + (error.response?.data?.error || error.message), icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
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

  // Validate file type and size before accepting
  const validateFile = (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isValidType = ALLOWED_FILE_TYPES.includes(file.type) || ALLOWED_FILE_EXTENSIONS.includes(fileExtension);
    const isValidSize = file.size <= MAX_FILE_SIZE;

    if (!isValidType) {
      Swal.fire({
        title: 'Invalid File Type',
        html: `<p>Only <strong>PDF, PNG, JPG, JPEG</strong> files are allowed.</p><p>You selected: <code>${fileExtension.toUpperCase()}</code></p>`,
        icon: 'error',
        confirmButtonColor: '#0062f4',
        showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
        hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
      });
      return false;
    }

    if (!isValidSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      Swal.fire({
        title: 'File Too Large',
        html: `<p>Maximum file size is <strong>${MAX_FILE_SIZE_MB}MB</strong>.</p><p>Your file: <strong>${fileSizeMB}MB</strong></p>`,
        icon: 'error',
        confirmButtonColor: '#0062f4',
        showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
        hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file before accepting
      if (!validateFile(file)) {
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setSelectedFile(file);
      
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
      const data = await apiPost('/api/chats/get-or-create', {
        other_user_id: contact.id,
        other_user_name: contact.name,
        other_user_role: contact.role,
      });

      setCurrentChatId(data.chat_id);
      setMessages(data.messages || []);
      setShowNewChatModal(false);
      
      await fetchContacts();
      setActiveChat(0);
    } catch (error) {
      console.error('Error creating chat:', error);
      Swal.fire({ title: 'Error creating chat: ' + (error.response?.data?.error || error.message), icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await window.axios.delete(`/api/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setShowDeleteConfirm(null);
      fetchContacts();
    } catch (error) {
      console.error('Error deleting message:', error);
      Swal.fire({ title: 'Error deleting message: ' + (error.response?.data?.error || error.message), icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editingContent.trim()) return;
    
    try {
      const response = await window.axios.put(`/api/messages/${messageId}`, {
        content: editingContent
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, content: response.data.content, isEdited: true } : msg
      ));
      
      setEditingMessageId(null);
      setEditingContent('');
      fetchContacts();
    } catch (error) {
      console.error('Error editing message:', error);
      Swal.fire({ title: 'Error editing message: ' + (error.response?.data?.error || error.message), icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
    }
  };

  const startEditingMessage = (msg) => {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const filteredContacts = contacts
    .filter(contact =>
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();
    return currentDate !== prevDate;
  };

  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long' });
  };

  const shouldShowSenderInfo = (index) => {
    if (index === 0) return true;
    const prevMsg = messages[index - 1];
    const currentMsg = messages[index];
    return prevMsg.sender !== currentMsg.sender || shouldShowDateSeparator(currentMsg, prevMsg);
  };

  const renderMessage = (msg, index) => {
    // Use attachment_data for original filename if available, fallback to legacy
    const attachmentData = msg.attachment_data;
    const displayFileName = attachmentData?.original_name || (msg.attachment ? msg.attachment.split('/').pop() : null);
    const fileType = attachmentData?.file_type || '';
    const isImage = msg.attachment && (fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.attachment));
    const fileExtension = displayFileName ? displayFileName.split('.').pop().toLowerCase() : null;
    const canDeleteAttachment = attachmentData?.can_delete || msg.isOwn;
    
    const isHovered = hoveredMessageId === msg.id;
    const isEditing = editingMessageId === msg.id;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);
    const showSenderInfo = shouldShowSenderInfo(index);

    // Handler for deleting attachment only (not the whole message)
    const handleDeleteAttachmentClick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if message has content - if not, will delete entire message
      const hasContent = msg.content && msg.content.trim().length > 0;
      const deleteMessage = !hasContent;
      
      const result = await Swal.fire({
        title: deleteMessage ? 'Delete Message?' : 'Delete Attachment?',
        text: deleteMessage 
          ? 'This message only contains an attachment. Deleting the attachment will remove the entire message.'
          : `Are you sure you want to delete "${displayFileName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
        hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
      });

      if (result.isConfirmed) {
        try {
          if (deleteMessage) {
            // Delete entire message if no content
            await window.axios.delete(`/api/messages/${msg.id}`);
            setMessages(prev => prev.filter(m => m.id !== msg.id));
          } else {
            // Only delete attachment
            await window.axios.delete(`/api/attachments/${msg.id}`);
            setMessages(prev => prev.map(m => 
              m.id === msg.id 
                ? { ...m, attachment: null, attachment_data: null }
                : m
            ));
          }
          Swal.fire({
            title: 'Deleted!',
            text: deleteMessage ? 'Message has been deleted.' : 'Attachment has been deleted.',
            icon: 'success',
            confirmButtonColor: primaryColor,
            showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
            hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
          });
          fetchContacts(); // Refresh contacts to update last message
        } catch (error) {
          console.error('Error deleting:', error);
          Swal.fire({
            title: 'Error',
            text: 'Failed to delete: ' + (error.response?.data?.error || error.message),
            icon: 'error',
            confirmButtonColor: primaryColor,
            showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
            hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
          });
        }
      }
    };

    return (
      <div key={msg.id}>
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

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 12,
            alignItems: 'flex-start',
            justifyContent: msg.isOwn ? 'flex-end' : 'flex-start',
            padding: '4px 8px',
            marginLeft: msg.isOwn ? '80px' : '0',
            marginRight: msg.isOwn ? '0' : '80px'
          }}
          onMouseEnter={() => setHoveredMessageId(msg.id)}
          onMouseLeave={() => {
            // Don't hide if delete confirm is showing
            if (showDeleteConfirm !== msg.id) {
              setHoveredMessageId(null);
            }
          }}
        >
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

          {!msg.isOwn && !showSenderInfo && (
            <div style={{ width: 40, flexShrink: 0 }} />
          )}

          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.isOwn ? 'flex-end' : 'flex-start',
            maxWidth: '70%'
          }}>
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
                >
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </p>
                  {msg.isEdited && (
                    <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 6 }}>(edited)</span>
                  )}

                  {(isHovered || showDeleteConfirm === msg.id) && msg.isOwn && (
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
                            background: '#f8f9fa',
                            color: '#333',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 500
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

            {msg.attachment && (
              <div style={{ marginTop: 8, marginBottom: msg.content ? 0 : 8, position: 'relative' }}>
                {isImage ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <a href={msg.attachment} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={msg.attachment} 
                        alt={displayFileName || 'attachment'} 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '240px', 
                          borderRadius: 8,
                          cursor: 'pointer'
                        }} 
                      />
                    </a>
                    {canDeleteAttachment && isHovered && (
                      <button
                        onClick={handleDeleteAttachmentClick}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'rgba(220, 53, 69, 0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                        title="Delete attachment"
                      >
                        <IoTrash size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    background: '#f0f0f0',
                    borderRadius: 6,
                    padding: '10px 12px',
                    width: 'fit-content'
                  }}>
                    <a 
                      href={msg.attachment} 
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        textDecoration: 'none',
                        color: '#333',
                        flex: 1,
                        cursor: 'pointer'
                      }}
                      title="Click to view file"
                    >
                      {getFileIcon(fileExtension)}
                      <span style={{ fontSize: 14, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayFileName}
                      </span>
                    </a>
                    <a
                      href={attachmentData?.download_url || msg.attachment}
                      download={displayFileName}
                      style={{
                        background: '#e0e0e0',
                        border: 'none',
                        borderRadius: '4px',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: primaryColor,
                        textDecoration: 'none'
                      }}
                      title="Download file"
                    >
                      <IoDownload size={16} />
                    </a>
                    {canDeleteAttachment && (
                      <button
                        onClick={handleDeleteAttachmentClick}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          borderRadius: '4px',
                          width: 28,
                          height: 28,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#dc3545',
                          marginLeft: 4
                        }}
                        title="Delete attachment"
                      >
                        <IoTrash size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

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
      borderRadius: '0px',
      boxShadow: 'none',
      height: '100%',
      width: '100%',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar - Contacts */}
      <div style={{ 
        width: '320px', 
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {/* Header with Search - THIS MUST STAY FIXED */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #e9ecef',
          flexShrink: 0
        }}>
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

        {/* Contacts List - ONLY THIS SCROLLS */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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
                  background: activeChat === index ? '#e7f1ff' : contact.unread > 0 ? '#f0f6ff' : 'transparent',
                  borderLeft: contact.unread > 0 && activeChat !== index ? `3px solid ${primaryColor}` : '3px solid transparent',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeChat !== index) e.currentTarget.style.background = contact.unread > 0 ? '#e7f1ff' : '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  if (activeChat !== index) e.currentTarget.style.background = contact.unread > 0 ? '#f0f6ff' : 'transparent';
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
                        fontWeight: contact.unread > 0 ? '700' : '600',
                        color: contact.unread > 0 ? '#000' : '#212529',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {contact.name}
                      </h4>
                      <span style={{ 
                        fontSize: '12px', 
                        color: contact.unread > 0 ? primaryColor : '#6c757d',
                        fontWeight: contact.unread > 0 ? '600' : '400'
                      }}>
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
                        color: contact.unread > 0 ? '#212529' : '#495057',
                        fontWeight: contact.unread > 0 ? '600' : '400',
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Messages Area - Header SCROLLS WITH messages - ONLY THIS SCROLLS */}
        <div style={{ 
          flex: 1, 
          padding: '0',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {activeChat !== null ? (
            <>
              {/* Chat Header - INSIDE scrollable area */}
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
              )}

              {/* Tab Navigation */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e9ecef',
                background: '#fff',
                flexShrink: 0
              }}>
                <button
                  onClick={() => setActiveTab('chat')}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'chat' ? `3px solid ${primaryColor}` : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 14,
                    fontWeight: activeTab === 'chat' ? 600 : 400,
                    color: activeTab === 'chat' ? primaryColor : '#6c757d',
                    transition: 'all 0.2s'
                  }}
                >
                  <MdChat size={18} />
                  Chat
                </button>
                <button
                  onClick={() => {
                    setActiveTab('files');
                    if (currentChatId) {
                      fetchSharedFiles(currentChatId);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'files' ? `3px solid ${primaryColor}` : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 14,
                    fontWeight: activeTab === 'files' ? 600 : 400,
                    color: activeTab === 'files' ? primaryColor : '#6c757d',
                    transition: 'all 0.2s'
                  }}
                >
                  <FaFolder size={16} />
                  Files
                  {sharedFiles.length > 0 && (
                    <span style={{
                      background: primaryColor,
                      color: '#fff',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      {sharedFiles.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Chat Tab Content */}
              {activeTab === 'chat' && (
                <>
                  {/* Messages */}
                  {messages.length === 0 ? (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flex: 1,
                      color: '#6c757d',
                      padding: '24px'
                    }}>
                      <p style={{ fontSize: '16px', marginBottom: '8px' }}>No messages yet</p>
                      <p style={{ fontSize: '14px' }}>Start a conversation!</p>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '24px 40px'
                    }}>
                      {messages.map((msg, index) => renderMessage(msg, index))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </>
              )}

              {/* Files Tab Content */}
              {activeTab === 'files' && (
                <div style={{ padding: '24px', flex: 1 }}>
                  {loadingFiles ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        border: '3px solid #e9ecef',
                        borderTopColor: primaryColor,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                  ) : sharedFiles.length === 0 ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '60px 20px',
                      color: '#6c757d'
                    }}>
                      <MdInsertDriveFile size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                      <p style={{ fontSize: 16, margin: 0, marginBottom: 8 }}>No files shared yet</p>
                      <p style={{ fontSize: 14, margin: 0, opacity: 0.8 }}>Files shared in this conversation will appear here</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 8 }}>
                        {sharedFiles.length} file{sharedFiles.length !== 1 ? 's' : ''} shared
                      </p>
                      {sharedFiles.map((file, idx) => {
                        const fileType = file.file_type || '';
                        const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.filename || file.url);
                        const fileExtension = (file.filename || file.url).split('.').pop().toLowerCase();
                        
                        // Check if corresponding message has content
                        const correspondingMessage = messages.find(m => m.id === file.id);
                        const hasContent = correspondingMessage?.content && correspondingMessage.content.trim().length > 0;
                        const willDeleteMessage = !hasContent;
                        
                        const handleDeleteSharedFile = async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const result = await Swal.fire({
                            title: willDeleteMessage ? 'Delete Message?' : 'Delete File?',
                            text: willDeleteMessage
                              ? 'This message only contains this file. Deleting it will remove the entire message.'
                              : `Are you sure you want to delete "${file.filename}"?`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#dc3545',
                            cancelButtonColor: '#6c757d',
                            confirmButtonText: 'Delete',
                            cancelButtonText: 'Cancel',
                            showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
                            hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
                          });

                          if (result.isConfirmed) {
                            try {
                              if (willDeleteMessage) {
                                // Delete entire message
                                await window.axios.delete(`/api/messages/${file.id}`);
                                setMessages(prev => prev.filter(m => m.id !== file.id));
                              } else {
                                // Only delete attachment
                                await window.axios.delete(`/api/attachments/${file.id}`);
                                setMessages(prev => prev.map(m => 
                                  m.id === file.id 
                                    ? { ...m, attachment: null, attachment_data: null }
                                    : m
                                ));
                              }
                              setSharedFiles(prev => prev.filter(f => f.id !== file.id));
                              fetchContacts(); // Refresh contacts
                              Swal.fire({
                                title: 'Deleted!',
                                text: willDeleteMessage ? 'Message has been deleted.' : 'File has been deleted.',
                                icon: 'success',
                                confirmButtonColor: primaryColor,
                                showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
                                hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
                              });
                            } catch (error) {
                              console.error('Error deleting file:', error);
                              Swal.fire({
                                title: 'Error',
                                text: 'Failed to delete: ' + (error.response?.data?.error || error.message),
                                icon: 'error',
                                confirmButtonColor: primaryColor,
                                showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
                                hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
                              });
                            }
                          }
                        };
                        
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '14px 16px',
                              background: '#f8f9fa',
                              borderRadius: 8,
                              border: '1px solid #e9ecef',
                              transition: 'all 0.2s'
                            }}
                          >
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                textDecoration: 'none',
                                color: '#333',
                                flex: 1,
                                minWidth: 0,
                                cursor: 'pointer'
                              }}
                              title="Click to view file"
                              onMouseEnter={(e) => {
                                e.currentTarget.parentElement.style.background = '#e9ecef';
                                e.currentTarget.parentElement.style.borderColor = '#dee2e6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.parentElement.style.background = '#f8f9fa';
                                e.currentTarget.parentElement.style.borderColor = '#e9ecef';
                              }}
                            >
                              {isImage ? (
                                <img
                                  src={file.url}
                                  alt={file.filename}
                                  style={{
                                    width: 48,
                                    height: 48,
                                    objectFit: 'cover',
                                    borderRadius: 6
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 6,
                                  background: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid #dee2e6'
                                }}>
                                  {getFileIcon(fileExtension)}
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  margin: 0,
                                  fontSize: 14,
                                  fontWeight: 500,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {file.filename}
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6c757d' }}>
                                  Shared by {file.sender} • {formatContactTime(file.timestamp)}
                                  {file.file_size && ` • ${formatFileSize(file.file_size)}`}
                                </p>
                              </div>
                            </a>
                            <a
                              href={file.download_url || file.url}
                              download={file.filename}
                              style={{
                                background: '#e9ecef',
                                border: 'none',
                                borderRadius: '6px',
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: primaryColor,
                                textDecoration: 'none',
                                flexShrink: 0
                              }}
                              title="Download file"
                            >
                              <IoDownload size={18} />
                            </a>
                            {file.can_delete && (
                              <button
                                onClick={handleDeleteSharedFile}
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
                                  transition: 'all 0.2s',
                                  flexShrink: 0
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                                title="Delete file"
                              >
                                <IoTrash size={16} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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

        {/* Attachment Preview - STAYS FIXED */}
        {attachmentPreview && (
          <div style={{
            padding: '12px 40px',
            background: '#f8f9fa',
            borderTop: '1px solid #e9ecef',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0
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
                transition: 'all 0.2s',
                flexShrink: 0
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

        {/* Message Input - STAYS FIXED AT BOTTOM */}
        <div style={{ 
          padding: '16px 40px', 
          borderTop: '1px solid #e9ecef',
          background: '#fff',
          opacity: activeChat !== null ? 1 : 0.5,
          pointerEvents: activeChat !== null ? 'auto' : 'none',
          flexShrink: 0
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '12px'
          }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
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
                width: '40px',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}
              title="Attach file or image"
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
            Press Enter to send • PDF, PNG, JPG (max 10MB) • Use emojis
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
                onClick={() => { setShowNewChatModal(false); setNewChatSearchTerm(''); }}
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
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #e9ecef' }}>
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
                  placeholder="Search users..."
                  value={newChatSearchTerm}
                  onChange={(e) => setNewChatSearchTerm(e.target.value)}
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
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {[...availableUsers]
                .filter(user =>
                  user.name?.toLowerCase().includes(newChatSearchTerm.toLowerCase()) ||
                  user.role?.toLowerCase().includes(newChatSearchTerm.toLowerCase())
                )
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .map((user) => (
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
              {[...availableUsers]
                .filter(user =>
                  user.name?.toLowerCase().includes(newChatSearchTerm.toLowerCase()) ||
                  user.role?.toLowerCase().includes(newChatSearchTerm.toLowerCase())
                ).length === 0 && (
                <div style={{ padding: '24px 20px', textAlign: 'center', color: '#999', fontSize: 14 }}>
                  No users found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}