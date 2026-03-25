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

// --- Time Formatting ---
function formatTimeAgo(timestamp: any): string {
  if (!timestamp) return "";
  const now = new Date();
  const sentDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((now.getTime() - sentDate.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min ago";
  return Math.floor(seconds) + "s ago";
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

  // --- Unified Navigation Logic ---
  const getDestination = useCallback((n: any) => {
    if (n.link) return n.link;
    const type = (n.type || "").toLowerCase();
    const title = (n.title || "").toLowerCase();

    if (type === "chat" || title.includes("chat")) {
      return "/chat";
    } else {
      const sID = n.SenderID || n.senderID;
      const pID = n.projectID || n.projectId || 'default';
      return `/project-worker/${sID}?projectid=${pID}`;
    }
  }, []);

  // --- Push Trigger ---
  const triggerPush = useCallback(async (n: Notification) => {
    const destination = getDestination(n);
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [{
          title: n.title || "New Message",
          body: n.body || "New update in RBS",
          id: Math.floor(Math.random() * 10000),
          extra: { destination } 
        }]
      });
    } else if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(n.title, {
        body: n.body,
        data: { url: destination }, 
        tag: n.id,
        renotify: true
      });
    }
  }, [getDestination]);

  useEffect(() => {
    dispatch(fetchWorkers());
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener("localNotificationActionPerformed", (action: ActionPerformed) => {
        const path = action.notification.extra?.destination;
        if (path) router.push(path);
      });
    }
  }, [dispatch, router]);

  useEffect(() => {
    if (workers.length === 0) return;

    const q = query(collection(db, "notification"), orderBy("sentAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Notification[] = [];
      
      snapshot.docChanges().forEach((change) => {
        // Sirf REAL-TIME naye notifications par alert do
        if (change.type === "added" && !isFirstRun.current) {
          const newNotif = change.doc.data() as Notification;
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
      isFirstRun.current = false; // Isse purane notifications repeat nahi honge
    });

    return () => unsubscribe();
  }, [workers, triggerPush]);

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, "notification", n.id), { read: true });
      }
    } catch (error) { console.error(error); }
  };

  const getWorkerInfo = (SenderID?: number) => {
    const worker = workers.find((w) => w.id === SenderID);
    if (!worker) return { name: "Unknown", initials: "?", image: null };
    const first = worker.firstName?.trim() || "";
    const last = worker.lastName?.trim() || "";
    return { 
      name: `${first} ${last}`.trim(), 
      initials: (first[0] || "") + (last[0] || "") || "?", 
      image: worker.profilePictureUrl || null 
    };
  };

  return (
    <div className="relative">
      <button onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAllAsRead(); }}
        className="relative flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-full h-10 w-10 dark:border-gray-800 dark:bg-gray-900"
      >
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {notifications.filter(n => !n.read).length}
          </span>
        )}
        <svg className="fill-current" width="18" height="18" viewBox="0 0 20 20">
          <path d="M10 1.54248C10.4143 1.54248 10.75 1.87827 10.75 2.29248V2.83613C13.9174 3.20733 16.375 5.9004 16.375 9.16748V14.4591H16.6667C17.0809 14.4591 17.4167 14.7949 17.4167 15.2091C17.4167 15.6234 17.0809 15.9591 16.6667 15.9591H3.33337C2.91916 15.9591 2.58337 15.6234 2.58337 15.2091C2.58337 14.7949 2.91916 14.4591 3.33337 14.4591H3.62504V9.16748C3.62504 5.9004 6.08266 3.20733 9.25004 2.83613V2.29248C9.25004 1.87827 9.58583 1.54248 10 1.54248Z" fill="currentColor" />
        </svg>
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="fixed right-4 mt-3 w-80 md:w-96 bg-white dark:bg-gray-dark shadow-xl rounded-2xl z-[999]">
        <div className="p-3 border-b dark:border-gray-700 font-bold">Notifications</div>
        <ul className="max-h-96 overflow-y-auto custom-scrollbar">
          {notifications.length > 0 ? notifications.map((n) => {
            const { name, initials, image } = getWorkerInfo(n.SenderID);
            return (
              <li key={n.id}>
                <DropdownItem onItemClick={() => { setIsOpen(false); router.push(getDestination(n)); }}
                  className={`flex gap-3 p-3 border-b dark:border-gray-800 ${!n.read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {image ? <img src={image} alt="" className="object-cover w-full h-full" /> : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold truncate dark:text-white">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1"></span>}
                    </div>
                    <p className="text-[11px] text-gray-500">From: {name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{n.body}</p>
                    <span className="text-[10px] text-gray-400 italic">{formatTimeAgo(n.sentAt)}</span>
                  </div>
                </DropdownItem>
              </li>
            );
          }) : <div className="p-10 text-center text-gray-500 text-xs">No notifications yet.</div>}
        </ul>
      </Dropdown>
    </div>
  );
}