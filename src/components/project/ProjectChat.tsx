"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Send,
  File as FileIcon,
  Smile,
  Mic,
  Loader2,
  X,
  Paperclip,
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
import { fetchProjectById } from "@/redux/projects/projectSlice";
// Notification Import
import { sendNotificationToUser } from "@/redux/userDeviceTokken/userDeviceTokkenSlice";
import Image from "next/image";

// Type Definitions
interface ReduxProjectState {
  currentProject: {
    id: string;
    name: string;
    status: string;
    deadlineDate: string;
  } | null;
  loading: boolean;
  error: string | null;
}

interface AuthState {
  user: {
    userId: string;
    name: string;
    surname: string;
    email: string;
  } | null;
  token: string | null;
}

interface FilePreview {
  file: File;
  fileType: string;
  fileName: string;
}

interface ChatMessage {
  id: string;
  content: string;
  type: "text" | "image" | "video" | "voice" | "document" | "task_card";
  senderId: string;
  senderName: string;
  createdAt?: Date;
  uploading?: boolean;
  read?: boolean;
  fileName?: string;
}

interface MediaItem {
  id: string;
  content: string;
  type: "image" | "video";
  fileName: string;
}

interface ChatUser {
  userId: string;
  name: string;
  email?: string;
}

interface SubTask {
  title: string;
  due_date: string;
  status: string;
}

// Helper Functions
export const generateChatId = (workerId: number, projectId: number) => {
  return `project_chat_${projectId}_${workerId}`;
};

export const formatMessageDate = (date: Date) => {
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

export const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatTaskDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusStyles = (status: string | undefined) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800";
    case "in_progress":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800";
    case "not_started":
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
  }
};

const getPriorityStyles = (priority: string | undefined) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800";
    case "medium":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800";
    case "low":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
  }
};

