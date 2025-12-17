import { useState, useEffect } from "react";
import { Table } from "../../../../components/shared";
import {
  fetchCarStationsWithConsumption,
  updateStationIsActive,
  fetchStationById,
} from "../../../../services/firestore";
import { LoadingSpinner } from "../../../../components/shared/Spinner/LoadingSpinner";
import { StatusToggle } from "../../../../components/shared/StatusToggle/StatusToggle";
import { useToast } from "../../../../context/ToastContext";

interface StationData {
  id: string;
  code: string;
  city: string;
  company: string;
  consumption: string;
  consumptionDetails?: string;
  isAvailable: boolean;
  totalLitersConsumed?: number;
  status?: string;
  stationStatus?: { active: boolean; text: string };
}

const dummyStationData: StationData[] = [
  {
    id: "1",
    code: "21A254",
    city: "12 ش الصالحين ، الرياض",
    company: "المتحدة للخدمات البترولية",
    consumption: "150 لتر",
    isAvailable: true,
  },
  {
    id: "2",
    code: "21A254",
    city: "12 ش الصالحين ، الرياض",
    company: "المتحدة للخدمات البترولية",
    consumption: "150 لتر",
    consumptionDetails: "(100 بنزين 91 + 50 سولار)",
    isAvailable: true,
  },
  {
    id: "3",
    code: "21A254",
    city: "12 ش الصالحين ، الرياض",
    company: "المتحدة للخدمات البترولية",
    consumption: "150 لتر",
    isAvailable: true,
  },
  {
    id: "4",
    code: "21A254",
    city: "12 ش الصالحين ، الرياض",
    company: "المتحدة للخدمات البترولية",
    consumption: "150 لتر",
    isAvailable: true,
  },
  {
    id: "5",
    code: "21A254",
    city: "12 ش الصالحين ، الرياض",
    company: "المتحدة للخدمات البترولية",
    consumption: "150 لتر",
    isAvailable: true,
  },
  {
    id: "6",
    code: "21A254",
    city: "12 ش الصالحين ، الرياض",
    company: "المتحدة للخدمات البترولية",
    consumption: "150 لتر",
    isAvailable: true,
  },
  {
    id: "7",
    code: "21A254",
    city: "12 ش الصالحين ، الرياض",
    company: "المتحدة للخدمات البترولية",
    consumption: "150 لتر",
    isAvailable: true,
  },
  {
    id: "8",
    code: "21A254",
    city: "12 ش الصالحين ، الرياض",
    company: "المتحدة للخدمات البترولية",
    consumption: "150 لتر",
    isAvailable: true,
  },
  {
    id: "9",
    code: "21A254",
    city: "12 ش الصالحين ، الرياض",
    company: "المتحدة للخدمات البترولية",
    consumption: "150 لتر",
    isAvailable: true,
  },
  {
    id: "10",
    code: "21A254",
    city: "12 ش الصالحين ، الرياض",
    company: "المتحدة للخدمات البترولية",
    consumption: "150 لتر",
    isAvailable: true,
  },
];

interface ControlPanelSectionProps {
  currentPage: number;
  setTotalPages: (pages: number) => void;
  selectedCompany: string;
  selectedCity: string;
  onCompaniesExtracted: (companies: string[]) => void;
  onCitiesExtracted: (cities: string[]) => void;
}

