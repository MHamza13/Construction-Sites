"use client";

import React, { useMemo, useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { fetchProjects } from "@/redux/projects/projectSlice";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import EditExpenseModal from "./EditExpenseModal";

interface Expense {
  id: string;
  projectId?: string;
  workerId?: string;
  totalPayment: number;
  createdAt: string;
  expenseDescription: string;
}

interface ExpenseListProps {
  expenses?: Expense[];
  onDelete: (id: string) => void;
}

const columnHelper = createColumnHelper<Expense>();

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses = [], onDelete }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const { items: workers = [], loading: workersLoading } = useSelector((state: RootState) => state.workers);
  const { items: projects = [], loading: projectsLoading } = useSelector((state: RootState) => state.projects);

  const [pageSize, setPageSize] = useState(10);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (Array.isArray(workers) && workers.length === 0) dispatch(fetchWorkers());
    if (Array.isArray(projects) && projects.length === 0) dispatch(fetchProjects());
  }, [dispatch, workers, projects]);

  const workerMap = useMemo(
    () =>
      new Map(
        Array.isArray(workers)
          ? workers.map((worker) => [
              String(worker.id),
              `${worker.firstName} ${worker.lastName || ""}`.trim(),
            ])
          : []
      ),
    [workers]
  );

  const projectMap = useMemo(
    () =>
      new Map(
        Array.isArray(projects)
          ? projects.map((project) => [project.id, project.name])
          : []
      ),
    [projects]
  );

  const handleDelete = (id: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(id);
        Swal.fire("Deleted!", "The expense has been deleted.", "success");
      }
    });
  };

  const handleEdit = (expense: Expense, e?: React.MouseEvent) => {
    e?.preventDefault(); 
    setEditingExpense(expense);
  };

  const handleSaveExpense = (updatedExpense: Expense) => {
    console.log("Updated Expense:", updatedExpense);
    // Optionally update parent state or refetch expenses here
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", { header: () => "Id" }),
      columnHelper.accessor("projectId", {
        header: () => "Project",
        cell: (info) => projectMap.get(info.getValue() ?? "") || "N/A",
      }),
      columnHelper.accessor("workerId", {
        header: () => "Worker",
        cell: (info) => workerMap.get(String(info.getValue())) || "Unknown",
      }),
      columnHelper.accessor("expenseDescription", {
        header: () => "Description",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("totalPayment", {
        header: () => "Amount",
        cell: (info) => `€ ${info.getValue().toLocaleString()}`,
      }),
      columnHelper.accessor("createdAt", {
        header: () => "Date",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.display({
        id: "actions",
        header: () => "Actions",
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={(e) => handleEdit(row.original, e)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleDelete(row.original.id); }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        ),
      }),
    ],
    [workerMap, projectMap]
  );

  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  const table = useReactTable({
    data: safeExpenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  if (workersLoading || projectsLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading table data...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
      {safeExpenses.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            No expenses found matching your criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex-1">
              <span className="mr-2">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const size = Number(e.target.value);
                  setPageSize(size);
                  table.setPageSize(size);
                }}
                className="p-1 border border-gray-300 rounded-md bg-transparent"
              >
                {[10, 20, 30, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="mr-4">
                Page <strong>{table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</strong>
              </span>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={handleSaveExpense}
        />
      )}
    </div>
  );
};

export default ExpenseList;
