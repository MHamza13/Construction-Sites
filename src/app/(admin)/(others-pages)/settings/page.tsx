import Specialization from "@/components/specialization/Specialization";
import React from "react";

const SettingPage = () => {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900  transition-colors duration-300">
  <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="bg-white dark:bg-gray-800 rounded-md px-4 py-3 shadow-sm border-b border-gray-200 dark:border-gray-700 mb-6 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Manage your application settings and configurations
          </p>
        </div>
      </div>
    </div>

    {/* Settings Content */}
    <div className="bg-white dark:bg-gray-800 shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 rounded-md transition-colors duration-300 px-3">
      <Specialization />
    </div>
  </div>
</main>

  );
};

export default SettingPage;
