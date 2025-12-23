"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchProjects } from "@/redux/projects/projectSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { createProjectExpense } from "@/redux/projectExpense/projectExpenseSlice";
import { FileText, DollarSign, User, X, Search, Folder, Upload, Trash2, AlertCircle, Loader2 } from "lucide-react";

interface AddExpenseModalProps {
  onClose: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();

  const { items: projects, loading: projectLoading } = useSelector((state: RootState) => state.projects);
  const { items: workers, loading: workerLoading } = useSelector((state: RootState) => state.workers);
  const { loading } = useSelector((state: RootState) => state.projectExpense);

  const [formData, setFormData] = useState({
    ProjectId: "",
    WorkerId: "",
    TotalPayment: "",
    ExpenseDescription: "",
    Status: "",
    PaymentNote: "",
    PaymentMethod: "",
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProjects()).catch((err) => console.error("Failed to fetch projects:", err));
    dispatch(fetchWorkers()).catch((err) => console.error("Failed to fetch workers:", err));

    return () => {
      selectedFiles.forEach((file) => URL.revokeObjectURL(URL.createObjectURL(file)));
    };
  }, [dispatch, selectedFiles]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const allowedTypes = ["image/png", "image/jpeg"];
    const validFiles: File[] = [];
    let fileError: string | null = null;

    newFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) fileError = `Invalid file type: ${file.name}. Only PNG or JPG are allowed.`;
      else if (file.size > 10 * 1024 * 1024) fileError = `File size exceeds 10MB: ${file.name}.`;
      else validFiles.push(file);
    });

    if (fileError) setError(fileError);
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.ProjectId || !formData.WorkerId || parseFloat(formData.TotalPayment) <= 0) {
      setError("Please select a project, worker, and enter a valid payment amount.");
      return;
    }

    if (selectedFiles.length === 0) {
      setError("Please upload at least one image receipt.");
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => formDataToSend.append(key, value));
    selectedFiles.forEach((file) => formDataToSend.append("Attachments", file, file.name));

    try {
      // @ts-expect-error
      await dispatch(createProjectExpense(formDataToSend)).unwrap();
      onClose();
    } catch (err: unknown) {  
      console.error("Expense creation error:", err);
      let message = "An unexpected error occurred.";
      if (typeof err === "object" && err !== null && "message" in err && typeof (err as any).message === "string") {
        message = (err as any).message;
      }
      setError(message);
    }
  };

  const filteredProjects = projects.filter((p) => p.name.toLowerCase().includes(projectSearch.toLowerCase()));
  const filteredWorkers = workers.filter(
    (w) =>
      w.firstName.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.lastName.toLowerCase().includes(workerSearch.toLowerCase()) ||
      (w.specialization?.toLowerCase() || "").includes(workerSearch.toLowerCase())
  );

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-content { animation: fadeIn 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>

      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Project Expense</h2>
                <p className="text-blue-100 text-sm">Create a new expense record</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg" aria-label="Close modal">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <form className="p-6 flex-grow overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Project & Worker */}
              <div className="space-y-6">
                {/* Project Selection */}
                <div className="bg-white rounded-lg border shadow-sm p-5">
                  <div className="flex items-center space-x-3 mb-4 border-b-2 border-blue-200 pb-2">
                    <Folder className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Select Project</h3>
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1 pr-2">
                    {projectLoading ? (
                      <div className="flex justify-center py-2">
                        <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
                      </div>
                    ) : filteredProjects.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">No projects found</p>
                    ) : (
                      filteredProjects.map((p, index) => (
                        <label key={p.id} className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-all ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                          <input type="radio" name="ProjectId" value={p.id} checked={formData.ProjectId === p.id.toString()} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                          <Folder className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-900 font-medium">{p.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Worker Selection */}
                <div className="bg-white rounded-lg border shadow-sm p-5">
                  <div className="flex items-center space-x-3 mb-4 border-b-2 border-blue-200 pb-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Select Worker</h3>
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search workers..."
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1 pr-2">
                    {workerLoading ? (
                      <div className="flex justify-center py-2">
                        <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
                      </div>
                    ) : filteredWorkers.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">No workers found</p>
                    ) : (
                      filteredWorkers.map((w, index) => (
                        <label key={w.id} className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-all ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                          <input type="radio" name="WorkerId" value={w.id} checked={formData.WorkerId === w.id.toString()} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                          <User className="h-4 w-4 text-blue-500" />
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900 font-medium">Id: {w.id}</span>
                            <span className="text-sm text-gray-900 font-medium">Name: {w.firstName} {w.lastName}</span>
                            <span className="text-sm text-gray-900 font-medium">Email: {w.email}</span>
                            <span className="text-xs text-gray-500">{w.specialization || "No specialization"}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Expense Details */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg border shadow-sm p-5">
                  <div className="flex items-center space-x-3 mb-4 border-b-2 border-amber-200 pb-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Expense Details</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Total Payment</label>
                      <div className="relative flex items-center">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="number" name="TotalPayment" value={formData.TotalPayment} onChange={handleChange} required step="0.01" className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Expense Description</label>
                      <textarea name="ExpenseDescription" value={formData.ExpenseDescription} onChange={handleChange} rows={3} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Payment for construction work..." />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Payment Note</label>
                      <input type="text" name="PaymentNote" value={formData.PaymentNote} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Paid via bank transfer..." />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                      <select name="PaymentMethod" value={formData.PaymentMethod} onChange={handleChange} required className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                        <option value="">Select Method</option>
                        <option value="Cash">Cash</option>
                        <option value="BankTransfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                      <select name="Status" value={formData.Status} onChange={handleChange} required className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Receipts</h3>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-gray-600 font-medium">Click to upload receipts</span>
                        <span className="text-xs text-gray-500 mt-1">PNG or JPG (Max 10MB each)</span>
                        <input type="file" accept="image/png,image/jpeg" onChange={handleFileChange} className="hidden" multiple />
                      </label>
                      {selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-700">Uploaded Files ({selectedFiles.length})</h4>
                            <button type="button" onClick={() => setSelectedFiles([])} className="text-xs text-red-600 hover:underline font-medium">Clear All</button>
                          </div>
                          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                </div>
                                <button type="button" onClick={() => handleRemoveFile(index)} className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
            <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={loading || selectedFiles.length === 0 || !formData.ProjectId || !formData.WorkerId || parseFloat(formData.TotalPayment) <= 0} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              {loading ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddExpenseModal;
