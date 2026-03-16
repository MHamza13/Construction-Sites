import WorkerChat from "@/components/chat/WorkerChat";
import Banner from "@/layout/Banner";
import React from "react";

const page = () => {
  return (
    <main className="min-h-screen">
      <div className="mx-auto">
        {/* <Banner
          title="Team Chat"
          subtitle="Communicate with your team members"
          breadcrumb={[{ label: "Home", href: "#" }, { label: "Project" }]}
        /> */}

        {/* Chat Component */}
        <div className="bg-white shadow-sm min-h-screen overflow-hidden">
          <WorkerChat />
        </div>
      </div>
    </main>
  );
};

export default page;
