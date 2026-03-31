"use client";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchAllProjectComments,
  markCommentAsRead,
  ProjectComment,
} from "@/redux/projectComments/projectCommentSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { fetchProjects } from "@/redux/projects/projectSlice";
import { CheckCircle, MessageSquare } from "lucide-react";

const pastelColors = [
  "bg-pink-50 border-pink-300 dark:bg-pink-900/40 dark:border-pink-700",
  "bg-blue-50 border-blue-300 dark:bg-blue-900/40 dark:border-blue-700",
  "bg-purple-50 border-purple-300 dark:bg-purple-900/40 dark:border-purple-700",
  "bg-yellow-50 border-yellow-300 dark:bg-yellow-900/40 dark:border-yellow-700",
  "bg-indigo-50 border-indigo-300 dark:bg-indigo-900/40 dark:border-indigo-700",
  "bg-rose-50 border-rose-300 dark:bg-rose-900/40 dark:border-rose-700",
  "bg-cyan-50 border-cyan-300 dark:bg-cyan-900/40 dark:border-cyan-700",
];

interface Project {
  id: string;
  name: string;
}

const ProjectUnredComments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { comments, loading: commentsLoading } = useSelector(
    (state: RootState) => state.projectComments
  );
  const { items: workers } = useSelector((state: RootState) => state.workers);
  const { items: projects } = useSelector((state: RootState) => state.projects);

  // Fetch all data
  useEffect(() => {
    dispatch(fetchAllProjectComments());
    dispatch(fetchWorkers());
    dispatch(fetchProjects());
  }, [dispatch]);

  // Filter unread comments only
  const unreadComments = useMemo(() => {
    return comments.filter((c) => !c.isRead);
  }, [comments]);

  // Color map
  const getCommentColor = useMemo(() => {
    const colorMap: Record<string, string> = {};
    return (id: string) => {
      if (!colorMap[id]) {
        const idx = Math.floor(Math.random() * pastelColors.length);
        colorMap[id] = pastelColors[idx];
      }
      return colorMap[id];
    };
  }, []);

  // Mark as read + REFETCH
  const handleMarkRead = async (commentId: string) => {
    // API call to mark as read
    await dispatch(markCommentAsRead(commentId));
    // Refetching ensures the comment is removed from the unread list
    dispatch(fetchAllProjectComments());
  };

  // Get initials
  const getInitials = (firstName: string, lastName?: string): string => {
    if (!firstName) return "?";
    const first = firstName.trim().charAt(0).toUpperCase();
    const last = lastName?.trim().charAt(0).toUpperCase() || "";
    return first + last;
  };

  // Find project name
  const getProjectName = (projectId: string): string => {
    const project = projects.find((p: Project) => String(p.id) === String(projectId));
    return project?.name || `Project #${projectId}`;
  };

  const loading = commentsLoading || workers.length === 0 || projects.length === 0;

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <MessageSquare className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Unread Comments
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unreadComments.length} unread message{unreadComments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      ) : unreadComments.length === 0 ? (
        <p className="text-center py-6 text-gray-500 dark:text-gray-400">No unread comments found.</p>
      ) : (
        <ul className="space-y-3 h-[420px] overflow-y-auto custom-scrollbar">
          {unreadComments.map((c: ProjectComment) => {
            const worker = workers.find((w) => String(w.id) === String(c.workerId));
            const workerName = worker
              ? `${worker.firstName.trim()} ${worker.lastName.trim()}`  
              : `User #${c.workerId}`;
            const initials = getInitials(worker?.firstName || "", worker?.lastName);
            const colorClass = getCommentColor(c.id);
            const projectName = getProjectName(c.projectId);
            const profileImageUrl = worker?.profilePictureUrl || null;

            return (
              <li
                key={c.id}
                className={`p-3 border rounded-lg text-sm transition-all duration-200 ${colorClass} shadow-sm`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-lg text-gray-900 dark:text-gray-200 font-medium">
                      Project: {projectName}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => handleMarkRead(c._id || c.id)} 
                      className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <CheckCircle size={14} />
                      <span className="hidden sm:inline">Mark Read</span>
                    </button>

                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(c.createdOn).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Important Type */}
                <span className="inline-block font-semibold text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {c.importantType || "General"}
                </span>

                {/* Comment Text */}
                <p className="text-gray-700 dark:text-gray-300 mt-2 mb-2 leading-relaxed">
                  {c.text || (c as any).commentText}
                </p>

                {/* Attachments Logic */}
                {c.attachments && c.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(() => {
                      try {
                        const parsed = typeof c.attachments === 'string' ? JSON.parse(c.attachments) : c.attachments;
                        if (Array.isArray(parsed)) {
                          return parsed.map((img: string, i: number) => {
                            const imgUrl = img.startsWith("http")
                              ? img
                              : `${process.env.NEXT_PUBLIC_FILE_URL}/${img.replace(/^\/+/, "")}`;
                            return (
                              <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm">
                                <img src={imgUrl} alt="Attachment" className="w-full h-full object-cover" />
                              </div>
                            );
                          });
                        }
                      } catch (err) { return null; }
                    })()}
                  </div>
                )}

                {/* Worker Info */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="relative w-8 h-8 flex-shrink-0">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={workerName}
                        className="w-full h-full rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center bg-blue-500 text-white font-bold text-xs">
                        {initials}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[140px]">
                    {workerName}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ProjectUnredComments;