"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  Search,
  Plus,
  Eye,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  fetchProjects,
  deleteProject,
  Project,
} from "@/redux/projects/projectSlice";
import { fetchAllProjectComments,  ProjectComment } from "@/redux/projectComments/projectCommentSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Link from "next/link";
import AddProject from "./addProject";
import EditProject from "./EditProjects";
import { FiFolder } from "react-icons/fi";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/Firebase";
import { FaEuroSign } from "react-icons/fa";

// Reused Types and Helper from ProjectChat
interface ChatMessage {
  id: string;
  content: string | { task_name?: string }; // Updated to handle task_card content
  type: "text" | "image" | "video" | "voice" | "document" | "task_card";
  senderId: string;
  senderName: string;
  createdAt?: Date;
  uploading?: boolean;
  read?: boolean;
  fileName?: string;
}

// Reused from ProjectChat
export const generateChatId = (workerId: number, projectId: number) => {
  return `project_chat_${projectId}_${workerId}`;
};

// Reused from ProjectChat
export const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const statusStyles: Record<
  ProjectStatus,
  { label: string; badge: string; dot: string; progressColor: string }
> = {
  "": {
    label: "Unknown",
    badge: "bg-gray-100 text-gray-600 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    dot: "bg-gray-400 dark:bg-gray-600",
    progressColor: "bg-gray-400 dark:bg-gray-600",
  },
  Active: {
    label: "Active",
    badge: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700",
    dot: "bg-green-500 dark:bg-green-300",
    progressColor: "bg-green-500 dark:bg-green-300",
  },
  Inactive: {
    label: "Inactive",
    badge: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700",
    dot: "bg-red-500 dark:bg-red-300",
    progressColor: "bg-red-500 dark:bg-red-300",
  },
  Completed: {
    label: "Completed",    
    badge: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700",
    dot: "bg-teal-500 dark:bg-teal-300",
    progressColor: "bg-teal-500 dark:bg-teal-300",
  },
};

