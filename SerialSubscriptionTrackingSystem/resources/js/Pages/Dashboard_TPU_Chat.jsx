// resources/js/Pages/Dashboard_TPU_Chat.jsx
import React from 'react';
import TPULayout from '@/Layouts/TpuLayout';
import ChatComponent from '@/Components/Chat/ChatComponent';

export default function DashboardTPUChat() {
  return (
    <TPULayout title="TPU Chat">
      <ChatComponent 
        primaryColor="#004A98"
        currentUserRole="tpu"
      />
    </TPULayout>
  );
}