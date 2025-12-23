"use client";

import React, { useEffect, useState, useMemo, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchSpecializations,
  addSpecialization,
  updateSpecialization,
  deleteSpecialization,
  clearSpecializationCache,
} from "@/redux/specialization/specializationSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Plus, Trash2, Settings, Users, Edit2, Check, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

// Define Type
interface SpecializationItem {
  id: number;
  name: string;
}

const Specialization: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading } = useSelector((state: RootState) => state.specializations);

  // Form State
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formName, setFormName] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Table Filters & Pagination
  const [globalFilter, setGlobalFilter] = useState<string>("");

  // Fetch on mount
  useEffect(() => {
    dispatch(clearSpecializationCache());
    dispatch(fetchSpecializations());
  }, [dispatch]);

  // Refresh
  const refresh = () => {
    dispatch(clearSpecializationCache());
    dispatch(fetchSpecializations());
  };

  // Start Add
  const startAdd = () => {
    setFormMode("add");
    setFormName("");
    setEditingId(null);
  };

  // Start Edit
  const startEdit = (spec: SpecializationItem) => {
    setFormMode("edit");
    setFormName(spec.name);
    setEditingId(spec.id);
  };

  // Submit Form (Add or Update)
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (formMode === "add") {
      dispatch(addSpecialization({ name: formName }))
        .unwrap()
        .then(() => {
          toast.success("Added!");
          startAdd();
          refresh();
        })
        .catch((err: string) => toast.error(err));
    } else if (formMode === "edit" && editingId !== null) {
      dispatch(updateSpecialization({ id: editingId, name: formName }))
        .unwrap()
        .then(() => {
          toast.success("Updated!");
          startAdd();
          refresh();
        })
        .catch((err: string) => toast.error(err));
    }
  };

  // Delete
  const handleDelete = (id: number) => {
    Swal.fire({
      title: "Delete?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteSpecialization(id))
          .unwrap()
          .then(() => {
            toast.success("Deleted!");
            refresh();
          })
          .catch((err: string) => toast.error(err));
      }
    });
  };

  // Columns
  const columns: ColumnDef<SpecializationItem>[] = useMemo(
    () => [
      { accessorKey: "id", header: "Id" },
      {
        accessorKey: "name",
        header: "Specialization Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const spec = row.original;
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => startEdit(spec)}
                className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(spec.id)}
                disabled={loading}
                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [loading]
  );

  // Table
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="w-full mx-auto relative">
      {/* Background */}
      <div className="absolute inset-0 rounded-2xl -z-10 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-gray-800/50 dark:to-gray-900/50"></div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    {formMode === "add" ? (
                      <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Edit2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formMode === "add" ? "Add Specialization" : "Edit Specialization"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formMode === "add" ? "Create new skill" : "Update existing skill"}
                    </p>
                  </div>
                </div>
                {formMode === "edit" && (
                  <button
                    onClick={startAdd}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Name *
                  </label>
                  <div className="relative group">
                    <Settings className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" />
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Plumber"
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 text-sm transition-all
                                 border-gray-200 dark:border-gray-700 
                                 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40
                                 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 
                                 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formName.trim()}
                  className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm 
                             transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {formMode === "add" ? "Adding..." : "Updating..."}
                    </>
                  ) : (
                    <>
                      {formMode === "add" ? <Plus className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      {formMode === "add" ? "Add Specialization" : "Update Specialization"}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Table */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-gray-900 dark:to-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      Specializations
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {items.length} total
                    </p>
                  </div>
                </div>
                <button
                  onClick={refresh}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search specializations..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="px-4 py-3 font-medium">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-gray-500">
                          No specializations found
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    items.length
                  )}{" "}
                  of {items.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Specialization;