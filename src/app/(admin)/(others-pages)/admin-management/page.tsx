import React from "react";
import Banner from "@/layout/Banner";
import AdminManagement from "@/components/adminManagement/AdminManagement";

const AdminManagementPage: React.FC = () => {

  return (
    <div className="mx-auto relative">
      <div className="mb-6">
        <Banner
          title="Admin Management"
          subtitle="Register a new admin user"
          breadcrumb={[{ label: "Home", href: "/" }, { label: "Admin Management" }]}
        />
      </div>
       <AdminManagement/>
    </div>
  );
};

export default AdminManagementPage;