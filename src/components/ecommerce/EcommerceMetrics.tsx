"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { fetchProjects } from "@/redux/projects/projectSlice";
// Humne problematic SVG imports ko hata kar Lucide use kiya hai jo zyada stable hai
import { Loader2, CheckCircle, PlayCircle, Users, Box } from "lucide-react";

// LocalStorage keys
const WORKERS_PREV_KEY = "dashboard_workers_prev_count";
const PROJECTS_PREV_KEY = "dashboard_projects_prev_count";
const ACTIVE_WORKERS_PREV_KEY = "dashboard_active_workers_prev_count";
const ACTIVE_PROJECTS_PREV_KEY = "dashboard_active_projects_prev_count";

export const EcommerceMetrics = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const { items: workers, loading: workersLoading } = useSelector(
    (state: RootState) => state.workers || { items: [], loading: false }
  );
  const { items: projects, loading: projectsLoading } = useSelector(
    (state: RootState) => state.projects || { items: [], loading: false }
  );

  const totalWorkers = workers.length;
  const totalProjects = projects.length;
  const activeWorkers = workers.filter((w) => w.isActive).length;
  const activeProjects = projects.filter((p) => p.status === "Active").length;

  const loading = workersLoading || projectsLoading;

  // Fetch data
  useEffect(() => {
    dispatch(fetchWorkers());
    dispatch(fetchProjects());
  }, [dispatch]);

  // Save to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(WORKERS_PREV_KEY, totalWorkers.toString());
      localStorage.setItem(PROJECTS_PREV_KEY, totalProjects.toString());
      localStorage.setItem(ACTIVE_WORKERS_PREV_KEY, activeWorkers.toString());
      localStorage.setItem(ACTIVE_PROJECTS_PREV_KEY, activeProjects.toString());
    }
  }, [totalWorkers, totalProjects, activeWorkers, activeProjects, loading]);

  // Reusable Metric Card Component
  const MetricCard = ({
    title,
    value,
    icon,
    loading,
    color,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    loading: boolean;
    color: { bg: string; darkBg: string; text: string; iconColor: string };
  }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center space-x-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.bg} ${color.darkBg}`}
        >
          {loading ? (
            <Loader2 className={`size-6 animate-spin ${color.text}`} />
          ) : (
            icon
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {loading ? "..." : value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Total Workers - Users Icon use kiya hai */}
      <MetricCard
        title="Total Workers"
        value={totalWorkers}
        icon={<Users className={`w-6 h-6 ${loading ? 'text-purple-600' : 'text-purple-700'} dark:text-purple-400`} />}
        loading={loading}
        color={{
          bg: "bg-purple-100",
          darkBg: "dark:bg-purple-900/30",
          text: "text-purple-600",
          iconColor: "text-purple-700 dark:text-purple-400",
        }}
      />

      {/* Total Projects - Box Icon use kiya hai */}
      <MetricCard
        title="Total Projects"
        value={totalProjects}
        icon={<Box className={`w-6 h-6 ${loading ? 'text-orange-600' : 'text-orange-700'} dark:text-orange-400`} />}
        loading={loading}
        color={{
          bg: "bg-orange-100",
          darkBg: "dark:bg-orange-900/30",
          text: "text-orange-600",
          iconColor: "text-orange-700 dark:text-orange-400",
        }}
      />

      {/* Active Workers */}
      <MetricCard
        title="Active Workers"
        value={activeWorkers}
        icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
        loading={loading}
        color={{
          bg: "bg-emerald-100",
          darkBg: "dark:bg-emerald-900/30",
          text: "text-emerald-600",
          iconColor: "text-emerald-600 dark:text-emerald-400",
        }}
      />

      {/* Active Projects */}
      <MetricCard
        title="Active Projects"
        value={activeProjects}
        icon={<PlayCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
        loading={loading}
        color={{
          bg: "bg-blue-100",
          darkBg: "dark:bg-blue-900/30",
          text: "text-blue-600",
          iconColor: "text-blue-600 dark:text-blue-400",
        }}
      />
    </div>
  );
};