"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { updateProject } from "@/redux/projects/projectSlice";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
import { Loader2 } from "lucide-react";

interface EditProjectProps {
  project: {
    id: string;
    name: string;
    description: string;
    budget: number;
    clientName: string;
    location?: string;
    status: string;
    priority: string;
    deadlineDate: string;
    startDate: string;
    managerId?: string | null;
  };
  onCancel: () => void;
  onEditSuccess: () => void;
}

export default function EditProject({
  project,
  onCancel,
  onEditSuccess,
}: EditProjectProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
    clientName: "",
    location: "",
    status: "Active",
    priority: "Medium",
    deadlineDate: new Date(),
    startDate: new Date(),
    managerId: "",
  });

  // Format number with commas
  const formatBudget = (value: string): string => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return formatBudget(parts[0] + "." + parts.slice(1).join(""));
    const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts[1] !== undefined ? `${integer}.${parts[1]}` : integer;
  };

  // Load project data with formatted budget
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        budget: project.budget ? formatBudget(project.budget.toString()) : "",
        clientName: project.clientName || "",
        location: project.location || "",
        status: project.status || "Active",
        priority: project.priority || "Medium",
        deadlineDate: project.deadlineDate ? new Date(project.deadlineDate) : new Date(),
        startDate: project.startDate ? new Date(project.startDate) : new Date(),
        managerId: project.managerId || "",
      });
    }
  }, [project]);

  // Handle input change
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "budget") {
      const formatted = formatBudget(value);
      setFormData((prev) => ({ ...prev, budget: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanBudget = formData.budget.replace(/,/g, "");
    const budgetNumber = cleanBudget ? parseFloat(cleanBudget) : 0;

    if (isNaN(budgetNumber)) {
      toast.error("Please enter a valid budget amount.");
      setLoading(false);
      return;
    }

    try {
      await dispatch(
        updateProject({
          id: project.id,
          updatedData: {
            ...formData,
            id: project.id,
            budget: budgetNumber,
            startDate: formData.startDate.toISOString(),
            deadlineDate: formData.deadlineDate.toISOString(),
          },
        })
      ).unwrap();

      toast.success("Project updated successfully!");
      onEditSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-gray-800/70 dark:to-gray-900/70 rounded-2xl -z-10 transition-colors duration-300" />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-colors duration-300">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg shadow-sm transition-colors duration-300">
              <FiFolder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                Edit Basic Information
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                Update project details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InputField id="name" label="Project Name *" value={formData.name} onChange={handleChange} icon={<FiFolder />} />
            <InputField id="clientName" label="Client Name *" value={formData.clientName} onChange={handleChange} icon={<FiUser />} />

            {/* Budget Field - Only Numbers */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Budget ($)</label>
              <div className="relative group">
                <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  id="budget"
                  name="budget"
                  type="text"
                  inputMode="numeric"
                  placeholder="2,500,000"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 hover:border-gray-300 dark:bg-gray-800 bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* <InputField id="managerId" label="Manager ID" value={formData.managerId} onChange={handleChange} icon={<FiUser />} /> */}
            <InputField id="location" label="Location" value={formData.location} onChange={handleChange} icon={<FiMapPin />} />

            <div className="lg:col-span-2">
              <TextAreaField id="description" label="Description" value={formData.description} onChange={handleChange} icon={<FiAlignLeft />} />
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-gray-900 dark:to-emerald-900/20 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-colors duration-300">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-green-100 dark:bg-emerald-900/40 rounded-lg shadow-sm transition-colors duration-300">
              <FiTrendingUp className="h-5 w-5 text-green-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                Project Details
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                Edit status, priority, and timeline
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SelectField
              id="status"
              label="Status *"
              value={formData.status}
              onChange={handleChange}
              icon={<FiTrendingUp />}
              options={[
                { value: "Active", label: "Active" },
                { value: "InActive", label: "InActive" },
                { value: "Complete", label: "Completed" },
              ]}
            />

            <SelectField
              id="priority"
              label="Priority"
              value={formData.priority}
              onChange={handleChange}
              icon={<FiFlag />}
              options={[
                { value: "Low", label: "Low" },
                { value: "Medium", label: "Medium" },
                { value: "High", label: "High" },
              ]}
            />

            {/* Deadline */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Deadline *</label>
              <div className="relative group">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <DatePicker
                  selected={formData.deadlineDate}
                  onChange={(date) => date && setFormData((prev) => ({ ...prev, deadlineDate: date }))}
                  minDate={formData.startDate}
                  dateFormat="MMMM d, yyyy"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 hover:border-gray-300 dark:bg-gray-800 bg-white transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all duration-200"
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

/* ----------------------------- Reusable Fields ----------------------------- */

function InputField({ id, label, value, onChange, icon }: { id: string; label: string; value: string; onChange: any; icon?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative group">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{icon}</span>}
        <input
          id={id}
          name={id}
          type="text"
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 hover:border-gray-300 dark:bg-gray-800 bg-white transition-all duration-200"
        />
      </div>
    </div>
  );
}

function TextAreaField({ id, label, value, onChange, icon }: { id: string; label: string; value: string; onChange: any; icon?: React.ReactNode }) {
  return (
    <div className="space-y-2 lg:col-span-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative group">
        {icon && <span className="absolute left-3 top-3 text-gray-400 dark:text-gray-500">{icon}</span>}
        <textarea
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          rows={3}
          className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 hover:border-gray-300 dark:bg-gray-800 resize-none transition-all duration-200"
        />
      </div>
    </div>
  );
}

function SelectField({ id, label, value, onChange, icon, options }: { id: string; label: string; value: string; onChange: any; icon?: React.ReactNode; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative group">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{icon}</span>}
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 hover:border-gray-300 dark:bg-gray-800 bg-white transition-all duration-200"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}