export const ControlPanelSection = ({
  currentPage,
  setTotalPages,
  selectedCompany,
  selectedCity,
  onCompaniesExtracted,
  onCitiesExtracted,
}: ControlPanelSectionProps): JSX.Element => {
  const { addToast } = useToast();
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [allStations, setAllStations] = useState<StationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  // Fetch car stations with consumption data
  useEffect(() => {
    const loadStations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const stations = await fetchCarStationsWithConsumption();

        // Transform data to match StationData interface
        const transformedStations: StationData[] = stations
          .filter((station) => {
            // Ensure station has a valid ID (doc.id from Firestore)
            const hasValidId =
              station.id &&
              typeof station.id === "string" &&
              station.id.trim() !== "";
            if (!hasValidId) {
              console.warn("Station without valid ID skipped:", station);
            }
            return hasValidId;
          })
          .map((station) => {
            // Determine if station is active
            const isActive =
              station.isActive !== false &&
              (station.status === "active" || station.isActive === true);

            return {
              id: station.id, // Use the Firestore document ID
              code: station.stationCode,
              city: station.city,
              company: station.company,
              consumption: `${Math.round(station.totalLitersConsumed)} لتر`,
              isAvailable: isActive,
              totalLitersConsumed: station.totalLitersConsumed,
              status: station.status,
              stationStatus: {
                active: isActive,
                text: isActive ? "مفعل" : "معطل",
              },
            };
          });

        setAllStations(transformedStations);
        setStationData(transformedStations);

        // Extract unique companies and cities
        const uniqueCompanies = Array.from(
          new Set(
            transformedStations
              .map((station) => station.company)
              .filter((company) => company && company !== "N/A" && company.trim() !== "")
          )
        );
        const uniqueCities = Array.from(
          new Set(
            transformedStations
              .map((station) => station.city)
              .filter((city) => city && city !== "N/A" && city.trim() !== "")
          )
        );

        // Pass unique values to parent
        onCompaniesExtracted(uniqueCompanies);
        onCitiesExtracted(uniqueCities);

        // Update total pages based on filtered data
        const pages = Math.ceil(transformedStations.length / ITEMS_PER_PAGE);
        setTotalPages(pages);
      } catch (err) {
        console.error("Error loading stations:", err);
        setError("فشل في تحميل بيانات المحطات");
      } finally {
        setIsLoading(false);
      }
    };

    loadStations();
  }, [onCompaniesExtracted, onCitiesExtracted, setTotalPages]);

  // Filter stations based on selected company and city
  useEffect(() => {
    let filteredStations = [...allStations];

    // Filter by company
    if (selectedCompany && selectedCompany !== "كل الشركات") {
      filteredStations = filteredStations.filter(
        (station) => station.company === selectedCompany
      );
    }

    // Filter by city
    if (selectedCity && selectedCity !== "كل المدن") {
      filteredStations = filteredStations.filter(
        (station) => station.city === selectedCity
      );
    }

    setStationData(filteredStations);

    // Update total pages based on filtered data
    const pages = Math.ceil(filteredStations.length / ITEMS_PER_PAGE);
    setTotalPages(pages);
  }, [selectedCompany, selectedCity, allStations, setTotalPages]);

  // Handler for toggling station status
  const handleToggleStatus = async (stationId: string | number) => {
    try {
      // Validate station ID
      if (!stationId || stationId === null || stationId === undefined) {
        console.error("Invalid station ID:", stationId);
        addToast({
          type: "error",
          title: "خطأ",
          message: "معرف المحطة غير صحيح",
        });
        return;
      }

      const stationIdStr = String(stationId);

      // Validate that the ID is not empty or just whitespace
      if (!stationIdStr.trim()) {
        console.error("Empty station ID string");
        addToast({
          type: "error",
          title: "خطأ",
          message: "معرف المحطة غير صحيح",
        });
        return;
      }

      // Fetch current station data from Firestore to get the current isActive status
      const currentStationData: any = await fetchStationById(stationIdStr);

      // Get current isActive status
      // Handle null, undefined, or missing values - treat as true/active
      let currentIsActive: boolean;
      if (
        currentStationData.isActive === null ||
        currentStationData.isActive === undefined
      ) {
        // If isActive is null/undefined, treat as active
        currentIsActive = true;
      } else {
        currentIsActive = currentStationData.isActive === true;
      }

      const newIsActive = !currentIsActive;
      await updateStationIsActive(stationIdStr, newIsActive);
      addToast({
        type: "success",
        title: "نجح",
        message: newIsActive
          ? "تم تفعيل المحطة بنجاح"
          : "تم تعطيل المحطة بنجاح",
      });

      // Refresh the stations list
      const stations = await fetchCarStationsWithConsumption();
      const transformedStations: StationData[] = stations
        .filter((station) => {
          // Ensure station has a valid ID (doc.id from Firestore)
          const hasValidId =
            station.id &&
            typeof station.id === "string" &&
            station.id.trim() !== "";
          return hasValidId;
        })
        .map((station) => {
          const isActive =
            station.isActive !== false &&
            (station.status === "active" || station.isActive === true);

          return {
            id: station.id, // Use the Firestore document ID
            code: station.stationCode,
            city: station.city,
            company: station.company,
            consumption: `${Math.round(station.totalLitersConsumed)} لتر`,
            isAvailable: isActive,
            totalLitersConsumed: station.totalLitersConsumed,
            status: station.status,
            stationStatus: {
              active: isActive,
              text: isActive ? "مفعل" : "معطل",
            },
          };
        });

      setAllStations(transformedStations);
      
      // Extract unique companies and cities after refresh
      const uniqueCompanies = Array.from(
        new Set(
          transformedStations
            .map((station) => station.company)
            .filter((company) => company && company !== "N/A" && company.trim() !== "")
        )
      );
      const uniqueCities = Array.from(
        new Set(
          transformedStations
            .map((station) => station.city)
            .filter((city) => city && city !== "N/A" && city.trim() !== "")
        )
      );

      onCompaniesExtracted(uniqueCompanies);
      onCitiesExtracted(uniqueCities);
      
      // Apply filters after refresh
      let filteredStations = [...transformedStations];
      if (selectedCompany && selectedCompany !== "كل الشركات") {
        filteredStations = filteredStations.filter(
          (station) => station.company === selectedCompany
        );
      }
      if (selectedCity && selectedCity !== "كل المدن") {
        filteredStations = filteredStations.filter(
          (station) => station.city === selectedCity
        );
      }
      setStationData(filteredStations);
    } catch (error) {
      console.error("Error toggling station status:", error);
      addToast({
        type: "error",
        title: "خطأ",
        message: "فشل في تحديث حالة المحطة",
      });
    }
  };

  const tableColumns = [
    {
      key: "stationStatus",
      label: "حالة المحطة",
      width: "flex-1 grow min-w-[200px]",
    },
    {
      key: "consumption",
      label: "اللترات المستهلكة",
      width: "w-[299px] min-w-[299px]",
    },
    {
      key: "company",
      label: "الشركة",
      width: "w-[260px] min-w-[260px]",
    },
    {
      key: "city",
      label: "المدينة",
      width: "w-48 min-w-[192px]",
    },
    {
      key: "code",
      label: "كود المحطة",
      width: "w-[126px] min-w-[126px]",
    },
  ];

  // Calculate pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStations = stationData.slice(startIndex, endIndex);

  const tableData = paginatedStations
    .filter((station) => station.id) // Filter out stations without ID
    .map((station) => ({
      ...station,
      stationStatus: station.stationStatus ? (
        <StatusToggle
          isActive={station.stationStatus.active}
          onToggle={() => station.id && handleToggleStatus(station.id)}
          statusText={station.stationStatus.text}
          disabled={!station.id}
        />
      ) : (
        <StatusToggle
          isActive={true}
          onToggle={() => station.id && handleToggleStatus(station.id)}
          statusText="مفعل"
          disabled={!station.id}
        />
      ),
      consumption: station.consumptionDetails ? (
        <p className="relative w-fit mt-[-0.20px] font-tajawal font-normal text-black text-sm text-left leading-[22.4px] whitespace-nowrap [direction:rtl]">
          <span className="tracking-[var(--body-body-2-letter-spacing)] font-body-body-2 [font-style:var(--body-body-2-font-style)] font-[number:var(--body-body-2-font-weight)] leading-[var(--body-body-2-line-height)] text-[length:var(--body-body-2-font-size)]">
            {station.consumption}{" "}
          </span>
          <span className="text-[length:var(--caption-caption-1-font-size)] tracking-[var(--caption-caption-1-letter-spacing)] leading-[var(--caption-caption-1-line-height)] font-caption-caption-1 [font-style:var(--caption-caption-1-font-style)] font-[number:var(--caption-caption-1-font-weight)]">
            {station.consumptionDetails}
          </span>
        </p>
      ) : (
        <span className="relative w-fit mt-[-0.20px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-black text-[length:var(--body-body-2-font-size)] text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
          {station.consumption}
        </span>
      ),
      city: (
        <address className="tracking-[var(--body-body-2-letter-spacing)] relative w-fit mt-[-0.20px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-black text-[length:var(--body-body-2-font-size)] text-left leading-[var(--body-body-2-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)] not-italic">
          {station.city}
        </address>
      ),
      code: (
        <code className="relative w-fit mt-[-0.20px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-black text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] whitespace-nowrap [font-style:var(--body-body-2-font-style)]">
          {station.code}
        </code>
      ),
    }));

  // Show loading state
  if (isLoading) {
    return (
      <section
        className="flex flex-col items-center justify-center gap-4 relative self-stretch w-full flex-[0_0_auto] min-h-[400px]"
        role="region"
        aria-label="لوحة التحكم في المحطات"
      >
        <LoadingSpinner message="جاري تحميل بيانات المحطات..." />
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section
        className="flex flex-col items-center justify-center gap-4 relative self-stretch w-full flex-[0_0_auto] min-h-[400px]"
        role="region"
        aria-label="لوحة التحكم في المحطات"
      >
        <p className="text-red-500 text-center [direction:rtl]">{error}</p>
      </section>
    );
  }

  // Show empty state
  if (stationData.length === 0) {
    return (
      <section
        className="flex flex-col items-center justify-center gap-4 relative self-stretch w-full flex-[0_0_auto] min-h-[400px]"
        role="region"
        aria-label="لوحة التحكم في المحطات"
      >
        <p className="text-gray-500 text-center [direction:rtl]">
          لا توجد محطات متاحة
        </p>
      </section>
    );
  }

  return (
    <section
      className="flex flex-col items-start gap-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto]"
      role="region"
      aria-label="لوحة التحكم في المحطات"
    >
      <Table
        columns={tableColumns}
        data={tableData}
        className="w-full"
        headerClassName="bg-color-mode-surface-bg-icon-gray"
        rowClassName="hover:bg-gray-50"
        cellClassName="text-right [direction:rtl] whitespace-nowrap"
      />
    </section>
  );
};
