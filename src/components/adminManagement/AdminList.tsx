"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import {
  fetchAdmins,
  selectAdmins,
  selectAdminLoading,
  selectAdminError,
  toggleAdminStatus,
  sendNewPassword,
} from "@/redux/admin/adminSlice";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Edit, KeyRound, Power, Shield } from "lucide-react";
import Swal from "sweetalert2";
import EditAdminModal from "./EditAdminModal";

interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  isSuperAdmin: boolean;
}

const SYSTEM_ADMIN_EMAIL = "systemuser112@gmail.com"; // ← Yeh system admin

const AdminList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const admins = useSelector(selectAdmins);
  const loading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    dispatch(fetchAdmins());
  }, [dispatch]);

  const filteredAdmins = useMemo(
    () => admins.filter((admin: Admin) => !admin.isSuperAdmin),
    [admins]
  );

  // Check if admin is system user
  const isSystemAdmin = (admin: Admin) => admin.email === SYSTEM_ADMIN_EMAIL;

  const handleEdit = (admin: Admin) => {
    if (isSystemAdmin(admin)) {
      Swal.fire({
        icon: "info",
        title: "Protected Admin",
        text: "System admin cannot be modified.",
      });
      return;
    }
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAdmin(null);
  };

  const handleStatusToggle = async (admin: Admin) => {
    if (isSystemAdmin(admin)) {
      Swal.fire({
        icon: "info",
        title: "Protected Admin",
        text: "System admin status cannot be changed.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You want to ${admin.isActive ? "deactivate" : "activate"} this admin?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, proceed",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(toggleAdminStatus({ id: admin.id, isActive: !admin.isActive })).unwrap();
        Swal.fire("Success", "Status updated successfully!", "success");
        dispatch(fetchAdmins());
      } catch {
        Swal.fire("Error", "Failed to update status!", "error");
      }
    }
  };

  const handleSendNewPassword = async (admin: Admin) => {
    if (isSystemAdmin(admin)) {
      Swal.fire({
        icon: "info",
        title: "Protected Admin",
        text: "Cannot send password to system admin.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Send new password?",
      text: `This will send a new password to ${admin.email}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(sendNewPassword(admin.id)).unwrap();
        Swal.fire("Success", "New password sent!", "success");
      } catch {
        Swal.fire("Error", "Failed to send password!", "error");
      }
    }
  };

  const columns = useMemo<ColumnDef<Admin>[]>(
    () => [
      {
        header: "Id",
        accessorKey:"id",
      },
      {
        header: "Name",
        accessorFn: (row) => `${row.name} ${row.surname}`,
        cell: (info) => (
          <div className="flex items-center gap-2">
            <span className="capitalize text-gray-800 dark:text-gray-200">
              {info.getValue()}
            </span>
            {isSystemAdmin(info.row.original) && (
              <Shield className="h-4 w-4 text-yellow-600" title="System Admin" />
            )}
          </div>
        ),
      },
      { 
        header: "Email", 
        accessorKey: "email",
        cell: (info) => {
          const email = info.getValue() as string;
          const admin = info.row.original;
          return (
            <span className={isSystemAdmin(admin) ? "font-semibold text-indigo-600" : ""}>
              {email}
            </span>
          );
        }
      },
      { header: "Phone", accessorKey: "phoneNumber" },
      {
        header: "Status",
        accessorKey: "isActive",
        cell: (info) => {
          const active = info.getValue() as boolean;
          const admin = info.row.original;
          return (
            <span className={`font-semibold ${active ? "text-green-600" : "text-red-600"}`}>
              {active ? "Active" : "Inactive"}
              {isSystemAdmin(admin) && " (Protected)"}
            </span>
          );
        },
      },
      {
        header: "Actions",
        cell: ({ row }) => {
          const admin = row.original;
          const disabled = isSystemAdmin(admin);

          return (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEdit(admin)}
                disabled={disabled}
                title={disabled ? "Cannot edit system admin" : "Edit Admin"}
                className={disabled ? "opacity-40 cursor-not-allowed" : ""}
              >
                <Edit size={18} className="text-blue-600 hover:text-blue-800" />
              </button>
              <button
                onClick={() => handleStatusToggle(admin)}
                disabled={disabled}
                title={disabled ? "Cannot toggle system admin" : "Toggle Status"}
                className={disabled ? "opacity-40 cursor-not-allowed" : ""}
              >
                <Power
                  size={18}
                  className={
                    admin.isActive
                      ? "text-red-600 hover:text-red-800"
                      : "text-green-600 hover:text-green-800"
                  }
                />
              </button>
              <button
                onClick={() => handleSendNewPassword(admin)}
                disabled={disabled}
                title={disabled ? "Cannot reset system admin password" : "Send New Password"}
                className={disabled ? "opacity-40 cursor-not-allowed" : ""}
              >
                <KeyRound size={18} className="text-yellow-600 hover:text-yellow-800" />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredAdmins,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading)
    return <p className="p-4 text-center text-gray-600 dark:text-gray-300">Loading admins...</p>;

  if (error) return <p className="p-4 text-center text-red-500 font-medium">{error}</p>;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100 dark:bg-gray-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`border-t border-gray-200 dark:border-gray-700 transition ${
                  isSystemAdmin(row.original)
                    ? "bg-yellow-50/50 dark:bg-yellow-900/10"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 text-gray-800 dark:text-gray-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="p-4 text-center text-gray-600 dark:text-gray-300 italic">
                No regular admins found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 text-sm text-gray-700 dark:text-gray-300">
        <div>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={`px-3 py-1 rounded-lg border ${
              table.getCanPreviousPage()
                ? "border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                : "border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Prev
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={`px-3 py-1 rounded-lg border ${
              table.getCanNextPage()
                ? "border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                : "border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedAdmin && (
        <EditAdminModal
          admin={selectedAdmin}
          onClose={closeModal}
          onSave={async () => {
            await dispatch(fetchAdmins());
            Swal.fire("Saved!", "Admin details updated successfully.", "success");
            closeModal();
          }}
        />
      )}
    </div>
  );
};

export default AdminList;