"use client";
import React, { useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchShiftsByWorkerAndProject } from "@/redux/projectShifts/projectShifts";
import { fetchWorkerById } from "@/redux/worker/workerSlice";
import { toast } from "react-toastify";

// Import the new Shift Log component
import ShiftLogTable from "./ShiftLogTable";
import ProjectChat from "./ProjectChat";

// --- Type Definitions ---
interface ProjectShift {
  id: number;
  workerId: number;
  projectId: number;
  checkIn: string;
  checkInLat: number;
  checkInLong: number;
  endShift: string | null;
  endShiftLat: number | null;
  endShiftLong: number | null;
  status: string;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Worker {
  id: number;
  firstName: string;
  lastName: string;
  specializationName: string | null;
}

// --- Helper Functions ---
const NOW_TIMESTAMP = new Date("2025-10-13T17:29:00+05:00").getTime();

const formatDateTime = (dateTime: string | null): string => {
  if (!dateTime || dateTime === "N/A") return "N/A";
  return new Date(dateTime)
    .toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace("at", "");
};

const calculateShiftDuration = (checkIn: string, endShift: string | null): string => {
  const start = new Date(checkIn).getTime();
  const end = endShift ? new Date(endShift).getTime() : NOW_TIMESTAMP;

  if (end <= start) return "0h 0m";

  const diffMs = end - start;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const ProjectWorkerDetails = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams();
  const router = useRouter();

  const searchParams = useSearchParams();
  // ✅ Ensure workerId is a clean number
  const workerId = id ? parseInt(id as string, 10) : null;
  const projectId = searchParams.get("projectid") ? parseInt(searchParams.get("projectid")!, 10) : null;

  // Redux selectors
  const {
    current: worker,
    error: workerError,
  } = useSelector((state: RootState) => state.workers || { current: null, loading: false, error: null });

  const {
    shifts,
    error: shiftsError,
  } = useSelector((state: RootState) => state.projectShifts || { shifts: [], loading: false, error: null });

  // Combine loading and error states
  const error = workerError || shiftsError;

  // Fetch data on mount
  useEffect(() => {
    if (workerId) {
      dispatch(fetchWorkerById(workerId));
      dispatch(fetchShiftsByWorkerAndProject({projectId , workerId}));
    }
  }, [dispatch, workerId]);

  // Display errors via toast
  useEffect(() => {
    if (workerError) toast.error(`Worker Error: ${workerError}`);
    if (shiftsError) toast.error(`Shifts Error: ${shiftsError}`);
  }, [workerError, shiftsError]);

  // --- Memoized Data Calculations ---
  const calculatedData = useMemo(() => {
    const sortedShifts: ProjectShift[] = [...(shifts || [])].sort(
      (a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
    );

    if (sortedShifts.length === 0) {
      return {
        totalHours: "0.0",
        checkIns: 0,
        lastCheckIn: "N/A",
        status: "Offline",
      };
    }

   let totalHoursSum = 0;
    for (const shift of sortedShifts) {
      const durationStr = calculateShiftDuration(shift.checkIn, shift.endShift);
      const [hoursPart, minutesPart] = durationStr.split(" ");
      const hours = parseFloat(hoursPart.replace("h", "")) || 0;
      const minutes = parseFloat(minutesPart.replace("m", "")) || 0;
      totalHoursSum += hours + minutes / 60; 
    }

   const totalHoursDisplay = `${Math.floor(totalHoursSum)}h ${Math.round((totalHoursSum % 1) * 60)}m`;

    

    const totalCheckIns = sortedShifts.length;
    const lastShift = sortedShifts[0];
    const lastCheckInTime = formatDateTime(lastShift.checkIn).split(", ")[1] || "N/A";
    const status = lastShift.endShift === null ? "Working" : "Offline";


    console.log("lastShift" , lastShift)
    console.log("lastCheckInTime" , lastCheckInTime)
    console.log("status" , status)

    return {
      totalHours: totalHoursDisplay,
      checkIns: totalCheckIns,
      lastCheckIn: lastCheckInTime,
      status,
    };
  }, [shifts]);

  const name = `${worker?.firstName || ""} ${worker?.lastName || ""}`.trim() || "User";

  const workerProfile = useMemo(
    () => ({
      profileImageUrl: worker?.profilePictureUrl
        ?  worker?.profilePictureUrl
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`,
      name: worker ? `${worker.firstName} ${worker.lastName}` : "Unknown Worker",
      role: worker?.specializationName || "Worker",
      IsActive: calculatedData.status === "Working",
      ...calculatedData,
    }),
    [worker, calculatedData]
  );

  // Custom StatBox
  const StatBox = ({ value, label, isStatus = false }) => (
    <div className="p-2 flex-1 min-w-[100px]">
      <p
        className={`text-xl font-bold ${
          isStatus && workerProfile.status === "Working" ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );



  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-8 text-red-600 dark:text-red-400">
          <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
          </svg>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
       <div className="min-h-screen flex items-start justify-center">
        <div className="p-12 text-center mt-20">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
            Project details loading...
          </p>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen">
      <div className="max-w-full mx-auto space-y-6">
        {/* Back to Project Link */}
        <div
          className="text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer"
          onClick={() => {
            const projectId = shifts.length > 0 ? shifts[0].ProjectId : null;
            if (projectId) router.push(`/projects/${projectId}`);
          }}
        >
          ← Back to Project
        </div>

        {/* Header Card */}
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold mr-4 flex-shrink-0">
                  <img src={workerProfile.profileImageUrl} alt="" className="rounded-full" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{workerProfile.name}</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{workerProfile.role}</p>
                </div>
              </div>
              {workerProfile.IsActive ? (
                <span className="inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-3 py-1 rounded-full font-medium">
                  Active
                </span>
              ) : (
                <span className="inline-block bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs px-3 py-1 rounded-full font-medium">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex justify-start space-x-8 pt-2">
              <StatBox value={workerProfile.totalHours} label="Total Hours" />
              <StatBox value={workerProfile.checkIns} label="Check-Ins" />
              <StatBox value={workerProfile.lastCheckIn} label="Last Check-In" />
              <StatBox value={workerProfile.status} label="Status" isStatus={true} />
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shift Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-4">
              <ShiftLogTable
                shifts={shifts as ProjectShift[]}
                formatDateTime={formatDateTime}
                calculateShiftDuration={calculateShiftDuration}
              />
            </div>
          </div>

          {/* ✅ Project Chat (Now correct param passed) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
            <ProjectChat workerId={workerId} projectId={projectId}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkerDetails;
