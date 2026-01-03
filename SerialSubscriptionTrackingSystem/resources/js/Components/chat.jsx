import React, { useState } from "react";

const conversations = [
  {
    id: 1,
    name: "ABC Supplier",
    lastMessage: "Inspection report will be submitted today.",
    messages: [
      { from: "them", text: "Inspection report will be submitted today." },
      { from: "me", text: "Noted. Please include serial discrepancies." },
    ],
  },
  {
    id: 2,
    name: "Warehouse Team",
    lastMessage: "Serial mismatch found in batch #23",
    messages: [
      { from: "them", text: "Serial mismatch found in batch #23" },
      { from: "me", text: "Please document and send photos." },
    ],
  },
  {
    id: 3,
    name: "Procurement Office",
    lastMessage: "New supplier inspection scheduled",
    messages: [
      { from: "them", text: "New supplier inspection scheduled tomorrow." },
    ],
  },
];

export default function Chat() {
  const [activeChat, setActiveChat] = useState(conversations[0]);
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (!message.trim()) return;

    setActiveChat((prev) => ({
      ...prev,
      messages: [...prev.messages, { from: "me", text: message }],
    }));

    setMessage("");
  };

  return (
    <div className="flex h-full">
      {/* ================= LEFT SIDEBAR (CHAT LIST) ================= */}
      <div className="w-72 border-r bg-[#f5f6f8]">
        <div className="p-4 font-semibold border-b text-[#004A98]">
          Chats
        </div>

        <div className="overflow-y-auto">
          {conversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`w-full text-left px-4 py-3 border-b transition
                ${
                  activeChat.id === chat.id
                    ? "bg-white"
                    : "hover:bg-gray-100"
                }`}
            >
              <p className="text-sm font-semibold">{chat.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {chat.lastMessage}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ================= CHAT AREA ================= */}
      <div className="flex-1 flex flex-col bg-white">
        {/* HEADER */}
        <div className="px-6 py-4 border-b font-semibold text-gray-800">
          {activeChat.name}
        </div>

        {/* MESSAGES */}
        <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto bg-[#eef2f5]">
          {activeChat.messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.from === "me" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg text-sm
                  ${
                    msg.from === "me"
                      ? "bg-[#0f57a3] text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none shadow"
                  }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div className="px-4 py-3 border-t bg-white flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message"
            className="flex-1 border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
          />
          <button
            onClick={sendMessage}
            className="bg-[#0f57a3] text-white px-5 rounded-md text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
