"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchWorkerById, updateWorker } from "@/redux/worker/workerSlice";
import Link from "next/link";
import EditWorkerModal from "@/components/worker/EditWorkerModal";
import Swal from "sweetalert2";
import Image from "next/image";

// Components
import WorkerDashboard from "@/components/worker/WorkerDashboard";
import RecentPayments from "@/components/worker/RecentPayments";
import PendingInvoices from "@/components/worker/PendingInvoices";
import WorkerInvoices from "@/components/worker/WorkerInvoices";
import WorkerShifts from "@/components/worker/WorkerShifts";

import type { AppDispatch, RootState } from "@/redux/store";

export interface Worker {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  profilePictureUrl?: string | null;
  experience: number;
  dailyWages: number;
  perHourSalary: number;
  specializationName?: string;
  stats?: any[];
  payments?: any[];
  pendingInvoices?: any[];
  invoices?: any[];
}

interface InfoRowProps {
  label: string;
  value?: string | number | null;
}

export default function WorkerDetails() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const numericId = parseInt(id, 10);

  const dispatch = useDispatch<AppDispatch>();
  const { current: worker, loading, error } = useSelector(
    (state: RootState) => state.workers
  );

  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "shifts">("overview");

  useEffect(() => {
    if (id) dispatch(fetchWorkerById(numericId));
  }, [dispatch, id]);

  const handleSaveWorker = async (updatedWorker: Partial<Worker>) => {
    try {
      await dispatch(updateWorker({ id: numericId, data: updatedWorker })).unwrap();
      await dispatch(fetchWorkerById(numericId));
      setShowEditModal(false);
      Swal.fire("Success!", "Worker updated.", "success");
    } catch (err: any) {
      Swal.fire("Error", err.message || "Update failed", "error");
    }
  };

  // AUTO AVATAR GENERATOR (SAFE FOR NEXT/IMAGE)
  const getAvatarUrl = () => {
    if (worker?.profilePictureUrl && worker.profilePictureUrl.startsWith("http")) {
      return worker.profilePictureUrl;
    }
    const name = `${worker?.firstName || ""} ${worker?.lastName || ""}`.trim() || "Worker";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!worker) return <div className="p-8 text-center text-gray-500">Worker not found.</div>;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Back + Title */}
        <div className="mb-6">
          <Link
            href="/worker-management"
            className="flex items-center text-blue-600 hover:text-blue-800 mb-3"
          >
            Back to Workers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Worker Details</h1>
        </div>

        {/* Worker Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Image
                src={getAvatarUrl()}
                alt={`${worker.firstName} ${worker.lastName}`}
                width={128}
                height={128}
                className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                unoptimized // Safe for external URLs
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {worker.firstName} {worker.lastName}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {worker.specializationName || "General Worker"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    worker.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {worker.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">
                    Employee Info
                  </h3>
                  <InfoRow label="ID" value={worker.id} />
                  <InfoRow label="Experience" value={`${worker.experience} years`} />
                  <InfoRow label="Daily Wage" value={`€${worker.dailyWages}`} />
                  <InfoRow label="Hourly Rate" value={`€${worker.perHourSalary}`} />
                  <InfoRow label="Specialization" value={worker.specializationName} />
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">
                    Contact
                  </h3>
                  <InfoRow label="Email" value={worker.email} />
                  <InfoRow label="Phone" value={worker.phoneNumber} />
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  Edit Worker
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <div className="mt-6 border-b border-gray-300 dark:border-gray-600">
            <nav className="flex gap-6">
              {(["overview", "invoices", "shifts"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentPayments payments={worker.payments || []} />
                <PendingInvoices workerId={worker.id} />
              </div>
            )}
            {activeTab === "invoices" && <WorkerInvoices workerId={worker.id} />}
            {activeTab === "shifts" && <WorkerShifts workerId={worker.id} />}
          </div>
        </div>

        {/* Edit Modal */}
        <EditWorkerModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          worker={worker}
          onSave={handleSaveWorker}
        />
      </div>
    </div>
  );
}

// Info Row
function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-gray-100">{value ?? "—"}</span>
    </div>
  );
}