"use client";

import React , {JSX} from "react";
import {
  CheckCircle2,
  Clock,
  Calendar,
  Timer,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Eye,
  FileText,
  ChevronRight,
} from "lucide-react";

// Interface for invoice data
interface PendingInvoice {
  id: string;
  date: string;
  hours: number;
  amount: number;
  status: string;
  project: string;
  daysWaiting: number;
  priority: string;
}

export default function PendingInvoices() {
  const invoices: PendingInvoice[] = [
    {
      id: "INV-004",
      date: "March 12, 2024",
      hours: 10,
      amount: 200.0,
      status: "Pending",
      project: "Project Alpha",
      daysWaiting: 3,
      priority: "High",
    },
    {
      id: "INV-005",
      date: "March 10, 2024",
      hours: 8,
      amount: 160.0,
      status: "Approved",
      project: "Project Beta",
      daysWaiting: 5,
      priority: "Medium",
    },
    {
      id: "INV-006",
      date: "March 8, 2024",
      hours: 12,
      amount: 240.0,
      status: "Pending",
      project: "Project Gamma",
      daysWaiting: 7,
      priority: "High",
    },
    {
      id: "INV-007",
      date: "March 5, 2024",
      hours: 9,
      amount: 180.0,
      status: "Approved",
      project: "Project Delta",
      daysWaiting: 10,
      priority: "Low",
    },
  ];

  const getStatusIcon = (status: string): JSX.Element => {
    return status === "Pending" ? (
      <Clock className="w-4 h-4" />
    ) : (
      <CheckCircle2 className="w-4 h-4" />
    );
  };

  const getStatusColor = (status: string): string => {
    return status === "Pending"
      ? "bg-amber-50 text-amber-700"
      : "bg-blue-50 text-blue-700";
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "High":
        return "border-l-2 border-l-red-400";
      case "Medium":
        return "border-l-2 border-l-amber-400";
      case "Low":
        return "border-l-2 border-l-green-400";
      default:
        return "border-l-2 border-l-gray-400";
    }
  };

  const totalPending: number = invoices.reduce(
    (sum: number, inv: PendingInvoice) => sum + inv.amount,
    0
  );
  const pendingCount: number = invoices.filter(
    (inv: PendingInvoice) => inv.status === "Pending"
  ).length;

  const handleViewClick = (e: React.MouseEvent<HTMLButtonElement>, inv: PendingInvoice) => {
    e.preventDefault();
    console.log("View invoice:", inv.id); // Placeholder for view action
  };

  const handleFollowUpClick = (e: React.MouseEvent<HTMLButtonElement>, inv: PendingInvoice) => {
    e.preventDefault();
    console.log("Follow up on invoice:", inv.id); // Placeholder for follow-up action
  };

  const handleViewAllClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("View all invoices"); // Placeholder for view all action
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-md shadow-md overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors duration-300">

      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900 dark:border-gray-800 transition-colors duration-300">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Pending Invoices
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Awaiting approval & payment
      </p>
    </div>
    <div className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </div>
  </div>
</div>


      {/* Summary */}
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800 transition-colors duration-300">
  <div className="grid grid-cols-2 gap-4">
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md shadow-sm transition-colors duration-300">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Total Pending Value
      </p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
        ${totalPending.toFixed(2)}
      </p>
    </div>
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md shadow-sm transition-colors duration-300">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Pending Count
      </p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
        {pendingCount}
      </p>
    </div>
  </div>
</div>


      {/* Invoices List */}
      <div className="p-5">
        <div className="space-y-4">
          {invoices.map((inv: PendingInvoice, i: number) => (
            <div
  key={i}
  className={`group bg-white dark:bg-gray-900 rounded-md shadow-sm p-4 hover:shadow-md dark:hover:shadow-lg transition-all duration-200 ${getPriorityColor(
    inv.priority
  )}`}
>
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <div
        className={`p-2 rounded-md shadow-sm ${
          inv.status === "Pending"
            ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        }`}
      >
        {getStatusIcon(inv.status)}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {inv.id}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{inv.project}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm">
        {inv.daysWaiting} days
      </span>
      <span
        className={`px-2 py-1 rounded-md text-xs font-medium shadow-sm ${getStatusColor(
          inv.status
        )}`}
      >
        {inv.status}
      </span>
    </div>
  </div>

  <div className="grid grid-cols-2 gap-4 mb-4">
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {inv.date}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {inv.hours} hours
        </span>
      </div>
    </div>

    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          ${inv.amount.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span
          className={`text-xs font-medium px-2 py-1 rounded-md shadow-sm ${
            inv.priority === "High"
              ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : inv.priority === "Medium"
              ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          }`}
        >
          {inv.priority}
        </span>
      </div>
    </div>
  </div>

  <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
    <div className="text-xs text-gray-500 dark:text-gray-400">
      Last updated: Today
    </div>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={(e) => handleViewClick(e, inv)}
        className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 text-xs font-medium px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Eye className="w-3 h-3" />
        View
      </button>
      {inv.status === "Pending" && (
        <button
          type="button"
          onClick={(e) => handleFollowUpClick(e, inv)}
          className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 text-xs font-medium px-2 py-1 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
        >
          <AlertCircle className="w-3 h-3" />
          Follow up
        </button>
      )}
    </div>
  </div>
</div>

          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t bg-gray-50 dark:bg-gray-900 dark:border-gray-800">
  <button 
    type="button"
    onClick={handleViewAllClick}
    className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
  >
    View all invoices
    <ChevronRight className="w-4 h-4" />
  </button>
</div>

    </div>
  );
}