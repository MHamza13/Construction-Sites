// src/data/tasks.js

export const tasks = [
  {
    id: 0,
    title: "Foundation Excavation",
    project: "Downtown Office Complex",
    status: "In Progress",
    priority: "High",
    assigned: "8 workers",
    dueDate: "2025-09-10",
    description:
      "Excavation for the building foundation, including site preparation, equipment setup, deep digging, and safety inspections.",
    workers: [
      { name: "Ali Khan", role: "Excavator Operator", hours: 40, image: "/workers/ali.jpg" },
      { name: "Sara Ahmed", role: "Site Supervisor", hours: 32, image: "/workers/sara.jpg" },
      { name: "John Doe", role: "Safety Officer", hours: 25, image: "/workers/john.jpg" },
      { name: "Fatima Noor", role: "Laborer", hours: 50, image: "/workers/fatima.jpg" },
    ],
    subtasks: [
      { name: "Site preparation", done: true },
      { name: "Equipment setup", done: true },
      { name: "Initial excavation", done: true },
      { name: "Deep excavation (in progress)", done: false, inProgress: true },
      { name: "Final inspection", done: false },
    ],
  },
  {
    id: 1,
    title: "Electrical Installation",
    project: "Residential Tower A",
    status: "Completed",
    priority: "Medium",
    assigned: "4 workers",
    dueDate: "2025-08-25",
    description:
      "Electrical wiring and panel installation for floor 5 of Residential Tower A, including testing and certification.",
    workers: [
      { name: "Ahmed Raza", role: "Electrician", hours: 42, image: "/workers/ahmed.jpg" },
      { name: "Maria Khan", role: "Assistant Electrician", hours: 35, image: "/workers/maria.jpg" },
      { name: "David Smith", role: "Inspector", hours: 28, image: "/workers/david.jpg" },
      { name: "Zara Ali", role: "Safety Supervisor", hours: 30, image: "/workers/zara.jpg" },
    ],
    subtasks: [
      { name: "Wiring installation", done: true },
      { name: "Panel connections", done: true },
      { name: "Testing & inspection", done: true },
      { name: "Final certification", done: true },
    ],
  },
  {
    id: 2,
    title: "Plumbing Installation",
    project: "Residential Tower A",
    status: "Not Started",
    priority: "Low",
    assigned: "3 workers",
    dueDate: "2025-09-15",
    description:
      "Plumbing work for floor 3, including pipe installations, fixture mounting, and system testing.",
    workers: [
      { name: "Bilal Ahmed", role: "Plumber", hours: 0, image: "/workers/bilal.jpg" },
      { name: "Sophia Malik", role: "Assistant Plumber", hours: 0, image: "/workers/sophia.jpg" },
      { name: "Michael Lee", role: "Inspector", hours: 0, image: "/workers/michael.jpg" },
      { name: "Ayesha Khan", role: "Supervisor", hours: 0, image: "/workers/ayesha.jpg" },
    ],
    subtasks: [
      { name: "Pipe installation", done: false },
      { name: "Fixture mounting", done: false },
      { name: "System testing", done: false },
    ],
  },
];
