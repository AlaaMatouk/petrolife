import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { CarInformationSection } from "./sections/CarInformationSection/CarInformationSection";
import { CarDriversSection } from "./sections/CarDriversSection/CarDriversSection";
import { useEffect, useState } from "react";
import { fetchCarById } from "../../services/firestore";

export const CarDetails = (): JSX.Element => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [carData, setCarData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch car data on component mount
  useEffect(() => {
    const loadCarData = async () => {
      if (!id) {
        setError("Car ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await fetchCarById(id);
        setCarData(data);
        setError(null);
      } catch (err: any) {
        console.error("Error loading car:", err);
        setError(err.message || "Failed to load car data");
      } finally {
        setIsLoading(false);
      }
    };

    loadCarData();
  }, [id]);

  return (
    <div className="flex flex-col w-full items-start gap-5">
      {/* Back Button */}
      <button
        onClick={() => navigate("/cars")}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">رجوع إلى السيارات</span>
      </button>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل بيانات السيارة...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg w-full">
          <p className="text-red-800 text-center [direction:rtl]">
            خطأ: {error}
          </p>
        </div>
      )}

      {/* Car Details - Only show when data is loaded */}
      {!isLoading && !error && carData && (
        <>
          <CarInformationSection carData={carData} />
          <CarDriversSection carData={carData} />
        </>
      )}
    </div>
  );
};
