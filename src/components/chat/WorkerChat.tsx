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
  Sun,
  Moon,
  ChevronLeft,
  Download,
  Play,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import EmojiPicker from "emoji-picker-react";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { sendNotificationToUser } from "@/redux/userDeviceTokken/userDeviceTokkenSlice";
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
// AAPKI REQUEST KE MUTABIQ ISKO CHANGE NAHI KIYA GAYA
export const generateChatId = (activeChat) =>
  `chat_${String(activeChat).replace(/\s+/g, "")}`;

export const formatMessageDate = (date) => {
  const today = new Date();
  const msgDate = new Date(date);
  if (msgDate.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (msgDate.toDateString() === yesterday.toDateString()) return "Yesterday";
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

  // States
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [userStatus, setUserStatus] = useState({});

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchWorkers());
  }, [dispatch]);

  // Online Status Listener
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

  // Messages Listener
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

  // --- Media Handlers ---

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((file) => ({
      file,
      name: file.name,
      type: file.type.split("/")[0], // image, video, application etc.
      url: URL.createObjectURL(file),
    }));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const uploadFile = async (file, chatId) => {
    const storageRef = ref(storage, `worker_chats/${chatId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
        },
        reject,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  };

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        setFilePreviews((prev) => [
          ...prev,
          { file: audioFile, name: "Voice Note", type: "voice", url: URL.createObjectURL(audioBlob) },
        ]);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  };

  const sendMessage = async () => {
    if (!activeChat || (!input.trim() && filePreviews.length === 0)) return;
    setIsSending(true);
    setShowEmojiPicker(false);

    const chatId = generateChatId(activeChat);
    const receiver = workers.find((w) => w.id === activeChat);

    try {
      await setDoc(doc(db, "chats", chatId), { users: [activeChat], lastUpdated: serverTimestamp() }, { merge: true });

      // Handle Files first
      for (const item of filePreviews) {
        const fileUrl = await uploadFile(item.file, chatId);
        let msgType = "file";
        if (item.type === "image") msgType = "image";
        else if (item.type === "video") msgType = "video";
        else if (item.type === "voice") msgType = "voice";

        await addDoc(collection(db, "chats", chatId, "messages"), {
          content: fileUrl,
          type: msgType,
          fileName: item.name,
          senderId: user.userId,
          senderName: user.name,
          createdAt: serverTimestamp(),
          read: false,
        });
      }

      // Handle Text
      if (input.trim()) {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          content: input.trim(),
          type: "text",
          senderId: user.userId,
          senderName: user.name,
          createdAt: serverTimestamp(),
          read: false,
        });

        if (receiver) {
          dispatch(
            sendNotificationToUser({
              userId: Number(receiver.id) || 0,
              type: "chat",
              title: `New message from ${user.name}`,
              body: input,
              senderID: Number(user.userId) || 0,
            })
          );
        }
      }

      setInput("");
      setFilePreviews([]);
      setUploadProgress({});
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

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex w-full h-[100vh] bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
      {/* Sidebar */}
      <aside className={`w-full md:w-80 flex-col bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 ${activeChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Team Chat</h3>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {workers.map((w) => (
            <div key={w.id} onClick={() => setActiveChat(w.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${activeChat === w.id ? "bg-blue-600 text-white shadow-lg" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center font-bold">
                {w.profilePictureUrl && isValidUrl(w.profilePictureUrl) ? (
                  <Image src={w.profilePictureUrl} alt="" width={48} height={48} className="object-cover" unoptimized />
                ) : (
                  <span className={activeChat === w.id ? "text-white" : "text-gray-600"}>{w.firstName?.[0]}</span>
                )}
                <Circle className={`w-3 h-3 absolute bottom-0 right-0 border-2 border-white ${userStatus[w.id] ? "text-green-500" : "text-gray-400"}`} fill="currentColor" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {w.firstName} {w.lastName}
                </p>
                <p className={`text-[10px] ${activeChat === w.id ? "text-blue-100" : "text-gray-500"}`}>{userStatus[w.id] ? "Online" : "Offline"}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat */}
      <section className={`flex-1 flex flex-col bg-[#f0f2f5] dark:bg-gray-950 ${activeChat ? "flex" : "hidden md:flex"}`}>
        {selectedWorker ? (
          <>
            <header className="flex items-center gap-3 p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 shadow-sm">
              <button onClick={() => setActiveChat(null)} className="md:hidden p-1 rounded-full hover:bg-gray-100">
                <ChevronLeft size={24} />
              </button>
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">{selectedWorker.firstName?.[0]}</div>
              <div>
                <h2 className="font-bold text-sm md:text-base leading-tight">
                  {selectedWorker.firstName} {selectedWorker.lastName}
                </h2>
                <span className="text-[10px] text-green-500 font-medium">{userStatus[selectedWorker.id] ? "Online" : "Offline"}</span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="text-center my-6">
                    <span className="bg-white dark:bg-gray-800 text-gray-500 text-[10px] px-3 py-1 rounded-full shadow-sm">{date}</span>
                  </div>
                  {msgs.map((m) => {
                    const isMe = m.senderId === user.userId;
                    return (
                      <div key={m.id} className={`flex mb-4 ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`p-2.5 rounded-2xl max-w-[85%] md:max-w-md shadow-sm ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none"}`}>
                          {m.type === "text" && <p className="text-xs md:text-sm whitespace-pre-wrap">{m.content}</p>}

                          {m.type === "image" && (
                            <div className="rounded-lg overflow-hidden">
                              <Image src={m.content} alt="img" width={300} height={300} className="w-full h-auto" unoptimized />
                            </div>
                          )}

                          {m.type === "video" && <video src={m.content} controls className="max-w-xs rounded-lg" />}

                          {m.type === "voice" && <audio src={m.content} controls className="h-8 w-48 md:w-64" />}

                          {m.type === "file" && (
                            <a href={m.content} target="_blank" className="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/10 rounded-lg">
                              <FileIcon size={20} className="text-blue-500" />
                              <span className="text-xs truncate flex-1">{m.fileName || "Download File"}</span>
                              <Download size={14} />
                            </a>
                          )}

                          <div className={`flex items-center justify-end gap-1 mt-1 opacity-60 text-[9px] ${isMe ? "text-blue-100" : "text-gray-500"}`}>
                            {formatTime(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              {filePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {filePreviews.map((pre, i) => (
                    <div key={i} className="relative w-16 h-16 border rounded-md overflow-hidden bg-gray-50">
                      {pre.type === "image" ? <img src={pre.url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><Play size={16} /></div>}
                      <button onClick={() => setFilePreviews((p) => p.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5"><X size={12} /></button>
                      {uploadProgress[pre.name] > 0 && <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all" style={{ width: `${uploadProgress[pre.name]}%` }} />}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 relative">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Smile size={22} /></button>
                {showEmojiPicker && (
                  <div className="absolute bottom-16 left-0 z-50">
                    <EmojiPicker onEmojiClick={(e) => setInput((p) => p + e.emoji)} theme={theme} width={280} height={350} />
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><Paperclip size={22} /></button>
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={isRecording ? "Recording..." : "Type a message..."}
                />

                <button 
                  onMouseDown={startRecording} onMouseUp={stopRecording}
                  onTouchStart={startRecording} onTouchEnd={stopRecording}
                  className={`p-2.5 rounded-full transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-500"}`}
                >
                  <Mic size={20} />
                </button>

                <button onClick={sendMessage} disabled={isSending || (!input.trim() && filePreviews.length === 0)} className={`p-2.5 rounded-full ${isSending || (!input.trim() && filePreviews.length === 0) ? "bg-gray-200 text-gray-400" : "bg-blue-600 text-white"}`}>
                  {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4 text-blue-600"><Send size={40} /></div>
            <h3 className="text-xl font-bold">Team Chat</h3>
            <p className="text-sm text-gray-500 mt-2">Select a team member to start chatting</p>
          </div>
        )}
      </section>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default WorkerChat;