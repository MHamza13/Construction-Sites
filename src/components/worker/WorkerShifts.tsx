"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { fetchWorkerShifts } from "@/redux/shift/ShiftSlice";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Loader,
  Search,
  Filter,
  Timer,
  Download,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  Row,
} from "@tanstack/react-table";
import LiveLocationModal from "../shifts/LiveLocationModal";
import ShiftMap from "../shifts/ShiftMap";
import { DateTime } from "luxon";

const UK_TIMEZONE = "Europe/London";

/**
 * Convert UTC to UK Local Time (auto BST/GMT)
 */
export const formatDateToUK = (
  dateStr: string | undefined,
  formatStr: string = "dd MMM yyyy, hh:mm a"
): string => {
  if (!dateStr) return "—";

  try {
    let isoString: string;
    if (dateStr.includes("T")) {
      isoString = dateStr;
    } else {
      const cleaned = dateStr.split(".")[0].replace(" ", "T");
      isoString = `${cleaned}Z`;
    }

    const dt = DateTime.fromISO(isoString, { zone: "utc" });
    if (!dt.isValid) return "Invalid";

    const ukDt = dt.setZone(UK_TIMEZONE);
    return ukDt.toFormat(formatStr);
  } catch (err) {
    console.error("formatDateToUK Error:", err);
    return "Invalid";
  }
};

/** Only Date (UK) */
export const formatDateOnlyUK = (dateStr?: string): string =>
  formatDateToUK(dateStr, "dd MMM yyyy");

/** Only Time (UK, 12-hour format with AM/PM) */
export const formatTimeOnlyUK = (dateStr?: string): string =>
  formatDateToUK(dateStr, "hh:mm a");

// ------------------- TYPES -------------------
interface WorkerShiftsProps {
  workerId: number | string;
}

interface Shift {
  Id: number;
  WorkerId: number;
  ProjectId: number;
  CheckIn: string;
  EndShift?: string;
  CalculatedHours: string;
  ShiftStatus: string;
  isInvoiced: boolean;
  createdByRole: string;
  CheckInLat?: number;
  CheckInLong?: number;
  EndShiftLat?: number;
  EndShiftLong?: number;
}

interface ShiftStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bgColor: string;
  textColor: string;
}

interface ShiftStatusTagProps {
  status?: string;
}

