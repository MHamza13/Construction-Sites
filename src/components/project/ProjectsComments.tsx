"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchProjectComments,
  markCommentAsRead,
  ProjectComment,
} from "@/redux/projectComments/projectCommentSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_FILE_URL;

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

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectComments(projectId));
      setCurrentPage(1);
    }
    dispatch(fetchWorkers());
  }, [dispatch, projectId]);

  // Pagination Logic
  const totalPages = Math.ceil(comments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentComments = comments.slice(indexOfFirstItem, indexOfLastItem);

  // Generate Page Numbers Array
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handleMarkRead = async (commentId: string) => {
    await dispatch(markCommentAsRead(commentId));
    dispatch(fetchProjectComments(projectId));
  };

  const getInitials = (firstName: string, lastName?: string): string => {
    if (!firstName) return "?";
    return (firstName.charAt(0) + (lastName ? lastName.charAt(0) : "")).toUpperCase();
  };

  return (
    <div className="space-y-4 p-4 mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          Project Comments
          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500">
            {comments.length}
          </span>
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center py-6 text-gray-500 dark:text-gray-400">No comments found.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {currentComments.map((c: ProjectComment) => {
              const worker = workers.find((w) => w.id === c.workerId);
              const workerName = worker ? `${worker.firstName} ${worker.lastName}` : `Worker #${c.workerId}`;
              const initials = getInitials(worker?.firstName || "", worker?.lastName);
              
              const colorClass = c.isRead 
                ? "bg-emerald-50 border-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-700 opacity-80"
                : getCommentColor(c.id);

              const name = `${worker?.firstName || ""} ${worker?.lastName || ""}`.trim() || "User";
              const profileImageUrl = worker?.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

              return (
                <li key={c.id} className={`p-3 border rounded-lg text-sm transition-all duration-200 ${colorClass} shadow-sm`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${c.isRead ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                      {c.importantType || "General"}
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      {!c.isRead ? (
                        <button onClick={() => handleMarkRead(c.id)} className="flex items-center gap-1 text-red-600 hover:text-emerald-600 transition-colors">
                          <CheckCircle size={14} /> <span className="hidden sm:inline">Mark Read</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle size={14} /> <span className="hidden sm:inline">Read</span>
                        </div>
                      )}
                      <span className="text-gray-500 dark:text-gray-400">{new Date(c.createdOn).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">{c.commentText}</p>
                  
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <img src={profileImageUrl} alt="avatar" className="w-full h-full rounded-full object-cover ring-1 ring-gray-200" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{workerName}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700 gap-4">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, comments.length)} of {comments.length}
              </span>
              
              <div className="flex items-center gap-1 shadow-sm rounded-lg p-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-all text-gray-600 dark:text-gray-400"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Numeric Page Buttons */}
                <div className="flex items-center gap-1">
                  {pageNumbers.map((number) => (
                    <button
                      key={number}
                      onClick={() => setCurrentPage(number)}
                      className={`px-3 py-1.5 text-xs font-black rounded-md transition-all border ${
                        currentPage === number
                          ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                          : "bg-transparent text-gray-500 border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-all text-gray-600 dark:text-gray-400"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectsComments;