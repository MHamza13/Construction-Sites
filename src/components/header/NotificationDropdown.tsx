"use client";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation"; 
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

// --- Interfaces ---
interface Notification {
  id: string;
  title: string;
  body: string;
  sentAt: any;
  SenderID?: number;
  read: boolean;
  link?: string; 
  type?: "project" | "chat" | "general";
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

  // --- Common Routing Logic (For UI & Capacitor Click) ---
  const handleNavigation = (data: any) => {
    const lowerTitle = (data.title || "").toLowerCase();
    const destination = data.link || (data.type === "chat" || lowerTitle.includes("chat") 
      ? "/chat" 
      : `/project-worker/${data.SenderID}?projectid=${data.projectID || 'default'}`);

    router.push(destination);
  };

  // --- Capacitor Specific Listener ---
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const listener = LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (action: ActionPerformed) => {
          const data = action.notification.extra;
          if (data) handleNavigation(data);
        }
      );
      return () => { listener.remove(); };
    } else {
      // PWA Permission Request
      if ("Notification" in window) {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    dispatch(fetchWorkers());
  }, [dispatch]);

  // --- TRIGGER NOTIFICATION (Mobile & PWA) ---
  const triggerPush = async (n: Notification) => {
    const destination = n.link || `/project-worker/${n.SenderID}?projectid=${n.projectID || 'default'}`;

    // 1. Mobile (Capacitor)
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [{
          title: n.title || "New Message",
          body: n.body || "You have a new notification",
          id: 1,
          extra: { ...n, link: destination }
        }]
      });
    } 
    // 2. PWA (Web Browser)
    else if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(n.title || "New Message", {
        body: n.body || "Click to open",
        icon: '/images/logo/logo-icon.png',
        badge: '/images/logo/logo-icon.png',
        data: { link: destination } // Ye custom-sw.js mein use hoga
      });
    }
  };

  useEffect(() => {
    const q = query(collection(db, "notification"), orderBy("sentAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !isFirstRun.current) {
          const newNotif = change.doc.data() as Notification;
          if (workers.some(w => w.id === newNotif.SenderID)) {
            triggerPush(newNotif);
          }
        }
      });

      const fetched: Notification[] = [];
      querySnapshot.forEach((d) => {
        fetched.push({ id: d.id, ...d.data(), read: d.data().read ?? false } as Notification);
      });

      setNotifications(fetched.filter(n => workers.some(w => w.id === n.SenderID)));
      setIsLoading(false);
      isFirstRun.current = false;
    });

    return () => unsubscribe();
  }, [workers]);

  const handleNotificationClick = async (n: Notification) => {
    setIsOpen(false); 
    if (!n.read) {
      const ref = doc(db, "notification", n.id);
      await updateDoc(ref, { read: true });
    }
    handleNavigation(n);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative h-10 w-10 border rounded-full flex items-center justify-center dark:border-gray-800">
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 shadow-xl rounded-lg border dark:border-gray-800 z-50 overflow-hidden">
          <div className="p-3 border-b dark:border-gray-800 font-bold">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs text-gray-500 truncate">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}