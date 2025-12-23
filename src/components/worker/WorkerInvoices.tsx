"use client";

import React, { JSX, useEffect, useMemo, useState, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  BarChart3,
  Building2,
  Timer,
} from "lucide-react";
import { fetchMasterInvoicesByWorkerId } from "@/redux/invoiceMaster/invoiceMasterSlice";
import { RootState } from "@/redux/store";

// Interface for UI Invoice
interface Invoice {
  id: string;
  date: string;
  hours: string;
  projects: string;
  amount: string;
  status: "Paid" | "Approved" | "Pending" | "Other";
  action: string;
  invoiceNumber: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
}

interface InvoiceHistoryProps {
  workerId: string;
}

export default function InvoiceHistory({ workerId }: InvoiceHistoryProps) {
  const dispatch = useDispatch();
  const { data: masterInvoices, loading, error } = useSelector(
    (state: RootState) => state.masterInvoice
  );

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All Status");

  // Fetch invoices for the worker on mount
  useEffect(() => {
    if (workerId) {
      dispatch(fetchMasterInvoicesByWorkerId(workerId));
    }
  }, [dispatch, workerId]);

  // Map MasterInvoice to Invoice interface
  const invoices: Invoice[] = useMemo(() => {
    if (!masterInvoices) return [];
    return masterInvoices
      .filter((master) =>
        ["Paid", "Approved", "PendingPayment"].includes(master.invoiceStatus)
      )
      .map((master) => {
        const createdAt = new Date(master.createdOn);
        const totalHours = master.totalHours;
        const regularHours = Math.min(totalHours, 8); // Up to 8 hours regular
        const overtimeHours = Math.max(totalHours - 8, 0); // Excess as overtime
        // Map invoiceStatus to UI status
        const statusMap: { [key: string]: "Paid" | "Approved" | "Pending" | "Other" } = {
          Paid: "Paid",
          Approved: "Approved",
          PendingPayment: "Pending",
        };
        const status = statusMap[master.invoiceStatus] || "Other";
        return {
          id: master.id.toString(),
          date: createdAt.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          hours: `${regularHours.toFixed(1)}h${
            overtimeHours > 0 ? ` + ${overtimeHours.toFixed(1)}h OT` : ""
          }`,
          projects: "Project", // Placeholder: Update if project data available
          amount: `$${master.totalAmount.toFixed(2)}`,
          status,
          action:
            status === "Paid"
              ? "View Receipt"
              : status === "Approved"
              ? "View Details"
              : "Review",
          invoiceNumber: `#${master.id.toString().padStart(3, "0")}`,
          totalHours,
          regularHours,
          overtimeHours,
        };
      });
  }, [masterInvoices]);

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
      case "Approved":
        return <CheckCircle className="w-4 h-4" />;
      case "Pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Status color classes
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  // Action button rendering
  const getActionButton = (invoice: Invoice) => {
    switch (invoice.status) {
      case "Paid":
        return (
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Receipt
          </button>
        );
      case "Approved":
        return (
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Eye className="w-4 h-4" />
            Details
          </button>
        );
      case "Pending":
        return (
          <button className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700 transition-colors">
            <AlertCircle className="w-4 h-4" />
            Review
          </button>
        );
      default:
        return (
          <button className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">
            <Eye className="w-4 h-4" />
            View
          </button>
        );
    }
  };

  // Filters
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = Object.values(inv)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All Status" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Totals
  const totalAmount = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount.replace("$", "")),
    0
  );
  const paidAmount = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + parseFloat(inv.amount.replace("$", "")), 0);
  const pendingCount = invoices.filter((inv) => inv.status === "Pending").length;
  const totalHours = invoices.reduce((sum, inv) => sum + inv.totalHours, 0);

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Invoice History</h2>
            <p className="text-slate-300">Track payments and manage invoices for Worker ID: {workerId}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="bg-white/10 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder-gray-300 dark:placeholder-gray-400 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                className="bg-white/10 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/30 rounded-md pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
              >
                <option value="All Status" className="text-gray-900 dark:text-gray-200">All Status</option>
                <option value="Approved" className="text-gray-900 dark:text-gray-200">Approved</option>
                <option value="Pending" className="text-gray-900 dark:text-gray-200">Pending</option>
                <option value="Paid" className="text-gray-900 dark:text-gray-200">Paid</option>
              </select>
            </div>
            <button className="bg-white dark:bg-gray-100 text-slate-900 dark:text-slate-900 px-6 py-2 rounded-md text-sm font-semibold hover:bg-slate-50 dark:hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 shadow-lg">
              <BarChart3 className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-8 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <SummaryCard title="Total Amount" value={`$${totalAmount.toFixed(2)}`}>
          <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
        </SummaryCard>
        <SummaryCard title="Paid Amount" value={`$${paidAmount.toFixed(2)}`}>
          <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </SummaryCard>
        <SummaryCard title="Pending" value={pendingCount.toString()}>
          <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </SummaryCard>
        <SummaryCard title="Total Hours" value={totalHours.toString()}>
          <Timer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </SummaryCard>
      </div>

      {/* Invoices Table */}
      <div className="p-8 bg-gray-50 dark:bg-gray-900">
        {filteredInvoices.length > 0 ? (
          <div className="space-y-4">
            {filteredInvoices.map((inv) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getActionButton={getActionButton}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            onClear={() => {
              setSearch("");
              setStatusFilter("All Status");
            }}
            hasFilters={search !== "" || statusFilter !== "All Status"}
          />
        )}
      </div>
    </div>
  );
}

// Summary Card Component
interface SummaryCardProps {
  title: string;
  value: string;
  children: React.ReactNode;
}

function SummaryCard({ title, value, children }: SummaryCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">{children}</div>
    </div>
  );
}

// Invoice Card Component
interface InvoiceCardProps {
  invoice: Invoice;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  getActionButton: (invoice: Invoice) => JSX.Element;
}

function InvoiceCard({
  invoice,
  getStatusIcon,
  getStatusColor,
  getActionButton,
}: InvoiceCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-md">
              <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{invoice.id}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Invoice {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <InvoiceInfo icon={<Calendar className="text-gray-400 dark:text-gray-500" />} label="Date" value={invoice.date} />
            <InvoiceInfo icon={<Timer className="text-gray-400 dark:text-gray-500" />} label="Hours" value={invoice.hours} />
            <InvoiceInfo icon={<Building2 className="text-gray-400 dark:text-gray-500" />} label="Projects" value={invoice.projects} />
            <InvoiceInfo
              icon={<DollarSign className="text-green-600 dark:text-green-400" />}
              label="Amount"
              value={invoice.amount}
              valueClass="text-green-600 dark:text-green-400 font-bold"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-md border font-medium ${getStatusColor(invoice.status)}`}
          >
            {getStatusIcon(invoice.status)}
            <span>{invoice.status}</span>
          </div>
          {getActionButton(invoice)}
        </div>
      </div>
    </div>
  );
}

// Invoice Info Row
interface InvoiceInfoProps {
  icon: JSX.Element;
  label: string;
  value: string;
  valueClass?: string;
}

function InvoiceInfo({ icon, label, value, valueClass }: InvoiceInfoProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1 text-gray-600 dark:text-gray-400">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className={`font-semibold ${valueClass || "text-gray-900 dark:text-white"}`}>{value}</p>
    </div>
  );
}

// Empty State
interface EmptyStateProps {
  hasFilters: boolean;
  onClear: () => void;
}

function EmptyState({ hasFilters, onClear }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <FileText className="w-10 h-10 text-gray-400 dark:text-gray-300" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No invoices found
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        {hasFilters
          ? "Try adjusting your search or filter criteria"
          : "Your invoices will appear here once created"}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}