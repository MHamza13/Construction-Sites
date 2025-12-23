"use client";

import { useEffect, useState } from "react";
import InvoiceDashboard from "@/components/invoice/InvoiceDashboard";
import InvoiceFilters from "@/components/invoice/InvoiceFilters";
import InvoiceTable from "@/components/invoice/InvoiceTable";
import CreateInvoiceForm from "@/components/invoice/CreateInvoiceForm";
// ✅ Se importa el ícono 'X' para usarlo en el botón de cierre del modal
import { FileText, Plus, X } from "lucide-react";
import Banner from "@/layout/Banner";
import { useDispatch } from "react-redux";
import { clearMasterInvoiceCache, fetchMasterInvoices } from "@/redux/invoiceMaster/invoiceMasterSlice";

interface InvoiceFiltersType {
  status: string;
  payment: string;
  project: string;
  worker: string; 
  from: string;
  to: string;
  search: string;
}

export default function InvoicesPage() {
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [filters, setFilters] = useState<InvoiceFiltersType>({
    status: "",
    payment: "",
    project: "",
    worker: "", 
    from: "",
    to: "",
    search: "",
  });

  // ✅ FIX: Se actualiza la función para manejar actualizaciones parciales de los filtros.
  // Acepta un 'Partial<InvoiceFiltersType>' y fusiona los nuevos filtros con el estado existente.
  // Esto resuelve el error de tipo y previene la pérdida de otros valores de filtro.
  const handleFilterChange = (newFilters: Partial<InvoiceFiltersType>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  const refreshInvoices = async () => {
    dispatch(clearMasterInvoiceCache());
    try {
      await dispatch(fetchMasterInvoices()).unwrap();
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

 

  return (
    <main className="min-h-screen">
      <div className="mx-auto">
        <Banner
          title="Invoice Management"
          subtitle="Manage worker invoices and payments"
          breadcrumb={[{ label: "Home", href: "#" }, { label: "Invoice Management" }]}
        />

        {/* Invoices Content */}
        <div className="overflow-hidden">
          <div className="">
            {/* Top Action Bar */}
            {/* <div className="flex justify-between items-center mb-8">
              <div></div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </button>
            </div> */}

            {/* Dashboard Section */}
            <div className="mb-8">
              <InvoiceDashboard />
            </div>

            {/* Filters Section */}
            <div className="mb-8">
              {/* Ahora la función 'handleFilterChange' es compatible con 'onFilterChange' */}
              <InvoiceFilters onFilterChange={handleFilterChange} />
            </div>

            {/* Invoice Table */}
            <div>
              <InvoiceTable refreshInvoices={refreshInvoices} filters={filters} />
            </div>
          </div>
        </div>

        {/* Modal Popup */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-4xl xl:max-w-6xl max-h-[95vh] bg-white shadow-2xl overflow-hidden rounded-xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg shadow-sm">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Create New Invoice</h2>
                    <p className="text-blue-100 text-sm">Add a new invoice for worker payment</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                  aria-label="Close modal"
                >
                  {/* ✅ FIX: Se reemplaza el SVG en línea por el componente X de lucide-react */}
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(95vh-100px)] overflow-y-auto custom-scrollbar">
                <CreateInvoiceForm />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}