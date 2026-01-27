// resources/js/Pages/Dashboard_Inspection_Chat.jsx
import React from 'react';
import InspectionLayout from '@/Layouts/InspectionLayout';
import ChatComponent from '@/Components/Chat/ChatComponent';

export default function DashboardInspectionChat() {
  return (
    <InspectionLayout title="Inspection Chat">
      <ChatComponent 
        primaryColor="#004A98"
        currentUserRole="inspection"
      />
    </InspectionLayout>
  );
}
