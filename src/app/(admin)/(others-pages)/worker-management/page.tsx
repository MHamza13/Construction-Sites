"use client";
import React, { useState, useEffect, useMemo } from "react";
import Banner from "@/layout/Banner";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchWorkers, updateWorker, clearWorkersCache } from "@/redux/worker/workerSlice";
import { fetchSpecializations } from "@/redux/specialization/specializationSlice";
import { approveUser } from "@/redux/auth/authSlice";
import WorkersList from "@/components/worker/WorkersList";
import AddWorkerForm from "@/components/worker/AddWorkerForm";
import EditWorkerModal from "@/components/worker/EditWorkerModal";
import Swal from "sweetalert2";

export interface Specialization {
  id?: string | number;
  _id?: string | number;
  name: string;
}

export interface Worker {
  id?: string | number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  profilePictureUrl?: string;
  experience: number;
  dailyWages: number;
  perHourSalary: number;
  specializationId: number | string;
  specialization?: Specialization | string;
  isApprovedByAdmins?: boolean;
}

interface Filters {
  status: "All Workers" | "Active" | "Inactive";
  search: string;
  specialization: string;
}

export default function WorkerManagement() {
  const [filters, setFilters] = useState<Filters>({
    status: "All Workers",
    search: "",
    specialization: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [approvingWorkerId, setApprovingWorkerId] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();

  const { items: specializations, loading: specLoading, error: specError } = useSelector(
    (state: RootState) => state.specializations
  );
  const { items: workers, loading: workersLoading, error: workersError } = useSelector(
    (state: RootState) => state.workers
  );
  const { loading: authLoading } = useSelector((state: RootState) => state.auth || {});

  // Initial Load
  useEffect(() => {
    if (specializations.length === 0 && !specLoading) dispatch(fetchSpecializations());
    if (workers.length === 0 && !workersLoading) dispatch(fetchWorkers());
  }, [dispatch, specializations.length, specLoading, workers.length, workersLoading]);

  // Force Refresh
  const refreshWorkers = async () => {
    dispatch(clearWorkersCache());
    try {
      await dispatch(fetchWorkers()).unwrap();
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  const handleWorkerAdded = () => {
    setShowForm(false);
    refreshWorkers();
  };

  const handleEdit = (worker: Worker) => {
    setSelectedWorker(worker);
    setShowEditModal(true);
  };

  const handleApprove = async (workerId: string) => {
    const result = await Swal.fire({
      title: "Approve Worker?",
      text: "This will allow the worker to log in.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Approve!",
    });

    if (!result.isConfirmed) return;

    setApprovingWorkerId(workerId);
    try {
      await dispatch(approveUser(workerId)).unwrap();
      await refreshWorkers();
      Swal.fire("Approved!", "Worker can now log in.", "success");
    } catch (err: any) {
      Swal.fire("Error", err.message || "Failed to approve", "error");
    } finally {
      setApprovingWorkerId(null);
    }
  };

  const handleSaveWorker = async (updatedWorker: Partial<Worker>) => {
    if (!selectedWorker?.id) return;

    try {
      await dispatch(updateWorker({ id: selectedWorker.id, data: updatedWorker })).unwrap();
      setShowEditModal(false);
      setSelectedWorker(null);
      await refreshWorkers();
      Swal.fire("Updated!", "Worker updated successfully.", "success");
    } catch (err: any) {
      Swal.fire("Error", err.message || "Failed to update", "error");
    }
  };

  const filteredWorkers = useMemo(() => {
    if (!Array.isArray(workers)) return [];

    return workers.filter((worker: Worker) => {
      const workerSpecialization = worker.specialization ?? worker.specializationId;
      const workerSpecName =
        typeof workerSpecialization === "object" && workerSpecialization !== null
          ? workerSpecialization.name?.toLowerCase() || ""
          : String(workerSpecialization || "").toLowerCase();

      const workerSpecId =
        typeof workerSpecialization === "object" && workerSpecialization !== null
          ? workerSpecialization._id || workerSpecialization.id
          : workerSpecialization;

      const searchLower = filters.search.toLowerCase();
      const fullName = `${worker.firstName} ${worker.lastName}`.toLowerCase();

      const searchMatch =
        filters.search === "" ||
        fullName.includes(searchLower) ||
        workerSpecName.includes(searchLower) ||
        worker.email?.toLowerCase().includes(searchLower);

      const statusMatch =
        filters.status === "All Workers" ||
        (filters.status === "Active" && worker.isActive === true) ||
        (filters.status === "Inactive" && worker.isActive === false);

      const specializationMatch =
        filters.specialization === "" ||
        filters.specialization === String(workerSpecId) ||
        filters.specialization.toLowerCase() === workerSpecName;

      return searchMatch && statusMatch && specializationMatch;
    });
  }, [workers, filters]);

  const isInitialLoading = (workersLoading || specLoading) && workers.length === 0;
  const hasError = workersError || specError;
  const showNoDataMessage = !isInitialLoading && !hasError && filteredWorkers.length === 0;

  return (
    <>
      <div className="mb-6">
        <Banner
          title="Worker Management"
          subtitle="Manage your workforce efficiently"
          breadcrumb={[{ label: "Home", href: "#" }, { label: "Worker" }]}
        />
      </div>

      <div className="min-h-screen relative">
        {(workersLoading || specLoading) && workers.length > 0 && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-300">Refreshing...</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-8 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Search Workers
                </label>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-3 pr-3 py-2 text-sm rounded-lg shadow-sm border border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Search by name, specialization, email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              <div className="w-full md:w-48">
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  className="cursor-pointer block w-full py-2 px-3 text-sm rounded-lg shadow-sm border border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as Filters["status"] })}
                >
                  <option value="All Workers">All Workers</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>

              <div className="w-full md:w-48">
                <label htmlFor="specialization" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Specialization
                </label>
                <select
                  id="specialization"
                  className="cursor-pointer block w-full py-2 px-3 text-sm rounded-lg shadow-sm border border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  value={filters.specialization}
                  onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                >
                  <option value="">All Specializations</option>
                  {specializations.map((spec: Specialization) => (
                    <option key={spec._id || spec.id || spec.name} value={String(spec._id || spec.id || spec.name)}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-auto flex-shrink-0">
                <button
                  onClick={() => setShowForm(true)}
                  className="cursor-pointer mt-1 md:mt-0 flex items-center justify-center px-6 py-3 text-sm font-medium rounded-lg shadow-sm bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400 transition-all"
                >
                  + Add Worker
                </button>
              </div>
            </div>
          </div>

          {isInitialLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Loading workers...</p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg shadow-sm text-center">
              <p className="font-semibold">Error loading data.</p>
            </div>
          )}

          {showNoDataMessage && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-2">No Workers Found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting filters or add a new worker.</p>
            </div>
          )}

          {!isInitialLoading && !hasError && filteredWorkers.length > 0 && (
            <WorkersList
              workers={filteredWorkers}
              onEdit={handleEdit}
              onApprove={handleApprove}
              approvingWorkerId={approvingWorkerId}
              authLoading={authLoading}
            />
          )}

          {showEditModal && selectedWorker && (
            <EditWorkerModal
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false);
                setSelectedWorker(null);
              }}
              worker={selectedWorker}
              onSave={handleSaveWorker}
            />
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="relative w-full max-w-lg sm:max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Add New Worker</h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                  >
                    X
                  </button>
                </div>
                <AddWorkerForm
                  specs={specializations}
                  onSuccess={handleWorkerAdded}
                  onClose={() => setShowForm(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}