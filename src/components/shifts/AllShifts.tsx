"use client";
import ShiftMap from "./ShiftMap";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector, Dispatch, AnyAction } from "react-redux";
import {
  fetchAllShifts,
  fetchWorkerShiftsByDate,
} from "@/redux/shift/ShiftSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  Row,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Search,
  X,
  ListOrdered,
  User,
  Filter,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import AddShiftModal from "./AddShiftModal";
import LiveLocationModal from "./LiveLocationModal";
// UK TIME FORMATTER
import { formatDateOnlyUK, formatTimeOnlyUK } from "@/utils/date";

interface Shift {
  id: string;
  workerId: string;
  projectId: string;
  checkIn: string;
  endShift?: string;
  calculatedHours: string;
  shiftStatus: string;
  isInvoiced: boolean;
  createdByRole: string;
  checkInLat?: number;
  checkInLong?: number;
  endShiftLat?: number;
  endShiftLong?: number;
}

interface ShiftStats {
  total: number;
  closed: number;
  open: number;
  invoiced: number;
  totalHours: string;
}

const LocationCell = ({ row }: { row: Row<Shift> }) => {
  const [openShiftMap, setOpenShiftMap] = React.useState(false);
  const [openLiveModal, setOpenLiveModal] = React.useState(false);
  const shift = row.original;
  const hasCheckIn = shift.checkInLat != null && shift.checkInLong != null;
  const hasEndShift = shift.endShiftLat != null && shift.endShiftLong != null;
  const hasAnyLocation = hasCheckIn || hasEndShift;
  const status = shift.shiftStatus || "Unknown";
  const isClosed = status === "Closed";

  return (
    <>
      <div className="flex items-center gap-2 justify-center">
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
      {openShiftMap && hasAnyLocation && (
        <ShiftMap
          onClose={() => setOpenShiftMap(false)}
          checkInLat={shift.checkInLat}
          checkInLong={shift.checkInLong}
          endShiftLat={shift.endShiftLat}
          endShiftLong={shift.endShiftLong}
        />
      )}
      {openLiveModal && (
        <LiveLocationModal
          onClose={() => setOpenLiveModal(false)}
          shiftId={Number(shift.id)}
          workerId={Number(shift.workerId)}
        />
      )}
    </>
  );
};

