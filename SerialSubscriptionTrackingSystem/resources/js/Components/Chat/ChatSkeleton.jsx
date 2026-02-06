import React from 'react';

const Skeleton = ({ className = '', style = {} }) => (
  <div
    className={`bg-gray-200 rounded animate-pulse ${className}`}
    style={style}
  ></div>
);

const ChatListSkeleton = () => (
  <div className="w-80 border-r border-gray-200 flex flex-col">
    {/* Header */}
    <div className="p-5 border-b border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
    {/* Contact List */}
    <div className="flex-1 overflow-y-auto">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center p-4 border-b border-gray-100">
          <Skeleton className="h-12 w-12 rounded-full mr-3" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ChatMessageSkeleton = () => (
  <div className="flex-1 flex flex-col">
    {/* Header */}
    <div className="flex items-center p-5 border-b border-gray-200">
      <Skeleton className="h-12 w-12 rounded-full mr-3" />
      <div className="flex-1">
        <Skeleton className="h-5 w-1/4 mb-2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    {/* Messages */}
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex justify-end mb-4">
        <Skeleton className="h-10 w-2/5 rounded-lg" />
      </div>
      <div className="flex justify-start mb-4">
        <Skeleton className="h-16 w-3/5 rounded-lg" />
      </div>
      <div className="flex justify-end mb-4">
        <Skeleton className="h-8 w-1/3 rounded-lg" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-12 w-1/2 rounded-lg" />
      </div>
    </div>
    {/* Input */}
    <div className="p-5 border-t border-gray-200">
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </div>
);

export default function ChatSkeleton() {
  return (
    <div className="bg-white h-full w-full flex overflow-hidden">
      <ChatListSkeleton />
      <ChatMessageSkeleton />
    </div>
  );
}
