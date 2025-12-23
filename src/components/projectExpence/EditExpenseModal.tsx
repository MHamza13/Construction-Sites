"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { updateProjectExpense } from "@/redux/projectExpense/projectExpenseSlice";
import { fetchProjects } from "@/redux/projects/projectSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { FileText, DollarSign, X, Upload, Trash2, AlertCircle, User, Folder, Loader2, Search } from "lucide-react";

interface EditExpenseModalProps {
  expense: any;
  onClose: () => void;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ expense, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();

  const { items: projects, loading: projectLoading } = useSelector((state: RootState) => state.projects);
  const { items: workers, loading: workerLoading } = useSelector((state: RootState) => state.workers);
  const { loading: expenseLoading } = useSelector((state: RootState) => state.projectExpense);

  const [formData, setFormData] = useState({
    Id: expense.id,
    ProjectId: "",
    WorkerId: "",
    TotalPayment: expense.totalPayment || "",
    ExpenseDescription: expense.expenseDescription || "",
    Status: expense.status || "Pending",
    PaymentNote: expense.paymentNote || "",
    PaymentMethod: expense.paymentMethod || "",
  });

  const [existingAttachments, setExistingAttachments] = useState<string[]>(
    Array.isArray(expense.paymentSlipPaths) ? expense.paymentSlipPaths : []
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");

  useEffect(() => {
    if (!projects.length) dispatch(fetchProjects()).catch(console.error);
    if (!workers.length) dispatch(fetchWorkers()).catch(console.error);
  }, [dispatch, projects.length, workers.length]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ProjectId: expense.projectId?.toString() || (projects[0]?.id?.toString() ?? ""),
      WorkerId: expense.workerId?.toString() || (workers[0]?.id?.toString() ?? ""),
    }));
  }, [expense, projects, workers]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "TotalPayment" ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const allowedTypes = ["image/png", "image/jpeg"];
    const validFiles: File[] = [];
    let fileError: string | null = null;

    newFiles.forEach((file) => {
      if (!allowedTypes.includes(file.type)) fileError = `Invalid file type: ${file.name}. Only PNG/JPG allowed.`;
      else if (file.size > 10 * 1024 * 1024) fileError = `File size exceeds 10MB: ${file.name}.`;
      else validFiles.push(file);
    });

    if (fileError) setError(fileError);
    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => setAttachments((prev) => prev.filter((_, i) => i !== index));
  const handleRemoveExistingFile = (index: number) => setExistingAttachments((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!formData.ProjectId || !formData.WorkerId || !formData.TotalPayment || !formData.ExpenseDescription) {
      Swal.fire("Error", "Please fill all required fields", "error");
      return;
    }
    if (existingAttachments.length + attachments.length === 0) {
      Swal.fire("Error", "Please add at least one attachment", "error");
      return;
    }

    try {
      const formToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => formToSend.append(key, value as any));
      existingAttachments.forEach((path) => formToSend.append("ExistingAttachments", path));
      attachments.forEach((file) => formToSend.append("Attachments", file, file.name));

      // @ts-expect-error
      await dispatch(updateProjectExpense({ id: expense.id, data: formToSend })).unwrap();
      Swal.fire("Success", "Expense updated successfully", "success");
      onClose();
    } catch (err: any) {
      Swal.fire("Error", err?.message ?? "Failed to update expense", "error");
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Expense</h2>
              <p className="text-blue-100 text-sm">Update expense details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <form className="p-6 flex-grow overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Project & Worker selection */}
            <div className="space-y-6">
              {/* Project */}
              <div className="bg-white rounded-lg border shadow-sm p-5">
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
                <div className="max-h-[200px] overflow-y-auto space-y-1 pr-2">
                  {projectLoading ? (
                    <div className="flex justify-center py-2"><Loader2 className="animate-spin h-5 w-5 text-blue-500" /></div>
                  ) : filteredProjects.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No projects found</p>
                  ) : (
                    filteredProjects.map((p, index) => (
                      <label key={p.id} className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-all ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                        <input type="radio" name="ProjectId" value={p.id} checked={formData.ProjectId.toString() === p.id.toString()} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                        <Folder className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-900 font-medium">{p.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Worker */}
              <div className="bg-white rounded-lg border shadow-sm p-5">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="Search workers..." value={workerSearch} onChange={(e) => setWorkerSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-1 pr-2">
                  {workerLoading ? (
                    <div className="flex justify-center py-2"><Loader2 className="animate-spin h-5 w-5 text-blue-500" /></div>
                  ) : filteredWorkers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No workers found</p>
                  ) : (
                    filteredWorkers.map((w, index) => (
                      <label key={w.id} className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-all ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                        <input type="radio" name="WorkerId" value={w.id} checked={formData.WorkerId.toString() === w.id.toString()} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                        <User className="h-4 w-4 text-blue-500"/>
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

            {/* Right: Payment details & attachments */}
            <div className="space-y-4">
              {/* Total Payment, Description, Note, Method, Status */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Total Payment *</label>
                <div className="relative flex items-center">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
                  <input type="number" name="TotalPayment" value={formData.TotalPayment} onChange={handleChange} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Expense Description *</label>
                <textarea name="ExpenseDescription" value={formData.ExpenseDescription} onChange={handleChange} rows={3} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Payment for materials..."/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Payment Note</label>
                <input type="text" name="PaymentNote" value={formData.PaymentNote} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional note..."/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                <select name="PaymentMethod" value={formData.PaymentMethod} onChange={handleChange} className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Method</option>
                  <option value="Cash">Cash</option>
                  <option value="BankTransfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <select name="Status" value={formData.Status} onChange={handleChange} className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Attachments */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Attachments</h3>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition">
                  <Upload className="w-6 h-6 text-gray-400 mb-1"/>
                  <span className="text-gray-600 text-sm">Click to upload files</span>
                  <input type="file" multiple accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden"/>
                </label>

                {/* Existing attachments */}
                {existingAttachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {existingAttachments.map((file, index) => (
                      <div key={index} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                        <img src={file} alt={`attachment-${index}`} className="w-full h-full object-cover"/>
                        <button type="button" onClick={() => handleRemoveExistingFile(index)} className="absolute top-1 right-1 text-red-500 hover:text-red-700 bg-white rounded-full p-1">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New attachments */}
                {attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {attachments.map((file, index) => (
                      <div key={index} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover"/>
                        <button type="button" onClick={() => handleRemoveFile(index)} className="absolute top-1 right-1 text-red-500 hover:text-red-700 bg-white rounded-full p-1">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={expenseLoading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
            <FileText className="w-5 h-5"/>
            {expenseLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;
