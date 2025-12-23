"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { fetchMasterInvoices } from "@/redux/invoiceMaster/invoiceMasterSlice";
import { FileText, Hourglass, Euro } from "lucide-react";
import { FaEuroSign } from "react-icons/fa";

export default function InvoiceDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { data: masterInvoices = [], loading } = useSelector(
    (state: RootState) => state.masterInvoice
  );

  const [stats, setStats] = useState({
    totalInvoices: 0,
    pendingInvoices: 0,    
    pendingAmount: 0,      
    paidAmount: 0,
  });

  // Fetch invoices
  useEffect(() => {
    dispatch(fetchMasterInvoices());
  }, [dispatch]);

  // Recalculate stats
  useEffect(() => {
    if (masterInvoices && masterInvoices.length > 0) {
      const totalInvoices = masterInvoices.length;

      const unpaidInvoices = masterInvoices.filter(
        (inv) => inv.invoiceStatus === "UnPaid"
      );

      const pendingInvoices = unpaidInvoices.length;
      const pendingAmount = unpaidInvoices.reduce(
        (sum, inv) => sum + (inv.totalAmount || 0),
        0
      );

      const paidAmount = masterInvoices
        .filter((inv) => inv.invoiceStatus === "Paid")
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      setStats({
        totalInvoices,
        pendingInvoices,
        pendingAmount,
        paidAmount,
      });
    } else {
      setStats({
        totalInvoices: 0,
        pendingInvoices: 0,
        pendingAmount: 0,
        paidAmount: 0,
      });
    }
  }, [masterInvoices]);

  // Dashboard Cards
  const statCards = useMemo(
    () => [
      {
        title: "Total Invoices",
        value: stats.totalInvoices,
        color: "text-blue-600",
        bg: "bg-blue-100",
        icon: <FileText className="w-8 h-8 text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]" />,
      },
      {
        title: "Pending Invoices",
        value: stats.pendingInvoices,
        color: "text-yellow-600",
        bg: "bg-yellow-100",
        icon: <Hourglass className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]" />,
      },
      {
        title: "Pending Amount",
        value: `€${stats.pendingAmount.toLocaleString()}`,
        color: "text-orange-600",
        bg: "bg-orange-100",
        icon: <Euro className="w-8 h-8 text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.4)]" />,
      },
      {
        title: "Paid Amount",
        value: `€${stats.paidAmount.toLocaleString()}`,
        color: "text-green-600",
        bg: "bg-green-100",
        icon: <FaEuroSign className="w-8 h-8 text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.4)]" />,
      },
    ],
    [stats]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {loading
        ? [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-lg shadow-md bg-gray-100 dark:bg-gray-800 animate-pulse h-28"
            ></div>
          ))
        : statCards.map((s, i) => (
            <div
              key={i}
              className="p-5 rounded-md shadow-md bg-white dark:bg-gray-800 flex items-center justify-between gap-4"
            >
              <div>
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {s.title}
                </h2>
                <p className={`text-2xl font-bold ${s.color} mt-1`}>
                  {s.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${s.bg} shadow-sm`}>
                {s.icon}
              </div>
            </div>
          ))}
    </div>
  );
}