"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import {
  X,
  CreditCard,
  Upload,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { markMasterInvoicePaid } from "@/redux/invoiceMaster/invoiceMasterSlice";
import { sendNotificationToUser } from "@/redux/userDeviceTokken/userDeviceTokkenSlice";
import { RootState } from "@/redux/store";
import Swal from "sweetalert2";
import { FaEuroSign } from "react-icons/fa";
import { formatDateOnlyUK } from "@/utils/date"; // UK Date Utility

// --- Type Definitions ---
interface Totals {
  totalPay?: number | null;
}

interface ShiftDetail {
  date?: string;
}

interface Invoice {
  id: number;
  payPeriod?: string;
  totals: Totals;
  ShiftDetails?: ShiftDetail[];
}

interface Worker {
  id: number;
  name: string;
}

interface ProcessPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  worker?: Worker | null;
}

// -------------------
// Component
// -------------------
export function ProcessPaymentModal({
  isOpen,
  onClose,
  invoice,
  refreshInvoices,
  worker,
}: ProcessPaymentModalProps) {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [receipts, setReceipts] = useState<File[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default payment date to TODAY (UK time)
  useEffect(() => {
    const todayUK = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
    setPaymentDate(todayUK);
  }, []);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    const objectUrls = receipts
      .filter((file) => file.type.startsWith("image/"))
      .map(URL.createObjectURL);

    return () => {
      objectUrls.forEach(URL.revokeObjectURL);
    };
  }, [receipts]);

  if (!isOpen || !invoice || !worker) return null;

  const updateReceipts = (updatedReceipts: File[]) => {
    setReceipts(updatedReceipts);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];

      const validFiles = filesArray.filter((file) => {
        if (!allowedTypes.includes(file.type)) {
          setError(`File "${file.name}" is not a PNG, JPG, or PDF.`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        updateReceipts([...receipts, ...validFiles]);
      }
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const updatedReceipts = receipts.filter((_, index) => index !== indexToRemove);
    updateReceipts(updatedReceipts);
  };

  // --- HANDLE SUBMIT + NOTIFICATION ---
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!invoice.totals.totalPay) {
      setError("Cannot process payment for invoice with no total pay.");
      setIsSubmitting(false);
      return;
    }
    if (receipts.length === 0) {
      setError("Please upload at least one payment receipt.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("MasterInvoiceIds", String(invoice.id));
    formData.append("PaymentDate", new Date(paymentDate).toISOString());
    formData.append("PaymentMethod", paymentMethod);
    formData.append("PaymentNote", notes);
    receipts.forEach((file) => {
      formData.append("PaymentSlips", file, file.name);
    });

    try {
      // Dispatch payment
      await dispatch(markMasterInvoicePaid(formData)).unwrap();
      // --- SEND NOTIFICATION TO WORKER ---
      const notificationPayload = {
        userId: Number(worker.id) || 0,
        type: "invoice",
        title: "Payment Processed",
        body: `Payment of €${invoice.totals.totalPay?.toFixed(2)} for Invoice #${invoice.id} has been processed via ${paymentMethod} on ${formatDateOnlyUK(paymentDate)}.`,
        senderID: user?.userId || 0,
      };

      dispatch(sendNotificationToUser(notificationPayload));


      // Success feedback
      Swal.fire({
        icon: "success",
        title: "Payment Processed!",
        text: "Worker has been notified.",
        timer: 2000,
        showConfirmButton: false,
      });

      // Reset form
      setReceipts([]);
      setNotes("");
      setPaymentMethod("Cash");
      const todayUK = new Date().toLocaleDateString("en-CA");
      setPaymentDate(todayUK);
      setError(null);
      refreshInvoices();
      onClose();
    } catch (err: unknown) {
      console.error("Payment processing error:", err);
      let message = "Failed to process payment. Please try again.";
      if (typeof err === "object" && err !== null && "message" in err) {
        message = (err as { message: string }).message;
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- JSX ---
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-gray-900 shadow-2xl w-full max-w-6xl xl:max-w-7xl max-h-[95vh] overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg shadow-sm">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Process Payment</h2>
              <p className="text-blue-100 text-sm">
                Complete payment for invoice #{invoice.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[calc(95vh-100px)] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="w-full mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl -z-10" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Invoice Summary */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg shadow-sm">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Invoice Summary</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Payment details and worker information</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {worker.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{worker.name}</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Worker ID: #{worker.id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Invoice ID:</span>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">#{invoice.id}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FaEuroSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Amount Due:</span>
                        </div>
                        <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                          €{invoice.totals.totalPay?.toFixed(2) || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Requirements */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg shadow-sm">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Payment Requirements</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Steps to complete payment processing</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Upload one or more payment receipts or proofs of payment",
                      "Select the payment method used",
                      "Select the payment date (if different from today)",
                      "Add notes if needed for record keeping",
                    ].map((text, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-600 dark:text-blue-300 text-xs font-bold">{i + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Payment Method */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50/30 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg shadow-sm">
                      <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Payment Method</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Select how the payment was made</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {["Bank Transfer", "Check", "Cash"].map((method) => (
                      <label
                        key={method}
                        className={`relative block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          paymentMethod === method
                            ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <input
                          type="radio"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-medium ${
                              paymentMethod === method ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {method}
                          </span>
                          {paymentMethod === method && (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment Date */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg shadow-sm">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Payment Date</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Select the payment date (defaults to today)</p>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    max={new Date().toLocaleDateString("en-CA")}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Upload Receipt */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50/30 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg shadow-sm">
                      <Upload className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Payment Receipt</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Upload multiple proofs of payment</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-full">
                    <label
                      className={`flex flex-col items-center justify-center w-full h-40 border-2 ${
                        receipts.length > 0
                          ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                          : "border-gray-300 dark:border-gray-700"
                      } border-dashed rounded-lg cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                    >
                      <div className="flex flex-col items-center justify-center pt-6 pb-6">
                        <Upload className="w-10 h-10 mb-4 text-gray-400 dark:text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          {receipts.length > 0 ? (
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {receipts.length} {receipts.length === 1 ? "file" : "files"} selected
                            </span>
                          ) : (
                            <>
                              <span className="font-medium">Click to upload multiple files</span> or drag and drop
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, PDF</p>
                      </div>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                      />
                    </label>
                  </div>

                  {/* Uploaded Files */}
                  {receipts.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Uploaded Files ({receipts.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => setReceipts([])}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {receipts.map((file, index) => {
                          const isImage = file.type.startsWith("image/");
                          const previewUrl = isImage ? URL.createObjectURL(file) : null;

                          return (
                            <div
                              key={index}
                              className="relative w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden group bg-white dark:bg-gray-800 shadow-sm"
                            >
                              {isImage ? (
                                <>
                                  <div className="w-full aspect-square">
                                    <img
                                      src={previewUrl!}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                    {file.name}
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center space-x-2 p-3">
                                  <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className={`absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full transition-opacity ${
                                  isImage ? "opacity-0 group-hover:opacity-100" : ""
                                }`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm">
                      <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Payment Notes</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Additional information (optional)</p>
                    </div>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    rows={4}
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || receipts.length === 0 || !invoice.totals.totalPay}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isSubmitting
                      ? "Processing..."
                      : `Process Payment (${receipts.length} ${receipts.length === 1 ? "file" : "files"})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}