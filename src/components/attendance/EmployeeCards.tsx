"use client";

import { useState } from "react";
import EmployeeDetailsModal from "./EmployeeDetailsModal";

// ✅ Define attendance record type
interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "late" | "not-recorded";
  checkIn?: string;
  checkOut?: string;
}

// ✅ Define worker type
interface Worker {
  id: number;
  name: string;
  employeeId: string;
  role: string;
  phone: string;
  email: string;
  experience: string;
  attendance: AttendanceRecord[];
}

// ✅ Define component props type
interface EmployeeCardsProps {
  workers: Worker[];
  selectedDate: string;
}

export default function EmployeeCards({ workers, selectedDate }: EmployeeCardsProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Worker | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // ✅ Get worker attendance status for selected date
  const getStatusForDate = (worker: Worker, date: string): AttendanceRecord["status"] => {
    const record = worker.attendance.find((a) => a.date === date);
    return record ? record.status : "not-recorded";
  };

  // ✅ Status color and label mapping
  const statusConfig: Record<
    AttendanceRecord["status"],
    { color: string; icon: string; label: string }
  > = {
    present: {
      color: "bg-green-100 text-green-700 border-green-200",
      icon: "✅",
      label: "Present",
    },
    absent: {
      color: "bg-red-100 text-red-700 border-red-200",
      icon: "❌",
      label: "Absent",
    },
    late: {
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: "⏰",
      label: "Late",
    },
    "not-recorded": {
      color: "bg-gray-100 text-gray-600 border-gray-200",
      icon: "➖",
      label: "Not Recorded",
    },
  };

  // ✅ Get initials from worker name
  const getInitials = (name: string): string =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  // ✅ Gradient color generator
  const getGradientColor = (id: number): string => {
    const gradients = [
      "bg-gradient-to-br from-blue-500 to-indigo-500",
      "bg-gradient-to-br from-purple-500 to-pink-500",
      "bg-gradient-to-br from-emerald-500 to-teal-500",
      "bg-gradient-to-br from-amber-500 to-orange-500",
      "bg-gradient-to-br from-cyan-500 to-sky-500",
      "bg-gradient-to-br from-rose-500 to-pink-600",
    ];
    return gradients[id % gradients.length];
  };

  // ✅ Handle modal open
  const handleViewDetails = (worker: Worker) => {
    setSelectedEmployee(worker);
    setIsModalOpen(true);
  };

  // ✅ Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  // ✅ Export attendance report to CSV
  const exportReport = () => {
    const headers = [
      "Name",
      "Employee ID",
      "Role",
      "Status",
      "Phone",
      "Email",
      "Experience",
    ];
    const csvContent = [
      headers.join(","),
      ...workers.map((worker) => {
        const status = getStatusForDate(worker, selectedDate);
        const statusLabel = statusConfig[status].label;

        return [
          `"${worker.name}"`,
          worker.employeeId,
          `"${worker.role}"`,
          statusLabel,
          worker.phone,
          worker.email,
          worker.experience,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance-report-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-white rounded-md shadow-md border border-gray-100 p-6">
        {/* ✅ Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">Team Overview</h2>
          <span className="text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-1">
            {selectedDate}
          </span>
        </div>

        {/* ✅ Employee Cards */}
        <div className="flex flex-col gap-4">
          {workers.map((worker) => {
            const status = getStatusForDate(worker, selectedDate);
            const statusInfo = statusConfig[status];

            return (
              <div
                key={worker.id}
                className="border border-gray-100 rounded-md p-4 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 bg-white"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className={`h-12 w-12 ${getGradientColor(
                        worker.id
                      )} rounded-full flex items-center justify-center text-white font-semibold text-base shadow`}
                    >
                      {getInitials(worker.name)}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {worker.name}
                      </h3>
                      <p className="text-xs text-gray-600">{worker.role}</p>
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 mt-1 inline-block">
                        {worker.employeeId}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full border text-[9px] font-medium ${statusInfo.color}`}
                  >
                    <span className="mr-1">{statusInfo.icon}</span>
                    {statusInfo.label}
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-gray-100 pt-3">
                  <div className="flex items-center text-gray-700">
                    <div className="bg-blue-100 p-1.5 rounded mr-2 text-[10px]">📞</div>
                    <span className="font-medium">{worker.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <div className="bg-purple-100 p-1.5 rounded mr-2 text-[10px]">✉️</div>
                    <span className="truncate font-medium">{worker.email}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 flex justify-between items-center text-[11px] text-gray-500">
                  <span>{worker.experience} experience</span>
                  <button
                    onClick={() => handleViewDetails(worker)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Showing {workers.length} of {workers.length} employees
          </p>
          <button
            onClick={exportReport}
            className="text-xs font-medium cursor-pointer text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md shadow transition"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* ✅ Employee Details Modal */}
      <EmployeeDetailsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        employee={selectedEmployee}
        selectedDate={selectedDate}
      />
    </>
  );
}
