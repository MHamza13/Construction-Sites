"use client";
import React, { useEffect, useState, FormEvent, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchImportantTypes,
  fetchImportantTypeById,
  createImportantType,
  updateImportantType,
  deleteImportantType,
  ImportantType,
  clearImportantTypesCache,
} from "@/redux/importantTypes/importantTypesSlice";
import { RootState } from "@/redux/store";
import { Plus, Tag, Edit, Users, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

const ImportantTypes: React.FC = () => {
  const dispatch = useDispatch();
  const { importantTypes, loading, error } = useSelector(
    (state: RootState) => state.importantTypes
  );

  const [formData, setFormData] = useState<{ id?: string; typeName: string }>({
    typeName: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Always fetch types from Redux
  const refreshTypes = async () => {
    dispatch(clearImportantTypesCache());
    try {
      await dispatch(fetchImportantTypes() as any);
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  useEffect(() => {
    refreshTypes();
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.typeName.trim()) {
      toast.error("Type Name is required");
      return;
    }

    try {
      if (isEditing && formData.id) {
        await dispatch(
          updateImportantType({ id: formData.id, data: { typeName: formData.typeName } }) as any
        ).unwrap();
        toast.success("Type updated successfully!");
      } else {
        await dispatch(createImportantType({ typeName: formData.typeName }) as any).unwrap();
        toast.success("Type added successfully!");
      }

      setFormData({ typeName: "" });
      setIsEditing(false);
      refreshTypes(); // Refresh after every change
    } catch (err) {
      console.error(err);
      toast.error("Failed to save type.");
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const type = await dispatch(fetchImportantTypeById(id) as any).unwrap();
      setFormData({ id: type._id || type.id, typeName: type.typeName });
      setIsEditing(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch type for editing.");
    }
  };

  const handleDelete = async (id: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dispatch(deleteImportantType(id) as any).unwrap();
          toast.success("Type deleted successfully!");
          refreshTypes();
        } catch (err) {
          console.error(err);
          toast.error("Failed to delete type.");
        }
      }
    });
  };

  const handleCancelEdit = () => {
    setFormData({ typeName: "" });
    setIsEditing(false);
  };

  const columns = useMemo<ColumnDef<ImportantType>[]>(
    () => [
      { accessorKey: "id", header: "Id" },
      { accessorKey: "typeName", header: "Type Name" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(row.original._id || row.original.id)}
              className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              title="Edit type"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original._id || row.original.id)}
              disabled={loading}
              className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete type"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [loading]
  );

  const table = useReactTable({
    data: importantTypes, // directly from Redux
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full mx-auto relative">
      <div className="absolute inset-0 rounded-2xl -z-10 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-gray-800/50 dark:to-gray-900/50 transition-colors duration-500"></div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-colors duration-500">
              <div className="flex items-center space-x-3 mb-5">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg shadow-sm">
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {isEditing ? "Edit Type" : "Add Type"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {isEditing ? "Update an existing type" : "Create a new important type"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Type Name *
                  </label>
                  <div className="relative group">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      name="typeName"
                      value={formData.typeName}
                      onChange={handleInputChange}
                      placeholder="Enter type name"
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 text-sm transition-all duration-200
                                 border-gray-200 dark:border-gray-700 
                                 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40
                                 hover:border-gray-300 dark:hover:border-gray-600 
                                 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 
                                 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading || !formData.typeName.trim()}
                    className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 
                               text-white rounded-lg font-medium text-sm 
                               transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed 
                               flex items-center justify-center"
                  >
                    {isEditing ? "Update Type" : "Add Type"}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="w-full px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                                 text-gray-800 dark:text-gray-100 rounded-lg font-medium text-sm 
                                 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Table */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-gray-900 dark:to-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-colors duration-500">
              <div className="flex items-center space-x-3 mb-5">
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg shadow-sm">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Available Types</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{importantTypes.length} types configured</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Loading types...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg mb-3">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                </div>
              ) : importantTypes.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 transition-colors">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-full">
                      <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h4 className="text-gray-700 dark:text-gray-200 font-medium mb-1">No types yet</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Add your first type to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left border-collapse">
                    <thead className="bg-green-100 dark:bg-green-900/20">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-gray-100"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-green-50 dark:hover:bg-green-900/10">
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm"
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportantTypes;
