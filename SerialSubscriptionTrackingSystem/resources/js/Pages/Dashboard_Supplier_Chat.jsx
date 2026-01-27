// resources/js/Pages/Dashboard_Supplier_Chat.jsx
import React from 'react';
import SupplierLayout from '@/Layouts/SupplierLayout';
import ChatComponent from '@/Components/Chat/ChatComponent';

export default function Dashboard_Supplier_Chat() {
  return (
    <SupplierLayout title="Supplier Chat">
      <ChatComponent 
        primaryColor="#004A98"
        currentUserRole="supplier"
      />
    </SupplierLayout>
  );
}
