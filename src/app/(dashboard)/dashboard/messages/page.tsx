"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  Bell,
  MessageSquare,
  Send,
  ArrowLeft,
  User,
  CheckCheck,
  Plus,
  Search,
} from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  company?: string;
}

interface Conversation {
  otherUser: UserInfo;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  subject: string | null;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string; role: string };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    VENDOR: "Vendor",
    EVENT_MANAGER: "Event Manager",
    ADMIN: "Admin",
    VENUE_ADMIN: "Venue Admin",
  };
  return labels[role] || role;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function MessagesPage() {
  const [tab, setTab] = useState<"messages" | "notifications">("messages");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState<UserInfo[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [myId, setMyId] = useState("");

  // Fetch session to get current user id
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.id) setMyId(d.user.id);
      });
  }, []);

  // Fetch conversations
  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch notifications
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || []);
        setUnreadNotifs(d.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  // Open a conversation
  const openChat = (user: UserInfo) => {
    setSelectedUser(user);
    setShowNewChat(false);
    fetch(`/api/messages/${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        setChatMessages(d.messages || []);
        // Update unread count in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.otherUser.id === user.id ? { ...c, unreadCount: 0 } : c
          )
        );
      });
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: newMessage.trim(),
        }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setChatMessages((prev) => [...prev, message]);
        setNewMessage("");
        // Refresh conversation list
        fetch("/api/messages")
          .then((r) => r.json())
          .then((d) => setConversations(d.conversations || []));
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  // New chat - fetch contacts
  const openNewChat = () => {
    setShowNewChat(true);
    setSelectedUser(null);
    fetch("/api/messages/contacts")
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts || []));
  };

  // Mark all notifications read
  const markAllRead = () => {
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    }).then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifs(0);
    });
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.company || "").toLowerCase().includes(contactSearch.toLowerCase())
  );

  // ── Chat View (selected user) ──
  if (selectedUser) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 p-4 border-b bg-white rounded-t-xl">
          <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
            <p className="text-xs text-gray-500">
              {getRoleLabel(selectedUser.role)}
              {selectedUser.company && ` · ${selectedUser.company}`}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {chatMessages.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No messages yet. Say hello!
            </div>
          )}
          {chatMessages.map((msg) => {
            const isMe = msg.senderId === myId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-white text-gray-900 border rounded-bl-md"
                  }`}
                >
                  <p>{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${isMe ? "text-indigo-200" : "text-gray-400"}`}>
                    {timeAgo(msg.createdAt)}
                    {isMe && <CheckCheck className="h-3 w-3" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Message input */}
        <div className="p-3 border-t bg-white rounded-b-xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── New Chat - Contact Picker ──
  if (showNewChat) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNewChat(false)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">New Message</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No contacts found</div>
            ) : (
              <div className="divide-y">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => openChat(contact)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {getRoleLabel(contact.role)}
                        {contact.company && ` · ${contact.company}`}
                      </p>
                    </div>
                    <Badge variant={contact.role === "EVENT_MANAGER" ? "info" : "default"}>
                      {getRoleLabel(contact.role)}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main View - Conversations & Notifications ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 text-sm">Chat with event organizers and vendors</p>
        </div>
        <Button onClick={openNewChat} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Message
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setTab("messages")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "messages"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <MessageSquare className="h-4 w-4 inline mr-1" />
          Messages
        </button>
        <button
          onClick={() => setTab("notifications")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
            tab === "notifications"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Bell className="h-4 w-4 inline mr-1" />
          Notifications
          {unreadNotifs > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadNotifs}
            </span>
          )}
        </button>
      </div>

      {/* Messages Tab */}
      {tab === "messages" && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No conversations yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Start a conversation with an event organizer or vendor
                </p>
                <Button onClick={openNewChat} size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-1" /> Start a Chat
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <button
                    key={conv.otherUser.id}
                    onClick={() => openChat(conv.otherUser)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${conv.unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                          {conv.otherUser.name}
                        </p>
                        <span className="text-xs text-gray-400">
                          {timeAgo(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${conv.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                        {conv.lastMessage.senderId === myId && "You: "}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {tab === "notifications" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Notifications</h2>
            {unreadNotifs > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No notifications yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  You&apos;ll see booking updates and reminders here
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 ${notif.isRead ? "" : "bg-indigo-50/50"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notif.type === "NEW_MESSAGE" ? "bg-blue-100" :
                        notif.type === "BOOKING_RECEIVED" ? "bg-green-100" :
                        "bg-gray-100"
                      }`}>
                        {notif.type === "NEW_MESSAGE" ? (
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Bell className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${notif.isRead ? "text-gray-700" : "text-gray-900 font-medium"}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
