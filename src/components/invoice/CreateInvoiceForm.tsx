"use client";

import { useState, useEffect, ChangeEvent, FormEvent, SVGProps, ComponentType } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects } from "@/redux/projects/projectSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import {
  User,
  Calendar,
  Clock,
  Briefcase,
  DollarSign,
  FileText,
  Settings,
  Plus,
} from "lucide-react";
import { RootState, AppDispatch } from "@/redux/store";

interface CreateInvoiceFormProps {
  onSuccess?: () => void;
}

interface FormData {
  worker: string;
  date: string;
  hours: string;
  overtime: string;
  project: string;
  dailyWage: string;
  extraHours: string;
  clientAdjust: string;
  reason: string;
}

interface ErrorState {
  [key: string]: string;
}

export default function CreateInvoiceForm({ onSuccess }: CreateInvoiceFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  // Redux states
  const { items: workers, loading: workersLoading } = useSelector(
    (state: RootState) => state.workers
  );
  const { items: projects, loading: projectsLoading } = useSelector(
    (state: RootState) => state.projects
  );
  const { loading } = useSelector((state: RootState) => state.invoices);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchWorkers());
    dispatch(fetchProjects());
  }, [dispatch]);

  const [formData, setFormData] = useState<FormData>({
    worker: "",
    date: new Date().toISOString().split("T")[0],
    hours: "",
    overtime: "",
    project: "",
    dailyWage: "",
    extraHours: "",
    clientAdjust: "",
    reason: "",
  });

  const [errors, setErrors] = useState<ErrorState>({});

  const validateForm = (): ErrorState => {
    const newErrors: ErrorState = {};
    if (!formData.worker) newErrors.worker = "Worker is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.hours || parseFloat(formData.hours) <= 0)
      newErrors.hours = "Enter valid hours";
    if (!formData.project) newErrors.project = "Project is required";
    if (!formData.dailyWage || parseFloat(formData.dailyWage) <= 0)
      newErrors.dailyWage = "Enter valid daily wage";
    return newErrors;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const selectedWorker = workers.find((w) => w.id === parseInt(formData.worker));

      const payload = {
        firstName: selectedWorker?.firstName ?? "",
        lastName: selectedWorker?.lastName ?? "",
        email: selectedWorker?.email ?? "",
        phoneNumber: selectedWorker?.phoneNumber ?? "",
        isActive: true,
        profilePictureUrl: selectedWorker?.profilePictureUrl ?? "",
        experience: selectedWorker?.experience ?? 0,
        dailyWages: parseFloat(formData.dailyWage) || 0,
        perHourSalary: 0,
        specializationId: selectedWorker?.specializationId ?? 0,
        date: formData.date,
        hours: parseFloat(formData.hours) || 0,
        overtime: parseFloat(formData.overtime) || 0,
        projectId: parseInt(formData.project) || 0,
        extraHours: parseFloat(formData.extraHours) || 0,
        clientAdjust: parseFloat(formData.clientAdjust) || 0,
        reason: formData.reason || "",
      };

      const resultAction = await dispatch(createInvoice(payload));
      if (createInvoice.fulfilled.match(resultAction)) {
        setFormData({
          worker: "",
          date: new Date().toISOString().split("T")[0],
          hours: "",
          overtime: "",
          project: "",
          dailyWage: "",
          extraHours: "",
          clientAdjust: "",
          reason: "",
        });
        onSuccess?.();
      } else {
        console.error("Failed to create invoice:", resultAction.payload);
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  return (
    <div className="w-full mx-auto relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl -z-10"></div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
  <div className="flex items-center space-x-3 mb-5">
    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg shadow-sm">
      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    </div>
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
        Basic Information
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        Worker and project details
      </p>
    </div>
  </div>
              <div className="space-y-5">
                <SelectField
                  label="Worker *"
                  icon={User}
                  name="worker"
                  value={formData.worker}
                  onChange={handleChange}
                  error={errors.worker}
                  options={workers.map((w) => ({
                    label: `${w.firstName} ${w.lastName} — ${w.specializationName}`,
                    value: w.id.toString(),
                  }))}
                  disabled={workersLoading}
                  placeholder={workersLoading ? "Loading workers..." : "Select Worker"}
                />

                <InputField
                  label="Date *"
                  icon={Calendar}
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  error={errors.date}
                />

                <InputField
                  label="Working Hours *"
                  icon={Clock}
                  name="hours"
                  value={formData.hours}
                  onChange={handleChange}
                  error={errors.hours}
                  placeholder="Enter hours"
                />

                <InputField
                  label="Overtime Hours"
                  icon={Clock}
                  name="overtime"
                  value={formData.overtime}
                  onChange={handleChange}
                  placeholder="Enter overtime hours"
                />

                <SelectField
                  label="Project *"
                  icon={Briefcase}
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  error={errors.project}
                  options={projects.map((p) => ({
                    label: `${p.name} — ${p.status}`,
                    value: p.id.toString(),
                  }))}
                  disabled={projectsLoading}
                  placeholder={projectsLoading ? "Loading projects..." : "Select Project"}
                />
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-6">
           <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
  <div className="flex items-center space-x-3 mb-5">
    <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg shadow-sm">
      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
    </div>
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
        Financial Details
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        Wages and adjustments
      </p>
    </div>
  </div>

              <div className="space-y-5">
                <InputField
                  label="Daily Wage ($) *"
                  icon={DollarSign}
                  name="dailyWage"
                  value={formData.dailyWage}
                  onChange={handleChange}
                  error={errors.dailyWage}
                  placeholder="Enter daily wage"
                />
                <InputField
                  label="Extra Hours Amount ($)"
                  icon={Plus}
                  name="extraHours"
                  value={formData.extraHours}
                  onChange={handleChange}
                  placeholder="Enter extra hours amount"
                />
                <InputField
                  label="Client Adjustment ($)"
                  icon={Settings}
                  name="clientAdjust"
                  value={formData.clientAdjust}
                  onChange={handleChange}
                  placeholder="Enter client adjustment"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50/30 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
  <div className="flex items-center space-x-3 mb-5">
    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg shadow-sm">
      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
    </div>
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
        Additional Information
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        Reason and notes
      </p>
    </div>
  </div>

  <div className="space-y-5">
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
      Reason
    </label>
    <div className="relative">
      <FileText className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
      <textarea
        name="reason"
        placeholder="Enter reason for invoice"
        value={formData.reason}
        onChange={handleChange}
        className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 transition-all duration-200 text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none resize-y"
        rows={3}
      />
    </div>
  </div>
</div>

          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
  <button
    type="button"
    onClick={() => window.history.back()}
    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 flex items-center justify-center"
  >
    Cancel
  </button>
  <button
    type="submit"
    disabled={loading}
    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800"
  >
    {loading ? (
      <>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        Creating...
      </>
    ) : (
      <>
        <Plus className="w-4 h-4 mr-2" />
        Create Invoice
      </>
    )}
  </button>
</div>

      </form>
    </div>
  );
}

// Reusable error message component
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex items-center text-red-600 text-sm mt-1">
    <svg
      className="w-4 h-4 mr-1"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
    {message}
  </div>
);

// Reusable Input Field
interface InputFieldProps {
  label: string;
  // ✅ Changed 'any' to a specific and safe type for SVG icons
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  type?: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  placeholder?: string;
}

const InputField = ({
  label,
  icon: Icon,
  type = "number",
  name,
  value,
  onChange,
  error,
  placeholder,
}: InputFieldProps) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full pl-10 pr-3 py-2.5 rounded-lg border-2 transition-all duration-200 text-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-300 bg-white text-gray-900 focus:outline-none ${
          error ? "border-red-500" : ""
        }`}
      />
    </div>
    {error && <ErrorMessage message={error} />}
  </div>
);

// Reusable Select Field
interface SelectFieldProps {
  label: string;
  // ✅ Changed 'any' to a specific and safe type for SVG icons
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string }[];
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const SelectField = ({
  label,
  icon: Icon,
  name,
  value,
  onChange,
  options,
  error,
  disabled,
  placeholder,
}: SelectFieldProps) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pl-10 pr-3 py-2.5 rounded-lg border-2 transition-all duration-200 text-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-300 bg-white text-gray-900 focus:outline-none ${
          error ? "border-red-500" : ""
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
    {error && <ErrorMessage message={error} />}
  </div>
);