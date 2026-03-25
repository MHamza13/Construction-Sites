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

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const appStartTime = useRef(Date.now());
  const isFirstRun = useRef(true); 

  const router = useRouter(); 
  const dispatch = useDispatch<AppDispatch>();
  const { items: workers } = useSelector((state: RootState) => state.workers);

  // --- Updated Navigation Logic (With Chat ID) ---
  const getDestination = useCallback((n: any) => {
    const rawType = (n.Type || n.type || "").toLowerCase().trim().replace(/\s/g, "");
    const sID = n.SenderID || n.senderID;
    const pID = n.projectId || n.projectID || n.projectid;
    
    if (n.link) return n.link;

    // 1. Project Chat Logic
    if (rawType === "projectchat" || rawType.includes("projectchat")) {
      if (sID && pID) return `/project-worker/${sID}?projectid=${pID}`;
      return "/chat";
    }

    // 2. Normal Chat Logic (Search Params mein ID bhej di)
    if (rawType === "chat" || (n.title && n.title.toLowerCase().includes("chat"))) {
      return sID ? `/chat?id=${sID}` : "/chat";
    }

    return "/";
  }, []);

  const triggerPush = useCallback(async (n: any) => {
    const destination = getDestination(n);
    const title = n.title || "RBS Update";
    const body = n.body || "New update received";

    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [{
          title, body,
          id: Math.floor(Math.random() * 10000),
          extra: { destination, notifId: n.id },
          smallIcon: "res://notification_icon",
        }]
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        body,
        icon: "/images/logo/logo-icon.png",
        badge: "/images/logo/logo-icon.png",
        data: { url: destination },
        tag: n.id,
        renotify: true
      });
    }
  }, [getDestination]);

  useEffect(() => {
    dispatch(fetchWorkers());
    if ("serviceWorker" in navigator && !Capacitor.isNativePlatform()) {
      navigator.serviceWorker.register("/custom-sw.js");
    }
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    if (Capacitor.isNativePlatform()) {
      const listener = LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
        const path = action.notification.extra?.destination;
        if (path) router.push(path);
      });
      return () => { listener.remove(); };
    }
  }, [dispatch, router]);

  useEffect(() => {
    if (workers.length === 0) return;
    const q = query(collection(db, "notification"), orderBy("sentAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: any[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !isFirstRun.current) {
          const data = change.doc.data();
          const sentAtMillis = data.sentAt?.toDate ? data.sentAt.toDate().getTime() : new Date(data.sentAt).getTime();
          if (sentAtMillis > appStartTime.current) {
            triggerPush({ id: change.doc.id, ...data });
          }
        }
      });

      snapshot.forEach((d) => {
        const data = d.data();
        fetched.push({ id: d.id, ...data, read: data.read ?? false });
      });

      const validNotifications = fetched.filter((n) =>
        workers.some((w) => String(w.id) === String(n.SenderID || n.senderID))
      );

      setNotifications(validNotifications);
      setIsLoading(false);
      isFirstRun.current = false; 
    });
    return () => unsubscribe();
  }, [workers, triggerPush]);

  const handleNotificationClick = async (n: any) => {
    setIsOpen(false);
    const path = getDestination(n);
    if (!n.read) {
        try { await updateDoc(doc(db, "notification", n.id), { read: true }); } catch (e) {}
    }
    router.push(path);
  };

  const getWorkerInfo = (sID?: any) => {
    const worker = workers.find((w) => String(w.id) === String(sID));
    if (!worker) return { name: "System", initials: "R", image: null };
    const first = worker.firstName || "";
    const last = worker.lastName || "";
    return { name: `${first} ${last}`, initials: (first[0] || "") + (last[0] || ""), image: worker.profilePictureUrl };
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white dark:ring-gray-900">
            {unreadCount}
          </span>
        )}
        <svg className="fill-current" width="18" height="18" viewBox="0 0 20 20"><path d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.2091 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z" fill="currentColor" /></svg>
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="fixed left-4 right-4 md:absolute md:left-auto md:right-0 mt-3 flex h-[450px] w-auto md:w-[360px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-[999]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-sm md:text-base font-bold text-gray-800 dark:text-gray-200">Notifications</h5>
        </div>
        <ul className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : notifications.length > 0 ? (
            notifications.map((n) => {
              const { name, initials, image } = getWorkerInfo(n.SenderID || n.senderID);
              return (
                <li key={n.id}>
                  <DropdownItem onItemClick={() => handleNotificationClick(n)} className={`flex gap-3 rounded-lg border-b border-gray-50 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 ${!n.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                    <div className="relative w-10 h-10 flex-shrink-0">
                      {image ? <img src={image} className="w-full h-full rounded-full object-cover" alt="" /> : <div className="absolute inset-0 rounded-full flex items-center justify-center text-white font-bold text-xs bg-blue-600">{initials}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs md:text-sm text-gray-900 dark:text-white truncate">{n.title}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{n.body}</p>
                      <span className="text-[10px] text-gray-400 mt-1.5 block italic">{formatTimeAgo(n.sentAt)}</span>
                    </div>
                  </DropdownItem>
                </li>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full p-4 text-gray-500 text-xs">No new notifications.</div>
          )}
        </ul>
      </Dropdown>
    </div>
  );
}