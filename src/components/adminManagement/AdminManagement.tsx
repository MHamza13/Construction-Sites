"use client";
import React, { useState } from "react";
import AdminForm from "./AdminForm";
import AdminList from "./AdminList";
import { Plus } from "lucide-react";

const AdminManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="mx-auto space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Add Admin
        </button>
      </div>

      {/* Admin List */}
      <AdminList />

      {/* Popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Register New Admin
            </h2>
            <AdminForm onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
