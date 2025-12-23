import AllShifts from "@/components/shifts/AllShifts";
import Banner from "@/layout/Banner";

const ShiftPage = () => {
  return (
    <>
      <Banner
        title="Shift"
        subtitle="Overview & insights of your projects"
        breadcrumb={[{ label: "Home", href: "/dashboard" }, { label: "Shift" }]}
      />
      <div className="mt-4">
        <AllShifts />
      </div>
    </>
  );
};

export default ShiftPage;
