"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation"; 
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { db } from "@/firebase/Firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,   
} from "firebase/firestore";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { LocalNotifications, ActionPerformed } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

// --- Time Formatting Function ---
function formatTimeAgo(timestamp: any): string {
  if (!timestamp) return "";
  const now = new Date();
  const sentDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((now.getTime() - sentDate.getTime()) / 1000);

  if (seconds < 60) return "just now";
  let interval = seconds / 3600;
  if (interval > 24) return Math.floor(seconds / 86400) + "d ago";
  if (interval > 1) return Math.floor(interval) + "h ago";
  return Math.floor(seconds / 60) + "min ago";
}

interface Notification {
  id: string;
  title: string;
  body: string;
  sentAt: any;
  SenderID?: number;
  read: boolean;
  link?: string;
  type?: string;
  projectID?: string | number;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFirstRun = useRef(true); 

  const router = useRouter(); 
  const dispatch = useDispatch<AppDispatch>();
  const { items: workers } = useSelector((state: RootState) => state.workers);

  // --- Optimized Navigation Logic ---
  const getDestination = useCallback((n: any) => {
    const type = (n.type || "").toLowerCase();
    const title = (n.title || "").toLowerCase();
    const sID = n.SenderID || n.senderID;
    const pID = n.projectID || n.projectId;

    // 1. Direct Link (Sab se pehle)
    if (n.link) return n.link;

    // 2. Project Chat Logic (Strict check: sirf projectchat type par)
    if (type === "projectchat" && sID && pID) {
      return `/project-worker/${sID}?projectid=${pID}`;
    }

    // 3. Simple Chat Logic
    if (type === "chat" || title.includes("chat")) {
      return "/chat";
    }

    // 4. Default Fallback
    return "/";
  }, []);

  // --- Handle Push Notifications ---
  const triggerPush = useCallback(async (n: Notification) => {
    const destination = getDestination(n);

    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [{
          title: n.title || "RBS Update",
          body: n.body || "New update received",
          id: Math.floor(Math.random() * 10000),
          extra: { destination } 
        }]
      });
    } else if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(n.title, {
        body: n.body,
        icon: '/images/logo/logo-icon.png',
        data: { url: destination }, 
        tag: n.id || `notif-${Date.now()}`,
        renotify: true
      });
    }
  }, [getDestination]);

  // --- Native Listener & Initial Data ---
  useEffect(() => {
    dispatch(fetchWorkers());

    if (Capacitor.isNativePlatform()) {
      const listener = LocalNotifications.addListener("localNotificationActionPerformed", (action: ActionPerformed) => {
        const path = action.notification.extra?.destination;
        if (path) router.push(path);
      });
      return () => { listener.remove(); };
    }
  }, [dispatch, router]);

  // --- Firestore Real-time Listener ---
  useEffect(() => {
    if (workers.length === 0) return;

    const q = query(collection(db, "notification"), orderBy("sentAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Notification[] = [];
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !isFirstRun.current) {
          const newNotif = { id: change.doc.id, ...change.doc.data() } as Notification;
          if (workers.some(w => w.id === newNotif.SenderID)) {
            triggerPush(newNotif);
          }
        }
      });

      snapshot.forEach((d) => {
        const data = d.data();
        if (workers.some(w => w.id === data.SenderID)) {
          fetched.push({ id: d.id, ...data, read: data.read ?? false } as Notification);
        }
      });

      setNotifications(fetched);
      setIsLoading(false);
      isFirstRun.current = false; 
    });

    return () => unsubscribe();
  }, [workers, triggerPush]);

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    unread.forEach(async (n) => {
      await updateDoc(doc(db, "notification", n.id), { read: true });
    });
  };

  const getWorkerInfo = (SenderID?: number) => {
    const worker = workers.find((w) => w.id === SenderID);
    if (!worker) return { name: "System", initials: "R", image: null };
    return { 
      name: `${worker.firstName} ${worker.lastName}`.trim(), 
      initials: (worker.firstName?.[0] || "") + (worker.lastName?.[0] || ""), 
      image: worker.profilePictureUrl || null 
    };
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAllAsRead(); }}
        className="relative flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-full h-10 w-10 dark:border-gray-800 dark:bg-gray-900"
      >
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
            {notifications.filter(n => !n.read).length}
          </span>
        )}
        <svg className="fill-current" width="18" height="18" viewBox="0 0 20 20">
          <path d="M10 1.54248C10.4143 1.54248 10.75 1.87827 10.75 2.29248V2.83613C13.9174 3.20733 16.375 5.9004 16.375 9.16748V14.4591H16.6667C17.0809 14.4591 17.4167 14.7949 17.4167 15.2091C17.4167 15.6234 17.0809 15.9591 16.6667 15.9591H3.33337C2.91916 15.9591 2.58337 15.6234 2.58337 15.2091C2.58337 14.7949 2.91916 14.4591 3.33337 14.4591H3.62504V9.16748C3.62504 5.9004 6.08266 3.20733 9.25004 2.83613V2.29248C9.25004 1.87827 9.58583 1.54248 10 1.54248Z" fill="currentColor" />
        </svg>
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="fixed right-4 mt-3 flex h-[450px] w-80 md:w-[360px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-800 dark:bg-gray-dark z-[999]"> 
        <div className="flex items-center justify-between pb-2 mb-2 border-b dark:border-gray-700">
          <h5 className="text-sm font-bold dark:text-gray-200">Notifications</h5>
        </div>

        <ul className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : notifications.length > 0 ? (
            notifications.map((n) => {
              const { name, initials, image } = getWorkerInfo(n.SenderID);
              const path = getDestination(n); 
              return (
                <li key={n.id}>
                  <DropdownItem
                    onItemClick={() => { setIsOpen(false); router.push(path); }}
                    className={`flex gap-3 p-3 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 ${!n.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                  >
                    <div className="relative w-10 h-10 flex-shrink-0">
                      {image ? <img src={image} className="w-full h-full rounded-full object-cover" alt="" /> : <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xs bg-blue-600">{initials}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{n.title}</span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-blue-600"></span>}
                      </div>
                      <p className="text-[10px] text-gray-500">From: {name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{n.body}</p>
                      <span className="text-[10px] text-gray-400 mt-1 block italic">{formatTimeAgo(n.sentAt)}</span>
                    </div>
                  </DropdownItem>
                </li>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-xs text-gray-500">No new notifications.</div>
          )}
        </ul>
      </Dropdown>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; }
      `}</style>
    </div>
  );
}