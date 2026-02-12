// resources/js/Pages/Dashboard_GSPS_Chat.jsx
import React from 'react';
import GSPSLayout from '@/Layouts/GSPSLayout';
import ChatComponent from '@/Components/Chat/ChatComponent';

export default function DashboardGSPS_Chat() {
  return (
    <GSPSLayout title="Chat">
      <ChatComponent 
        primaryColor="#004A98"
        currentUserRole="gsps"
      />
    </GSPSLayout>
  );
}