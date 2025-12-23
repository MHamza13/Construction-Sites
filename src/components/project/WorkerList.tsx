"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { fetchShiftsByProjectId } from "@/redux/projectShifts/projectShifts";
import { fetchWorkers, Worker } from "@/redux/worker/workerSlice";
import { Users, XCircle, Clock, MessageSquare } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/Firebase";
import { toast } from "react-toastify";

// Reused Types and Helper from ProjectChat
interface ChatMessage {
  id: string;
  content: string | { task_name?: string };
  type: "text" | "image" | "video" | "voice" | "document" | "task_card";
  senderId: string;
  senderName: string;
  createdAt?: Date;
  uploading?: boolean;
  read?: boolean;
  fileName?: string;
}

export const generateChatId = (workerId: number, projectId: number) => {
  return `project_chat_${projectId}_${workerId}`;
};

interface ProjectShift {
  Id: number;
  WorkerId: number;
  ProjectId: number;
  CheckIn: string;
  CheckInLat: number;
  CheckInLong: number;
  EndShift: string | null;
  EndShiftLat: number | null;
  EndShiftLong: number | null;
  status: "Open" | "Closed" | "Not Started";
}

interface WorkerListProps {
  projectId: string;
  assignedUserIds: string[];
}

const formatDuration = (dateTimeString: string | null, isActive: boolean): string => {
  if (!dateTimeString) return isActive ? "Unknown Time" : "N/A";
  const date = new Date(dateTimeString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 60 && diffMinutes >= 0) {
    return `${diffMinutes} min${diffMinutes > 1 ? "s" : ""} ago`;
  }
  if (diffHours < 24 && diffHours >= 0) {
    return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString();
};

const calculateTotalHours = (workerShifts: ProjectShift[]): string => {
  const totalMs = workerShifts.reduce((total, shift) => {
    if (shift.EndShift) {
      const checkIn = new Date(shift.CheckIn).getTime();
      const endShift = new Date(shift.EndShift).getTime();
      return total + (endShift - checkIn);
    }
    return total;
  }, 0);

  const totalHours = Math.round(totalMs / (1000 * 60 * 60));
  return totalHours > 0 ? `${totalHours} hr${totalHours > 1 ? "s" : ""}` : "0 hr";
};

const calculateDaysSinceCheckout = (lastCheckout: string | null): string => {
  if (!lastCheckout) return "N/A";
  const checkoutDate = new Date(lastCheckout);
  const now = new Date();
  const diffMs = now.getTime() - checkoutDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? `${diffDays} day${diffDays > 1 ? "s" : ""} ago` : "Today";
};

const getInitialsAndColor = (firstName: string, lastName: string) => {
  const initials = (firstName?.[0] || "N").toUpperCase() + (lastName?.[0] || "A").toUpperCase();
  const colors = ["bg-blue-500", "bg-red-500", "bg-green-500", "bg-yellow-600", "bg-purple-500", "bg-pink-500"];
  const hash = (firstName + lastName).length % colors.length;
  return { initials, colorClass: colors[hash] };
};

interface WorkerCardProps {
  shift: ProjectShift | null;
  projectId: string;
  workerDetails: Worker | undefined;
  status: "Open" | "Closed" | "Not Started";
  totalHours: string;
  daysSinceCheckout: string;
  unreadMessagesCount: number;
}

const WorkerCard = ({
  shift,
  projectId,
  workerDetails,
  status,
  totalHours,
  daysSinceCheckout,
  unreadMessagesCount,
}: WorkerCardProps) => {
  const router = useRouter();

  const isActive = status === "Open";
  const isNotStarted = status === "Not Started";

  let statusText, statusColor, bgColor, timeRef, durationLabel;

  if (isNotStarted) {
    statusText = "Not Started";
    statusColor = "text-yellow-600";
    bgColor = "bg-yellow-50 border-yellow-200";
    durationLabel = "—";
  } else if (isActive) {
    statusText = "Checked In";
    statusColor = "text-green-600";
    bgColor = "bg-green-50 border-green-200";
    timeRef = shift?.CheckIn || null;
    durationLabel = formatDuration(timeRef, isActive);
  } else {
    statusText = "Checked Out";
    statusColor = "text-red-600";
    bgColor = "bg-red-50 border-red-200";
    timeRef = shift?.EndShift || null;
    durationLabel = formatDuration(timeRef, isActive) || "N/A";
  }

  const roleText = workerDetails?.specializationName ? `${workerDetails.specializationName}` : "General Worker";
  const name = `${workerDetails?.firstName || ""} ${workerDetails?.lastName || ""}`.trim() || "User";
            // Build full image URL
  const profileImageUrl = workerDetails?.profilePictureUrl
      ? workerDetails?.profilePictureUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;

  const fullName = workerDetails ? `${workerDetails.firstName} ${workerDetails.lastName}` : `Worker ID: ${shift?.WorkerId || "Unknown"}`;
  const workderID = workerDetails ? `${workerDetails.id}` : `Worker ID: ${shift?.WorkerId || "Unknown"}`;
  const WorkerEmail = workerDetails ? `${workerDetails.email}` : `Worker ID: ${shift?.WorkerId || "Unknown"}`;

  const handleCardClick = () => {
    if (workerDetails?.id) {
      router.push(`/project-worker/${workerDetails.id}?projectid=${projectId}`);
    }
  };

  return (
    <button
      onClick={handleCardClick}
      disabled={!workerDetails?.id}
      className={`
        w-full p-6 border rounded-lg shadow-sm transition-all duration-200
        ${bgColor} hover:shadow-md hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-500
        disabled:opacity-60 disabled:cursor-not-allowed
        dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`rounded-full flex items-center justify-center font-bold text-white text-sm`}>
            <img src={profileImageUrl} alt=""  className="w-11 h-11 rounded-full"/>
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm"></p>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{fullName}</p>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{WorkerEmail} (Id: {workderID})</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{roleText}</p>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="flex items-center text-blue-600 dark:text-blue-400">
                <Clock className="w-3 h-3 mr-1" />
                {totalHours}
              </span>
              {unreadMessagesCount > 0 && (
                <span className="flex items-center text-red-600 dark:text-red-400 font-bold">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Unread {unreadMessagesCount}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${statusColor}`}>{statusText}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{durationLabel}</p>
          {!isActive && !isNotStarted && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Last: {daysSinceCheckout}</p>
          )}
        </div>
      </div>
    </button>
  );
};

