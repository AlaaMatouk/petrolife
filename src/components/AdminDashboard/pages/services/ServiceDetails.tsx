import { useEffect, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { ServiceInfo } from "./ServiceInfo";
import { getServiceById } from "../../../../services/firestore";

interface OutletContext {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setDynamicTitle: (title: string) => void;
}

export const ServiceDetails = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { setDynamicTitle } = useOutletContext<OutletContext>();
  const [serviceData, setServiceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch service data on component mount
  useEffect(() => {
    const loadServiceData = async () => {
      if (!id) {
        setError("Service ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch service from Firestore
        const service = await getServiceById(id);

        if (!service) {
          throw new Error("Service not found");
        }

        console.log("Service data fetched from Firestore:", service);

        setServiceData(service);
        setError(null);

        // Update the header title with service name
        const serviceTitle =
          typeof service.title === "object"
            ? service.title.ar || service.title.en
            : service.title || "الخدمة";
        setDynamicTitle(`خدمات التطبيق / ${serviceTitle}`);
      } catch (err: any) {
        console.error("Error loading service:", err);
        setError(err.message || "Failed to load service data");
      } finally {
        setIsLoading(false);
      }
    };

    loadServiceData();
  }, [id, setDynamicTitle]);

  return (
    <div className="flex flex-col gap-2">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل بيانات الخدمة...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-center [direction:rtl]">
            خطأ: {error}
          </p>
        </div>
      )}

      {/* Service Info - Only show when data is loaded */}
      {!isLoading && !error && serviceData && (
        <>
          <ServiceInfo serviceData={serviceData} />
        </>
      )}
    </div>
  );
};

export default ServiceDetails;
