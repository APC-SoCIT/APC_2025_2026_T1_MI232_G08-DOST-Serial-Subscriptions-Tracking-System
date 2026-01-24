import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function CommunityChat({ userId, userRole }) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Fetch all chats
  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchChats = async () => {
    try {
      const response = await axios.get('/api/chats');
      setChats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // Fetch messages for selected chat
  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/chats/${selectedChat.id}/messages`);
      setMessages(response.data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !attachment) {
      return;
    }

    const formData = new FormData();
    if (newMessage.trim()) {
      formData.append('content', newMessage);
    }
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const response = await axios.post(`/api/chats/${selectedChat.id}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessages([...messages, response.data]);
      setNewMessage('');
      setAttachment(null);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat List */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg">Messages</h2>
        </div>
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setSelectedChat(chat)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
              selectedChat?.id === chat.id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="font-semibold text-sm">{chat.name}</div>
            <div className="text-xs text-gray-500 mt-1">{chat.role}</div>
            <div className="text-xs text-gray-400 mt-1 truncate">{chat.lastMessage}</div>
            <div className="text-xs text-gray-400">{chat.time}</div>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <h2 className="font-bold">{selectedChat.name}</h2>
            <p className="text-sm text-gray-500">{selectedChat.role}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.isOwn
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {!message.isOwn && (
                    <div className="text-xs font-semibold mb-1">
                      {message.sender} ({message.senderRole})
                    </div>
                  )}
                  <div>{message.content}</div>
                  {message.attachment && (
                    <a
                      href={message.attachment}
                      download
                      className={`block text-xs mt-2 underline ${
                        message.isOwn ? 'text-blue-100' : 'text-blue-500'
                      }`}
                    >
                      📎 Download File
                    </a>
                  )}
                  <div className={`text-xs mt-1 ${message.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.time}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.querySelector('input[type="file"]').click()}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                >
                  📎
                </button>
              </label>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                Send
              </button>
            </div>
            {attachment && (
              <div className="mt-2 text-sm text-gray-600">
                📎 {attachment.name}
              </div>
            )}
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Select a chat to start messaging</p>
        </div>
      )}
    </div>
  );
}