const WorkerShiftTable = ({ shifts }: { shifts: Shift[] }) => {
  const columns = useMemo<ColumnDef<Shift>[]>(
    () => [
      {
        header: "Shift ID",
        accessorKey: "id",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <span
              className="inline-flex items-center justify-center h-7 px-3 rounded-md
              bg-gray-100 text-xs font-medium text-gray-800 border border-gray-300
              dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
            >
              #{value || "N/A"}
            </span>
          );
        },
      },
      {
        header: "Check-In",
        accessorKey: "checkIn",
        cell: ({ getValue }) => {
          const checkIn = getValue() as string;
          return (
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {formatTimeOnlyUK(checkIn)}
              </div>
              <div className="text-gray-500 text-sm dark:text-gray-400">
                {formatDateOnlyUK(checkIn)}
              </div>
            </div>
          );
        },
      },
      {
        header: "End Shift",
        accessorKey: "endShift",
        cell: ({ getValue }) => {
          const endShift = getValue() as string | undefined;
          if (!endShift) {
            return (
              <span className="text-yellow-600 dark:text-yellow-400 italic font-medium">
                Ongoing
              </span>
            );
          }
          return (
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {formatTimeOnlyUK(endShift)}
              </div>
              <div className="text-gray-500 text-sm dark:text-gray-400">
                {formatDateOnlyUK(endShift)}
              </div>
            </div>
          );
        },
      },
      {
        header: "Hours",
        accessorKey: "calculatedHours",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const hours = parseFloat(value) || 0;
          return (
            <span
              className="inline-flex items-center justify-center h-7 px-3 rounded-md
              bg-indigo-100 text-sm font-semibold text-indigo-700
              dark:bg-indigo-900/40 dark:text-indigo-300"
            >
              {hours > 0 ? `${hours.toFixed(1)}h` : "—"}
            </span>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "shiftStatus",
        cell: ({ getValue }) => {
          const status = (getValue() as string) || "Unknown";
          const isClosed = status === "Closed";
          return (
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border
              ${
                isClosed
                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800"
                  : status === "Active"
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800"
              }`}
            >
              <span
                className={`${
                  isClosed
                    ? "bg-green-500 dark:bg-green-400"
                    : status === "Active"
                    ? "bg-blue-500 dark:bg-blue-400"
                    : "bg-yellow-500 dark:bg-yellow-400"
                } inline-block h-1.5 w-1.5 rounded-full`}
              />
              {status}
            </span>
          );
        },
      },
      {
        header: "Invoiced",
        accessorKey: "isInvoiced",
        cell: ({ getValue }) => {
          const isInvoiced = getValue() as boolean;
          return (
            <span
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border
              ${
                isInvoiced
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800"
              }`}
            >
              <span
                className={`${
                  isInvoiced
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : "bg-rose-500 dark:bg-rose-400"
                } inline-block h-1.5 w-1.5 rounded-full`}
              />
              {isInvoiced ? "Invoiced" : "Pending"}
            </span>
          );
        },
      },
      {
        header: "Manual",
        accessorKey: "createdByRole",
        cell: ({ row }) => {
          const shift = row.original;
          const role = shift.createdByRole || "";
          const name = shift.createdByName || "";

          const isAdmin = role === "Admin";
          const label = isAdmin ? "Manual" : "Own";
          const bgColor = isAdmin
            ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800"
            : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800";
          const dotColor = isAdmin ? "bg-orange-500 dark:bg-orange-400" : "bg-teal-500 dark:bg-teal-400";

          return (
            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border ${bgColor}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} />
              {label}: ({name})
            </span>
          );
        },
      },
      {
        header: "Location",
        cell: ({ row }) => <LocationCell row={row} />,
      },
    ],
    []
  );

  const table = useReactTable<Shift>({
    data: shifts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 5 },
      sorting: [{ id: "checkIn", desc: true }], // Default sort: newest first
    },
  });

  const getPaginationRange = (): (number | string)[] => {
    const currentPage = table.getState().pagination.pageIndex + 1;
    const totalPages = table.getPageCount();
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }
    if (currentPage > totalPages - 3) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider
                    text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 cursor-pointer transition-colors duration-300"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 transition-colors duration-300">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50/75 dark:hover:bg-gray-800/60 cursor-pointer transition-all duration-200"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-sm whitespace-nowrap text-gray-700 dark:text-gray-300 transition-colors duration-300"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pt-3 flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
        <div>
          Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
          <strong>{table.getPageCount()}</strong>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {getPaginationRange().map((pageNumber, index) =>
            typeof pageNumber === "number" ? (
              <button
                key={pageNumber}
                onClick={() => table.setPageIndex(pageNumber - 1)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors duration-200 border
                ${
                  table.getState().pagination.pageIndex + 1 === pageNumber
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 hover:bg-gray-200 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                }`}
              >
                {pageNumber}
              </button>
            ) : (
              <span key={`dots-${index}`} className="px-1.5 py-1">
                ...
              </span>
            )
          )}
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-md text-gray-600 dark:text-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-gray-200 dark:hover:bg-gray-700
            transition-colors duration-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const AllShifts = () => {
  const dispatch: Dispatch<AnyAction> = useDispatch();
  const router = useRouter();
  const {
    shifts = [],
    loading: shiftsLoading = false,
    error: shiftsError = null,
  } = useSelector((state: RootState) => state.shifts || {});
  const { items: workers = [], loading: workersLoading = false, error: workersError = null } =
    useSelector((state: RootState) => state.workers || {});

  const [search, setSearch] = useState<string>("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [invoiceFilter, setInvoiceFilter] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isSpecificQuery, setIsSpecificQuery] = useState<boolean>(false);
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchAllShifts());
    dispatch(fetchWorkers());
  }, [dispatch]);

  useEffect(() => {
    const isReadyForSpecificQuery = !!selectedWorkerId && !!selectedDate;
    if (isReadyForSpecificQuery) {
      setIsSpecificQuery(true);
      dispatch(
        fetchWorkerShiftsByDate({
          workerId: selectedWorkerId,
          shiftDate: selectedDate,
        })
      );
    } else {
      setIsSpecificQuery(false);
      if (!selectedWorkerId && !selectedDate && shifts.length < 1) {
        dispatch(fetchAllShifts());
      }
    }
  }, [dispatch, selectedWorkerId, selectedDate, shifts.length]);

  const workerIds = useMemo(() => {
    const ids = new Set<string>();
    shifts.forEach((shift: Shift) => {
      if (shift.workerId) ids.add(shift.workerId);
    });
    return Array.from(ids);
  }, [shifts]);

  const workerNameMap = useMemo(() => {
    return workers.reduce((map, worker) => {
      if (worker.id) {
        map[worker.id.toString()] = `${worker.firstName || ""} ${worker.lastName || ""}`.trim() || "Unknown Worker";
      }
      return map;
    }, {} as Record<string, string>);
  }, [workers]);

  // Filtered and sorted shifts (default: newest check-in first)
  const filteredShifts = useMemo<Shift[]>(() => {
    let list: Shift[] = Array.isArray(shifts) ? [...shifts] : [];
    const normalize = (v: unknown): string => String(v || "").toLowerCase().trim();

    if (!isSpecificQuery) {
      if (selectedWorkerId) {
        list = list.filter((s: Shift) => s && String(s.workerId) === String(selectedWorkerId));
      }
      if (selectedDate) {
        const selectedDateStr = selectedDate;
        list = list.filter((s: Shift) => {
          if (!s?.checkIn) return false;
          const checkInDate = new Date(s.checkIn);
          if (isNaN(checkInDate.getTime())) return false;
          const checkInDateStr = checkInDate.toISOString().split("T")[0];
          return checkInDateStr === selectedDateStr;
        });
      }
    }

    if (statusFilter) {
      list = list.filter((s: Shift) => s && normalize(s.shiftStatus) === normalize(statusFilter));
    }
    if (invoiceFilter) {
      const isInvoiced = invoiceFilter === "invoiced";
      list = list.filter((s: Shift) => s && s.isInvoiced === isInvoiced);
    }
    if (search.trim()) {
      const q = normalize(search);
      list = list.filter((s: Shift) => {
        if (!s) return false;
        return (
          normalize(s.id).includes(q) ||
          normalize(s.workerId).includes(q) ||
          normalize(s.shiftStatus).includes(q) ||
          normalize(workerNameMap[s.workerId]).includes(q)
        );
      });
    }

    // Default sorting: newest check-in first
    return list.sort((a: Shift, b: Shift) => 
      new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
    );
  }, [shifts, selectedWorkerId, statusFilter, invoiceFilter, selectedDate, search, isSpecificQuery, workerNameMap]);

  const shiftsGroupedByWorker = useMemo<Record<string, Shift[]>>(() => {
    return filteredShifts.reduce((acc: Record<string, Shift[]>, shift: Shift) => {
      const workerId = shift.workerId;
      if (!acc[workerId]) {
        acc[workerId] = [];
      }
      acc[workerId].push(shift);
      return acc;
    }, {});
  }, [filteredShifts]);

  const getShiftStats = (shiftsList: Shift[]): ShiftStats => {
    const total = shiftsList.length;
    const closed = shiftsList.filter((s: Shift) => s?.shiftStatus === "Closed").length;
    const invoiced = shiftsList.filter((s: Shift) => s?.isInvoiced).length;
    const totalHours = shiftsList.reduce(
      (sum: number, s: Shift) => sum + (parseFloat(s?.calculatedHours) || 0),
      0
    );
    return {
      total,
      closed,
      open: total - closed,
      invoiced,
      totalHours: totalHours.toFixed(1),
    };
  };

  const getOverallStats = useMemo<ShiftStats>(() => getShiftStats(filteredShifts), [filteredShifts]);

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setSelectedWorkerId("");
    setStatusFilter("");
    setInvoiceFilter("");
    setSelectedDate("");
    setExpandedWorkerId(null);
    if (isSpecificQuery || filteredShifts.length === 0) {
      dispatch(fetchAllShifts());
    }
  }, [dispatch, isSpecificQuery, filteredShifts.length]);

  const handleAddShiftClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddModal(true);
  }, []);

  if (shiftsLoading || workersLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-12 transition-colors duration-300">
        <div className="h-12 w-12 rounded-full border-4 border-blue-200 dark:border-blue-800 animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
        <p className="text-lg font-medium text-blue-600 dark:text-blue-400">Loading data...</p>
      </div>
    );
  }

  if (shiftsError || workersError) {
    return (
      <div className="rounded-md border p-6 flex items-center space-x-4 bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-800 transition-colors duration-300">
        <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
        <div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Error Loading Data</h3>
          <p className="text-red-600 dark:text-red-400">{String(shiftsError || workersError)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl">
        <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-md p-6 mb-6 transition-colors duration-300">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight transition-colors duration-300">
                All Shifts
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400 transition-colors duration-300">
                Monitor and manage all shifts across your organization
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 lg:gap-4">
              <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{getOverallStats.total}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Shifts</div>
              </div>
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-xl font-bold text-green-700 dark:text-green-400">{getOverallStats.closed}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Shift End</div>
              </div>
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{getOverallStats.open}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Shift Open</div>
              </div>
              <div className="rounded-md bg-purple-50 dark:bg-purple-900/20 p-4 border border-purple-200 dark:border-purple-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{getOverallStats.invoiced}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Invoiced</div>
              </div>
              <div className="rounded-md bg-indigo-50 dark:bg-indigo-900/20 p-4 border border-indigo-200 dark:border-indigo-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{getOverallStats.totalHours}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md overflow-hidden shadow-md">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Filter Shifts
              </h2>
              <button
                onClick={handleAddShiftClick}
                className="inline-flex items-center gap-2 rounded-md
                bg-blue-600 hover:bg-blue-700
                dark:bg-blue-500 dark:hover:bg-blue-600
                text-white px-4 py-2 text-sm font-medium
                shadow-md transition-all
                focus:outline-none focus:ring-2 focus:ring-offset-2
                focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              >
                + Add Shift
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search shifts, workers..."
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                />
              </div>
              <div className="relative">
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full appearance-none rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-4 pr-10 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                >
                  <option value="">All Workers</option>
                  {workerIds.map((workerId) => (
                    <option key={workerId} value={workerId}>
                      {workerNameMap[workerId] || `Worker ID: ${workerId}`}
                    </option>
                  ))}
                </select>
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-4 pr-10 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                >
                  <option value="">All Status</option>
                  <option value="Closed">Closed</option>
                  <option value="Open">Open</option>
                  <option value="Active">Active</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={invoiceFilter}
                  onChange={(e) => setInvoiceFilter(e.target.value)}
                  className="w-full appearance-none rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-4 pr-10 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                >
                  <option value="">Invoice Status</option>
                  <option value="invoiced">Invoiced</option>
                  <option value="not-invoiced">Not Invoiced</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 cursor-pointer" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value || "")}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors duration-300"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {(selectedWorkerId || search || statusFilter || invoiceFilter || selectedDate) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {!shiftsLoading && !shiftsError && filteredShifts.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800 transition-colors duration-300">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    {["Worker", "Shifts", "Closed", "Open", "Invoiced", "Hours", "Expand"].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 text-center first:text-left"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {Object.entries(shiftsGroupedByWorker).map(([workerId, workerShifts]: [string, Shift[]]) => {
                    const isExpanded = expandedWorkerId === workerId;
                    const workerStats = getShiftStats(workerShifts);
                    const workerName = workerNameMap[workerId] || `Worker ID: ${workerId}`;
                    const initials = workerName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "W";
                    const projectId = workerShifts[0]?.projectId || "";

                    return (
                      <React.Fragment key={workerId}>
                        <tr
                          onClick={() => {
                            setExpandedWorkerId(isExpanded ? null : workerId);
                            if (!isExpanded && projectId) {
                              router.push(`/project-worker/${workerId}?projectId=${projectId}`);
                            }
                          }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/70 cursor-pointer transition"
                        >
                          <td className="px-4 py-3 flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-sm font-semibold text-blue-700 dark:text-blue-300">
                              {initials}
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {workerName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-blue-700 dark:text-blue-400">
                            {workerStats.total}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-green-700 dark:text-green-400">
                            {workerStats.closed}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                            {workerStats.open}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-purple-700 dark:text-purple-400">
                            {workerStats.invoiced}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                            {workerStats.totalHours}h
                          </td>
                          <td className="px-4 py-3 text-center">
                            <ChevronDown
                              className={`h-5 w-5 mx-auto text-gray-500 dark:text-gray-400 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50 dark:bg-gray-800/50 transition-all">
                            <td colSpan={7} className="px-1 py-4">
                              <WorkerShiftTable shifts={workerShifts} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!shiftsLoading && !shiftsError && filteredShifts.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg p-12 text-center transition-colors duration-300">
              <div className="space-y-4">
                <div className="mx-auto h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-300 dark:border-gray-600 transition-colors duration-300">
                  <ListOrdered className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  No Shifts Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  {selectedWorkerId || search || statusFilter || invoiceFilter || selectedDate
                    ? "No shifts match your current filters. Try adjusting your search criteria."
                    : "No shifts have been recorded yet."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && <AddShiftModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

export default AllShifts;