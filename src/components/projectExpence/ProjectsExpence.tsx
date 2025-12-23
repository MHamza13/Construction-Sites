"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchAllProjectExpenses,
  deleteProjectExpense,
} from "@/redux/projectExpense/projectExpenseSlice";
import { fetchProjects } from "@/redux/projects/projectSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import AddExpenseModal from "./AddExpenseModal";
import ExpenseList from "./ExpenseList";
import { Search, X, Filter, Loader2, FolderOpen, RotateCcw } from "lucide-react";

interface Expense {
  id: string;
  description: string;
  projectId: string;
  workerId: string;
  totalPayment: number;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
}

interface Worker {
  id: string | number;
  firstName: string;
  lastName: string;
}

const ProjectsExpence = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { expenses = [], loading: expensesLoading = false } = useSelector(
    (state: RootState) => state.projectExpense || { expenses: [], loading: false }
  );

  const {
    items: projects = [],
    loading: projectsLoading = false,
    error: projectsError,
  } = useSelector(
    (state: RootState) =>
      state.projects || { items: [], loading: false, error: null }
  );

  const {
    items: workers = [],
    loading: workersLoading = false,
    error: workersError,
  } = useSelector(
    (state: RootState) =>
      state.workers || { items: [], loading: false, error: null }
  );

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");

  useEffect(() => {
    dispatch(fetchAllProjectExpenses());
    dispatch(fetchProjects());
    dispatch(fetchWorkers());
  }, [dispatch]);

  // Map projects/workers
  const projectNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((project: Project) => {
      if (project.id && project.name) {
        map[String(project.id)] = project.name;
      }
    });
    return map;
  }, [projects]);

  const workerNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    workers.forEach((worker: Worker) => {
      const id = String(worker.id);
      if (id && worker.firstName) {
        map[id] = `${worker.firstName} ${worker.lastName || ""}`.trim();
      }
    });
    return map;
  }, [workers]);

  const projectIds = useMemo(() => {
    const ids = new Set<string>();
    if (Array.isArray(expenses)) {
      expenses.forEach((expense: Expense) => {
        const pid = String(expense.projectId);
        if (pid && projectNameMap[pid]) ids.add(pid);
      });
    }
    return Array.from(ids);
  }, [expenses, projectNameMap]);

  const workerIds = useMemo(() => {
    const ids = new Set<string>();
    if (Array.isArray(expenses)) {
      expenses.forEach((expense: Expense) => {
        const wid = String(expense.workerId);
        if (wid && workerNameMap[wid]) ids.add(wid);
      });
    }
    return Array.from(ids);
  }, [expenses, workerNameMap]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    let list: Expense[] = Array.isArray(expenses) ? [...expenses] : [];
    const normalize = (v: unknown): string =>
      String(v || "").toLowerCase().trim();

    if (selectedProjectId)
      list = list.filter((e) => String(e.projectId) === selectedProjectId);
    if (selectedWorkerId)
      list = list.filter((e) => String(e.workerId) === selectedWorkerId);
    if (search.trim()) {
      const query = normalize(search);
      list = list.filter((expense) => {
        const desc = normalize(expense.description);
        const proj = normalize(projectNameMap[expense.projectId] || "");
        const worker = normalize(workerNameMap[expense.workerId] || "");
        return desc.includes(query) || proj.includes(query) || worker.includes(query);
      });
    }

    return list;
  }, [
    expenses,
    search,
    selectedProjectId,
    selectedWorkerId,
    projectNameMap,
    workerNameMap,
  ]);

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteProjectExpense(id)).unwrap();
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedProjectId("");
    setSelectedWorkerId("");
  };

  const isLoading = expensesLoading || projectsLoading || workersLoading;

  // --- 🧩 CASE 1: Error in fetching ---
  if (projectsError || workersError) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-xl text-red-700 dark:text-red-300 shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-lg">
                Failed to load required data
              </p>
              <p className="mt-1 text-sm opacity-90">
                We couldn't fetch <strong>projects</strong> or <strong>workers</strong>. This page needs them to work properly.
              </p>
              <p className="mt-3 text-sm font-medium bg-yellow-100 dark:bg-yellow-900/40 px-3 py-2 rounded-lg inline-block">
                Tip: First add a project from the <strong>Projects</strong> page, then come back here.
              </p>
              <button
                onClick={() => {
                  dispatch(fetchProjects());
                  dispatch(fetchWorkers());
                }}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-lg transition shadow-sm flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Loading
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 🧩 CASE 2: No Projects or Workers available ---
  const noProjects = !projectsLoading && projects.length === 0;
  const noWorkers = !workersLoading && workers.length === 0;

  const showNoDataMessage = noProjects || noWorkers;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Filter Expenses
          </h2>
          <div className="flex items-center gap-6">
            <button
              onClick={clearFilters}
              disabled={!search && !selectedProjectId && !selectedWorkerId}
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" /> Clear Filters
            </button>
            <button
              onClick={() => setShowModal(true)}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="inline-block h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                "+ Add Project Expense"
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by description, project, worker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isLoading}
              className="pl-10 pr-10 py-2 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Project Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={isLoading || projectIds.length === 0}
              className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">All Projects</option>
              {projectIds.map((id) => (
                <option key={id} value={id}>
                  {projectNameMap[id] || `Project ID: ${id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Worker Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              disabled={isLoading || workerIds.length === 0}
              className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">All Workers</option>
              {workerIds.map((id) => (
                <option key={id} value={id}>
                  {workerNameMap[id] || `Worker ID: ${id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : showNoDataMessage ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md mx-4">
          <FolderOpen className="h-12 w-12 text-gray-400 mb-3" />
          {noProjects && (
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
              No projects found. Please add projects first.
            </p>
          )}
          {noWorkers && (
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium mt-2">
              No workers found. Please add workers first.
            </p>
          )}
        </div>
      ) : filteredExpenses.length > 0 ? (
        <ExpenseList expenses={filteredExpenses} onDelete={handleDelete} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <FolderOpen className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
            No expenses found
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Try changing filters or add a new project expense.
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && <AddExpenseModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default ProjectsExpence;
