"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchProjectById,
  ProjectStatus,
  assignWorkerToProject, 
} from "@/redux/projects/projectSlice";
import { Users, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import WorkerList from "./WorkerList";
import AssignedWorkerModal from "./AssignedWorkerModal";
import ProjectsComments from "./ProjectsComments";


export type DisplayProjectStatus = "" | "Inactive" | "Active" | "Completed";

const statusStyles: Record<
  DisplayProjectStatus,
  { label: string; badge: string; dot: string }
> = {
  "": {
    label: "Unknown",
    badge: "bg-gray-100 text-gray-600 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
    dot: "bg-gray-400 dark:bg-gray-500",
  },
  Active: {
    label: "Active",
    badge: "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700",
    dot: "bg-green-500 dark:bg-green-400",
  },
  Inactive: {
    label: "Inactive",
    badge: "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700",
    dot: "bg-yellow-500 dark:bg-yellow-400",
  },
  Completed: {
    label: "Completed",
    badge: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700",
    dot: "bg-teal-500 dark:bg-teal-400",
  },
};

const mapToDisplayStatus = (
  status: ProjectStatus | "" | undefined
): DisplayProjectStatus => {
  const normalizedStatus = status?.trim().toLowerCase();
  if (!normalizedStatus) return "";

  switch (normalizedStatus) {
    case "active":
      return "Active";
    case "inactive":
    case "inactived":
      return "Inactive";
    case "complete":
    case "completed":
      return "Completed";
    default:
      return "";
  }
};

// --- DetailItem ---
function DetailItem({
  label,
  value,
  highlight = false,
  isRed = false,
  isGreen = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  isRed?: boolean;
  isGreen?: boolean;
}) {
 let valueClasses = "text-gray-900 font-semibold dark:text-gray-100";

if (highlight) {
  valueClasses = "text-lg font-semibold dark:text-gray-100";
  if (isRed) valueClasses += " text-red-600 dark:text-red-400";
  else if (isGreen) valueClasses += " text-green-600 dark:text-green-400";
}

return (
  <div className="flex flex-col">
    <dt className="text-gray-500 text-sm dark:text-gray-400">{label}</dt>
    <dd className={`mt-1 ${valueClasses} break-words`}>{value}</dd>
  </div>
);

}

// --- Utility function ---
const calculateDaysRemaining = (deadlineDate: string | undefined): string => {
  if (!deadlineDate) return "N/A";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `${diffDays} days`;
  if (diffDays === 0) return "Today (0 days)";
  return "Overdue";
};


// --- MAIN COMPONENT ---
const ProjectDetails = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { currentProject: project, loading, error } = useSelector(
    (state: RootState) => state.projects
  );

  console.log("Projects ID" , project)

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleWorkerAssigned = (selectedWorkerIds: string[]) => {
    if (!id) {
      toast.error("Project ID is missing!");
      return;
    }

    dispatch(
      assignWorkerToProject({
        projectId: id,
        workerIds: selectedWorkerIds.map((id) => parseInt(id)),
      })
    )
      .unwrap()
      .then(() => {
        toast.success("Workers assigned successfully!");
        setIsModalOpen(false);
        dispatch(fetchProjectById(id));
      })
      .catch((err) => {
        console.error("Failed to assign workers:", err);
        toast.error(err?.message || "Failed to assign workers!");
      });
  };

  useEffect(() => {
  if (!id) return;

  if (!project || project.id !== id) {
    dispatch(fetchProjectById(id));
  }
}, [dispatch, id]);


  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (id && loading && !project) {
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

  if (error || !project) {
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

  const displayStatus = mapToDisplayStatus(project.status);
  const statusStyle = statusStyles[displayStatus] || statusStyles[""];
  const workers = Array.isArray(project.assignedWorkerIds)
    ? project.assignedWorkerIds
    : [];
  const teamSize = workers.length;

  const formattedBudget = `€${project.budget?.toLocaleString() || "N/A"}`;
  const formattedStartDate = project.startDate
    ? new Date(project.startDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const daysRemainingText = calculateDaysRemaining(project.deadlineDate);
  const isDeadlineRed =
    daysRemainingText === "Overdue" ||
    (daysRemainingText.includes("days") && parseInt(daysRemainingText) < 30);

  const formattedDeadline = project.deadlineDate
    ? new Date(project.deadlineDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-full">
        <button
          onClick={() => router.push("/projects")}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mb-6 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </button>

        <div className="">
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8">
  <header className="flex justify-between items-start mb-4">
    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {project.name || "Untitled Project"}
              </h1>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${statusStyle.badge} flex items-center shadow-sm flex-shrink-0`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1 ${statusStyle.dot}`}
                ></span>
                {statusStyle.label}
              </span>
            </header>

          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl text-sm sm:text-base">
            {project.description || "No description provided for this project."}
          </p>


            <dl className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-12">
              <DetailItem label="Client Name" value={project.clientName || "N/A"} highlight />
              <DetailItem label="Budget" value={formattedBudget} highlight isGreen />
              <DetailItem
                label="Deadline"
                value={formattedDeadline}
                highlight
                isRed={isDeadlineRed}
              />
              <DetailItem label="Location" value={project.location || "N/A"} highlight />
              <DetailItem label="Start Date" value={formattedStartDate} highlight />
              <DetailItem
                label="Days Remaining"
                value={daysRemainingText}
                highlight
                isRed={isDeadlineRed}
              />
             <div className="flex flex-col">
  <dt className="text-gray-500 dark:text-gray-400 text-sm">Total Workers</dt>
  <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100 break-words">
    <button
      onClick={() => setIsModalOpen(true)}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center"
    >
      <Users className="w-5 h-5 mr-2" />
      {`${teamSize} assigned`}
    </button>
  </dd>
</div>

              <DetailItem
                label="Status"
                value={project.status || "N/A"}
                highlight
                isGreen={project.status?.toLowerCase() === "active"}
              />
              <DetailItem
                label="Priority"
                value={project.priority || "Normal"}
                highlight
                isRed={project.priority?.toLowerCase() === "high"}
              />
            </dl>
          </div>

          <AssignedWorkerModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            assignedUserIds={workers}
            onWorkerAssigned={handleWorkerAssigned}
            projectId={id}
          />

          <WorkerList projectId={id} assignedUserIds={workers} />

          <ProjectsComments projectId={id}/>
        </div>
      </div>
    </main>
  );
};

export default ProjectDetails;