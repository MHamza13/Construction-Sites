
export const projects = [
  {
    id: 1,
    name: "Downtown Office Complex",
    status: "Active",
    description: "Commercial office building with 20 floors",
    budget: "$2.4M",
    deadline: "Dec 15, 2024",
    team: "24 workers",
    progress: 68,
    tasksCompleted: 42,
    totalTasks: 62,
  },
  {
    id: 2,
    name: "Residential Tower A ",
    status: "At Risk",
    description: "30-story residential building",
    budget: "$1.8M",
    deadline: "Jan 30, 2025",
    team: "18 workers",
    progress: 42,
    tasksCompleted: 21,
    totalTasks: 50,
  },
  {
    id: 3,
    name: "Shopping Mall Renovation",
    status: "Planning",
    description: "Complete renovation of existing mall",
    budget: "$950K",
    deadline: "Mar 20, 2025",
    team: "12 workers",
    progress: 15,
    tasksCompleted: 5,
    totalTasks: 33,
  },
];

export const statusStyles = {
  Active: {
    badge: "bg-green-100 text-green-700",
    bar: "from-green-400 to-green-500",
    dot: "bg-green-500",
  },
  "At Risk": {
    badge: "bg-yellow-100 text-yellow-700",
    bar: "from-yellow-400 to-yellow-500",
    dot: "bg-yellow-500",
  },
  Planning: {
    badge: "bg-blue-100 text-blue-700",
    bar: "from-blue-400 to-blue-500",
    dot: "bg-blue-500",
  },
  Completed: {
    badge: "bg-purple-100 text-purple-700",
    bar: "from-purple-400 to-purple-500",
    dot: "bg-purple-500",
  },
};