// ------------------- LOCATION CELL -------------------
const LocationCell = ({ row }: { row: Row<Shift> }) => {
  const [openShiftMap, setOpenShiftMap] = React.useState(false);
  const [openLiveModal, setOpenLiveModal] = React.useState(false);
  const shift = row.original;
  const hasCheckIn = shift.CheckInLat != null && shift.CheckInLong != null;
  const hasEndShift = shift.EndShiftLat != null && shift.EndShiftLong != null;
  const hasAnyLocation = hasCheckIn || hasEndShift;
  const status = shift.ShiftStatus || "Unknown";
  const isClosed = status === "Closed";

  return (
    <>
      <div className="flex items-center gap-2 justify-center">
        {/* Map */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasAnyLocation) setOpenShiftMap(true);
          }}
          className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
            !hasAnyLocation ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 11.25a1.875 1.875 0 100-3.75 1.875 1.875 0 000 3.75z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2.25c4.556 0 8.25 3.694 8.25 8.25 0 5.25-8.25 11.25-8.25 11.25S3.75 15.75 3.75 10.5c0-4.556 3.694-8.25 8.25-8.25z"
            />
          </svg>
        </button>
        {/* Live */}
        {hasCheckIn && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenLiveModal(true);
            }}
            className={`flex items-center gap-1 text-sm hover:underline ${
              isClosed
                ? "text-gray-800 dark:text-gray-100"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {!isClosed && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live
          </button>
        )}
      </div>

      {/* Map Modal */}
      {openShiftMap && hasAnyLocation && (
        <ShiftMap
          onClose={() => setOpenShiftMap(false)}
          checkInLat={shift.CheckInLat}
          checkInLong={shift.CheckInLong}
          endShiftLat={shift.EndShiftLat}
          endShiftLong={shift.EndShiftLong}
        />
      )}

      {/* Live Location Modal */}
      {openLiveModal && (
        <LiveLocationModal
          onClose={() => setOpenLiveModal(false)}
          shiftId={Number(shift.Id)}
          workerId={Number(shift.WorkerId)}
        />
      )}
    </>
  );
};

// ------------------- MAIN COMPONENT -------------------
const WorkerShifts: React.FC<WorkerShiftsProps> = ({ workerId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const { workerShifts: shifts, loading, error } = useSelector(
    (state: RootState) => state.shifts || {}
  );

  useEffect(() => {
    if (workerId) {
      dispatch(fetchWorkerShifts(workerId));
    }
  }, [dispatch, workerId]);

  const shiftArray = useMemo<Shift[]>(() => {
    return Array.isArray(shifts) ? shifts : [];
  }, [shifts]);

  const filteredShifts = useMemo(() => {
    return shiftArray.filter((shift) => {
      const searchData = [
        formatDateOnlyUK(shift.CheckIn),
        shift.ShiftStatus,
        shift.CalculatedHours ? String(shift.CalculatedHours) : "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = searchData.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All Status" || shift.ShiftStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [shiftArray, search, statusFilter]);

  const totalShiftHours = useMemo(() => {
    return shiftArray
      .reduce((sum, shift) => {
        const hours = parseFloat(String(shift?.CalculatedHours)) || 0;
        return sum + hours;
      }, 0)
      .toFixed(1);
  }, [shiftArray]);

  const completedShifts = shiftArray.filter(
    (s) => s.ShiftStatus === "Closed"
  ).length;

  // ------------------- TABLE COLUMNS -------------------
  const columns = useMemo<ColumnDef<Shift>[]>(
    () => [
      {
        accessorKey: "CheckIn",
        header: "Shift Date",
        cell: ({ row }) => {
          const date = formatDateOnlyUK(row.original.CheckIn);
          return <span>{date === "Invalid" ? "N/A" : date}</span>;
        },
      },
      {
        accessorKey: "CheckInTime",
        header: "Check-In Time",
        cell: ({ row }) => {
          const time = formatTimeOnlyUK(row.original.CheckIn);
          return <span>{time === "Invalid" ? "N/A" : time}</span>;
        },
      },
      {
        accessorKey: "EndShift",
        header: "End Shift Time",
        cell: ({ row }) => {
          const endShift = row.original.EndShift;
          if (!endShift) {
            return (
              <span className="text-yellow-600 dark:text-yellow-400 italic font-medium">
                Ongoing
              </span>
            );
          }
          const time = formatTimeOnlyUK(endShift);
          return <span>{time === "Invalid" ? "N/A" : time}</span>;
        },
      },
      {
        accessorKey: "CalculatedHours",
        header: "Hours",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center justify-center h-6 px-3 rounded-md text-sm font-semibold ${
              row.original.ShiftStatus === "Closed"
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {(parseFloat(String(row.original.CalculatedHours)) || 0).toFixed(1)}h
          </span>
        ),
      },
      {
        accessorKey: "ShiftStatus",
        header: "Status",
        cell: ({ row }) => <ShiftStatusTag status={row.original.ShiftStatus} />,
      },
      {
        header: "Location",
        cell: ({ row }) => <LocationCell row={row} />,
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredShifts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // ------------------- LOADING / ERROR STATES -------------------
  if (loading && shiftArray.length === 0) {
    return (
      <div className="p-10 text-center bg-white shadow-lg rounded-lg border border-gray-100">
        <Loader className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
        <p className="text-gray-600">Fetching worker shifts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-lg">
        Error loading shifts: {String(error)}
      </div>
    );
  }

  // ------------------- MAIN UI -------------------
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Shift History</h2>
            <p className="text-slate-300 dark:text-slate-400">
              View and track all recorded shifts
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search shifts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/10 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-300 dark:placeholder-gray-400 w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/10 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/30 rounded-md pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
              >
                <option value="All Status">All Status</option>
                <option value="Closed">Completed</option>
                <option value="Active">Active</option>
              </select>
            </div>
            {/* Export */}
            <button className="bg-white dark:bg-gray-100 text-slate-900 dark:text-gray-900 px-6 py-2 rounded-md text-sm font-semibold hover:bg-slate-50 dark:hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 shadow-lg cursor-pointer">
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-8 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
        <ShiftStatCard
          icon={<Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          label="Total Shifts"
          value={shiftArray.length}
          bgColor="bg-blue-50 dark:bg-blue-900"
          textColor="text-blue-700 dark:text-blue-300"
        />
        <ShiftStatCard
          icon={<Timer className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
          label="Total Hours Tracked"
          value={`${totalShiftHours}h`}
          bgColor="bg-indigo-50 dark:bg-indigo-900"
          textColor="text-indigo-700 dark:text-indigo-300"
        />
        <ShiftStatCard
          icon={<CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />}
          label="Completed Shifts"
          value={completedShifts}
          bgColor="bg-green-50 dark:bg-green-900"
          textColor="text-green-700 dark:text-green-300"
        />
      </div>

      {/* Table */}
      <div className="p-8">
        {filteredShifts.length > 0 ? (
          <>
            <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " up",
                            desc: " down",
                          }[header.column.getIsSorted() as string] ?? null}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-100 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-100 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-gray-400 dark:text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No shifts found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {search || statusFilter !== "All Status"
                ? "Try adjusting your search or filter criteria."
                : "This worker has no recorded shifts yet."}
            </p>
            {(search || statusFilter !== "All Status") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All Status");
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------- HELPER COMPONENTS -------------------
const ShiftStatCard: React.FC<ShiftStatCardProps> = ({
  icon,
  label,
  value,
  bgColor,
  textColor,
}) => (
  <div
    className={`p-4 rounded-lg shadow-sm ${bgColor} border border-gray-200 dark:border-gray-700 flex items-center space-x-4`}
  >
    <div className={`flex-shrink-0 ${textColor}`}>{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
      </p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  </div>
);

const ShiftStatusTag: React.FC<ShiftStatusTagProps> = ({ status }) => {
  let classes = "";
  let display = status || "Unknown";

  if (status === "Closed") {
    classes = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    display = "Completed";
  } else if (status === "Active") {
    classes = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    display = "Active";
  } else {
    classes = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${classes}`}
    >
      {display}
    </span>
  );
};

export default WorkerShifts;