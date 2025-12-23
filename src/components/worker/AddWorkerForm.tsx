"use client";

import { useState, useEffect } from "react";
import { User, Phone, Mail, Shield, Image as ImageIcon,  Clock, Calendar } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSpecializations } from "@/redux/specialization/specializationSlice";
import { createWorker } from "@/redux/worker/workerSlice";
import Swal from "sweetalert2";
import Image from "next/image";
import { FaEuroSign } from "react-icons/fa";

export default function AddWorkerForm({ onClose, specs, onSuccess }) {
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [experience, setExperience] = useState(0);
  const [dailyWages, setDailyWages] = useState(0);
  const [perHourSalary, setPerHourSalary] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const { items: specializationsFromRedux, loading: specLoading } = useSelector(
    (state) => state.specializations
  );

  const allSpecializations = specs || specializationsFromRedux;

  useEffect(() => {
    if (allSpecializations.length === 0 && !specLoading) {
      dispatch(fetchSpecializations());
    }
  }, [dispatch, allSpecializations.length, specLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const newErrors = {};
    if (!data.firstName) newErrors.firstName = "First name is required";
    if (!data.lastName) newErrors.lastName = "Last name is required";
    if (!data.email) newErrors.email = "Email is required";
    if (!data.phoneNumber) newErrors.phoneNumber = "Phone number is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      isActive: true,
      profilePictureUrl: preview || null,
      experience: Number(experience),
      dailyWages: Number(dailyWages),
      perHourSalary: Number(perHourSalary),
      specializationId: data.specializationId ? Number(data.specializationId) : null,
    };

    try {
      const resultAction = await dispatch(createWorker(payload));

      if (createWorker.fulfilled.match(resultAction)) {
        Swal.fire({
          icon: "success",
          title: "Worker Created!",
          text: "Worker registered successfully!",
          confirmButtonColor: "#3085d6",
        }).then(() => {
          if (onSuccess) onSuccess();
          else onClose();
        });
      } else {
        const errorText =
          resultAction.payload?.message ||
          resultAction.error?.message ||
          "Worker registration failed!";
        Swal.fire({ icon: "error", title: "Error", text: errorText });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong during registration!",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: "Image must be less than 5MB" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearError = (field) => setErrors({ ...errors, [field]: "" });

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6  px-6 py-6">
        
        {/* Profile Picture */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32 group">
            {preview ? (
              <Image
                src={preview}
                alt="Preview"
                width={128}
                height={128}
                className="w-full h-full object-cover rounded-full border-4 border-blue-100 dark:border-blue-900 shadow-md"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600">
                <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Upload profile picture"
            />
            <div className="absolute inset-0 rounded-full border bg-white dark:bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 dark:text-white" />
            </div>
          </div>
        </div>
        {errors.image && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center mt-2">{errors.image}</p>
        )}

        {/* First + Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <User className="absolute left-3 top-10 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              name="firstName"
              type="text"
              placeholder="John"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.firstName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              onChange={() => clearError("firstName")}
              required
            />
            {errors.firstName && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.firstName}</p>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <User className="absolute left-3 top-10 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              name="lastName"
              type="text"
              placeholder="Doe"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.lastName ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              onChange={() => clearError("lastName")}
              required
            />
            {errors.lastName && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <Mail className="absolute left-3 top-10 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              name="email"
              type="email"
              placeholder="john@example.com"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              onChange={() => clearError("email")}
              required
            />
            {errors.email && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <Phone className="absolute left-3 top-10 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              name="phoneNumber"
              type="tel"
              placeholder="+92 300 1234567"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.phoneNumber ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
              onChange={() => clearError("phoneNumber")}
              required
            />
            {errors.phoneNumber && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.phoneNumber}</p>
            )}
          </div>
        </div>

        {/* Specialization + Experience + Wages */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Specialization */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Specialization
            </label>
            <Shield className="absolute left-3 top-10 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <select
              name="specializationId"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onChange={() => clearError("specializationId")}
            >
              <option value="">
                {specLoading ? "Loading..." : "Select Specialization"}
              </option>
              {allSpecializations.map((spec) => (
                <option key={spec.id || spec._id} value={spec.id || spec._id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Experience */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Experience (Years)
            </label>
            <Calendar className="absolute left-3 top-10 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="number"
              placeholder="5"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              min="0"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Daily Wages */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Daily Wages
            </label>
            <FaEuroSign className="absolute left-3 top-10 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="number"
              placeholder="1500"
              value={dailyWages}
              onChange={(e) => setDailyWages(e.target.value)}
              min="0"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Per Hour Salary */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Per Hour Salary
            </label>
            <Clock className="absolute left-3 top-10 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="number"
              placeholder="200"
              value={perHourSalary}
              onChange={(e) => setPerHourSalary(e.target.value)}
              min="0"
              step="0.01"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Registering...
              </>
            ) : (
              "Add Worker"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}