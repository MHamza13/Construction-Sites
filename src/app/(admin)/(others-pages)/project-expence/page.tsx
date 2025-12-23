import ProjectsExpence from '@/components/projectExpence/ProjectsExpence'
import Banner from '@/layout/Banner'
import React from 'react'

const ProjectExpencePage = () => {
  return (
    <div>
      <Banner
        title="Project Expenses"
        subtitle="Manage and track all your project-related expenses"
        breadcrumb={[{ label: "Home", href: "#" }, { label: "Project" }]}
      />
       <ProjectsExpence/>
    </div>
  )
}

export default ProjectExpencePage