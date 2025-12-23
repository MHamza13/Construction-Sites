"use client";

import React from "react";
import {
  CheckCircle2,
  Calendar,
  Timer,
  DollarSign,
  Banknote,
  Download,
  ChevronRight,
} from "lucide-react";

// ✅ Define Payment type (adjust fields if needed)
interface Payment {
  id: string;
  date: string;
  hours: string;
  regularHours: number;
  overtimeHours: number;
  amount: string;
  status: string;
  project: string;
  paymentMethod: string;
}

// ✅ Define component props
interface RecentPaymentsProps {
  payments: Payment[];
  className?: string;
}

// ✅ Component
export default function RecentPayments({ payments, className }: RecentPaymentsProps) {
  const totalAmount = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount.replace("$", "")),
    0
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-md shadow-md overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Payments
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              All payments up to date
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm">
            <Banknote className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-md shadow-sm">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total This Period
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              ${totalAmount.toFixed(2)}
            </p>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-md shadow-sm">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Payments</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {payments.length}
            </p>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="p-5">
        <div className="space-y-4">
          {payments.map((p, i) => (
            <div
              key={i}
              className="group bg-white dark:bg-gray-800 rounded-md shadow-sm p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-50 dark:bg-green-900 p-2 rounded-md text-green-600 dark:text-green-400 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{p.id}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{p.project}</p>
                  </div>
                </div>

                <span className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-400 px-2 py-1 rounded-md text-xs font-medium shadow-sm">
                  {p.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{p.date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{p.hours}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {p.amount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {p.paymentMethod}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Processed: {p.date}
                </div>
                <button className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-xs font-medium px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Download className="w-3 h-3" />
                  Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <button className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          View payment history
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
