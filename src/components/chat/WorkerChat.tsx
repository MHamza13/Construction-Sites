"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  File as FileIcon,
  Smile,
  Mic,
  Loader2,
  X,
  Paperclip,
  Circle,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  ListChecks,
  Sun,
  Moon,
  ChevronLeft, // Added for mobile back button
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import EmojiPicker from "emoji-picker-react";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { sendNotificationToUser } from "@/redux/userDeviceTokken/userDeviceTokkenSlice"; // Import notification slice
import {
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/Firebase";
import Image from "next/image";

// -------- Helper functions --------
export const generateChatId = (activeChat) =>
  `chat_${String(activeChat).replace(/\s+/g, "")}`;

export const formatMessageDate = (date) => {
  const today = new Date();
  const msgDate = new Date(date);

  const isToday =
    msgDate.getDate() === today.getDate() &&
    msgDate.getMonth() === today.getMonth() &&
    msgDate.getFullYear() === today.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday =
    msgDate.getDate() === yesterday.getDate() &&
    msgDate.getMonth() === yesterday.getMonth() &&
    msgDate.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return msgDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatTaskDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800";
    case "in_progress":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800";
    case "not_started":
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
  }
};

const WorkerChat = () => {
  const dispatch = useDispatch();
  const { items: workers } = useSelector((state) => state.workers);
  const loginData = useSelector((state) => state.auth);

  const user = {
    userId: loginData?.user?.userId || "",
    name: `${loginData?.user?.name || ""} ${loginData?.user?.surname || ""}`,
    email: loginData?.user?.email || "",
    token: loginData?.token || "",
  };

  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" ? "dark" : "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [userStatus, setUserStatus] = useState({});
  const [mediaLoaded, setMediaLoaded] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaList, setMediaList] = useState([]);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchWorkers());
  }, [dispatch]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const statusMap = {};
      snapshot.forEach((doc) => {
        statusMap[doc.id] = doc.data().online || false;
      });
      setUserStatus(statusMap);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }
    const chatId = generateChatId(activeChat);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ensureChatExists = async (chatId, sender, receiver) => {
    await setDoc(doc(db, "chats", chatId), { users: [sender, receiver] }, { merge: true });
  };

  const sendMessage = async () => {
    if (!activeChat || (!input.trim() && filePreviews.length === 0)) return;
    setIsSending(true);
    setShowEmojiPicker(false); // Close picker on send

    const chatId = generateChatId(activeChat);
    const receiver = workers.find((w) => w.id === activeChat);

    try {
      if (input.trim()) {
        const messageBody = input.trim();
        await ensureChatExists(chatId, user, receiver);
        await addDoc(collection(db, "chats", chatId, "messages"), {
          content: messageBody,
          type: "text",
          senderId: user.userId,
          senderName: user.name,
          createdAt: serverTimestamp(),
          read: false,
        });

        if (receiver) {
          const notificationPayload = {
            userId: Number(receiver.id) || 0,
            type: "chat",
            title: `New message from ${user.name}`,
            body: messageBody.length > 60 ? messageBody.substring(0, 60) + "..." : messageBody,
            senderID: Number(user.userId) || 0,
          };
          dispatch(sendNotificationToUser(notificationPayload));
        }
      }
      setInput("");
      setFilePreviews([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectedWorker = workers.find((w) => w.id === activeChat);
  const groupedMessages = messages.reduce((groups, msg) => {
    const label = formatMessageDate(msg.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
    return groups;
  }, {});

  const sortedWorkers = [...workers].sort((a, b) => (lastMessages[b.id]?.createdAt || 0) - (lastMessages[a.id]?.createdAt || 0));
  const isValidUrl = (url) => { try { new URL(url); return true; } catch { return false; } };

  return (
    <div className="flex w-full h-[calc(100vh-70px)] md:h-[600px] bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
      
      <aside className={`w-full md:w-80 flex-col bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg shadow-sm">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <h3 className="text-lg font-bold">Team Chat</h3>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">{theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}</button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {sortedWorkers.map((w) => (
            <div key={w.id} onClick={() => setActiveChat(w.id)} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${activeChat === w.id ? "bg-blue-50 dark:bg-blue-900/50 border-blue-200 shadow-sm" : "border-transparent hover:bg-white dark:hover:bg-gray-800"}`}>
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-blue-400 flex items-center justify-center text-white font-bold">
                {w.profilePictureUrl && isValidUrl(w.profilePictureUrl) ? <Image src={w.profilePictureUrl} alt="" width={48} height={48} className="object-cover" unoptimized /> : <span>{w.firstName?.[0]}</span>}
                <Circle className={`w-3 h-3 absolute -bottom-1 -right-1 ${userStatus[w.id] ? "text-green-500" : "text-gray-400"}`} fill="currentColor" />
              </div>
              <div className="flex-1 min-w-0"><p className="font-semibold truncate">{w.firstName} {w.lastName}</p></div>
            </div>
          ))}
        </div>
      </aside>

      <section className={`flex-1 flex flex-col bg-white dark:bg-gray-900 ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedWorker ? (
          <>
            <header className="flex items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><ChevronLeft className="w-6 h-6 dark:text-white" /></button>
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">{selectedWorker.firstName?.[0]}</div>
                <div><h2 className="font-bold text-base md:text-lg leading-tight">{selectedWorker.firstName} {selectedWorker.lastName}</h2><span className="text-[10px] text-green-500 font-medium">{userStatus[selectedWorker.id] ? "Online" : "Offline"}</span></div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="text-center my-4"><span className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] md:text-xs px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 font-medium">{date}</span></div>
                  {msgs.map((m) => (
                    <div key={m.id} className={`flex mb-4 ${m.senderId === user.userId ? "justify-end" : "justify-start"}`}>
                      <div className={`p-3 rounded-2xl max-w-[85%] md:max-w-md shadow-sm ${m.senderId === user.userId ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-tl-none"}`}>
                        <p className="text-xs md:text-sm whitespace-pre-wrap">{m.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 opacity-60 text-[9px]`}>{formatTime(m.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-3 md:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 md:gap-3 relative">
                {/* Emoji Picker Button */}
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"><Smile className="w-5 h-5" /></button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-16 left-0 z-50 shadow-2xl">
                    <EmojiPicker onEmojiClick={(e) => setInput(prev => prev + e.emoji)} theme={theme} width={300} height={400} />
                  </div>
                )}

                <button onClick={() => fileInputRef.current?.click()} className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"><Paperclip className="w-5 h-5" /></button>
                <input type="file" ref={fileInputRef} className="hidden" />
                
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 dark:text-white"
                  placeholder="Type a message..."
                />
                
                <button className="p-1.5 md:p-2 rounded-full transition-colors text-gray-500"><Mic className="w-5 h-5" /></button>
                
                <button onClick={sendMessage} disabled={isSending || !input.trim()} className={`p-2 md:p-2.5 rounded-full transition-all ${isSending || !input.trim() ? "bg-gray-200 text-gray-400" : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"}`}>
                   {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6 bg-gray-50 dark:bg-gray-900/50">
             <div className="max-w-xs"><div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4"><Send className="w-8 h-8 text-blue-600 dark:text-blue-400" /></div><h3 className="text-lg font-bold">Welcome to Team Chat</h3><p className="text-sm text-gray-500">Select a team member to start chatting</p></div>
          </div>
        )}
      </section>
    </div>
  );
};

export default WorkerChat;