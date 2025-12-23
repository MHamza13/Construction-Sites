"use client";
import Banner from "../../../../layout/Banner";
import ProjectCard from "../../../../components/project/ProjectCard";

export default function Page() {
  return (
    <div>
      {/* Banner */}
      <Banner
        title="Project Management"
        subtitle="Overview & insights of your projects"
        breadcrumb={[{ label: "Home", href: "#" }, { label: "Project" }]}
      />
      <div className="">
        <ProjectCard />
      </div>
    </div>
  );
}
