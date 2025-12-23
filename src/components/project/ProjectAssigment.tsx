"use client";
import { Calendar, Clock, DollarSign, TrendingUp } from "lucide-react";
import React from "react";

/* ----------------------------- Types ----------------------------- */
interface Project {
  name: string;
  startDate: string;
  endDate: string;
  hours: number;
  earnings: number;
  progress: number;
  status: "In Progress" | "Completed" | "Not Started" | string;
  client: string;
  priority: "High" | "Medium" | "Low" | string;
}

/* ----------------------------- Component ----------------------------- */
export default function ProjectAssignments() {
  const projects: Project[] = [
    {
      name: "Website Redesign",
      startDate: "March 1, 2024",
      endDate: "March 20, 2024",
      hours: 40,
      earnings: 1200,
      progress: 70,
      status: "In Progress",
      client: "TechCorp Inc.",
      priority: "High",
    },
    {
      name: "Mobile App Development",
      startDate: "Feb 15, 2024",
      endDate: "April 10, 2024",
      hours: 85,
      earnings: 3400,
      progress: 45,
      status: "In Progress",
      client: "StartupXYZ",
      priority: "Medium",
    },
    {
      name: "Marketing Campaign",
      startDate: "March 5, 2024",
      endDate: "March 25, 2024",
      hours: 25,
      earnings: 750,
      progress: 100,
      status: "Completed",
      client: "BrandStudio",
      priority: "Low",
    },
    {
      name: "Backend Revamp",
      startDate: "April 1, 2024",
      endDate: "May 1, 2024",
      hours: 0,
      earnings: 0,
      progress: 0,
      status: "Not Started",
      client: "DataFlow Ltd.",
      priority: "High",
    },
  ];

  const getStatusColor = (status: Project["status"]): string => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700 border border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700";
    case "Not Started":
      return "bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
    default:
      return "bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
  }
};

const getPriorityColor = (priority: Project["priority"]): string => {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    case "Medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
    case "Low":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
};

const getProgressColor = (progress: number): string => {
  if (progress === 100) return "bg-green-500 dark:bg-green-600";
  if (progress >= 70) return "bg-blue-500 dark:bg-blue-600";
  if (progress >= 40) return "bg-amber-500 dark:bg-amber-600";
  return "bg-gray-400 dark:bg-gray-600";
};

  /* ----------------------------- Stats ----------------------------- */
  const totalEarnings = projects.reduce((sum, proj) => sum + proj.earnings, 0);
  const totalHours = projects.reduce((sum, proj) => sum + proj.hours, 0);
  const avgProgress = Math.round(
    projects.reduce((sum, proj) => sum + proj.progress, 0) / projects.length
  );

  /* ----------------------------- Render ----------------------------- */
  return (
  <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5">
  <div className="flex justify-between items-center">
    <div>
      <h2 className="text-xl font-bold text-white dark:text-white">
        Project Assignments
      </h2>
      <p className="text-indigo-200 text-sm dark:text-indigo-100">
        Track your active projects and progress
      </p>
    </div>
    <div className="text-right">
      <div className="text-2xl font-bold text-white dark:text-white">
        {projects.length}
      </div>
      <div className="text-indigo-200 text-xs dark:text-indigo-100">
        Active Projects
      </div>
    </div>
  </div>
</div>


      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
  {/* Total Earnings */}
  <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Total Earnings
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          ${totalEarnings.toLocaleString()}
        </p>
      </div>
      <div className="bg-green-100 dark:bg-green-900 p-2 rounded-md">
        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-300" />
      </div>
    </div>
  </div>

  {/* Total Hours */}
  <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Total Hours
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {totalHours}
        </p>
      </div>
      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-md">
        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-300" />
      </div>
    </div>
  </div>

  {/* Avg Progress */}
  <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Avg Progress
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {avgProgress}%
        </p>
      </div>
      <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-md">
        <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-300" />
      </div>
    </div>
  </div>
</div>

      {/* Projects List */}
      <div className="p-6 space-y-4">
  {projects.map((proj, i) => (
    <div
      key={i}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
    >
            {/* Header */}
           <div className="flex justify-between items-start mb-4">
  <div>
    <div className="flex items-center gap-2 mb-1">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
        {proj.name}
      </h3>
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-md ${getPriorityColor(
          proj.priority
        )}`}
      >
        {proj.priority}
      </span>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-300">{proj.client}</p>
  </div>
  <span
    className={`px-3 py-1 text-xs font-semibold rounded-md ${getStatusColor(
      proj.status
    )}`}
  >
    {proj.status}
  </span>
</div>


           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-1" />
    <p className="text-xs text-gray-600 dark:text-gray-300">Duration</p>
    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
      {proj.startDate} → {proj.endDate}
    </p>
  </div>

  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
    <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-1" />
    <p className="text-xs text-gray-600 dark:text-gray-300">Hours</p>
    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
      {proj.hours}
    </p>
  </div>

  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
    <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-1" />
    <p className="text-xs text-gray-600 dark:text-gray-300">Earnings</p>
    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
      ${proj.earnings.toLocaleString()}
    </p>
  </div>

  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
    <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-1" />
    <p className="text-xs text-gray-600 dark:text-gray-300">Progress</p>
    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
      {proj.progress}%
    </p>
  </div>
</div>

            {/* Progress Bar */}
            <div className="mb-3">
  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
    <span>Project Completion</span>
    <span>{proj.progress}%</span>
  </div>
  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-md overflow-hidden">
    <div
      className={`h-full ${getProgressColor(proj.progress)} transition-all`}
      style={{ width: `${proj.progress}%` }}
    ></div>
  </div>
</div>


            {/* Action */}
            <div className="text-right">
  <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline cursor-pointer">
    View Details →
  </button>
</div>

          </div>
        ))}
      </div>
    </div>
  );
}
