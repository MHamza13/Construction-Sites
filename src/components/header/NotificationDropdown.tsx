"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
 
// --- Time Formatting Function ---
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

// --- Interfaces ---
interface Notification {
  id: string;
  title: string;
  body: string;
  sentAt: any;
  SenderID?: number;
  read: boolean;
}

interface Worker {
  id: number;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useDispatch<AppDispatch>();
  const { items: workers } = useSelector((state: RootState) => state.workers);

  // Fetch workers once
  useEffect(() => {
    dispatch(fetchWorkers());
  }, [dispatch]);

  // Fetch notifications
  useEffect(() => {
    const q = query(collection(db, "notification"), orderBy("sentAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedNotifications: Notification[] = [];
        querySnapshot.forEach((d) => {
          const data = d.data();
          fetchedNotifications.push({
            id: d.id,
            ...data,
            read: data.read ?? false,
          } as Notification);
        });

        // ✅ Only keep notifications whose SenderID matches a worker’s id
        const validNotifications = fetchedNotifications.filter((n) =>
          workers.some((w) => w.id === n.SenderID)
        );

        setNotifications(validNotifications);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications: ", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [workers]); 

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      for (const n of unread) {
        const ref = doc(db, "notification", n.id);
        await updateDoc(ref, { read: true });
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) markAllAsRead();
  };

  const closeDropdown = () => setIsOpen(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Get worker info
  const getWorkerInfo = (SenderID?: number) => {
    const worker = workers.find((w) => w.id === SenderID);
    if (!worker) return { name: "Unknown", initials: "?", image: null };

    const first = worker.firstName?.trim() || "";
    const last = worker.lastName?.trim() || "";
    const name = `${first} ${last}`.trim();
    const initials = (first[0] || "") + (last[0] || "");
    const image = worker.profilePictureUrl || null;

    return { name, initials: initials || "?", image };
  };

  return (
    <div className="relative">
      {/* --- Bell Icon --- */}
      <button
        onClick={handleClick}
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-10 w-10 md:h-11 md:w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-500 text-[10px] md:text-xs font-bold text-white ring-2 ring-white dark:ring-gray-900">
            {unreadCount}
          </span>
        )}
        <svg
          className="fill-current"
          width="18"
          height="18"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* --- Dropdown --- */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        // Fixed positioning for mobile to keep it on the left/screen-center, and absolute for desktop
        className="fixed left-4 right-4 md:absolute md:left-auto md:right-0 mt-3 flex h-[450px] w-auto md:w-[360px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark lg:right-0 z-[999]"
      > 
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-sm md:text-base font-bold text-gray-800 dark:text-gray-200">
            Notifications
          </h5>
          <button
            onClick={closeDropdown}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Notifications List */}
        <ul className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
               <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-xs text-gray-500">Loading...</p>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((n) => {
              const { name, initials, image } = getWorkerInfo(n.SenderID);
              return (
                <li key={n.id}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    className={`flex gap-3 rounded-lg border-b border-gray-50 p-2.5 md:p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 transition-colors ${
                      !n.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative w-9 h-9 md:w-10 md:h-10 flex-shrink-0">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          className="w-full h-full rounded-full object-cover ring-1 ring-gray-100 dark:ring-gray-700"
                        />
                      ) : (
                        <div className="absolute inset-0 rounded-full flex items-center justify-center text-white font-bold text-xs bg-gradient-to-br from-blue-500 to-indigo-600">
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-xs md:text-sm text-gray-900 dark:text-white truncate">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-1">
                        From: <span className="font-semibold text-gray-700 dark:text-gray-200">{name}</span>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 block italic">
                        {formatTimeAgo(n.sentAt)}
                      </span>
                    </div>
                  </DropdownItem>
                </li>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                No new notifications.
              </p>
            </div>
          )}
        </ul>
      </Dropdown>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
        }
      `}</style>
    </div>
  );
}