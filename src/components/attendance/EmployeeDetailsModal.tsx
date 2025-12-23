import React, { useState } from "react";

interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "late" | "not-recorded";
  checkIn?: string;
  checkOut?: string;
}

interface Employee {
  id?: number;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  experience?: number;
  employeeId?: string;
  status?: "Active" | "Inactive";
  projects?: string;
  tasks?: string;
  attendance?: AttendanceRecord[];
}

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  selectedDate: string;
}

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  isOpen,
  onClose,
  employee,
  selectedDate,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "attendance" | "performance">("details");

  if (!isOpen || !employee) return null;

  const getStatusForDate = (worker: Employee, date: string): AttendanceRecord["status"] => {
    const record = worker.attendance?.find((a) => a.date === date);
    return record ? record.status : "not-recorded";
  };

  const statusConfig: Record<
    AttendanceRecord["status"],
    { color: string; label: string }
  > = {
    present: { color: "bg-green-100 text-green-800", label: "Present" },
    absent: { color: "bg-red-100 text-red-800", label: "Absent" },
    late: { color: "bg-amber-100 text-amber-800", label: "Late" },
    "not-recorded": { color: "bg-gray-100 text-gray-800", label: "Not Recorded" },
  };

  const status = getStatusForDate(employee, selectedDate);
  const statusInfo = statusConfig[status] || statusConfig["not-recorded"];

  const getInitials = (name = ""): string =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const getRandomColor = (id = 0): string => {
    const colors = [
      "bg-blue-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-rose-500",
      "bg-amber-500",
      "bg-cyan-500",
      "bg-emerald-500",
    ];
    return colors[id % colors.length];
  };

  // Attendance stats
  const attendanceRecords = employee.attendance || [];
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((a) => a.status === "present").length;
  const absentDays = attendanceRecords.filter((a) => a.status === "absent").length;
  const lateDays = attendanceRecords.filter((a) => a.status === "late").length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Employee Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Employee Info */}
        <div className="p-6 bg-gray-50 flex items-center">
          <div
            className={`h-20 w-20 ${getRandomColor(
              employee.id || 0
            )} rounded-full flex items-center justify-center text-white font-bold text-2xl`}
          >
            {getInitials(employee.name)}
          </div>
          <div className="ml-6">
            <h3 className="text-2xl font-bold text-gray-900">{employee.name}</h3>
            <p className="text-lg text-gray-600">{employee.role || "N/A"}</p>
            <div className="flex items-center mt-2 flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
              >
                {statusInfo.label} on {selectedDate}
              </span>
              <span className="text-sm text-gray-500 bg-gray-100 rounded-md px-2 py-1">
                {employee.employeeId || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {["details", "attendance", "performance"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`py-4 px-6 text-center font-medium text-sm border-b-2 ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab === "details"
                  ? "Personal Details"
                  : tab === "attendance"
                  ? "Attendance History"
                  : "Performance"}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <p className="text-gray-700">📞 {employee.phone || "N/A"}</p>
                  <p className="text-gray-700">✉️ {employee.email || "N/A"}</p>
                  <p className="text-gray-700">
                    💼 {employee.experience || 0} years experience
                  </p>
                </div>
              </div>

              {/* Work Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Work Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {employee.status || "Inactive"}
                    </span>
                  </div>
                  {employee.projects && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Projects:</span>
                      <span className="text-gray-900 font-medium">{employee.projects}</span>
                    </div>
                  )}
                  {employee.tasks && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tasks:</span>
                      <span className="text-gray-900 font-medium">{employee.tasks}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Records</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Days", value: totalDays, color: "blue" },
                  { label: "Present Days", value: presentDays, color: "green" },
                  { label: "Absent Days", value: absentDays, color: "red" },
                  { label: "Late Days", value: lateDays, color: "amber" },
                ].map((item, idx) => (
                  <div key={idx} className={`bg-${item.color}-50 p-4 rounded-lg text-center`}>
                    <div className={`text-2xl font-bold text-${item.color}-700`}>{item.value}</div>
                    <div className={`text-sm text-${item.color}-600`}>{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Date", "Status", "Check In", "Check Out"].map((head, i) => (
                        <th
                          key={i}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employee.attendance?.map((record, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              statusConfig[record.status]?.color ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {statusConfig[record.status]?.label || "Not Recorded"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.checkIn || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.checkOut || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-700 text-sm">
                  {employee.name} has maintained a {attendanceRate}% attendance rate over the
                  recorded period.{" "}
                  {attendanceRate > 90
                    ? "Excellent attendance record."
                    : "Good attendance record."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Export Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
