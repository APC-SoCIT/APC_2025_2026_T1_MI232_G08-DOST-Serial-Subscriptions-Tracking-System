// resources/js/Pages/Dashboard_GSPS_Chat.jsx
import React from 'react';
import GspsLayout from '@/Layouts/GspsLayout';
import ChatComponent from '@/Components/Chat/ChatComponent';

export default function DashboardGSPS_Chat() {
  return (
    <GspsLayout title="Chat">
      <ChatComponent 
        primaryColor="#004A98"
        currentUserRole="gsps"
      />
    </GspsLayout>
  );
}