// Component
const ProjectChat = ({ workerId, projectId }: { workerId: number; projectId: number }) => {
  const dispatch = useDispatch();

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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Redux State
  const { currentProject, loading: projectLoading } = useSelector(
    (state: { projects: ReduxProjectState }) => state.projects
  );

  const loginData: AuthState = useSelector((state: { auth: AuthState }) => state.auth);

  const user = useMemo(
    () => ({
      userId: loginData?.user?.userId || "",
      name: `${loginData?.user?.name || ""} ${loginData?.user?.surname || ""}`,
      email: loginData?.user?.email || "",
      token: loginData?.token || "",
    }),
    [loginData]
  );

  // Local States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [mediaLoaded, setMediaLoaded] = useState<{ [key: string]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [showSubtasks, setShowSubtasks] = useState<{ [key: string]: boolean }>({});
  const [showAllUnread, setShowAllUnread] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight < scrollHeight - 100) {
        setShouldAutoScroll(false);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const resetAutoScroll = useCallback(() => {
    setShouldAutoScroll(true);
  }, []);

  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    const handleInputFocus = () => resetAutoScroll();
    const input = document.querySelector("textarea[placeholder='Type a message...']");
    if (input) {
      input.addEventListener("focus", handleInputFocus);
      return () => input.removeEventListener("focus", handleInputFocus);
    }
  }, [resetAutoScroll]);

  // Chat ID
  const chatId = useMemo(() => generateChatId(workerId, projectId), [workerId, projectId]);

  const receiver = useMemo(
    () => ({
      userId: workerId.toString(),
      name: `Worker ${workerId}`,
      email: "",
    }),
    [workerId]
  );

  const unreadMessages = useMemo(
    () =>
      messages
        .filter((m) => m.senderId !== user.userId && !m.read && !m.uploading)
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)),
    [messages, user.userId]
  );

  // Effects
  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
    }
  }, [dispatch, projectId]);

  useEffect(() => {
    if (!workerId || projectId === null) {
      setMessages([]);
      setMediaLoaded({});
      return;
    }

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setMessages(msgs);

      const unreadMsgs = msgs.filter((m) => m.senderId !== user.userId && !m.read);
      for (const msg of unreadMsgs) {
        if (!msg.uploading) {
          await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
            read: true,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [workerId, projectId, chatId, user.userId]);

  // Helpers
  const ensureChatExists = async (chatId: string, sender: ChatUser, receiver: ChatUser) => {
    const chatDocRef = doc(db, "chats", chatId);
    await setDoc(chatDocRef, { users: [sender, receiver] }, { merge: true });
  };

  const uploadFile = (file: File, fileName: string, tempId: string, chatId: string, receiver: ChatUser) => {
    return new Promise<void>(async (resolve, reject) => {
      const storageRef = ref(storage, `/fromMobileSide/${Date.now()}_${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress((prev) => ({ ...prev, [tempId]: progress }));
        },
        (error) => {
          console.error("Upload Error:", error);
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadProgress((prev) => {
              const { [tempId]: _, ...rest } = prev;
              return rest;
            });

            await ensureChatExists(chatId, user, receiver);

            await addDoc(collection(db, "chats", chatId, "messages"), {
              content: url,
              type: file.type.startsWith("audio/")
                ? "voice"
                : file.type.startsWith("image/")
                ? "image"
                : file.type.startsWith("video/")
                ? "video"
                : "document",
              fileName,
              senderId: user.userId,
              senderName: user.name,
              createdAt: serverTimestamp(),
              read: false,
            });

            // Notification for File
            const notificationPayload = {
              userId: Number(workerId) || 0,
              type: "chat",
              title: `Attachment in ${currentProject?.name}`,
              body: `${user.name} sent a file.`,
              senderID: Number(user.userId) || 0,
            };
            dispatch(sendNotificationToUser(notificationPayload));

            resolve();
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  };

  const removeFilePreview = (index: number) => {
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!input.trim() && filePreviews.length === 0) return;

    setIsSending(true);
    const previewsToSend = [...filePreviews];
    const messageBody = input.trim();
    setFilePreviews([]);

    try {
      if (messageBody) {
        await ensureChatExists(chatId, user, receiver);
        await addDoc(collection(db, "chats", chatId, "messages"), {
          content: messageBody,
          type: "text",
          senderId: user.userId,
          senderName: user.name,
          createdAt: serverTimestamp(),
          read: false,
        });

        // --- SEND NOTIFICATION TO WORKER ---
        const notificationPayload = {
          userId: Number(workerId) || 0,
          type: "chat",
          title: `Project Chat: ${currentProject?.name}`,
          body: messageBody.length > 60 ? messageBody.substring(0, 60) + "..." : messageBody,
          senderID: Number(user.userId) || 0,
        };
        dispatch(sendNotificationToUser(notificationPayload));
      }
      setInput("");

      for (const preview of previewsToSend) {
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
            createdAt: new Date(),
          },
        ]);

        await uploadFile(preview.file, preview.fileName, tempId, chatId, receiver);
      }
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        setFilePreviews((prev) => [
          ...prev,
          { file: audioFile, fileType: "voice", fileName: audioFile.name },
        ]);
        mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openMediaModal = (mediaId: string) => {
    const mediaItems = messages
      .filter((m) => (m.type === "image" || m.type === "video") && m.id && !m.uploading)
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

  const toggleSubtasks = (messageId: string) => {
    setShowSubtasks((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  // Group messages
  const groupedMessages = messages.reduce((groups: { [key: string]: ChatMessage[] }, msg) => {
    const date = msg.createdAt || new Date();
    const label = formatMessageDate(date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
    return groups;
  }, {});

  // Render snippet
  const renderMessageSnippet = (m: ChatMessage) => {
    if (m.type === "text") {
      return m.content.length > 50 ? `${m.content.substring(0, 50)}...` : m.content;
    } else if (m.type === "image") {
      return "Image attachment";
    } else if (m.type === "video") {
      return "Video attachment";
    } else if (m.type === "voice") {
      return "Voice message";
    } else if (m.type === "document") {
      return `Document: ${m.fileName || "File"}`;
    } else if (m.type === "task_card") {
      return `Task: ${m.content.task_name || "Untitled Task"}`;
    }
    return "Message";
  };

  // Loading / Error States
  if (projectLoading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 items-center justify-center text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Loading project details...</p>
      </div>
    );
  }

  if (!currentProject || projectId === null) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 items-center justify-center text-center">
        <p className="text-red-500 dark:text-red-400 font-semibold">
          Error: {currentProject ? "Project ID is missing" : "Project not found or ID is missing."}
        </p>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Please ensure the provided project ID is correct.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[550px] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="ml-3 text-left">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{currentProject.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                Project Status:{" "}
                <span className={`ml-1 ${getStatusStyles(currentProject.status)} px-2 py-0.5 rounded-full`}>
                  {currentProject.status || "Unknown"}
                </span>
                <span className="mx-1">•</span>
                Deadline: {formatTaskDate(currentProject.deadlineDate)}
              </div>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </button>
        </div>

        {unreadMessages.length > 0 && (
          <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Unread Messages ({unreadMessages.length})
              </span>
              {unreadMessages.length > 1 && (
                <button
                  onClick={() => setShowAllUnread(!showAllUnread)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  {showAllUnread ? "Show Less" : "Show More"}
                  {showAllUnread ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
            <div className="mt-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{unreadMessages[0].senderName}: </span>
                {renderMessageSnippet(unreadMessages[0])}
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-500">
                  {unreadMessages[0].createdAt && formatTime(unreadMessages[0].createdAt)}
                </span>
              </div>
              {showAllUnread &&
                unreadMessages.slice(1).map((m) => (
                  <div key={m.id} className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">{m.senderName}: </span>
                    {renderMessageSnippet(m)}
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-500">
                      {m.createdAt && formatTime(m.createdAt)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-gray-50/30 to-blue-50/20 dark:from-gray-800 dark:to-gray-900 custom-scrollbar"
      >
        {Object.keys(groupedMessages).map((dateLabel) => (
          <div key={dateLabel}>
            <div className="text-center my-3">
              <span className="inline-block bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-full shadow-md font-medium">
                {dateLabel}
              </span>
            </div>
            {groupedMessages[dateLabel].map((m: ChatMessage) => {
              const isSender = m.senderId === user.userId;
              const senderInitials = isSender ? user.name?.[0] || "Y" : "W";

              return (
                <div
                  key={m.id}
                  className={`flex mb-4 ${isSender ? "justify-end" : "justify-start"}`}
                >
                  {!isSender && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0 shadow-sm">
                      {senderInitials}
                    </div>
                  )}
                  <div className={`max-w-[75%] flex flex-col ${isSender ? "items-end text-right" : "items-start text-left"}`}>
                    <div
                      className={`p-3 rounded-xl text-sm ${
                        isSender
                          ? "bg-blue-600 text-white rounded-br-sm shadow-sm"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm shadow-sm"
                      } ${m.uploading ? "opacity-70" : ""}`}
                    >
                      {m.uploading ? (
                        <div className="flex items-center text-xs">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Uploading {m.fileName}...{" "}
                          {Math.round(uploadProgress[m.id] || 0)}%
                        </div>
                      ) : (
                        <>
                          {m.type === "image" && (
                            <div onClick={() => openMediaModal(m.id)} className="cursor-pointer relative">
                              {!mediaLoaded[m.id] && (
                                <Loader2 className="w-6 h-6 animate-spin absolute inset-0 m-auto text-blue-300" />
                              )}
                              <Image
                                src={m.content || "/fallback-image.png"}
                                alt={m.fileName || "Image"}
                                width={300}
                                height={200}
                                className={`max-w-xs max-h-48 object-cover rounded-lg transition-all ${
                                  !mediaLoaded[m.id] ? "blur-sm" : ""
                                }`}
                                onLoadingComplete={() =>
                                  setMediaLoaded((prev) => ({ ...prev, [m.id]: true }))
                                }
                                onError={() =>
                                  setMediaLoaded((prev) => ({ ...prev, [m.id]: false }))
                                }
                              />
                            </div>
                          )}
                          {m.type === "video" && (
                            <div onClick={() => openMediaModal(m.id)} className="cursor-pointer relative">
                              {!mediaLoaded[m.id] && (
                                <Loader2 className="w-6 h-6 animate-spin absolute inset-0 m-auto text-blue-300" />
                              )}
                              <video
                                src={m.content}
                                controls={mediaLoaded[m.id]}
                                className={`max-w-xs max-h-48 object-cover rounded-lg ${
                                  !mediaLoaded[m.id] ? "blur-sm" : ""
                                }`}
                                onLoadedData={() => setMediaLoaded((prev) => ({ ...prev, [m.id]: true }))}
                                onError={() => setMediaLoaded((prev) => ({ ...prev, [m.id]: false }))}
                              />
                            </div>
                          )}
                          {m.type === "voice" && (
                            <div className="flex flex-col items-start">
                              <audio
                                src={m.content}
                                controls
                                className="mb-1 h-8 max-w-full"
                              />
                            </div>
                          )}
                          {m.type === "document" && (
                            <a
                              href={m.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-300 dark:text-blue-400 hover:underline"
                            >
                              <Paperclip className="w-4 h-4 mr-2" /> {m.fileName || "Download File"}
                            </a>
                          )}
                          {m.type === "text" && m.content}
                          {m.type === "task_card" && m.content && (
                            <div
                              className={`p-4 rounded-xl border ${
                                isSender ? "bg-blue-700 border-blue-600 text-white" : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                              } shadow-md w-full`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className={`font-bold text-base ${isSender ? "text-white" : "text-gray-900 dark:text-white"}`}>
                                  {m.content.task_name || "Untitled Task"}
                                </h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusStyles(m.content.parent_status)}`}>
                                  {m.content.parent_status || "Unknown"}
                                </span>
                              </div>
                              <p className={`text-xs mb-3 ${isSender ? "text-blue-200" : "text-gray-600 dark:text-gray-400"} line-clamp-2`}>
                                {m.content.task_description || "No description provided"}
                              </p>
                              <div className={`flex justify-between text-[10px] font-bold uppercase pt-3 border-t ${isSender ? "border-white/20" : "border-gray-200 dark:border-gray-600"}`}>
                                <div className="flex items-center gap-1">
                                  <Clock size={12} className={isSender ? "text-blue-300" : "text-blue-500"} />
                                  <span>{formatTaskDate(m.content.task_deadline)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Flag size={12} className={isSender ? "text-blue-300" : "text-red-500"} />
                                  <span>{m.content.task_priority}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className={`text-[10px] mt-1 opacity-60 dark:text-gray-100 font-medium ${isSender ? "text-right" : "text-left"}`}>
                      {m.createdAt && formatTime(m.createdAt)}
                      {isSender && m.read && <span className="text-blue-500 ml-1 font-bold">Seen</span>}
                    </div>
                  </div>
                  {isSender && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold ml-2 flex-shrink-0 shadow-sm">
                      {user.name?.[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 bg-white dark:bg-gray-800">
        {filePreviews.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
            {filePreviews.map((preview, idx) => (
              <div key={idx} className="relative p-2 border border-gray-300 dark:border-gray-500 rounded-lg flex items-center bg-white dark:bg-gray-600">
                <button
                  onClick={() => removeFilePreview(idx)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 z-10 shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
                <FileIcon className="w-4 h-4 mr-2 text-blue-500" />
                <span className="text-xs text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{preview.fileName}</span>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end space-x-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
          >
            <Smile className="w-6 h-6" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 z-10 left-0 shadow-2xl">
              <EmojiPicker
                onEmojiClick={(e) => {
                  setInput((prev) => prev + e.emoji);
                }}
                height={350}
                width={300}
                theme={theme}
              />
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
            id="project-file-input"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
          >
            <Paperclip className="w-6 h-6" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 resize-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 h-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            placeholder="Type a message..."
            disabled={isSending || isRecording}
          />

          <button
            onClick={handleMicClick}
            className={`p-3 rounded-xl transition-all ${
              isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
            disabled={isSending}
          >
            <Mic className={`w-6 h-6 ${isRecording ? "fill-white" : ""}`} />
          </button>

          <button
            onClick={sendMessage}
            className={`p-3 rounded-xl transition-all text-white ${
              isSending ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={isSending}
          >
            {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>

          {isRecording && (
            <button
              onClick={cancelRecording}
              className="p-3 rounded-xl bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 transition-colors ml-2"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Media Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 text-white text-3xl hover:text-gray-300 transition-colors"
          >
            <X size={32} />
          </button>

          {mediaList.length > 1 && (
            <>
              <button
                onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length)}
                className="absolute left-4 text-white text-5xl opacity-75 hover:opacity-100 p-4 transition-all"
              >
                ‹
              </button>
              <button
                onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length)}
                className="absolute right-4 text-white text-5xl opacity-75 hover:opacity-100 p-4 transition-all"
              >
                ›
              </button>
            </>
          )}

          <div className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center">
            {mediaList[currentMediaIndex].type === "image" ? (
              <Image
                src={mediaList[currentMediaIndex].content || "/fallback-image.png"}
                alt={mediaList[currentMediaIndex].fileName}
                width={1200}
                height={800}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            ) : (
              <video
                src={mediaList[currentMediaIndex].content}
                controls
                autoPlay
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            )}
            <div className="mt-4 text-white font-medium">{mediaList[currentMediaIndex].fileName}</div>
            <div className="text-gray-400 text-sm">
              {currentMediaIndex + 1} / {mediaList.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectChat;