"use client";
import { useState } from "react";
import { projects } from "@/data/projects";
import { AiOutlineClose } from "react-icons/ai";

// Interfaces based on usage (updated to match actual data schema)
interface InvoiceTotals {
  totalPay: number;
}

interface Invoice {
  id: string;
  workerName: string;
  payPeriod: string;
  totals?: InvoiceTotals;
}

interface Project {
  id: number; // Updated to match actual data type (number)
  name: string;
  status: string;
  description: string;
  budget: string;
  deadline: string;
  team: string;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
}

interface Allocation {
  projectId: string; // Kept as string for select value compatibility
  amount: string;
  percentage: string;
}

interface DivideAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
}

export default function DivideAmountModal({ isOpen, onClose, invoices }: DivideAmountModalProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([
    { projectId: "", amount: "", percentage: "" },
  ]);

  // Calculate total amount from invoices, handling null values
  const totalAmount: number = invoices.reduce(
    (sum: number, inv: Invoice) => sum + (inv.totals?.totalPay || 0),
    0
  );

  // Calculate allocated amount
  const allocatedAmount: number = allocations.reduce(
    (sum: number, a: Allocation) => sum + (parseFloat(a.amount) || 0),
    0
  );

  // Calculate remaining amount
  const remaining: number = totalAmount - allocatedAmount;

  // Update allocation when input changes
  const updateAllocation = (index: number, field: keyof Allocation, value: string) => {
    const updated: Allocation[] = [...allocations];
    updated[index][field] = value;

    if (field === "percentage") {
      const percent: number = parseFloat(value) || 0;
      updated[index].amount = ((totalAmount * percent) / 100).toFixed(2);
    }

    if (field === "amount") {
      const amt: number = parseFloat(value) || 0;
      updated[index].percentage = totalAmount
        ? ((amt / totalAmount) * 100).toFixed(2)
        : "";
    }

    setAllocations(updated);
  };

  // Add a new project allocation row
  const addProject = () => {
    setAllocations([
      ...allocations,
      { projectId: "", amount: "", percentage: "" },
    ]);
  };

  // Remove a project allocation row
  const removeProject = (index: number) => {
    setAllocations(allocations.filter((_, i: number) => i !== index));
  };

  // Handle apply button click
  const handleApply = () => {
    if (remaining !== 0) {
      alert("⚠️ Please allocate the full amount before applying.");
      return;
    }
    console.log("✅ Final Allocation:", allocations);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
  <div className="bg-white dark:bg-gray-900 rounded-md shadow-xl w-full max-w-2xl p-6 relative border border-gray-200 dark:border-gray-700">
    <button
      type="button"
      onClick={onClose}
      className="absolute top-4 right-4 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <AiOutlineClose className="w-5 h-5" />
    </button>

    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
      Divide Invoice Amount Across Projects
    </h2>

    {/* Selected Invoices */}
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 max-h-40 overflow-y-auto custom-scrollbar mb-4">
      {invoices.map((inv: Invoice) => (
        <div key={inv.id} className="flex justify-between py-1">
          <span className="text-gray-700 dark:text-gray-300">
            {inv.workerName} - {inv.payPeriod}
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            ${inv.totals?.totalPay ? inv.totals.totalPay.toFixed(2) : "N/A"}
          </span>
        </div>
      ))}
      <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
        <span className="dark:text-gray-200">Total Amount:</span>
        <span className="text-purple-600 dark:text-purple-400">
          ${totalAmount.toFixed(2)}
        </span>
      </div>
    </div>

    {/* Divide Across Projects */}
    <div className="space-y-3 mb-4">
      {allocations.map((alloc: Allocation, index: number) => (
        <div key={index} className="flex items-center gap-3">
          <select
            className="border rounded-md px-3 py-2 flex-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            value={alloc.projectId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              updateAllocation(index, "projectId", e.target.value)
            }
          >
            <option value="">Select Project</option>
            {(projects as Project[]).map((p: Project) => (
              <option key={p.id} value={p.id.toString()}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="$"
            className="border rounded-md px-3 py-2 w-28 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            value={alloc.amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateAllocation(index, "amount", e.target.value)
            }
          />

          <input
            type="number"
            placeholder="%"
            className="border rounded-md px-3 py-2 w-20 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            value={alloc.percentage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateAllocation(index, "percentage", e.target.value)
            }
          />

          {allocations.length > 1 && (
            <button
              type="button"
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 flex items-center justify-center"
              onClick={() => removeProject(index)}
            >
              <AiOutlineClose className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-500 text-sm font-medium flex items-center gap-1"
        onClick={addProject}
      >
        + Add Another Project
      </button>
    </div>

    <div className="text-right text-gray-600 dark:text-gray-300 mb-4">
      Remaining:{" "}
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        ${remaining.toFixed(2)}
      </span>
    </div>

    {/* Buttons */}
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-md cursor-pointer border bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700 dark:text-gray-200 transition"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleApply}
        className="px-4 py-2 rounded-md cursor-pointer bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 transition"
      >
        Apply Division
      </button>
    </div>
  </div>
</div>

  );
}