"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addShift } from "@/redux/shift/ShiftSlice";
import { fetchWorkers } from "@/redux/worker/workerSlice";
import { Users, Clock, Search, MapPin, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import {
  convertUKToUTC,
} from "@/utils/date";

interface RootState {
  workers: {
    items: Array<{
      id: number;
      firstName: string;
      lastName: string;
      specializationName?: string;
      profilePictureUrl?: string;
      isActive: boolean;
    }>;
    loading: boolean;
    error: string | null;
  };
}

const AddShiftModal = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch();
  const { items: workers = [], loading } = useSelector(
    (state: RootState) => state.workers || {}
  );

  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftTimes, setShiftTimes] = useState({
    checkIn: "",
    endShift: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const [maxDateTime, setMaxDateTime] = useState<string>("");

  // Format date for <input type="datetime-local"> safely
  const formatDateTimeLocal = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Set max to yesterday 23:59 (UK time) — NO toISOString() error
  useEffect(() => {
    const now = new Date();

    // Get UK time safely using timezone offset
    const ukOffset = now.getTimezoneOffset() * 60000;
    const ukNow = new Date(now.getTime() + ukOffset);

    // Yesterday in UK time
    const yesterday = new Date(ukNow);
    yesterday.setDate(ukNow.getDate() - 1);
    yesterday.setHours(23, 59, 0, 0);

    const maxDate = formatDateTimeLocal(yesterday);
    setMaxDateTime(maxDate);

    // Default: yesterday 09:00 - 17:00
    const defaultCheckIn = new Date(yesterday);
    defaultCheckIn.setHours(9, 0, 0, 0);
    const defaultEndShift = new Date(yesterday);
    defaultEndShift.setHours(17, 0, 0, 0);

    setShiftTimes({
      checkIn: formatDateTimeLocal(defaultCheckIn),
      endShift: formatDateTimeLocal(defaultEndShift),
    });
  }, []);

  // Fetch workers
  useEffect(() => {
    if (!workers.length && !loading) {
      // @ts-ignore
      dispatch(fetchWorkers());
    }
  }, [dispatch, workers.length, loading]);

  // Auto fetch location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (error) => {
          let errorMsg = "Unable to retrieve location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "Location access denied. Enable location services.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Location unavailable.";
              break;
            case error.TIMEOUT:
              errorMsg = "Location request timed out.";
              break;
          }
          Swal.fire({
            icon: "error",
            title: "Location Error",
            text: errorMsg,
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      Swal.fire({
        icon: "error",
        title: "Unsupported",
        text: "Geolocation not supported by this browser.",
      });
    }
  }, []);

  const handleRadioChange = (id: string) => setSelectedWorker(id);
  const handleTimeChange = (field: string, value: string) =>
    setShiftTimes((prev) => ({ ...prev, [field]: value }));

  const filteredWorkers = workers.filter((worker) => {
    const name = `${worker.firstName} ${worker.lastName}`.toLowerCase();
    const role = (worker.specializationName || "Worker").toLowerCase();
    return (
      name.includes(searchQuery.toLowerCase()) ||
      role.includes(searchQuery.toLowerCase())
    );
  });

  // Submit handler with strict validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!selectedWorker) {
      Swal.fire({
        icon: "warning",
        title: "Select a worker",
        text: "Please choose a worker before submitting.",
      });
      setSubmitting(false);
      return;
    }

    if (!location) {
      Swal.fire({
        icon: "warning",
        title: "Location Missing",
        text: "Location not available. Please enable GPS and try again.",
      });
      setSubmitting(false);
      return;
    }

    const checkIn = new Date(shiftTimes.checkIn);
    const endShift = new Date(shiftTimes.endShift);

    if (isNaN(checkIn.getTime()) || isNaN(endShift.getTime())) {
      Swal.fire({
        icon: "error",
        title: "Invalid Date",
        text: "Please select valid check-in and check-out times.",
      });
      setSubmitting(false);
      return;
    }

    const now = new Date();
    const ukOffset = now.getTimezoneOffset() * 60000;
    const ukNow = new Date(now.getTime() + ukOffset);

    // Today at 00:00:00 in UK time
    const todayStart = new Date(ukNow);
    todayStart.setHours(0, 0, 0, 0);

    // 1. Only past dates allowed (not today)
    if (checkIn >= todayStart || endShift >= todayStart) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Date",
        text: "You can only add shifts for past dates. Today's or future shifts are not allowed.",
      });
      setSubmitting(false);
      return;
    }

    // 2. Check-in must be before Check-out
    if (checkIn >= endShift) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Time",
        text: "Check-in time must be before check-out time.",
      });
      setSubmitting(false);
      return;
    }

    // 3. No cross-day shifts
    const checkInDate = checkIn.toISOString().split("T")[0];
    const endShiftDate = endShift.toISOString().split("T")[0];

    if (checkInDate !== endShiftDate) {
      Swal.fire({
        icon: "warning",
        title: "Cross-Day Shift Not Allowed",
        text: "Shifts cannot span across two days. Both check-in and check-out must be on the same date.",
      });
      setSubmitting(false);
      return;
    }

    const payload = {
      command: "CreateShift",
      workerId: Number(selectedWorker),
      checkInLatitude: location.lat,
      checkInLongitude: location.lng,
      endShiftLatitude: location.lat,
      endShiftLongitude: location.lng,
      checkIn: convertUKToUTC(shiftTimes.checkIn, "iso"),
      endShift: convertUKToUTC(shiftTimes.endShift, "iso"),
    };

    try {
      // @ts-ignore
      await dispatch(addShift(payload)).unwrap();
      Swal.fire({
        icon: "success",
        title: "Shift Added",
        text: "Shift successfully created for past date.",
        timer: 1800,
        showConfirmButton: false,
      });
      onClose();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error Adding Shift",
        text: err?.message || "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Worker Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Select Worker
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedWorker
                      ? "1 worker selected"
                      : "No worker selected"}
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search workers or roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-10 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {location && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <MapPin className="inline-block w-4 h-4 mr-1" />
                  Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
              )}

              <div className="max-h-[230px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map((worker) => {
                    const isSelected = selectedWorker === worker.id.toString();
                    const fullName = `${worker.firstName} ${worker.lastName}`.trim();
                    const role = worker.specializationName || "Worker";
                    return (
                      <label
                        key={worker.id}
                        className={`block p-4 rounded-lg border-2 mb-2 cursor-pointer transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/40"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="worker"
                          value={worker.id}
                          checked={isSelected}
                          onChange={() =>
                            handleRadioChange(worker.id.toString())
                          }
                          className="sr-only"
                        />
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            {worker.profilePictureUrl ? (
                              <img
                                src={worker.profilePictureUrl}
                                alt={fullName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                {fullName}
                              </h4>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {role}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              {worker.isActive ? "Available" : "Inactive"}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <h4 className="text-gray-700 dark:text-gray-300 font-medium">
                      No workers found
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {searchQuery
                        ? "No workers match your search."
                        : "No workers available."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Shift Times */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Shift Times (UK Time)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Check In (UK)
                  </label>
                  <input
                    type="datetime-local"
                    value={shiftTimes.checkIn}
                    onChange={(e) =>
                      handleTimeChange("checkIn", e.target.value)
                    }
                    max={maxDateTime}
                    className="w-full mt-1 px-2 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Check Out (UK)
                  </label>
                  <input
                    type="datetime-local"
                    value={shiftTimes.endShift}
                    onChange={(e) =>
                      handleTimeChange("endShift", e.target.value)
                    }
                    max={maxDateTime}
                    min={shiftTimes.checkIn || undefined}
                    className="w-full mt-1 px-2 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

               {/* Note */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Note:</strong> You can <strong>only add shifts for past dates</strong>. 
                  Today’s date and cross-day shifts (e.g., 10 PM to 6 AM) are not allowed.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !selectedWorker ||
                !shiftTimes.checkIn ||
                !shiftTimes.endShift ||
                !location
              }
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding..." : "Add Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShiftModal;