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
  ChevronLeft,
  MoreVertical,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import EmojiPicker from "emoji-picker-react";
import { fetchWorkers } from "@/redux/worker/workerSlice";
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
const generateChatId = (activeChat) => `chat_${String(activeChat).replace(/\s+/g, "")}`;

const formatMessageDate = (date) => {
  const today = new Date();
  const msgDate = new Date(date);
  if (msgDate.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (msgDate.toDateString() === yesterday.toDateString()) return "Yesterday";
  return msgDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case "completed": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "in_progress": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default: return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
};

const WorkerChat = () => {
  const dispatch = useDispatch();
  const { items: workers } = useSelector((state) => state.workers);
  const loginData = useSelector((state) => state.auth);

  const user = {
    userId: loginData?.user?.userId || "",
    name: `${loginData?.user?.name || ""} ${loginData?.user?.surname || ""}`,
  };

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [theme, setTheme] = useState("light");

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => { dispatch(fetchWorkers()); }, [dispatch]);

  // Real-time Listeners
  useEffect(() => {
    const unsubStatus = onSnapshot(collection(db, "users"), (snap) => {
      const statusMap = {};
      snap.forEach((doc) => { statusMap[doc.id] = doc.data().online || false; });
      setUserStatus(statusMap);
    });
    return () => unsubStatus();
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    const chatId = generateChatId(activeChat);
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsubMsgs = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() || new Date() }));
      setMessages(msgs);
    });
    return () => unsubMsgs();
  }, [activeChat]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Handlers
  const sendMessage = async () => {
    if (!activeChat || (!input.trim() && filePreviews.length === 0)) return;
    setIsSending(true);
    const chatId = generateChatId(activeChat);
    const receiver = workers.find(w => w.id === activeChat);

    try {
      if (input.trim()) {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          content: input.trim(),
          type: "text",
          senderId: user.userId,
          senderName: user.name,
          createdAt: serverTimestamp(),
          read: false,
        });
      }
      // File upload logic here (similar to your previous version)
      setInput("");
      setFilePreviews([]);
    } catch (e) { console.error(e); } finally { setIsSending(false); }
  };

  const selectedWorker = workers.find(w => w.id === activeChat);

  return (
    <div className="flex w-full h-[calc(100vh-85px)] md:h-[700px] bg-gray-50 dark:bg-black overflow-hidden md:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800">
      
      {/* Sidebar - Hidden on Mobile when Chat is Active */}
      <aside className={`${activeChat ? "hidden" : "flex"} md:flex w-full md:w-96 flex-col bg-white dark:bg-gray-950 border-r dark:border-gray-800`}>
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Chats</h1>
          <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:scale-110 transition-all">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {workers.map((w) => (
            <div
              key={w.id}
              onClick={() => setActiveChat(w.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${activeChat === w.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none" : "hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300"}`}
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  {w.profilePictureUrl ? <Image src={w.profilePictureUrl} alt="" width={56} height={56} className="object-cover h-full w-full" unoptimized /> : <div className="flex items-center justify-center h-full text-xl font-bold">{w.firstName?.[0]}</div>}
                </div>
                {userStatus[w.id] && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white dark:border-gray-950 rounded-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold truncate">{w.firstName} {w.lastName}</span>
                </div>
                <p className={`text-xs truncate ${activeChat === w.id ? "text-blue-100" : "text-gray-500"}`}>Click to start chatting</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat - Hidden on Mobile when No Active Chat */}
      <main className={`${!activeChat ? "hidden" : "flex"} md:flex flex-1 flex-col bg-white dark:bg-gray-950`}>
        {selectedWorker ? (
          <>
            {/* Chat Header */}
            <header className="p-4 md:p-5 border-b dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <ChevronLeft size={24}   className="text-gray-900 dark:text-white" />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-gray-800 overflow-hidden shadow-sm">
                  {selectedWorker.profilePictureUrl ? <Image src={selectedWorker.profilePictureUrl} alt="" width={48} height={48} className="object-cover h-full w-full" unoptimized /> : <div className="flex items-center justify-center h-full font-bold">{selectedWorker.firstName?.[0]}</div>}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{selectedWorker.firstName} {selectedWorker.lastName}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${userStatus[selectedWorker.id] ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                    <span className="text-[11px] font-medium text-gray-500">{userStatus[selectedWorker.id] ? "Active Now" : "Offline"}</span>
                  </div>
                </div>
              </div>
              <MoreVertical className="text-gray-400 cursor-pointer" />
            </header>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-gray-50/50 dark:bg-black/20 custom-scrollbar">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                  <div className="p-6 bg-gray-100 dark:bg-gray-900 rounded-full mb-4"><Send size={32} /></div>
                  <p className="text-sm font-medium">Say hello to {selectedWorker.firstName}!</p>
                </div>
              )}
              {messages.map((m, i) => {
                const isMe = m.senderId === user.userId;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`group relative max-w-[85%] md:max-w-[70%] p-4 rounded-3xl shadow-sm transition-all ${isMe ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none" : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-800 rounded-tl-none"}`}>
                      {m.type === "text" && <p className="text-sm md:text-base leading-relaxed">{m.content}</p>}
                      
                      {m.type === "task_card" && (
                        <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border dark:border-gray-800 space-y-3 mt-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-blue-600">NEW TASK</span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${getStatusStyles(m.content.parent_status)}`}>{m.content.parent_status}</span>
                          </div>
                          <h4 className="font-black text-sm dark:text-white leading-tight">{m.content.task_name}</h4>
                          <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 font-bold uppercase">
                            <div className="flex items-center gap-1"><Clock size={12} className="text-blue-500"/> {m.content.task_deadline}</div>
                            <div className="flex items-center gap-1"><Flag size={12} className="text-red-500"/> {m.content.task_priority}</div>
                          </div>
                        </div>
                      )}

                      <div className={`flex items-center justify-end gap-1.5 mt-2 opacity-60 text-[10px] font-bold`}>
                        {formatTime(m.createdAt)}
                        {isMe && <div className={`w-1.5 h-1.5 rounded-full ${m.read ? "bg-white" : "border border-white"}`} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <footer className="p-4 md:p-6 bg-white dark:bg-gray-950 border-t dark:border-gray-800">
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900 p-2 md:p-3 rounded-[2rem] border-2 border-transparent focus-within:border-blue-500/30 transition-all">
                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-500 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all">
                  <Paperclip size={20} />
                  <input type="file" ref={fileInputRef} className="hidden" />
                </button>
                
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base dark:text-white placeholder-gray-400"
                />

                <div className="flex items-center gap-1">
                  <button className="hidden sm:block p-2.5 text-gray-500 hover:text-yellow-500 transition-colors"><Smile size={20}/></button>
                  <button onClick={() => setIsRecording(!isRecording)} className={`p-2.5 rounded-full transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "text-gray-500 hover:text-blue-500"}`}>
                    <Mic size={20} />
                  </button>
                  <button 
                    onClick={sendMessage}
                    disabled={!input.trim() && filePreviews.length === 0}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-blue-500/20"
                  >
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 p-10 text-center">
            <div className="w-32 h-32 bg-white dark:bg-gray-900 rounded-[3rem] shadow-xl flex items-center justify-center mb-8 rotate-12">
              <Send size={48} className="text-blue-600 -rotate-12 opacity-20" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Your Team is Waiting</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs text-sm">Select a contact from the list to start a professional conversation.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkerChat;