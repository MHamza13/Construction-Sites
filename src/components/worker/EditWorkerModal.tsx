"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import placeholderImg from "@/assets/profilebgRemove.png";
import Swal from "sweetalert2";
import {
  User,
  Phone,
  Mail,
  Award,
  CreditCard,
  Briefcase,
  ToggleLeft,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchSpecializations } from "@/redux/specialization/specializationSlice";
import Image from "next/image";
import { FaEuroSign } from "react-icons/fa";

// Interfaces
interface Specialization {
  id: number;
  name: string;
}

interface Worker {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  isApprovedByAdmin?: boolean; // NEW FIELD
  profilePictureUrl?: string | null;
  experience: number;
  dailyWages: number;
  perHourSalary: number;
  specializationId?: number | null;
  specialization?: Specialization;
}

interface EditWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  onSave: (data: Worker) => Promise<void>;
}

const EditWorkerModal: React.FC<EditWorkerModalProps> = ({
  isOpen,
  onClose,
  worker,
  onSave,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: specializations, loading } = useSelector(
    (state: RootState) => state.specializations
  );

  const [formData, setFormData] = useState<Worker>(
    worker || {
      id: 0,
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      isActive: true,
      isApprovedByAdmin: false,
      profilePictureUrl: null,
      experience: 0,
      dailyWages: 0,
      perHourSalary: 0,
      specializationId: null,
    }
  );
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchSpecializations());
  }, [dispatch]);

  useEffect(() => {
    if (worker) {
      setFormData({
        ...worker,
        specializationId:
          worker.specialization?.id || worker.specializationId || null,
        isActive: worker.isActive ?? true,
        isApprovedByAdmin: worker.isApprovedByAdmin ?? false,
      });
      setPreview(worker.profilePictureUrl || null);
    }
  }, [worker]);

  if (!isOpen || !worker) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "isActive" || name === "isApprovedByAdmin"
          ? value === "true"
          : name === "experience" ||
            name === "dailyWages" ||
            name === "perHourSalary"
          ? Number(value)
          : value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const updatedData: Worker = {
      ...formData,
      specializationId: formData.specializationId
        ? Number(formData.specializationId)
        : null,
      profilePictureUrl: preview,
    };

    try {
      await onSave(updatedData);
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Worker updated successfully",
        confirmButtonColor: "#3085d6",
      }).then(() => onClose());
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update worker. Please try again.",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-md p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-none shadow-lg border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Edit Worker
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Update worker information
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center">
              <Image
                src={preview || placeholderImg.src}
                alt="Preview"
                width={80}
                height={80}
                className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shadow-sm mr-4"
                unoptimized
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block text-sm text-gray-500 dark:text-gray-400 
                  file:mr-4 file:py-2 file:px-4 
                  file:rounded-full file:border-0 
                  file:text-sm file:font-semibold 
                  file:bg-blue-50 file:text-blue-700 
                  dark:file:bg-blue-900/20 dark:file:text-blue-300
                  hover:file:bg-blue-100 dark:hover:file:bg-blue-900/40
                  cursor-pointer transition-colors duration-150"
              />
            </div>
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <User className="absolute left-3 top-[37px] h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleChange}
                placeholder="First Name"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-150"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <User className="absolute left-3 top-[37px] h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
                placeholder="Last Name"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-150"
                required
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <Phone className="absolute left-3 top-[37px] h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={handleChange}
                placeholder="Phone Number"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-150"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <Mail className="absolute left-3 top-[37px] h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="Email"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-150"
                required
              />
            </div>
          </div>

          {/* Status & Go To Login (NEW) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <ToggleLeft className="absolute left-3 top-[37px] h-5 w-5 text-gray-400 dark:text-gray-500" />
              <select
                name="isActive"
                value={formData.isActive ? "true" : "false"}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none transition-colors duration-150"
                required
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Go To Login (NEW FIELD) */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Allow Login
              </label>
              {formData.isApprovedByAdmin ? (
                <CheckCircle className="absolute left-3 top-[37px] h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="absolute left-3 top-[37px] h-5 w-5 text-red-500" />
              )}
              <select
                name="isApprovedByAdmin"
                value={formData.isApprovedByAdmin ? "true" : "false"}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2.5 border ${
                  formData.isApprovedByAdmin
                    ? "border-green-500 focus:border-green-600"
                    : "border-red-500 focus:border-red-600"
                } dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none transition-colors duration-150`}
              >
                <option value="true">Approved (Can Login)</option>
                <option value="false">Pending (Cannot Login)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.isApprovedByAdmin
                  ? "User can log in to the app"
                  : "User approval pending"}
              </p>
            </div>
          </div>

          {/* Specialization */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Specialization
            </label>
            <Briefcase className="absolute left-3 top-[37px] h-5 w-5 text-gray-400 dark:text-gray-500" />
            <select
              name="specializationId"
              value={formData.specializationId || ""}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-150"
            >
              <option value="">
                {loading ? "Loading..." : "Select Specialization"}
              </option>
              {specializations?.map((spec: Specialization) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Experience, Wages, Salary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Experience (years)
              </label>
              <Award className="absolute left-3 top-[37px] h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                name="experience"
                type="number"
                value={formData.experience || ""}
                onChange={handleChange}
                placeholder="Experience"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-150"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Daily Wages
              </label>
              <FaEuroSign className="absolute left-3 top-[37px] h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                name="dailyWages"
                type="number"
                value={formData.dailyWages || ""}
                onChange={handleChange}
                placeholder="Daily Wages"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-150"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Per Hour Salary
              </label>
              <CreditCard className="absolute left-3 top-[37px] h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                name="perHourSalary"
                type="number"
                value={formData.perHourSalary || ""}
                onChange={handleChange}
                placeholder="Per Hour Salary"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-150"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-150"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWorkerModal;