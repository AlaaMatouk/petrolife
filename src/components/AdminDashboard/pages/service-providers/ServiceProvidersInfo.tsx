import { Truck, ArrowLeft, Fuel } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { DataTableSection } from "../../../sections/DataTableSection";
import {
  fetchFuelStationsByProvider,
  FuelStation,
  updateStationIsActive,
  fetchStationById,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";

interface ServiceProvidersInfoProps {
  providerData: any;
}

// Station interface matching ServiceDistributerStationLocations
interface Station {
  id: string;
  stationCode: string;
  stationName: string;
  address: string;
  fuelTypes: string[];
  stationStatus: { active: boolean; text: string };
}

// Columns configuration matching ServiceDistributerStationLocations
const stationColumns = [
  {
    key: "actions",
    label: "",
    width: "w-16 min-w-[60px]",
    priority: "high" as const,
  },
  {
    key: "stationStatus",
    label: "حالة المحطة",
    width: "flex-1 grow min-w-[120px]",
    priority: "high" as const,
  },
  {
    key: "fuelTypes",
    label: "نوع الوقود",
    width: "flex-1 grow min-w-[150px]",
    priority: "high" as const,
    render: (value: string[]) => (
      <div className="text-center">{value.join(" ")}</div>
    ),
  },
  {
    key: "address",
    label: "العنوان",
    width: "flex-1 grow min-w-[150px]",
    priority: "medium" as const,
  },
  {
    key: "stationName",
    label: "اسم المحطة",
    width: "flex-1 grow min-w-[150px]",
    priority: "high" as const,
  },
  {
    key: "stationCode",
    label: "كود المحطة",
    width: "flex-1 grow min-w-[120px]",
    priority: "high" as const,
  },
];

export const ServiceProvidersInfo = ({
  providerData,
}: ServiceProvidersInfoProps): JSX.Element => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Fetch data function for stations - filtered by provider
  // Same transformation logic as ServiceDistributerStationLocations
  const fetchStationsData = async (): Promise<Station[]> => {
    try {
      // Get provider email and uId - stations are linked by createdUserId matching email
      const providerEmail = providerData.email || "";
      const providerUId = providerData.uId || providerData.uid;

      console.log("🔍 Fetching stations for provider:", {
        providerEmail,
        providerUId,
        providerData: {
          uId: providerData.uId,
          uid: providerData.uid,
          email: providerData.email,
        },
      });

      if (!providerEmail && !providerUId) {
        console.log("⚠️ No provider identifier found");
        return [];
      }

      // Fetch provider's fuel stations from Firestore (same method as ServiceDistributerStationLocations)
      const fuelStations = await fetchFuelStationsByProvider(providerEmail, providerUId);
      
      console.log(`📊 Fetched ${fuelStations.length} fuel stations`);

      // Transform FuelStation data to Station interface format (same as ServiceDistributerStationLocations)
      return fuelStations.map((station: FuelStation) => {
        // Use Firestore document ID directly (same as Stations.tsx)
        // Generate station code from document ID (first 8 characters, uppercase)
        const stationCode = station.id.substring(0, 8).toUpperCase();

        // Build address string from formattedLocation or address object
        let address = "";
        if (station.formattedLocation?.address) {
          const addr = station.formattedLocation.address;
          address =
            [addr?.road, addr?.city, addr?.state, addr?.country]
              .filter(Boolean)
              .join("، ") || station.cityName || "-";
        } else if (station.address) {
          if (typeof station.address === "string") {
            address = station.address;
          } else if (
            typeof station.address === "object" &&
            station.address !== null
          ) {
            const addr = station.address as {
              road?: string;
              city?: string;
              state?: string;
              country?: string;
            };
            address =
              [addr?.road, addr?.city, addr?.state, addr?.country]
                .filter(Boolean)
                .join("، ") || station.cityName || "-";
          } else {
            address = station.cityName || "-";
          }
        } else {
          address = station.cityName || "-";
        }

        // Map fuel types - check if available in station data, otherwise use default
        const options = station.options as { fuelTypes?: string[] } | undefined;
        const fuelTypes =
          options?.fuelTypes && Array.isArray(options.fuelTypes)
            ? options.fuelTypes
            : station.type
            ? [station.type]
            : ["ديزل", "بنزين 91"]; // Default fuel types

        // Map isActive to stationStatus
        const isActive = station.isActive !== false; // Default to true if not specified
        const stationStatus = {
          active: isActive,
          text: isActive ? "مفعل" : "معطل",
        };

        return {
          id: station.id, // Use Firestore document ID directly (string)
          stationCode,
          stationName: station.stationName || station.name || "محطة غير معروفة",
          address,
          fuelTypes: Array.isArray(fuelTypes)
            ? fuelTypes
            : [fuelTypes].filter(Boolean),
          stationStatus,
        };
      });
    } catch (error) {
      console.error("Error fetching provider stations:", error);
      // Return empty array on error
      return [];
    }
  };

  // Handle status toggle (same as ServiceDistributerStationLocations)
  const handleToggleStatus = async (stationId: string | number) => {
    try {
      const stationIdStr = String(stationId);

      // Fetch current station data from Firestore to get the current isActive status
      const currentStationData = await fetchStationById(stationIdStr);

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
        message: newIsActive
          ? "تم تفعيل المحطة بنجاح"
          : "تم تعطيل المحطة بنجاح",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error toggling station status:", error);
      addToast({
        type: "error",
        message: "فشل في تحديث حالة المحطة",
        duration: 3000,
      });
    }
  };

  // Helper function to get value or dash
  const getValueOrDash = (value: any): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return String(value);
  };

  // Extract service provider information
  const providerInfo = {
    name: getValueOrDash(providerData.providerName || providerData.name),
    clientCode: getValueOrDash(
      providerData.clientCode || providerData.providerCode || providerData.code
    ),
    distinguishedClientNumber: getValueOrDash(
      providerData.distinguishedClientNumber || providerData.specialClientNumber
    ),
    email: getValueOrDash(providerData.email),
    phone: getValueOrDash(providerData.phone || providerData.phoneNumber),
    type: getValueOrDash(providerData.type || providerData.serviceType),
    stations: getValueOrDash(providerData.stations),
    sales: getValueOrDash(providerData.sales),
    accountStatus:
      providerData.accountStatus?.text || getValueOrDash(providerData.status),
    address: getValueOrDash(providerData.address),
    city: getValueOrDash(providerData.city),
    commercialRegNumber: getValueOrDash(providerData.commercialRegNumber),
    taxNumber: getValueOrDash(providerData.taxNumber),
    joinDate: getValueOrDash(
      providerData.joinDate ||
        providerData.registrationDate ||
        providerData.createdAt
    ),
    nationalAddressDoc:
      providerData.nationalAddressDoc || providerData.nationalAddressDocument,
    taxNumberDoc: providerData.taxNumberDoc || providerData.taxDocument,
    commercialRegDoc:
      providerData.commercialRegDoc || providerData.commercialRegDocument,
    logo: providerData.logo || providerData.image || providerData.profileImage,
  };

  // Define all fields to display in 3-column layout
  const fields = [
    { label: "البريد الإلكتروني", value: providerInfo.email },
    { label: "رقم الهاتف", value: providerInfo.phone },
    { label: "اسم مزود الخدمة", value: providerInfo.name },
    { label: "تاريخ الانضمام", value: providerInfo.joinDate },
    { label: "العنوان", value: providerInfo.address },

    { label: "المدينة", value: providerInfo.city },
    {
      label: "رقم العميل المميز",
      value: providerInfo.distinguishedClientNumber,
    },
    { label: "الرقم الضريبي", value: providerInfo.taxNumber },
    { label: "السجل التجاري", value: providerInfo.commercialRegNumber },
  ];

  // Helper function to render field
  const renderField = (field: { label: string; value: string }) => (
    <div className="flex flex-col gap-2 flex-1">
      <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
        {field.label}
      </label>
      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[var(--form-readonly-input-text-color)] [direction:rtl] text-right font-normal">
        {field.value}
      </div>
    </div>
  );

  // Helper function to render rows of 3 columns
  const renderFieldRows = () => {
    const rows = [];
    for (let i = 0; i < fields.length; i += 3) {
      const rowFields = fields.slice(i, i + 3);
      rows.push(
        <div
          key={i}
          className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]"
        >
          {rowFields.map((field, index) => (
            <React.Fragment key={index}>{renderField(field)}</React.Fragment>
          ))}
          {/* Fill remaining columns if less than 3 */}
          {rowFields.length < 3 &&
            Array.from({ length: 3 - rowFields.length }).map((_, index) => (
              <div key={`empty-${index}`} className="flex-1" />
            ))}
        </div>
      );
    }
    return rows;
  };

  return (
    <div>
      <main
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
        data-model-id="service-provider-info"
      >
        <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
          <nav className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
              aria-label="العودة"
            >
              <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </div>
            </button>

            <div className="flex items-center justify-end gap-1.5 relative">
              <h1 className="mt-[-1.00px] font-bold text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] relative [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
                {providerInfo.name}
              </h1>
              <Truck className="w-5 h-5 text-gray-500" />
            </div>
          </nav>
        </header>

        <section className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-end gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
            <form className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
              {/* Provider Logo Section - Full Width Row */}
              <div className="flex mt-[-20px] items-center justify-end relative self-stretch w-full flex-[0_0_auto]">
                {providerInfo.logo ? (
                  <img
                    src={providerInfo.logo}
                    alt="شعار مزود الخدمة"
                    className="w-32 h-32 object-cover rounded-full border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-full border-2 border-gray-300">
                    <Truck className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Dynamic fields in 3-column layout */}
              {renderFieldRows()}

              {/* Document Preview Section */}
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                {/* معاينة العنوان الوطني (اختياري) */}
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                    معاينة العنوان الوطني (اختياري)
                  </label>
                  {providerInfo.nationalAddressDoc ? (
                    <a
                      href={providerInfo.nationalAddressDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors [direction:rtl] text-right font-normal cursor-pointer"
                    >
                      عرض المستند
                    </a>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 [direction:rtl] text-right font-normal">
                      -
                    </div>
                  )}
                </div>

                {/* معاينة الرقم الضريبي */}
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                    معاينة الرقم الضريبي
                  </label>
                  {providerInfo.taxNumberDoc ? (
                    <a
                      href={providerInfo.taxNumberDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors [direction:rtl] text-right font-normal cursor-pointer"
                    >
                      عرض المستند
                    </a>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 [direction:rtl] text-right font-normal">
                      -
                    </div>
                  )}
                </div>

                {/* معاينة السجل التجاري */}
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm font-normal text-[var(--form-readonly-label-color)] [direction:rtl] text-right">
                    معاينة السجل التجاري
                  </label>
                  {providerInfo.commercialRegDoc ? (
                    <a
                      href={providerInfo.commercialRegDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors [direction:rtl] text-right font-normal cursor-pointer"
                    >
                      عرض المستند
                    </a>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 [direction:rtl] text-right font-normal">
                      -
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Button */}
              <div className="flex items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
                <button
                  className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] hover:opacity-90 transition-opacity"
                  style={{ border: "0.5px solid #A9B4BE" }}
                  aria-label="تواصل مع مزود الخدمة"
                >
                  <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="w-fit font-[number:var(--subtitle-subtitle-3-font-weight)] text-[#5B738B] text-left tracking-[var(--subtitle-subtitle-3-letter-spacing)] whitespace-nowrap [direction:rtl] relative mt-[-1.00px] font-subtitle-subtitle-3 text-[length:var(--subtitle-subtitle-3-font-size)] leading-[var(--subtitle-subtitle-3-line-height)] [font-style:var(--subtitle-subtitle-3-font-style)]">
                      تواصل مع مزود الخدمة
                    </div>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Service Provider Station Locations Section - Using DataTableSection */}
      {/* Same structure as ServiceDistributerStationLocations */}
      <div className="mt-[var(--corner-radius-large)]">
        <DataTableSection<Station>
          title={`محطات ${providerInfo.name}`}
          entityName="المحطة"
          entityNamePlural="المحطات"
          icon={Fuel}
          columns={stationColumns}
          fetchData={fetchStationsData}
          onToggleStatus={handleToggleStatus}
          addNewRoute=""
          viewDetailsRoute={(id) => `/service-provider-station/${id}`}
          loadingMessage={`جاري تحميل بيانات المحطات...`}
          errorMessage="فشل في تحميل بيانات المحطات."
          itemsPerPage={5}
          showTimeFilter={false}
          showAddButton={false}
        />
      </div>
    </div>
  );
};
