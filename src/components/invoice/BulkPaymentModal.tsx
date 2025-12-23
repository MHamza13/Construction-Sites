"use client";

import { useState, useEffect, ChangeEvent, MouseEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  X,
  CreditCard,
  Upload,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Trash2,
  Users,
  Hash,
  Loader2,
} from "lucide-react";
import { markMasterInvoicePaid } from "@/redux/invoiceMaster/invoiceMasterSlice";
import { sendNotificationToUser } from "@/redux/userDeviceTokken/userDeviceTokkenSlice";
import { RootState } from "@/redux/store";
import Swal from "sweetalert2";
import { FaEuroSign } from "react-icons/fa";

interface InvoiceTotals {
  totalPay: number;
  totalHours?: number;
}

interface Invoice {
  id: string | number;
  payPeriod?: string;
  totals: InvoiceTotals;
}

interface Worker {
  id: string | number;
  name: string;
}

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices?: Invoice[];
  worker?: Worker | null;
}

export default function BulkPaymentModal({
  isOpen,
  onClose,
  refreshInvoices,
  invoices = [],
  worker,
}: BulkPaymentModalProps) {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [paymentMethod, setPaymentMethod] = useState<string>("Bank Transfer");
  const [receipts, setReceipts] = useState<File[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod("Bank Transfer");
      setReceipts([]);
      setNotes("");
      setIsSubmitting(false);
      setError(null);
      setPaymentDate(new Date().toISOString().split("T")[0]);
    } else {
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const objectUrls = receipts
      .filter((file) => file.type.startsWith("image/"))
      .map(URL.createObjectURL);

    return () => {
      objectUrls.forEach(URL.revokeObjectURL);
    };
  }, [receipts]);

  if (!isOpen || !Array.isArray(invoices) || invoices.length === 0) return null;

  const isWorkerValid = worker && worker.id && worker.name;
  const totalAmount: number = invoices.reduce(
    (sum, inv) => sum + (inv?.totals?.totalPay || 0),
    0
  );
  const invoiceIds = invoices.map((inv) => `#${inv.id}`).join(", ");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    const validFiles: File[] = [];
    let fileError: string | null = null;

    newFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        fileError = `Invalid file type: ${file.name}. Only PNG, JPG, or PDF are allowed.`;
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        fileError = `File size exceeds 10MB limit: ${file.name}.`;
        return;
      }
      validFiles.push(file);
    });

    if (fileError) setError(fileError);
    setReceipts((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setReceipts((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);

    if (!isWorkerValid) return setError("Invalid worker data.");
    if (totalAmount <= 0) return setError("Total amount must be greater than zero.");
    if (receipts.length === 0) return setError("Please upload at least one receipt.");

    setIsSubmitting(true);

    const formData = new FormData();
    invoices.forEach((inv) => formData.append("MasterInvoiceIds", String(inv.id)));
    formData.append("PaymentDate", new Date(paymentDate).toISOString());
    formData.append("PaymentMethod", paymentMethod);
    formData.append("PaymentNote", notes);
    receipts.forEach((file) => formData.append("PaymentSlips", file, file.name));

    try {
      await dispatch(markMasterInvoicePaid(formData)).unwrap();

      const notificationPayload = {   
        userId: Number(worker!.id) || 0,
        type: "invoice",
        title: "Bulk Payment Processed",
        body: `Payment of €${totalAmount.toFixed(2)} for ${invoices.length} invoice(s) ${invoiceIds} has been processed via ${paymentMethod} on ${new Date(paymentDate).toLocaleDateString()}.`,
        senderID: user?.userId || 0,
      };

      dispatch(sendNotificationToUser(notificationPayload));

      Swal.fire({
        icon: "success",
        title: "Bulk Payment Processed!",
        text: `Worker notified for ${invoices.length} invoices.`,
        timer: 2500,
      });

      onClose();
      refreshInvoices();
    } catch (err: any) {
      setError(err?.message || "Error processing bulk payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Bulk Payment Processing</h2>
              <p className="text-blue-100 text-sm">
                Process {invoices.length} invoices for {worker?.name || "..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Summary */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                  Payment Summary
                </h3>
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><Users size={16}/> Worker:</span>
                    <span className="font-semibold">{worker?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><Hash size={16}/> Worker ID:</span>
                    <span className="font-semibold">#{worker?.id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><FileText size={16}/> Invoices:</span>
                    <span className="font-semibold">{invoices.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><Calendar size={16}/> Payment Date:</span>
                    <span className="font-semibold">{new Date(paymentDate).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                    <span className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-100"><FaEuroSign size={20}/> Total Amount:</span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      €{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Invoices</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                  {invoices.map((inv, index) => (
                    <div
                      key={inv.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm">
                          {index + 1}
                        </span>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">
                          Invoice #{inv.id}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-700 dark:text-blue-400">
                          €{inv.totals.totalPay.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {inv.totals.totalHours || 0}h
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="space-y-6">
              {/* Payment Method */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                  Payment Method
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {["Bank Transfer", "Check", "Cash"].map((method) => (
                    <label
                      key={method}
                      className={`relative block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === method
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                    >
                      <input
                        type="radio"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <span
                        className={`text-sm font-medium ${
                          paymentMethod === method
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {method}
                      </span>
                      {paymentMethod === method && (
                        <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 absolute top-2 right-2" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Date */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                  Payment Date
                </h3>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Receipts */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                  Payment Receipts
                </h3>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    Click to upload receipts
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG or PDF (Max 10MB each)
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                </label>

                {receipts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Uploaded Files ({receipts.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => setReceipts([])}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                      {receipts.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                              {file.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                  Payment Notes (Optional)
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Add any relevant notes for this bulk payment..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting || receipts.length === 0 || totalAmount <= 0 || !isWorkerValid
            }
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg font-medium text-sm transition shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {isSubmitting
              ? "Processing..."
              : `Process Bulk Payment (€${totalAmount.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
}
