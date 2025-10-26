import { Truck, ArrowLeft, MapPin } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataTableSection } from "../../../sections/DataTableSection";
import { fetchProviderStations } from "../../../../services/firestore";

interface ServiceProvidersInfoProps {
  providerData: any;
}

// Mock data type for service provider station locations
interface StationLocation {
  id: number;
  stationName: string;
  address: string;
  fuel91Consumed: number;
  fuel95Consumed: number;
  dieselConsumed: number;
  stationStatus: { active: boolean; text: string };
}

// Mock data for service provider station locations
const mockStationLocations: StationLocation[] = [
  {
    id: 1,
    stationName: "محطة الصالح",
    address: "الرياض، حي النخيل، شارع الملك فهد",
    fuel91Consumed: 5200,
    fuel95Consumed: 3800,
    dieselConsumed: 4500,
    stationStatus: { active: true, text: "نشط" },
  },
  {
    id: 2,
    stationName: "محطة النور",
    address: "جدة، حي الصفا، طريق الكورنيش",
    fuel91Consumed: 4800,
    fuel95Consumed: 5200,
    dieselConsumed: 3900,
    stationStatus: { active: true, text: "نشط" },
  },
  {
    id: 3,
    stationName: "محطة السلام",
    address: "الدمام، حي الشاطئ، شارع الخليج",
    fuel91Consumed: 4200,
    fuel95Consumed: 3500,
    dieselConsumed: 5800,
    stationStatus: { active: true, text: "نشط" },
  },
  {
    id: 4,
    stationName: "محطة الأمل",
    address: "مكة المكرمة، حي العزيزية، طريق مكة جدة",
    fuel91Consumed: 6100,
    fuel95Consumed: 4200,
    dieselConsumed: 3800,
    stationStatus: { active: false, text: "متوقف" },
  },
  {
    id: 5,
    stationName: "محطة الرياض",
    address: "الرياض، حي العليا، شارع التحلية",
    fuel91Consumed: 7200,
    fuel95Consumed: 6800,
    dieselConsumed: 5200,
    stationStatus: { active: true, text: "نشط" },
  },
];

// Columns configuration for service provider station locations
const stationColumns = [
  {
    key: "stationStatus",
    label: "حالة المحطة",
    priority: "high" as const,
  },
  {
    key: "dieselConsumed",
    label: "الديزل المستهلك (لتر)",
    priority: "low" as const,
  },
  {
    key: "fuel95Consumed",
    label: "وقود 95 المستهلك (لتر)",
    priority: "medium" as const,
  },
  {
    key: "fuel91Consumed",
    label: "وقود 91 المستهلك (لتر)",
    priority: "medium" as const,
  },
  {
    key: "address",
    label: "العنوان",
    priority: "high" as const,
  },
  {
    key: "stationName",
    label: "اسم المحطة",
    priority: "medium" as const,
  },
];

// Fetch real station data for a provider
const fetchStationLocations = async (
  providerEmail: string
): Promise<StationLocation[]> => {
  const realStations = await fetchProviderStations(providerEmail);

  // Map real stations to the interface, ensuring all fields are populated
  return realStations.map((station, index) => ({
    id: station.id || index + 1,
    stationName: station.stationName || "-",
    address: station.address || "-",
    fuel91Consumed: station.fuel91Consumed || 0,
    fuel95Consumed: station.fuel95Consumed || 0,
    dieselConsumed: station.dieselConsumed || 0,
    stationStatus: station.stationStatus || { active: true, text: "نشط" },
  }));
};

export const ServiceProvidersInfo = ({
  providerData,
}: ServiceProvidersInfoProps): JSX.Element => {
  const navigate = useNavigate();
  const [stationsFetchFunction, setStationsFetchFunction] = useState<
    () => Promise<StationLocation[]>
  >(() => async () => []);

  // Set up the fetch function when component mounts or providerData changes
  useEffect(() => {
    // Get provider email or UID to fetch stations
    const providerEmail =
      providerData.email || providerData.uId || providerData.uid || "";

    if (providerEmail) {
      // Create a fetch function that uses the provider's email
      const fetchStations = async (): Promise<StationLocation[]> => {
        return await fetchStationLocations(providerEmail);
      };
      setStationsFetchFunction(() => fetchStations);
    }
  }, [providerData]);

  // Handler for toggling station status
  const handleToggleStatus = (stationId: number) => {
    console.log(`Toggling status for station ID: ${stationId}`);
    // In a real application, this would make an API call to update the station status
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
      <div className="mt-[var(--corner-radius-large)]">
        <DataTableSection<StationLocation>
          title={`مواقع محطات ${providerInfo.name}`}
          entityName="محطة"
          entityNamePlural="محطات"
          icon={MapPin}
          columns={stationColumns}
          fetchData={stationsFetchFunction}
          onToggleStatus={handleToggleStatus}
          addNewRoute=""
          viewDetailsRoute={(id) => `/service-provider-station/${id}`}
          loadingMessage={`جاري تحميل مواقع محطات ${providerInfo.name}...`}
          itemsPerPage={5}
          showTimeFilter={false}
          showAddButton={false}
        />
      </div>
    </div>
  );
};
