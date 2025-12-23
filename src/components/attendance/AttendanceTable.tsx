"use client";

import React from "react";

// ✅ Define AttendanceRecord type
interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "late" | "not-recorded";
  checkIn?: string;
  checkOut?: string;
}

// ✅ Define Worker type
interface Worker {
  id: number;
  name: string;
  employeeId: string;
  role: string;
  experience: string;
  attendance: AttendanceRecord[];
}

// ✅ Define Props type
interface AttendanceTableProps {
  workers: Worker[];
  selectedDate: string;
}

export default function AttendanceTable({
  workers,
  selectedDate,
}: AttendanceTableProps) {
  // ✅ Helper function to get attendance record for the selected date
  const getRecordForDate = (worker: Worker, date: string): AttendanceRecord => {
    return (
      worker.attendance.find((a) => a.date === date) || {
        date,
        status: "not-recorded",
      }
    );
  };

  // ✅ Color mapping for status
  const statusColors: Record<
    AttendanceRecord["status"],
    string
  > = {
    present: "bg-green-100 text-green-800",
    absent: "bg-red-100 text-red-800",
    late: "bg-yellow-100 text-yellow-800",
    "not-recorded": "bg-gray-100 text-gray-800",
  };

  // ✅ Handle status change
  const handleStatusChange = (workerId: number, newStatus: AttendanceRecord["status"]) => {
    console.log(
      `Updating worker ${workerId} status to ${newStatus} for date ${selectedDate}`
    );
  };

  return (
    <div className="bg-white rounded-md shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-semibold text-gray-800">
          Attendance for{" "}
          <span className="text-indigo-600">{selectedDate}</span>
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {["Employee", "Role", "Status", "Check In/Out", "Actions"].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {workers.map((worker) => {
              const record = getRecordForDate(worker, selectedDate);

              return (
                <tr
                  key={worker.id}
                  className="hover:bg-indigo-50 transition-colors duration-200"
                >
                  {/* Employee Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-blue-600 font-semibold">
                          {worker.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {worker.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {worker.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{worker.role}</div>
                    <div className="text-xs text-gray-500">
                      {worker.experience}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                        statusColors[record.status]
                      }`}
                    >
                      {record.status.replace("-", " ")}
                    </span>
                  </td>

                  {/* Check In/Out */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.checkIn ? (
                      <div>
                        <span className="text-gray-900 font-medium">In:</span>{" "}
                        {record.checkIn}
                        {record.checkOut && (
                          <span className="ml-3">
                            <span className="text-gray-900 font-medium">
                              Out:
                            </span>{" "}
                            {record.checkOut}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No record</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleStatusChange(worker.id, "present")
                        }
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200 transition"
                      >
                        Present
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(worker.id, "absent")
                        }
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 transition"
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(worker.id, "late")}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-medium hover:bg-yellow-200 transition"
                      >
                        Late
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
