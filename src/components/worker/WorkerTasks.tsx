"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchTasksByWorkerId } from "@/redux/task/TaskSlice";

import {
  Clock,
  Calendar,
  CheckCircle2,
  PlayCircle,
  Building2,
  Timer,
  TrendingUp,
  Filter,
  ChevronDown,
} from "lucide-react";

// ✅ Define interfaces for type safety
interface SubtasksSummary {
  parent_status?: string;
  parent_status_color?: string;
  total?: number;
  completed?: number;
  in_progress?: number;
  not_started?: number;
  overdue?: number;
  progress_percent?: number;
}

interface Task {
  task_id: number;
  task_name: string;
  task_description: string;
  task_deadline: string;
  task_priority: "High" | "Medium" | "Low" | string;
  project_name: string;
  subtasks_summary?: SubtasksSummary;
}

interface TaskHistoryProps {
  workerId: number | string;
}

export default function TaskHistory({
  workerId,
}: TaskHistoryProps): React.JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const { items: tasksData, loading, error } = useSelector(
    (state: RootState) => state.tasks
  );

  const [selectedProject, setSelectedProject] =
    useState<string>("All Projects");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // ✅ Always ensure `tasks` is an array
  const tasks: Task[] = Array.isArray(tasksData)
    ? tasksData
    : tasksData
      ? [tasksData]
      : [];

  useEffect(() => {
    if (workerId !== undefined && workerId !== null) {
      // ✅ Convert workerId safely to number before dispatch
      const id = typeof workerId === "string" ? parseInt(workerId, 10) : workerId;
      if (!isNaN(id)) {
        dispatch(fetchTasksByWorkerId(id));
      } else {
        console.error("Invalid Worker ID:", workerId);
      }
    } else {
      console.error("Worker ID is missing. Cannot fetch tasks.");
    }
  }, [dispatch, workerId]);

  // ✅ Project filter options
  const projectOptions: string[] = [
    "All Projects",
    ...new Set(tasks.map((task) => task.project_name).filter(Boolean)),
  ];

  const filteredTasks: Task[] =
    selectedProject === "All Projects"
      ? tasks
      : tasks.filter((task) => task.project_name === selectedProject);

  // ✅ Icons by status
  const getStatusIcon = (status?: string): React.JSX.Element => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      case "overdue":
        return <Clock className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // ✅ Priority color styling
  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case "High":
        return "border-l-4 border-red-500 hover:border-red-600";
      case "Medium":
        return "border-l-4 border-amber-500 hover:border-amber-600";
      case "Low":
        return "border-l-4 border-green-500 hover:border-green-600";
      default:
        return "border-l-4 border-gray-400";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg dark:shadow-gray-900 overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 via-indigo-700 to-purple-800 px-8 py-6 rounded-t-md">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Task History</h2>
            <p className="text-indigo-200 text-sm">
              Worker assigned tasks overview
            </p>
          </div>

          {/* Project Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white/10 backdrop-blur-sm cursor-pointer text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-white/20 transition flex items-center gap-2 shadow-sm"
            >
              <Filter className="w-4 h-4" />
              {selectedProject}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg dark:shadow-gray-900 border border-gray-200 dark:border-gray-600 z-10">
                {projectOptions.map((project, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedProject(project);
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-600 hover:text-indigo-600 dark:hover:text-white cursor-pointer rounded-md"
                  >
                    {project}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Task List */}
      <div className="p-6 space-y-6">
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Loading tasks...</p>

        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const summary: SubtasksSummary = task.subtasks_summary || {};
            const parentStatusColor = summary.parent_status_color || "#333";
            const hasSubtasks = summary.total && summary.total > 0;

            return (
              <div
                key={task.task_id}
                className={`bg-white dark:bg-gray-800 rounded-md p-6 shadow-md dark:shadow-gray-900 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer ${getPriorityColor(
                  task.task_priority
                )}`}
              >

                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 transition cursor-pointer">
                        {task.task_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{task.project_name}</span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: parentStatusColor + "20",
                      color: parentStatusColor,
                      border: `1px solid ${parentStatusColor}60`,
                    }}
                  >
                    {getStatusIcon(summary.parent_status)}
                    <span>{summary.parent_status || "Not Started"}</span>
                  </div>
                </div>


                <p className="text-gray-600 dark:text-gray-300 mb-6">{task.task_description}</p>

                {/* Subtask Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b pb-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-1 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" /> Deadline
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {task.task_deadline}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-1 text-sm text-gray-600 dark:text-gray-400">
                      <Timer className="w-4 h-4" /> Total Subtasks
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {summary.total || 0}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-1 text-sm text-gray-600 dark:text-gray-400">
                      <TrendingUp className="w-4 h-4" /> Progress
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {summary.progress_percent || 0}%
                    </p>
                  </div>
                </div>


                {hasSubtasks && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3">
                      Subtask Status Breakdown
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3">
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          {summary.completed || 0}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-300">Completed</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                          {summary.in_progress || 0}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-300">In Progress</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800/50 rounded-md p-3">
                        <p className="text-xl font-bold text-gray-700 dark:text-gray-100">
                          {summary.not_started || 0}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Not Started</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-3">
                        <p className="text-xl font-bold text-red-700 dark:text-red-400">
                          {summary.overdue || 0}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-300">Overdue</p>
                      </div>
                    </div>
                  </div>

                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16">
            {error ? (
              <p className="text-red-500 dark:text-red-400 font-medium">
                Error fetching tasks: {JSON.stringify(error)}
              </p>
            ) : (
              <>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-md w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Worker Tasks Found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  This worker doesn’t have any assigned tasks yet.
                </p>
              </>
            )}
          </div>

        )}
      </div>
    </div>
  );
}