const WorkerList = ({ projectId, assignedUserIds }: WorkerListProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { shifts, loading: shiftsLoading } = useSelector(
    (state: RootState) => state.projectShifts || { shifts: [], loading: false }
  );
  const { items: allWorkers, loading: workersLoading } = useSelector(
    (state: RootState) => state.workers || { items: [], loading: false }
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [messages, setMessages] = useState<{ [workerId: number]: ChatMessage[] }>({});

  const loading = shiftsLoading || workersLoading;

  useEffect(() => {
    if (projectId) {
      dispatch(fetchShiftsByProjectId(projectId));
    }
    dispatch(fetchWorkers());
  }, [dispatch, projectId]);

  // Real-time Firebase Messages Listener
  useEffect(() => {
    if (!projectId || !user?.userId || assignedUserIds.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    assignedUserIds.forEach((idStr) => {
      const workerId = parseInt(idStr);
      if (isNaN(workerId)) return;

      const chatId = generateChatId(workerId, Number(projectId));
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const msgs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            read: doc.data().read ?? false,
          })) as ChatMessage[];

          setMessages((prev) => ({ ...prev, [workerId]: msgs }));
        },
        (error) => {
          console.error("Message fetch error:", error);
          toast.error(`Failed to load messages for worker ${workerId}`);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [projectId, assignedUserIds, user?.userId]);

  const workerMap = useMemo(() => {
    return allWorkers.reduce((acc: { [key: number]: Worker }, worker: Worker) => {
      if (worker.id) acc[worker.id] = worker;
      return acc;
    }, {});
  }, [allWorkers]);

  const workerStats = useMemo(() => {
    const stats: { [key: number]: { totalHours: string; daysSinceCheckout: string } } = {};
    allWorkers.forEach((worker) => {
      if (worker.id) {
        const workerShifts = shifts.filter((s) => s.WorkerId === worker.id);
        const lastClosed = workerShifts
          .filter((s) => s.status === "Closed")
          .sort((a, b) => new Date(b.EndShift || 0).getTime() - new Date(a.EndShift || 0).getTime())[0];

        stats[worker.id] = {
          totalHours: calculateTotalHours(workerShifts),
          daysSinceCheckout: calculateDaysSinceCheckout(lastClosed?.EndShift || null),
        };
      }
    });
    return stats;
  }, [shifts, allWorkers]);

  const getUnreadCount = (workerId: number): number => {
    const msgs = messages[workerId] || [];
    return msgs.filter((m) => m.senderId !== user?.userId && !m.read && !m.uploading).length;
  };

  const workerShiftStatus = useMemo(() => {
    const latestShiftMap: { [key: number]: ProjectShift } = {};
    shifts.forEach((shift) => {
      const existing = latestShiftMap[shift.WorkerId];
      if (!existing || new Date(shift.CheckIn) > new Date(existing.CheckIn)) {
        latestShiftMap[shift.WorkerId] = shift;
      }
    });

    return assignedUserIds
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id))
      .map((workerId) => {
        const shift = latestShiftMap[workerId] || null;
        const status = !shift ? "Not Started" : shift.status === "Open" ? "Open" : "Closed";
        return { workerId, shift, status, unreadMessagesCount: getUnreadCount(workerId) };
      });
  }, [shifts, assignedUserIds, messages, user?.userId]);

  // SORT BY UNREAD COUNT (DESC)
  const activeWorkers = useMemo(() => {
    return workerShiftStatus
      .filter((w) => w.status === "Open")
      .sort((a, b) => b.unreadMessagesCount - a.unreadMessagesCount);
  }, [workerShiftStatus]);

  const inactiveWorkers = useMemo(() => {
    return workerShiftStatus
      .filter((w) => w.status !== "Open")
      .sort((a, b) => b.unreadMessagesCount - a.unreadMessagesCount);
  }, [workerShiftStatus]);

  const groupedWorkers = { Active: activeWorkers, Inactive: inactiveWorkers };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-3 text-gray-600">Loading workers...</p>
      </div>
    );
  }

  if (workerShiftStatus.length === 0) {
    return (
      <div className="text-center py-12 border-t border-gray-200 dark:border-gray-700">
        <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-500">No workers assigned to this project.</p>
      </div>
    );
  }

  const statusStyles = {
    Active: { title: "Active Workers", color: "green", dot: "animate-pulse" },
    Inactive: { title: "Inactive Workers", color: "red", dot: "" },
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        Project Workforce
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedWorkers).map(([key, list]) => {
          const style = statusStyles[key as "Active" | "Inactive"];
          return (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
              <h3 className={`text-lg font-bold text-${style.color}-600 mb-4 flex items-center`}>
                <span className={`w-3 h-3 rounded-full bg-${style.color}-500 mr-2 ${style.dot}`}></span>
                {style.title} ({list.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {list.length > 0 ? (
                  list.map((w) => (
                    <WorkerCard
                      key={w.workerId}
                      projectId={projectId}
                      shift={w.shift}
                      workerDetails={workerMap[w.workerId]}
                      status={w.status}
                      totalHours={workerStats[w.workerId]?.totalHours || "0 hr"}
                      daysSinceCheckout={workerStats[w.workerId]?.daysSinceCheckout || "N/A"}
                      unreadMessagesCount={w.unreadMessagesCount}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6">No workers</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkerList;