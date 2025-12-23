"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  parseValidationErrors,
  getErrorMessage,
  isValidationError,
} from "../../utils/errorHandler";
import {
  FiFolder,
  FiAlignLeft,
  FiDollarSign,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiTrendingUp,
  FiFlag,
} from "react-icons/fi";
import { createProject } from "@/redux/projects/projectSlice";
import { AppDispatch, RootState } from "@/redux/store";

/* ----------------------------- Types & Interfaces ----------------------------- */

interface AddProjectPageProps {
  onCancel?: () => void;
  onProjectAdd?: (project: Project) => void;
}

interface FormState {
  name: string;
  description: string;
  budget: string; // string to allow formatting with commas
  deadline: Date | null;
  client: string;
  location: string;
  startDate: Date | null;
  managerId: string;
  priority: string;
  status: string;
}

type ErrorMap = Record<string, string>;

/* ----------------------------- Component ----------------------------- */

export default function AddProjectPage({
  onCancel,
  onProjectAdd,
}: AddProjectPageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading } = useSelector((state: RootState) => state.projects);

  const [formData, setFormData] = useState<FormState>({
    name: "",
    description: "",
    budget: "",
    deadline: null,
    client: "",
    location: "",
    startDate: new Date(),
    managerId: "",
    priority: "Medium",
    status: "Active",
  });

  const [errors, setErrors] = useState<ErrorMap>({});

  /* ----------------------------- Handlers ----------------------------- */

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Special handling for budget field
    if (name === "budget") {
      // Remove all non-digit and non-dot characters except commas (for formatting)
      let cleaned = value.replace(/[^0-9.]/g, "");

      // Prevent multiple dots
      const parts = cleaned.split(".");
      if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("");
      }

      // Prevent leading zero issues (optional)
      if (cleaned.startsWith(".")) cleaned = "0" + cleaned;
      if (cleaned === "") cleaned = "";

      // Format with commas
      const [integerPart, decimalPart] = cleaned.split(".");
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const formattedValue = decimalPart !== undefined
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;

      setFormData((prev) => ({ ...prev, budget: formattedValue }));

      if (errors.budget) {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.budget;
          return copy;
        });
      }
      return;
    }

    // Handle other fields
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ErrorMap = {};
    if (!formData.name?.trim()) newErrors.name = "Project name is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required";
    if (!formData.budget?.trim()) {
      newErrors.budget = "Budget is required";
    } else if (isNaN(parseFloat(formData.budget.replace(/,/g, "")))) {
      newErrors.budget = "Please enter a valid number";
    }
    if (!formData.client?.trim()) newErrors.client = "Client name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name || "",
        description: formData.description || "",
        budget: parseFloat(formData.budget.replace(/,/g, "")) || 0,
        deadlineDate: formData.deadline?.toISOString() ?? new Date().toISOString(),
        clientName: formData.client || "",
        startDate: formData.startDate?.toISOString() ?? new Date().toISOString(),
        status: formData.status || "Active",
        priority: formData.priority || "Medium",
        managerId: formData.managerId || null,
        ...(formData.location && { location: formData.location }),
        metadata: JSON.stringify({
          phase: "Initial Planning",
          priority: formData.priority,
        }),
      };

      const result = await dispatch(createProject(payload)).unwrap();

      toast.success("Project Created! Your project has been successfully added.");

      if (onProjectAdd) onProjectAdd(result);
    } catch (err: unknown) {
      console.error("Project creation error:", err);

      if (isValidationError(err)) {
        const apiErrors = parseValidationErrors(err);
        setErrors(apiErrors);
        toast.error("Please fix the validation errors below and try again.");
      } else {
        toast.error(getErrorMessage(err));
      }
    }
  };

  const handleCancel = () => {
    setErrors({});
    if (onCancel) onCancel();
    else router.push("/projects");
  };

  /* ----------------------------- Render ----------------------------- */

  return (
    <div className="w-full mx-auto relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-gray-900/40 dark:to-gray-800/40 rounded-2xl -z-10" />

      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/60 rounded-lg shadow-sm transition-colors duration-300">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2 text-red-500 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L4.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Please fix the following errors:
          </h3>

          <ul className="text-sm text-red-700 dark:text-red-400 space-y-2">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field} className="flex items-start">
                <span className="text-red-500 dark:text-red-400 mr-2">•</span>
                <span className="font-medium capitalize">{field}:</span>
                <span className="ml-1">{message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Information */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-all duration-300">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg shadow-sm">
              <FiFolder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Basic Information
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Enter project details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <InputField
                id="name"
                label="Project Name *"
                placeholder="e.g., Downtown Office Complex"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                icon={<FiFolder />}
              />
            </div>

            <div className="lg:col-span-2">
              <TextAreaField
                id="description"
                label="Description *"
                placeholder="Describe project scope and objectives..."
                value={formData.description}
                onChange={handleChange}
                error={errors.description}
                icon={<FiAlignLeft />}
              />
            </div>

            {/* Budget Field - Now with number formatting */}
            <div>
              <label
                htmlFor="budget"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Budget *
              </label>
              <div className="relative group">
                <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  id="budget"
                  name="budget"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 2,500,000"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 transition-all duration-200"
                />
              </div>
              {errors.budget && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.budget}</p>}
            </div>

            <InputField
              id="client"
              label="Client Name *"
              placeholder="e.g., ABC Corporation"
              value={formData.client}
              onChange={handleChange}
              error={errors.client}
              icon={<FiUser />}
            />

            <div className="lg:col-span-2">
              <InputField
                id="location"
                label="Location"
                placeholder="e.g., New York, NY"
                value={formData.location}
                onChange={handleChange}
                error={errors.location}
                icon={<FiMapPin />}
              />
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="relative bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-all duration-300">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg shadow-sm">
              <FiTrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Project Details
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Set status, priority, and deadline
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status *
              </label>
              <div className="relative group">
                <FiTrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 transition-all duration-200"
                >
                  <option value="Active">Active</option>
                  <option value="InActive">InActive</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <div className="relative group">
                <FiFlag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 transition-all duration-200"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Deadline *
              </label>
              <div className="relative group">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" />
                <DatePicker
                  selected={formData.deadline}
                  onChange={(date: Date | null) =>
                    setFormData((prev) => ({ ...prev, deadline: date }))
                  }
                  minDate={formData.startDate ?? new Date()}
                  dateFormat="MMMM d, yyyy"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium text-sm disabled:opacity-70 transition-all duration-200"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ----------------------------- InputField Component ----------------------------- */

interface InputFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  icon?: React.ReactNode;
}

function InputField({ id, label, placeholder = "", value, onChange, error, icon }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>

      <div className="relative group">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
          {icon}
        </span>
        <input
          id={id}
          name={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 transition-all duration-200"
        />
      </div>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
    </div>
  );
}

/* ----------------------------- TextAreaField Component ----------------------------- */

interface TextAreaFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  icon?: React.ReactNode;
}

function TextAreaField({ id, label, placeholder = "", value, onChange, error, icon }: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>

      <div className="relative group">
        <span className="absolute left-3 top-3 text-gray-400 dark:text-gray-500">
          {icon}
        </span>
        <textarea
          id={id}
          name={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={3}
          className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 resize-none transition-all duration-200"
        />
      </div>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
    </div>
  );
}