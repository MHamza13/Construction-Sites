import Specialization from '@/components/specialization/Specialization'
import Banner from '@/layout/Banner'
import React from 'react'

const page = () => {
  return (
    <div>
        <div className="mb-6">
            <Banner
                title="Specialization"
                subtitle="Manage and organize your team's skills and expertise"
                breadcrumb={[{ label: "Home", href: "/" }, { label: "Specialization" }]}
            />
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 rounded-md transition-colors duration-300 px-3">
          <Specialization />
        </div>
    </div>
  )
}

export default page