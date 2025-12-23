"use client";

import React, { JSX, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { fetchMasterInvoicesByWorkerId } from "@/redux/invoiceMaster/invoiceMasterSlice";
import { RootState } from "@/redux/store";
import WorkerInvoiceDetailsModal from "./WorkerInvoiceDetailsModal";

// Interface for InvoiceDetail
interface InvoiceDetail {
  id: number;
  masterInvoiceId: number;
  invoicePeriod: string;
  dailyWagesRate: number;
  hourlyRate: number;
  dailyHours: number;
  overtimeHours: number;
  adjustedHours: number;
  totalAmount: number;
  totalHours: number;
  shiftJson: string;
  createdOn: string;
  createdBy: number;
  modifiedOn: string | null;
  modifiedBy: number | null;
  isActive: boolean;
  isDeleted: boolean;
}

// Interface for MasterInvoice
interface MasterInvoice {
  id: number;
  workerId: number;
  invoiceStatus: string;
  totalAmount: number;
  totalHours: number;
  invoiceDetails: InvoiceDetail[];
  createdOn: string;
  createdBy: number;
  modifiedOn: string | null;
  modifiedBy: number | null;
  isActive: boolean;
  isDeleted: boolean;
  invoicePdfPath: string | null;
  paymentDate: string | null;
  paymentMethod: string | null;
  paymentNote: string | null;
  paymentSlipPaths: string | null;
  shiftIds: string;
  notes: string;
  dailyWagesRate: number;
  hourlyWagesRate: number;
}

// Interface for UI Invoice
interface Invoice {
  id: string;
  date: string;
  hours: number;
  amount: number;
  status: "Pending" | "Approved" | "Paid" | string;
  project: string;
  daysWaiting: number;
  priority: "High" | "Medium" | "Low" | string;
}

interface PendingInvoicesProps {
  workerId: string;
}

export default function PendingInvoices({ workerId }: PendingInvoicesProps): JSX.Element {
  const dispatch = useDispatch();
  const { data: masterInvoices, loading, error } = useSelector(
    (state: RootState) => state.masterInvoice
  );
  const [selectedInvoice, setSelectedInvoice] = useState<MasterInvoice | null>(null);

  // Fetch invoices for the worker on mount
  useEffect(() => {
    if (workerId) {
      dispatch(fetchMasterInvoicesByWorkerId(workerId));
    }
  }, [dispatch, workerId]);

  // Map MasterInvoice to Invoice interface
  const invoices: Invoice[] = useMemo(() => {
    if (!masterInvoices) return [];
    const today = new Date("2025-10-23"); // Fixed date for calculation
    return masterInvoices
      .filter((master) => {
        const createdDate = new Date(master.createdOn);
        const daysDiff = Math.floor(
          (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isRecent = daysDiff <= 30; // Recent: within 30 days
        const isPending = master.invoiceStatus === "PendingPayment";
        return isPending || isRecent;
      })
      .map((master) => {
        const createdAt = new Date(master.createdOn);
        const daysWaiting = Math.floor(
          (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const priority =
          daysWaiting > 7 ? "High" : daysWaiting >= 3 ? "Medium" : "Low";
        const statusMap: { [key: string]: "Paid" | "Approved" | "Pending" | string } = {
          Paid: "Paid",
          Approved: "Approved",
          PendingPayment: "Pending",
        };
        const status = statusMap[master.invoiceStatus] || master.invoiceStatus;
        return {
          id: master.id.toString(),
          date: createdAt.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          hours: master.totalHours,
          amount: master.totalAmount,
          status,
          project: "Project", // Placeholder: Update if project data available
          daysWaiting,
          priority,
        };
      });
  }, [masterInvoices]);

  // Helper functions
  const getStatusIcon = (status: string): JSX.Element =>
    status === "Pending" ? (
      <Clock className="w-4 h-4" />
    ) : (
      <CheckCircle2 className="w-4 h-4" />
    );

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

  // Totals
  const totalPending: number = invoices
    .filter((inv) => inv.status === "Pending")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingCount: number = invoices.filter((inv) => inv.status === "Pending").length;

  // Render loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-6 text-center">
        <div className="flex justify-center items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading invoices...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-6 text-center">
        <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400 mx-auto" />
        <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Render Component
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pending Invoices
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Awaiting approval & payment for Worker ID: {workerId}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm">
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-md shadow-sm">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Pending Value
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              ${totalPending.toFixed(2)}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-md shadow-sm">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Count</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {pendingCount}
            </p>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="p-5">
        <div className="space-y-4">
          {invoices.length > 0 ? (
            invoices.map((inv: Invoice, i: number) => (
              <div
                key={i}
                className={`group bg-white dark:bg-gray-800 rounded-md shadow-sm p-4 hover:shadow-md transition-all duration-200 ${getPriorityColor(
                  inv.priority
                )} dark:${getPriorityColor(inv.priority)}`}
              >
                {/* Top section */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-md shadow-sm ${
                        inv.status === "Pending"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-400"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                      }`}
                    >
                      {getStatusIcon(inv.status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{inv.id}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{inv.project}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm">
                      {inv.daysWaiting} days
                    </span>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium shadow-sm ${
                        inv.status === "Pending"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-400"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>

                {/* Invoice Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{inv.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {inv.hours} hours
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${inv.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-md shadow-sm ${
                          inv.priority === "High"
                            ? "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-400"
                            : inv.priority === "Medium"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-400"
                            : "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-400"
                        }`}
                      >
                        {inv.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {new Date("2025-10-23").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setSelectedInvoice(masterInvoices.find((m) => m.id.toString() === inv.id) || null)
                      }
                      className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-xs font-medium px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    {inv.status === "Pending" && (
                      <button className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 text-xs font-medium px-2 py-1 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900 transition-colors">
                        <AlertCircle className="w-3 h-3" />
                        Follow up
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-gray-400 dark:text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No pending or recent invoices found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Invoices will appear here once created
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <button className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          View all invoices
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modal */}
      {selectedInvoice && (
        <WorkerInvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}