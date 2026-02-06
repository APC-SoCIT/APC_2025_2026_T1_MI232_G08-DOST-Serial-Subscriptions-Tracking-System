import React from 'react';
import { IoCheckmarkDone, IoCheckmark, IoTimeOutline } from 'react-icons/io5';

const MessageStatus = ({ status }) => {
  const iconStyle = {
    fontSize: '16px',
    color: '#a0aec0', // gray-500
  };

  const sendingStyle = {
    ...iconStyle,
    animation: 'spin 1s linear infinite',
  };

  switch (status) {
    case 'sending':
      return <IoTimeOutline style={sendingStyle} title="Sending..." />;
    case 'sent':
      return <IoCheckmark style={iconStyle} title="Sent" />;
    case 'read':
      return <IoCheckmarkDone style={{ ...iconStyle, color: '#4299e1' /* blue-500 */ }} title="Read" />;
    default:
      return null;
  }
};

export default MessageStatus;
