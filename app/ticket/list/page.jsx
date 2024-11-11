"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

let socket;

const ChatPage = () => {
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userId = token ? JSON.parse(atob(token.split(".")[1])).sub : null;

  const BASE_URL = "http://localhost:3000";

  console.log("Logged User ID from JWT:", userId);

  useEffect(() => {
    if (!token) {
      console.error("Token not found, please log in");
      return;
    }

    if (!socket) {
      console.log("Initializing socket connection...");
      socket = io(BASE_URL, {
        auth: {
          token: `Bearer ${token}`,
        },
      });
    }

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      socket.emit("joinTicketList");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    socket.on("newTicket", (newTicket) => {
      console.log("New Ticket Received:", newTicket);
      setTickets((prevTickets) => [newTicket, ...prevTickets]);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/tickets`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data.success) {
          console.log("Fetched tickets successfully:", response.data.tickets);
          setTickets(response.data.tickets);
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
    };

    fetchTickets();
  }, [token]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message) => {
        console.log("New Message Received:", message);

        const isSender = String(message.sender_id) === String(userId);

        setTickets((prevTickets) => {
          const updatedTickets = prevTickets.map((ticket) => {
            if (ticket.id === message.ticket_id) {
              if (isSender) {
                return { ...ticket, is_last_sender: false };
              }
              return { ...ticket, is_last_sender: true };
            }
            return ticket;
          });

          const targetTicket = updatedTickets.find((ticket) => ticket.id === message.ticket_id);
          return [targetTicket, ...updatedTickets.filter((ticket) => ticket.id !== message.ticket_id)];
        });

        if (selectedTicket && message.ticket_id === selectedTicket.id) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              ...message,
              sender: isSender ? "me" : "other",
            },
          ]);
        }
      };

      socket.on("newMessage", handleNewMessage);

      return () => {
        socket.off("newMessage", handleNewMessage);
      };
    }
  }, [selectedTicket, userId]);

  const handleSelectTicket = async (ticket) => {
    console.log("Selecting ticket:", ticket);
    setSelectedTicket(ticket);
    try {
      const response = await axios.get(`${BASE_URL}/tickets/${ticket.id}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const messagesWithSender = response.data.messages.map((message) => {
        const isSender = String(message.sender_id) === String(userId);
        return {
          ...message,
          sender: isSender ? "me" : "other",
        };
      });
      setMessages(messagesWithSender);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }

    if (socket && socket.connected) {
      socket.emit("joinTicket", ticket.id);
    } else {
      console.error("Socket is not connected");
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (messageText.trim() && selectedTicket) {
      const newMessage = {
        ticket_id: selectedTicket.id,
        content: messageText,
        sender_id: userId,
        type: "text",
      };

      if (socket && socket.connected) {
        socket.emit("sendMessage", newMessage, (ack) => {
          if (ack.success) {
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                ...newMessage,
                id: ack.message_id,
                sender: "me",
                created_at: new Date().toISOString(),
              },
            ]);
          } else {
            console.error("Error saving message on server:", ack.error);
          }
        });
      } else {
        console.error("Socket is not connected");
      }

      setMessageText("");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    const confirmDelete = window.confirm("آیا مطمئن هستید که می‌خواهید این تیکت را حذف کنید؟");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`${BASE_URL}/tickets/${ticketId}/close`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setTickets((prevTickets) => prevTickets.filter((ticket) => ticket.id !== ticketId));
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(null);
        }
        console.log("Ticket deleted successfully");
      } else {
        console.error("Error deleting ticket:", response.data.error);
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      <div className="w-1/4 bg-gray-800 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-200">تیکت‌ها</h2>
        </div>
        <ul className="overflow-y-auto h-full">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="flex items-center p-3 cursor-pointer rounded-lg mb-2 transition bg-gray-800 hover:bg-gray-700"
              onClick={() => handleSelectTicket(ticket)}
            >
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-200">{ticket.title}</h3>
                <p className="text-xs text-gray-400">وضعیت: {ticket.status}</p>
              </div>
              <button
                className="text-red-500 hover:text-red-700 ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTicket(ticket.id);
                }}
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col bg-gray-900">
        {selectedTicket ? (
          <>
            <div className="flex items-center p-4 bg-gray-800 border-b border-gray-700 justify-between">
              <h2 className="text-lg font-semibold text-gray-200">{selectedTicket.title}</h2>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.id}-${index}`}
                  className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-xs ${
                      message.sender === "me" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs text-gray-400 mt-1 block">{message.timestamp || message.created_at}</span>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-gray-800 border-t border-gray-700 flex items-center">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 p-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none"
              />
              <button type="submit" className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
                ارسال
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400">برای شروع یک چت، یک تیکت را انتخاب کنید</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