// Info Card Component
function Info({ label, value, icon }: InfoProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
      <div
        className={`p-1.5 rounded-full flex-shrink-0 ${
          label === "Budget"
            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
            : label === "Deadline"
            ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
            : label === "Messages"
            ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
            : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="font-semibold text-gray-800 dark:text-gray-100 text-xs truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

// Main Component
export default function ProjectCard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { items: projects, loading, error } = useSelector(
    (state: RootState) => state.projects
  );
  const { comments } = useSelector((state: RootState) => state.projectComments);
  const { user } = useSelector((state: RootState) => state.auth);

  console.log("comments" , comments)

  const [filter, setFilter] = useState<ProjectStatus | "All">("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState<boolean>(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<{ [projectId: string]: ChatMessage[] }>({});
  const [showAllUnread, setShowAllUnread] = useState<{ [projectId: string]: boolean }>({});
  const [fetchError, setFetchError] = useState<string | null>(null);

  const statusOptions: (ProjectStatus | "All")[] = [
    "All",
    "Active",
    "Inactive",
    "Completed",
  ];

  const mapToNewStatus = (status: string): ProjectStatus => {
    const normalizedStatus = status?.trim();
    if (!normalizedStatus) return "";
    switch (normalizedStatus.toLowerCase()) {
      case "active":
        return "Active";
      case "inactive":
      case "inactived":
        return "Inactive";
      case "complete":
      case "completed":
        return "Completed";
      default:
        return "";
    }
  };

  // Fetch projects and workers
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchWorkers());
    dispatch(fetchAllProjectComments());
  }, [dispatch]);


  // Fetch messages for each project
  useEffect(() => {
    if (projects.length > 0 && user?.userId) {
      console.log("Fetching messages for projects:", projects.map(p => p.id));
      console.log("Current user ID:", user.userId);
      const unsubscribes: (() => void)[] = [];
      projects.forEach((project) => {
        if (project.id && project.assignedWorkerIds) {
          const workerIds = Array.isArray(project.assignedWorkerIds)
            ? project.assignedWorkerIds
            : [project.assignedWorkerIds];
          
          workerIds.forEach((workerId) => {
            const chatId = generateChatId(Number(workerId), Number(project.id));
            console.log(`Fetching messages for chatId: ${chatId}`);
            const messagesRef = collection(db, "chats", chatId, "messages");
            const q = query(messagesRef, orderBy("createdAt", "asc"));

            const unsubscribe = onSnapshot(
              q,
              (snapshot) => {
                const msgs = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  createdAt: doc.data().createdAt?.toDate() || new Date(),
                  read: doc.data().read ?? false, // Ensure read field is always defined
                })) as ChatMessage[];
                console.log(`Messages fetched for project ${project.id}:`, msgs);
                setMessages((prev) => ({
                  ...prev,
                  [project.id]: [
                    ...(prev[project.id] || []),
                    ...msgs.filter(
                      (msg) => !prev[project.id]?.some((existing) => existing.id === msg.id)
                    ),
                  ],
                }));
              },
              (error) => {
                console.error(`Error fetching messages for chatId ${chatId}:`, error);
                setFetchError(`Failed to fetch messages for project ${project.id}: ${error.message}`);
                toast.error(`Error loading messages for project ${project.id}`);
              }
            );
            unsubscribes.push(unsubscribe);
          });
        } else {
          console.log(`No worker IDs for project ${project.id}`);
        }
      });
      return () => {
        console.log("Cleaning up message listeners");
        unsubscribes.forEach((unsub) => unsub());
      };
    } else {
      console.log("No projects or user ID available");
    }
  }, [projects, user?.userId]);

  const filteredProjects: Project[] = projects.filter((project) => {
    const mappedStatus = mapToNewStatus(project.status as string);
    const matchesFilter = filter === "All" || mappedStatus === filter;
    const matchesSearch =
      (project.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (project.description?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      );
    return matchesFilter && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete project ${id}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteProject(id)).unwrap();
        toast.success(`Project ${id} deleted successfully!`);
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast.error(error.message || "Failed to delete project.");
        } else {
          toast.error("Failed to delete project due to unknown error.");
        }
      }
    }
    setOpenMenu(null);
  };

  const toggleAddProjectPopup = () => setIsAddProjectOpen(!isAddProjectOpen);

  const handleAddProject = async () => {
    setIsAddProjectOpen(false);
    await dispatch(fetchProjects());
    router.refresh();
  };

  const openEditPopup = (project: Project) => {
    setSelectedProject(project);
    setIsEditProjectOpen(true);
    setOpenMenu(null);
  };

  const handleEditSuccess = async () => {
    setIsEditProjectOpen(false);
    await dispatch(fetchProjects());
    router.refresh();
  };

  const getUnreadCommentsCount = (projectId: string) => {
    return comments.filter(
      (comment: ProjectComment) =>
        comment.projectId === projectId && comment.isRead === false
    ).length;
  };

  // Get unread messages count and content for a project
  const getUnreadMessages = (projectId: string) => {
    const projectMessages = messages[projectId] || [];
    const unread = projectMessages
      .filter((m) => {
        const isUnread = m.senderId !== user?.userId && m.read === false && !m.uploading;
        console.log(`Message ${m.id} for project ${projectId}:`, {
          senderId: m.senderId,
          userId: user?.userId,
          read: m.read,
          uploading: m.uploading,
          isUnread,
        });
        return isUnread;
      })
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    console.log(`Unread messages for project ${projectId}:`, unread);
    return unread;
  };

  // Render message snippet
  const renderMessageSnippet = (m: ChatMessage) => {
    if (m.type === "text") {
      return typeof m.content === "string" && m.content.length > 50
        ? `${m.content.substring(0, 50)}...`
        : m.content;
    } else if (m.type === "image") {
      return "Image attachment";
    } else if (m.type === "video") {
      return "Video attachment";
    } else if (m.type === "voice") {
      return "Voice message";
    } else if (m.type === "document") {
      return `Document: ${m.fileName || "File"}`;
    } else if (m.type === "task_card") {
      return `Task: ${(m.content as { task_name?: string })?.task_name || "Untitled Task"}`;
    }
    return "Message";
  };

  // Log fetch error if present
  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError);
    }
  }, [fetchError]);

  return (
    <main className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl">
        {/* Top Filter/Search/Add Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-100 dark:border-gray-700">
          <div className="hidden sm:flex flex-wrap gap-2">
            {statusOptions.map((status) => {
              const style =
                statusStyles[status as ProjectStatus] || statusStyles[""];
              const isSelected = filter === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`flex px-3 py-2 rounded-xl cursor-pointer text-sm font-semibold transition-all items-center border shadow-sm ${
                    isSelected
                      ? `${style.badge} ring-2 ring-offset-1 ${style.dot.replace(
                          "bg-",
                          "ring-"
                        )}`
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {status !== "All" && (
                    <span
                      className={`w-2 h-2 rounded-full mr-2 ${style.dot}`}
                    ></span>
                  )}
                  {status === "All" ? "All Projects" : style.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                size={16}
                className="text-gray-400 dark:text-gray-500 absolute left-3 top-[11px]"
              />
            </div>
            <button
              onClick={toggleAddProjectPopup}
              className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white w-full sm:w-auto px-5 py-2.5 rounded-xl flex items-center justify-center shadow-lg font-semibold text-sm"
            >
              <Plus size={16} className="mr-2" />
              Add Project
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-center py-12 text-red-500 dark:text-red-400">
            Error: {error}
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && (
          <div className="grid gap-6 pb-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const displayStatus = mapToNewStatus(project.status as string);
              const style = statusStyles[displayStatus] || statusStyles[""];
              const teamSize = Array.isArray(project.assignedWorkerIds)
                ? project.assignedWorkerIds.length
                : project.assignedWorkerIds || "N/A";
              const unreadCommentsCount = getUnreadCommentsCount(project.id);
              const unreadMessages = getUnreadMessages(project.id);
              const unreadMessagesCount = unreadMessages.length;

              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:scale-[1.01] transition-all duration-300 flex flex-col"
                >
                  <div className="p-5 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-h-[56px] mr-2">
                        <h1
                          title={project.name}
                          className="text-md font-bold text-gray-900 dark:text-gray-100"
                        >
                          {project.name}
                        </h1>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${style.badge} flex items-center`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot}`}></span>
                          {style.label}
                        </span>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenu(openMenu === project.id ? null : project.id);
                            }}
                            className="p-1 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-500 dark:text-blue-200 rounded-full"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenu === project.id && (
                            <div
                              className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-10"
                              role="menu"
                              aria-label="Project Options Menu"
                            >
                              <button
                                onClick={() => openEditPopup(project)}
                                className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
                                role="menuitem"
                                aria-label="Edit Project"
                              >
                                <Pencil size={14} className="text-gray-500 dark:text-gray-300" />
                                Edit
                              </button>
                              <div className="border-t border-gray-200 dark:border-gray-700"></div>
                              <button
                                onClick={() => handleDelete(project.id)}
                                className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500"
                                role="menuitem"
                                aria-label="Delete Project"
                              >
                                <Trash2 size={14} className="text-red-500 dark:text-red-400" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Info
                          label="Budget"
                          value={`€${project.budget?.toLocaleString() || "0"}`}
                          icon={<FaEuroSign size={16} />}
                        />
                        <Info
                          label="Comments"
                          value={unreadCommentsCount}
                          icon={<MessageSquare size={16} />}
                        />
                        <Info
                          label="Workers"
                          value={teamSize}
                          icon={<Users size={16} />}
                        />
                        <Info
                          label="Deadline"
                          value={
                            project.deadlineDate
                              ? new Date(project.deadlineDate).toLocaleDateString()
                              : "N/A"
                          }
                          icon={<Calendar size={16} />}
                        />  
                      </div>
                      {/* Unread Messages Section */}
                     {unreadMessagesCount > 0 && (
                      <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Unread Messages ({unreadMessagesCount})
                          </span>
                          {unreadMessagesCount > 1 && (
                            <button
                              onClick={() =>
                                setShowAllUnread((prev) => ({
                                  ...prev,
                                  [project.id]: !prev[project.id],
                                }))
                              }
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                              {showAllUnread[project.id] ? "Show Less" : "Show More"}
                              {showAllUnread[project.id] ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="mt-2">
                          <div
                            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-md p-1 transition-colors"
                            onClick={() => router.push(`/project-worker/${unreadMessages[0].senderId}?projectid=${project.id}`)}
                          >
                            <span className="font-medium">{unreadMessages[0].senderName}: </span>
                            {renderMessageSnippet(unreadMessages[0])}
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-500">
                              {unreadMessages[0].createdAt && formatTime(unreadMessages[0].createdAt)}
                            </span>
                          </div>
                          {showAllUnread[project.id] &&
                            unreadMessages.slice(1).map((m) => (
                              <div
                                key={m.id}
                                className="text-sm text-gray-600 dark:text-gray-400 mt-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-md p-1 transition-colors"
                                onClick={() => router.push(`/project-worker/${m.senderId}?projectid=${project.id}`)}
                              >
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
                  </div>

                  <div className="p-5 pt-0">
                    <Link href={`/projects/${project.id}`} passHref>
                      <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-800 dark:hover:bg-blue-900 dark:text-gray-100 font-semibold py-2 rounded-xl flex items-center justify-center text-sm border border-blue-500 dark:border-blue-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
                        aria-label={`View project ${project.id}`}
                      >
                        <Eye size={16} className="mr-2 text-blue-200 dark:text-blue-300" />
                        View Project
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Popups */}
        {isAddProjectOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-4xl xl:max-w-6xl max-h-[95vh] bg-white dark:bg-gray-800 shadow-2xl overflow-hidden rounded-xl">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <FiFolder className="h-5 w-5" />
                  <div>
                    <h2 className="text-xl font-bold">Create New Project</h2>
                    <p className="text-blue-100 dark:text-blue-200 text-sm">Add a new project</p>
                  </div>
                </div>
                <button
                  onClick={toggleAddProjectPopup}
                  className="p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 max-h-[calc(95vh-100px)] overflow-y-auto">
                <AddProject
                  onProjectAdd={handleAddProject}
                  onCancel={toggleAddProjectPopup}
                />
              </div>
            </div>
          </div>
        )}

        {isEditProjectOpen && selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-4xl xl:max-w-6xl max-h-[95vh] bg-white dark:bg-gray-800 shadow-2xl overflow-hidden rounded-xl">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <FiFolder className="h-5 w-5" />
                  <div>
                    <h2 className="text-xl font-bold">Edit Project</h2>
                    <p className="text-orange-100 dark:text-orange-200 text-sm">
                      Update project details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditProjectOpen(false)}
                  className="p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 max-h-[calc(95vh-100px)] overflow-y-auto">
                <EditProject
                  project={selectedProject}
                  onCancel={() => setIsEditProjectOpen(false)}
                  onEditSuccess={handleEditSuccess}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}