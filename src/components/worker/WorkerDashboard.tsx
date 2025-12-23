"use client";

// ✅ Step 1: Apne Redux slice se 'Stats' type ko import karein
import type { Stats } from "@/redux/worker/workerSlice";
import { Card, CardContent } from "@/ui/card";
import {  Clock, FileText, Briefcase, BarChart } from "lucide-react";
import { FaEuroSign } from "react-icons/fa";

// ✅ Step 2: Component ke props ke liye ek interface define karein
interface WorkerDashboardProps {
  stats: Stats[];
}

// ✅ Step 3: Component ko batayein ki woh props accept karega
export default function WorkerDashboard({ stats }: WorkerDashboardProps) {

  // Yeh icons object ab dynamic labels ke liye taiyar hai
  const icons: { [key: string]: React.ReactNode } = {
    "Active Projects": <Briefcase className="h-8 w-8 text-blue-600" />,
    "This Month Earnings": <FaEuroSign className="h-8 w-8 text-green-600" />,
    "Pending Invoices": <FileText className="h-8 w-8 text-yellow-600" />,
    "Hours This Month": <Clock className="h-8 w-8 text-purple-600" />,
    // Ek default icon bhi rakh sakte hain
    "default": <BarChart className="h-8 w-8 text-gray-600" />,
  };

  // ✅ Step 4: Agar stats nahi hain to message dikhayein
  if (!stats || stats.length === 0) {
    return (
      <Card className="rounded-md p-5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
        <CardContent className="p-0 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No performance stats available for this worker.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-6">
      {/* ✅ Step 5: Hardcoded data ki jagah, incoming 'stats' prop par map karein */}
      {stats.map((item, i) => (
        <Card
          key={i}
          className="rounded-md shadow-md hover:shadow-lg transition p-5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800"
        >
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {item.label || "N/A"}
              </p>
              <h2 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                {item.value || "0"}
              </h2>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl">
              {icons[item.label || 'default'] || icons['default']}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}