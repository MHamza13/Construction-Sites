import WorkerChat from "@/components/chat/WorkerChat";
import Banner from "@/layout/Banner";
import React from "react";

const page = () => {
  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Banner
          title="Team Chat"
          subtitle="Communicate with your team members"
          breadcrumb={[{ label: "Home", href: "#" }, { label: "Project" }]}
        />

        {/* Chat Component */}
        <div className="bg-white shadow-sm overflow-hidden">
          <WorkerChat />
        </div>
      </div>
    </main>
  );
};

export default page;
