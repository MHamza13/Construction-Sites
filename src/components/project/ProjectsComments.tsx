"use client";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchProjectComments,
  markCommentAsRead,
  ProjectComment,
} from "@/redux/projectComments/projectCommentSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { CheckCircle } from "lucide-react";

// Same pastel colors as InvoiceTable (solid, no gradient)
const pastelColors = [
  "bg-pink-50 border-pink-300 dark:bg-pink-900/40 dark:border-pink-700",
  "bg-blue-50 border-blue-300 dark:bg-blue-900/40 dark:border-blue-700",
  "bg-purple-50 border-purple-300 dark:bg-purple-900/40 dark:border-purple-700",
  "bg-yellow-50 border-yellow-300 dark:bg-yellow-900/40 dark:border-yellow-700",
  "bg-indigo-50 border-indigo-300 dark:bg-indigo-900/40 dark:border-indigo-700",
  "bg-rose-50 border-rose-300 dark:bg-rose-900/40 dark:border-rose-700",
  "bg-cyan-50 border-cyan-300 dark:bg-cyan-900/40 dark:border-cyan-700",
];

interface ProjectsCommentsProps {
  projectId: string;
}

const ProjectsComments: React.FC<ProjectsCommentsProps> = ({ projectId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { comments, loading } = useSelector((state: RootState) => state.projectComments);
  const { items: workers } = useSelector((state: RootState) => state.workers);

  // Direct base URL (no .env)
  const IMAGE_BASE_URL = "https://salmanfarooq1-001-site1.jtempurl.com";

  // Consistent color per comment
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

  // Fetch data
  useEffect(() => {
    if (projectId) dispatch(fetchProjectComments(projectId));
    dispatch(fetchWorkers());
  }, [dispatch, projectId]);

  // Mark as read
  const handleMarkRead = async (commentId: string) => {
    await dispatch(markCommentAsRead(commentId));
    dispatch(fetchProjectComments(projectId));
  };

  // Get initials (same as InvoiceTable)
  const getInitials = (firstName: string, lastName?: string): string => {
    if (!firstName) return "?";
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : "";
    return first + last;
  };

  return (
    <div className="space-y-4 p-4 mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        Project Comments
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center py-6 text-gray-500 dark:text-gray-400">No comments found.</p>
      ) : (
        <ul className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
          {comments.map((c: ProjectComment) => {
            const worker = workers.find((w) => w.id === c.workerId);
            const workerName = worker
              ? `${worker.firstName} ${worker.lastName}`
              : `Worker #${c.workerId}`;
            const initials = getInitials(worker?.firstName || "", worker?.lastName);
            const colorClass = c.isRead 
              ? "bg-emerald-50 border-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-700"
              : getCommentColor(c.id);

            const name = `${worker?.firstName || ""} ${worker?.lastName || ""}`.trim() || "User";
            // Build full image URL
            const profileImageUrl = worker?.profilePictureUrl
              ? worker?.profilePictureUrl
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;

            return (
              <li
                key={c.id}
                className={`p-3 border rounded-lg text-sm transition-all duration-200 ${colorClass} shadow-sm`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                      c.isRead
                        ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {c.importantType || "General"}
                  </span>

                  <div className="flex items-center gap-3 text-xs">
                    {!c.isRead ? (
                      <button
                        onClick={() => handleMarkRead(c.id)}
                        className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <CheckCircle size={14} />
                        <span className="hidden sm:inline">Mark Read</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle size={14} />
                        <span className="hidden sm:inline">Read</span>
                      </div>
                    )}
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

                {/* Comment Text */}
                <p className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                  {c.commentText}
                </p>

                {/* Attachments */}
                {c.attachments && c.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {JSON.parse(c.attachments).map((img: string, i: number) => {
                      const imgUrl = `${IMAGE_BASE_URL}/${img}`;
                      return (
                        <div
                          key={i}
                          className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm"
                        >
                          <img
                            src={imgUrl}
                            alt={`Attachment ${i + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML += `<div class="flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700 text-xs text-gray-500">Failed</div>`;
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Worker Info */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {/* Avatar / Image */}
                  <div className="relative w-8 h-8 flex-shrink-0">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={workerName}
                        className="w-full h-full rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          (target.nextElementSibling as HTMLElement).style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`absolute inset-0 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-blue-200/50 dark:ring-blue-700/50 backdrop-blur-sm transition-opacity ${
                        profileImageUrl ? "hidden" : "flex"
                      } bg-blue-500 dark:bg-blue-600`}
                    >
                      {initials}
                    </div>
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

export default ProjectsComments;