import React from "react";
import { Settings } from "lucide-react";
import { DataTableSection } from "../../../sections/DataTableSection/DataTableSection";
import { fetchAllServices } from "../../../../services/firestore";

interface Service {
  id: string;
  serviceId?: string;
  image: string;
  title: string;
  description: string;
  unit: string;
  status?: "active" | "inactive";
  accountStatus?: { active: boolean; text: string };
}

export const mockServices: Service[] = [
  {
    id: "1",
    serviceId: "1",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop",
    title: "وقود بالقرب منك",
    description: "نصلك في أسرع وقت لتزويدك بالوقود",
    unit: "لتر",
    status: "active",
    accountStatus: { active: true, text: "نشط" },
  },
  {
    id: "2",
    serviceId: "2",
    image:
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=100&fit=crop",
    title: "تغيير البطارية",
    description: "تغيير وفحص البطارية",
    unit: "حبة",
    status: "active",
    accountStatus: { active: true, text: "نشط" },
  },
  {
    id: "3",
    serviceId: "3",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop",
    title: "وقود بالقرب منك",
    description: "نصلك في أسرع وقت لتزويدك بالوقود",
    unit: "لتر",
    status: "active",
    accountStatus: { active: true, text: "نشط" },
  },
  {
    id: "4",
    serviceId: "4",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop",
    title: "وقود بالقرب منك",
    description: "نصلك في أسرع وقت لتزويدك بالوقود",
    unit: "لتر",
    status: "inactive",
    accountStatus: { active: false, text: "غير نشط" },
  },
  {
    id: "5",
    serviceId: "5",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop",
    title: "وقود بالقرب منك",
    description: "نصلك في أسرع وقت لتزويدك بالوقود",
    unit: "لتر",
    status: "active",
    accountStatus: { active: true, text: "نشط" },
  },
];

export const Services: React.FC = () => {
  // Define table columns
  const columns = [
    {
      key: "actions",
      priority: "high" as const,
    },
    {
      key: "unit",
      label: "الوحدة",
      priority: "high" as const,
    },
    {
      key: "description",
      label: "الوصف",
      priority: "medium" as const,
      render: (text: string) => (
        <div className="max-w-xs truncate text-sm text-[#5B738B]">{text}</div>
      ),
    },
    {
      key: "title",
      label: "العنوان",
      priority: "high" as const,
    },
    {
      key: "image",
      label: "صورة الخدمة",
      priority: "high" as const,
      render: (imageUrl: string) => (
        <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-md bg-gray-100">
          <img
            src={imageUrl}
            alt="Service"
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      key: "serviceId",
      label: "الرقم التعريفي",
      priority: "high" as const,
      render: (serviceId: string, row: Service) => (
        <div className="text-sm font-medium text-gray-700">
          {serviceId || row.id || "-"}
        </div>
      ),
    },
  ];

  // Helper function to extract string from multilingual object or return string
  const extractString = (value: any, fallback: string = ""): string => {
    if (!value) return fallback;
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      // Handle multilingual objects like {ar: "...", en: "..."}
      if (value.ar) return value.ar;
      if (value.en) return value.en;
      // If object has no ar/en, try to get first string value
      const firstValue = Object.values(value)[0];
      if (typeof firstValue === "string") return firstValue;
    }
    return fallback;
  };

  // Fetch real services from Firestore
  const fetchServices = async (): Promise<Service[]> => {
    try {
      const servicesData = await fetchAllServices();

      // Map Firestore data to Service interface
      const mappedServices: Service[] = servicesData.map((service: any) => ({
        id: service.id || service.serviceId || "",
        serviceId: service.serviceId || service.id || "",
        image:
          extractString(service.image) ||
          extractString(service.imageUrl) ||
          "/img/placeholder.svg",
        title:
          extractString(service.title) ||
          extractString(service.nameAr) ||
          extractString(service.name) ||
          "",
        description:
          extractString(service.desc) ||
          extractString(service.description) ||
          "",
        unit: extractString(service.unit) || "",
        status:
          service.status === "active" || service.isActive
            ? "active"
            : "inactive",
        accountStatus: {
          active: service.status === "active" || service.isActive || false,
          text:
            service.status === "active" || service.isActive ? "نشط" : "غير نشط",
        },
      }));

      // Sort services by serviceId in ascending order
      const sortedServices = mappedServices.sort((a, b) => {
        const aId = parseInt(a.serviceId || a.id || "0", 10) || 0;
        const bId = parseInt(b.serviceId || b.id || "0", 10) || 0;
        return aId - bId;
      });

      console.log("Mapped and sorted services:", sortedServices);
      return sortedServices;
    } catch (error) {
      console.error("Error fetching services:", error);
      // Return empty array on error, DataTableSection will handle the error display
      return [];
    }
  };

  // Handle status toggle
  const handleToggleStatus = (id: number | string) => {
    console.log("Toggle status for service:", id);
    // In a real app, you would make an API call here
  };

  // Mock add new service route
  const addNewServiceRoute = "/application-services/add";

  // View details route
  const viewServiceDetailsRoute = (id: string | number) =>
    `/application-services/${id}`;

  return (
    <DataTableSection
      title="خدمات التطبيق"
      entityName="خدمة"
      entityNamePlural="خدمات"
      icon={Settings}
      columns={columns}
      fetchData={fetchServices}
      onToggleStatus={handleToggleStatus}
      addNewRoute={addNewServiceRoute}
      viewDetailsRoute={viewServiceDetailsRoute}
      loadingMessage="جاري تحميل الخدمات..."
      errorMessage="فشل في تحميل الخدمات"
      itemsPerPage={10}
      showAddButton={true}
      showModifyButton={true}
    />
  );
};

export default Services;
