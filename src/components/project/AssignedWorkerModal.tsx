"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Users, Clock } from "lucide-react";
import { fetchWorkers, Worker } from "@/redux/worker/workerSlice";
import { assignWorkerToProject } from "@/redux/projects/projectSlice";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";

interface AssignedWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedUserIds: string[];
  onWorkerAssigned: (selectedWorkerIds: string[]) => void;
  projectId: string;
}

export default function AssignedWorkerModal({
  isOpen,
  onClose,
  assignedUserIds = [],
  onWorkerAssigned,
  projectId,
}: AssignedWorkerModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(
    assignedUserIds.map(String)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ Get workers from store
  const workers = useSelector((state: RootState) => state.workers?.items ?? []);
  const loading = useSelector((state: RootState) => state.workers?.loading);
  const error = useSelector((state: RootState) => state.workers?.error);

  // ✅ Fetch workers on mount
  useEffect(() => {
    dispatch(fetchWorkers());
  }, [dispatch]);

  const handleCheckboxChange = (id: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!projectId) {
      toast.error("No project ID found!");
      setSubmitting(false);
      return;
    }

    if (selectedWorkers.length === 0) {
      toast.error("Select at least one worker!");
      setSubmitting(false);
      return;
    }

    try {
      await dispatch(
        assignWorkerToProject({
          projectId,
          workerIds: selectedWorkers.map((id) => parseInt(id)),
        })
      ).unwrap();

      toast.success("Workers assigned successfully!");
      onWorkerAssigned(selectedWorkers);
      onClose();
    } catch (err) {
      console.error("Failed to assign workers:", err);
      toast.error("Failed to assign workers!");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWorkers = workers.filter((worker: Worker) =>
    [
      worker.firstName || "",
      worker.lastName || "",
      worker.specializationName || "",
      worker.email || "",
      worker.id?.toString() || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black dark:bg-neutral-900 bg-opacity-50 flex p-[50px] items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full mx-4 p-6 shadow-xl transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Assign Workers to Project
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl -z-10"></div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 🔍 Search Section */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Search Workers
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Find and select workers to assign
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Search Workers
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, role, ID, or email..."
                        className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 text-sm border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 👷 Worker Selection */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50/30 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Select Workers
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {selectedWorkers.length}{" "}
                        {selectedWorkers.length === 1 ? "worker" : "workers"}{" "}
                        selected
                      </p>
                    </div>
                  </div>

                  {loading && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Loading workers...
                    </div>
                  )}
                  {error && (
                    <div className="text-sm text-red-500 mb-3">
                      Failed to load workers: {String(error)}
                    </div>
                  )}

                  {filteredWorkers.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredWorkers.map((worker: Worker) => {
                        const isSelected = selectedWorkers.includes(
                          worker.id.toString()
                        );
                        const workerName = `${worker.firstName || ""} ${
                          worker.lastName || ""
                        }`.trim();
                        const role = worker.specializationName || "Worker";

                        return (
                          <label
                            key={worker.id}
                            className={`relative block p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/40"
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              value={worker.id}
                              checked={isSelected}
                              onChange={() =>
                                handleCheckboxChange(worker.id.toString())
                              }
                              className="sr-only"
                            />

                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                  <Users className="w-5 h-5 text-white" />
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                                    {workerName || "Unnamed"}
                                  </h4>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                    {role}
                                  </span>
                                </div>

                                {/* ✅ Show Worker ID & Email */}
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    ID:
                                  </span>{" "}
                                  {worker.id}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    Email:
                                  </span>{" "}
                                  {worker.email || "N/A"}
                                </div>

                                <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                                  <span>
                                    {worker.isActive
                                      ? "Available"
                                      : "Inactive"}
                                  </span>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="flex-shrink-0">
                                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                      <h4 className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                        No workers found
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {searchQuery
                          ? "Try adjusting your search terms"
                          : "No workers available"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🧩 Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedWorkers.length === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Assigning..."
                  : `Assign Workers (${selectedWorkers.length})`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
