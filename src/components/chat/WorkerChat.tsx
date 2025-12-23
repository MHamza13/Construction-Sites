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

const getPriorityStyles = (priority) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800";
    case "medium":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800";
    case "low":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800";
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
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || 
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const [, setUnreadCount] = useState<Record<string, number>>({});

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
  const [showSubtasks, setShowSubtasks] = useState({});

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // ---------- Effects ----------
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
    const unsubs = workers.map((w) => {
      const chatId = generateChatId(w.id);
      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "desc")
      );
      return onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const lastMsg = snap.docs[0].data();
          setLastMessages((prev) => ({
            ...prev,
            [w.id]: { ...lastMsg, createdAt: lastMsg.createdAt?.toDate() },
          }));

          const totalUnread = snap.docs.reduce((count, doc) => {
            const msg = doc.data();
            return msg.senderId !== user.userId && !msg.read ? count + 1 : count;
          }, 0);
          setUnreadCount((prev) => ({
            ...prev,
            [w.id]: totalUnread,
          }));
        } else {
          setLastMessages((prev) => ({ ...prev, [w.id]: null }));
          setUnreadCount((prev) => ({ ...prev, [w.id]: 0 }));
        }
      });
    });
    return () => unsubs.forEach((u) => u());
  }, [workers, user.userId]);

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      setMediaLoaded({});
      return;
    }

    const chatId = generateChatId(activeChat);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setMessages(msgs);

      const unreadMessages = msgs.filter(
        (m) => m.senderId !== user.userId && !m.read
      );
      for (const msg of unreadMessages) {
        await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
          read: true,
        });
      }
    });

    return () => unsubscribe();
  }, [activeChat, user.userId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ---------- Helpers ----------
  const ensureChatExists = async (chatId, sender, receiver) => {
    const chatDocRef = doc(db, "chats", chatId);
    await setDoc(chatDocRef, { users: [sender, receiver] }, { merge: true });
  };

  const uploadFile = (file, fileName, tempId, chatId, receiver) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(
        storage,
        `/fromMobileSide/${Date.now()}_${fileName}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);

      setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((prev) => ({ ...prev, [tempId]: progress }));
        },
        reject,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadProgress((prev) => {
            const { [tempId]: _, ...rest } = prev;
            return rest;
          });
          await ensureChatExists(chatId, user, receiver);
          await addDoc(collection(db, "chats", chatId, "messages"), {
            content: url,
            type: file?.type?.startsWith("image/")
              ? "image"
              : file?.type?.startsWith("video/")
              ? "video"
              : file?.type?.startsWith("audio/")
              ? "voice"
              : file?.type
              ? "document"
              : "task_card",
            fileName,
            senderId: user.userId,
            senderName: user.name,
            createdAt: serverTimestamp(),
            read: false,
          });
          resolve();
        }
      );
    });
  };

  const removeFilePreview = (index) => {
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!activeChat || (!input.trim() && filePreviews.length === 0)) return;
    setIsSending(true);
    setFilePreviews([]);

    const chatId = generateChatId(activeChat);
    const receiver = workers.find((w) => w.id === activeChat);

    try {
      if (input.trim()) {
        await ensureChatExists(chatId, user, receiver);
        await addDoc(collection(db, "chats", chatId, "messages"), {
          content: input.trim(),
          type: "text",
          senderId: user.userId,
          senderName: user.name,
          createdAt: serverTimestamp(),
          read: false,
        });
      }

      for (const preview of filePreviews) {
        const tempId = Date.now() + "_" + preview.fileName;

        setMessages((prev) => [
          ...prev,
          {
            id: tempId,
            content: preview.fileName,
            type: preview.fileType,
            senderId: user.userId,
            senderName: user.name,
            uploading: true,
          },
        ]);

        await uploadFile(
          preview.file,
          preview.fileName,
          tempId,
          chatId,
          receiver
        );
      }

      setInput("");
    } catch (e) {
      console.error("Send error:", e);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "voice/webm",
        });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
          type: "voice/webm",
        });

        setFilePreviews((prev) => [
          ...prev,
          { file: audioFile, fileType: "voice", fileName: audioFile.name },
        ]);
      };

      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
    audioChunksRef.current = [];
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      file,
      fileType: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
        ? "voice"
        : "document",
      fileName: file.name,
    }));
    setFilePreviews((p) => [...p, ...previews]);
    fileInputRef.current.value = null;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openMediaModal = (mediaId) => {
    const mediaItems = messages
      .filter((m) => (m.type === "image" || m.type === "video") && m.id)
      .map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        fileName: m.fileName || "Media",
      }));
    const index = mediaItems.findIndex((item) => item.id === mediaId);
    if (index !== -1) {
      setMediaList(mediaItems);
      setCurrentMediaIndex(index);
      setIsModalOpen(true);
    }
  };

  const toggleSubtasks = (messageId) => {
    setShowSubtasks((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const selectedWorker = workers.find((w) => w.id === activeChat);

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = msg.createdAt || new Date();
    const label = formatMessageDate(date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
    return groups;
  }, {});

  const sortedWorkers = [...workers].sort((a, b) => {
    const msgA = lastMessages[a.id]?.createdAt || 0;
    const msgB = lastMessages[b.id]?.createdAt || 0;
    return msgB - msgA;
  });

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex w-full h-[600px] bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-80 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700 custom-scrollbar">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg shadow-sm">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Team Chat</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Select a team member</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-100px)] p-3 space-y-2">
          {sortedWorkers.map((w) => {
            const lastMsg = lastMessages[w.id];
            const unread = lastMsg && lastMsg.senderId !== user.userId && !lastMsg.read ? 1 : 0;
            return (
              <div
                key={w.id}
                onClick={() => setActiveChat(w.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 relative border-2 ${
                  activeChat === w.id
                    ? "bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-700 shadow-sm"
                    : "border-transparent hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm"
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {w.profilePictureUrl && isValidUrl(w.profilePictureUrl) ? (
                      <Image
                        src={w.profilePictureUrl}
                        alt={w.firstName || "Worker"}
                        width={100}
                        height={100}
                        className="w-full h-full rounded-full object-cover"
                        unoptimized
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const next = target.nextElementSibling;
                          if (next) next.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <span className={w.profilePictureUrl && isValidUrl(w.profilePictureUrl) ? "hidden" : "block"}>
                      {w.firstName?.[0] || "U"}
                    </span>
                  </div>
                  <Circle
                    className={`w-3 h-3 absolute -bottom-1 -right-1 ${
                      userStatus[w.id] ? "text-green-500" : "text-gray-400 dark:text-gray-500"
                    }`}
                    fill={userStatus[w.id] ? "green" : "gray"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                      {w.firstName} {w.lastName}
                    </p>
                    {lastMsg && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                        {formatTime(lastMsg.createdAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                      {lastMsg
                        ? lastMsg.type === "text"
                          ? lastMsg.content
                          : lastMsg.type === "task_card"
                          ? `[Task: ${lastMsg.content.project_name}]`
                          : `[${lastMsg.type}]`
                        : "No messages yet"}
                    </p>
                    {unread > 0 && (
                      <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                        {unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Chat Section */}
      <section className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {selectedWorker ? (
          <>
            {/* Chat Header */}
            <header className="flex items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {selectedWorker.profilePictureUrl && isValidUrl(selectedWorker.profilePictureUrl) ? (
                      <Image
                        src={selectedWorker.profilePictureUrl}
                        alt={selectedWorker.firstName || "Worker"}
                        width={80}
                        height={80}
                        className="w-full h-full rounded-full object-cover"
                        unoptimized
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const next = target.nextElementSibling;
                          if (next) next.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <span className={selectedWorker.profilePictureUrl && isValidUrl(selectedWorker.profilePictureUrl) ? "hidden" : "block"}>
                      {selectedWorker.firstName?.[0] || "U"}
                    </span>
                  </div>
                  <Circle
                    className={`w-3 h-3 absolute -bottom-1 -right-1 ${
                      userStatus[selectedWorker.id] ? "text-green-500" : "text-gray-400 dark:text-gray-500"
                    }`}
                    fill={userStatus[selectedWorker.id] ? "green" : "gray"}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                    {selectedWorker.firstName} {selectedWorker.lastName}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      userStatus[selectedWorker.id]
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}>
                      <Circle className={`w-2 h-2 mr-1 ${userStatus[selectedWorker.id] ? "text-green-500" : "text-gray-400 dark:text-gray-500"}`} fill={userStatus[selectedWorker.id] ? "green" : "gray"} />
                      {userStatus[selectedWorker.id] ? "Online" : "Offline"}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedWorker.specializationName || "No specialization"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
              </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6 bg-gradient-to-br from-gray-50/30 to-blue-50/20 dark:from-gray-900 dark:to-gray-800">
              {Object.keys(groupedMessages).map((dateLabel) => (
                <div key={dateLabel}>
                  <div className="sticky top-0 z-10 flex justify-center my-4">
                    <span className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 font-medium">
                      {dateLabel}
                    </span>
                  </div>

                  {groupedMessages[dateLabel].map((m) => {
                    const isSender = m.senderId === user.userId;
                    const senderWorker = workers.find((w) => w.id === m.senderId) || {};
                    return (
                      <div
                        key={m.id}
                        className={`flex items-start gap-2 mb-3 ${isSender ? "justify-end" : "justify-start"}`}
                      >
                        {!isSender && (
                          <div className="w-8 h-8 rounded-full mt-1 overflow-hidden bg-blue-200 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm">
                            {senderWorker.profilePictureUrl && isValidUrl(senderWorker.profilePictureUrl) ? (
                              <Image
                                src={senderWorker.profilePictureUrl}
                                alt={senderWorker.firstName || m.senderName || "User"}
                                width={40}
                                height={40}
                                className="w-full h-full rounded-full object-cover"
                                unoptimized
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = "none";
                                  const next = target.nextElementSibling;
                                  if (next) next.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <span className={senderWorker.profilePictureUrl && isValidUrl(senderWorker.profilePictureUrl) ? "hidden" : "block"}>
                              {senderWorker.firstName?.[0] || m.senderName?.[0] || "U"}
                            </span>
                          </div>
                        )}
                        <div className={`px-4 py-3 rounded-2xl max-w-md shadow-sm relative ${
                          isSender
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                        }`}>
                          {m.uploading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Uploading... {Math.round(uploadProgress[m.id] || 0)}%</span>
                            </div>
                          ) : (
                            <>
                              {m.type === "image" && m.content && isValidUrl(m.content) ? (
                                <div className="relative cursor-pointer" onClick={() => openMediaModal(m.id)}>
                                  {!mediaLoaded[m.id] && (
                                    <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                      <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
                                    </div>
                                  )}
                                  <Image
                                    src={m.content}
                                    alt={m.fileName || "Image"}
                                    width={600}
                                    height={400}
                                    className={`rounded-md mb-2 max-w-full h-auto ${mediaLoaded[m.id] ? "block" : "hidden"}`}
                                    unoptimized
                                    onLoadingComplete={() => setMediaLoaded((prev) => ({ ...prev, [m.id]: true }))}
                                    onError={() => setMediaLoaded((prev) => ({ ...prev, [m.id]: false }))}
                                  />
                                </div>
                              ) : m.type === "image" ? (
                                <div className="text-red-500 text-sm">Error: Invalid image URL</div>
                              ) : null}
                              {m.type === "video" && (
                                <div className="relative cursor-pointer" onClick={() => openMediaModal(m.id)}>
                                  {!mediaLoaded[m.id] && (
                                    <div className="w-40 h-40 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                      <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
                                    </div>
                                  )}
                                  <video
                                    src={m.content}
                                    controls
                                    className={`mb-2 max-w-full rounded-md ${mediaLoaded[m.id] ? "block" : "hidden"}`}
                                    onLoadedMetadata={() => setMediaLoaded((prev) => ({ ...prev, [m.id]: true }))}
                                    onError={() => setMediaLoaded((prev) => ({ ...prev, [m.id]: false }))}
                                  />
                                </div>
                              )}
                              {m.type === "voice" && (
                                <div className="flex flex-col items-start">
                                  <audio src={m.content} controls className="mb-1" />
                                  <span className="text-xs opacity-70">0:00</span>
                                </div>
                              )}
                              {m.type === "document" && (
                                <a href={m.content} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                                  {m.fileName || "Download File"}
                                </a>
                              )}
                              {m.type === "text" && <p>{m.content}</p>}
                              {m.type === "task_card" && m.content && (
                                <div className="border rounded-md p-4 bg-white dark:bg-gray-800 transition-shadow duration-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 pr-5">
                                      {m.content.task_name || "Untitled Task"}
                                    </h3>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(m.content.parent_status)}`}>
                                      {m.content.parent_status || "Unknown"}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {m.content.task_description || "No description provided"}
                                  </p>
                                  <div className="space-y-2 mb-3">
                                    <div className="flex justify-between items-center px-2 py-1 rounded-full text-xs font-medium">
                                      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        <span>Deadline:</span>
                                      </div>
                                      <div className="text-gray-900 dark:text-white font-medium">
                                        {formatTaskDate(m.content.task_deadline)}
                                      </div>
                                    </div>
                                    <div>
                                      <span className={`flex justify-between items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`}>
                                        <div className="flex items-center gap-1">
                                          <ListChecks className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                          <span>Subtasks:</span>
                                        </div>
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                          {m.content.sub_tasks.filter((sub) => sub.status?.toLowerCase() === "completed").length}/{m.content.sub_tasks?.length || 0}
                                        </div>
                                      </span>
                                    </div>
                                    <div>
                                      <span className={`flex justify-between items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyles(m.content.task_priority)}`}>
                                        <div className="flex items-center">
                                          <Flag className="w-3 h-3 mr-1" />
                                          Priority:
                                        </div>
                                        <div>{m.content.task_priority || "Unknown"}</div>
                                      </span>
                                    </div>
                                  </div>
                                  {m.content.project_name && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                      <strong>Project:</strong> {m.content.project_name}
                                    </p>
                                  )}
                                  {m.content.sub_tasks?.length > 0 && (
                                    <div className="mt-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                          Subtasks ({m.content.sub_tasks.length})
                                        </h4>
                                        <button
                                          onClick={() => toggleSubtasks(m.id)}
                                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 text-sm"
                                        >
                                          {showSubtasks[m.id] ? (
                                            <>
                                              <ChevronUp className="w-4 h-4" /> Hide
                                            </>
                                          ) : (
                                            <>
                                              <ChevronDown className="w-4 h-4" /> Show
                                            </>
                                          )}
                                        </button>
                                      </div>
                                      {showSubtasks[m.id] && (
                                        <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                          {m.content.sub_tasks
                                            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                                            .map((sub) => (
                                              <li
                                                key={sub.sub_task_id}
                                                className="flex items-center justify-between border rounded-md p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: sub.color_code || "#ccc" }}></span>
                                                  <span className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{sub.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatTaskDate(sub.due_date)}
                                                  </span>
                                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(sub.status)}`}>
                                                    {sub.status}
                                                  </span>
                                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyles(sub.priority)}`}>
                                                    {sub.priority}
                                                  </span>
                                                </div>
                                              </li>
                                            ))}
                                        </ul>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {m.type === "task_card" && !m.content && (
                                <p className="text-red-500 text-sm">Error: Invalid task data</p>
                              )}
                            </>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs font-semibold"></span>
                            {m.createdAt && (
                              <span className="text-[10px] opacity-70">{formatTime(m.createdAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* File Previews */}
            {filePreviews.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-3">
                  {filePreviews.map((preview, idx) => (
                    <div key={idx} className="relative w-44 h-20 flex items-center justify-center border rounded-md bg-white dark:bg-gray-700">
                      <button
                        onClick={() => removeFilePreview(idx)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                      {preview.fileType === "image" && (
                        <Image
                          src={URL.createObjectURL(preview.file)}
                          alt={preview.fileName || "Preview"}
                          width={176}
                          height={80}
                          className="w-full h-full object-cover rounded-md"
                          unoptimized
                        />
                      )}
                      {preview.fileType === "video" && (
                        <video src={URL.createObjectURL(preview.file)} className="w-full h-full object-cover rounded-md" muted controls />
                      )}
                      {preview.fileType === "voice" && (
                        <div className="w-full p-1 flex flex-col items-center">
                          <audio src={URL.createObjectURL(preview.file)} controls className="w-full" />
                        </div>
                      )}
                      {preview.fileType === "document" && (
                        <div className="text-center p-2">
                          <FileIcon className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs truncate block">{preview.fileName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Footer */}
            <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
                {showEmojiPicker && (
                  <div className="absolute bottom-20 left-2 z-20 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
                    <EmojiPicker
                      onEmojiClick={(e) => {
                        setInput((prev) => prev + e.emoji);
                        setShowEmojiPicker(false);
                      }}
                      theme={theme}
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Type a message..."
                  disabled={isSending}
                />
                {isRecording ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelRecording}
                      className="p-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleMicClick}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleMicClick}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={sendMessage}
                  disabled={isSending || (!input.trim() && filePreviews.length === 0)}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    isSending || (!input.trim() && filePreviews.length === 0)
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md"
                  }`}
                >
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center bg-gradient-to-br from-gray-50/30 to-blue-50/20 dark:from-gray-800 dark:to-gray-900">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Welcome to Team Chat</h3>
              <p className="text-gray-500 dark:text-gray-400">Select a team member from the sidebar to start a conversation</p>
            </div>
          </div>
        )}

        {/* Media Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white text-3xl font-bold z-10 hover:text-gray-300">×</button>
            <button
              onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length)}
              className="absolute left-4 text-white text-5xl opacity-75 hover:opacity-100 z-10"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length)}
              className="absolute right-4 text-white text-5xl opacity-75 hover:opacity-100 z-10"
            >
              ›
            </button>
            <div className="relative w-full max-w-4xl max-h-[90vh] flex items-center justify-center">
              {mediaList[currentMediaIndex].type === "image" && isValidUrl(mediaList[currentMediaIndex].content) ? (
                <Image
                  src={mediaList[currentMediaIndex].content}
                  alt={mediaList[currentMediaIndex].fileName || "Media"}
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain rounded-md"
                  unoptimized
                />
              ) : mediaList[currentMediaIndex].type === "video" ? (
                <video src={mediaList[currentMediaIndex].content} controls autoPlay className="max-w-full max-h-full object-contain rounded-md" />
              ) : (
                <div className="text-white text-sm">Error: Invalid media URL</div>
              )}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-1 rounded-full text-sm">
                {currentMediaIndex + 1} / {mediaList.length}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default WorkerChat;