"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store"; // ✅ Add your RootState import if needed

export default function ApiLoadingBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Get loading states from all Redux slices (typed)
  const authLoading = useSelector((state: RootState) => state.auth?.loading);
  const tasksLoading = useSelector((state: RootState) => state.tasks?.loading);
  const workersLoading = useSelector((state: RootState) => state.workers?.loading);
  const projectsLoading = useSelector((state: RootState) => state.projects?.loading);
  const specializationsLoading = useSelector((state: RootState) => state.specializations?.loading);
  const invoicesLoading = useSelector((state: RootState) => state.invoices?.loading);

  // Check if any slice is loading
  const isLoading =
    authLoading ||
    tasksLoading ||
    workersLoading ||
    projectsLoading ||
    specializationsLoading ||
    invoicesLoading;

  // ✅ Memoized getLoadingMessage to avoid re-creation each render
  const getLoadingMessage = useCallback(() => {
    const loadingStates: string[] = [];
    if (authLoading) loadingStates.push("Authenticating");
    if (tasksLoading) loadingStates.push("Tasks");
    if (workersLoading) loadingStates.push("Workers");
    if (projectsLoading) loadingStates.push("Projects");
    if (specializationsLoading) loadingStates.push("Specializations");
    if (invoicesLoading) loadingStates.push("Invoices");

    if (loadingStates.length === 0) return "Loading...";
    if (loadingStates.length === 1) return `Loading ${loadingStates[0].toLowerCase()}...`;
    return `Loading ${loadingStates.join(", ").toLowerCase()}...`;
  }, [
    authLoading,
    tasksLoading,
    workersLoading,
    projectsLoading,
    specializationsLoading,
    invoicesLoading,
  ]);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setProgress(0);
      setLoadingMessage(getLoadingMessage());

      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) return prev;
          return prev + Math.random() * 5 + 3;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
        setLoadingMessage("");
      }, 300);
    }
  }, [isLoading, getLoadingMessage]); // ✅ Fixed dependency list

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow:
            "0 0 15px rgba(59, 130, 246, 0.6), 0 0 30px rgba(6, 182, 212, 0.3)",
        }}
      />
      <div className="h-1 bg-gray-200" />

      {loadingMessage && (
        <div className="absolute top-2 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg animate-pulse">
          {loadingMessage}
        </div>
      )}
    </div>
  );
}
