import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Table, Pagination, ExportButton, LoadingSpinner } from "../../../shared";
import { ArrowLeft, MapPin, Building2, Download } from "lucide-react";
import { createPortal } from "react-dom";
import {
  fetchAllAreas,
  fetchAllCities,
  fetchAllCountries,
  createCity,
  createArea,
} from "../../../../services/firestore";

// Export Menu Component
const ExportMenu = ({ items }: { items: any[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 150;
    const viewportWidth = window.innerWidth;
    let left = rect.right + 4;
    if (left + menuWidth > viewportWidth) left = rect.left - menuWidth - 4;
    setMenuPosition({ top: rect.bottom + 4, left: Math.max(4, left) });
  };

  const handleExport = (format: "excel" | "pdf") => {
    console.log("Export items as", format);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={setButtonRef}
        onClick={() => {
          setIsOpen((v) => !v);
          setTimeout(updateMenuPosition, 0);
        }}
        className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray"
      >
        <div className="flex items-center gap-[var(--corner-radius-small)]">
          <span className="font-body-body-2 text-[length:var(--body-body-2-font-size)] text-color-mode-text-icons-t-sec [direction:rtl]">
            تصدير
          </span>
          <Download className="w-4 h-4 text-gray-500" />
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {createPortal(
            <div
              className="fixed w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="py-1">
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>ملف Excel</span>
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>ملف PDF</span>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

const CountryDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const locationState = (location.state as any) || {};

  const [country, setCountry] = useState<any | null>(locationState?.country ?? null);
  const [cities, setCities] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [cityForm, setCityForm] = useState({
    cityNameAr: "",
    cityNameEn: "",
  });
  const [regionForm, setRegionForm] = useState({
    regionNameAr: "",
    regionNameEn: "",
    cityId: "",
  });
  const [isSubmittingCity, setIsSubmittingCity] = useState(false);
  const [isSubmittingRegion, setIsSubmittingRegion] = useState(false);

  const [citiesPage, setCitiesPage] = useState(1);
  const [regionsPage, setRegionsPage] = useState(1);
  const itemsPerPage = 10;

  const resolveCountryId = () => {
    return (
      id ??
      country?.id ??
      country?.docId ??
      (typeof country?.countryId === "string" ? country.countryId : null)
    );
  };

  const refreshCities = async (overrideCountryId?: string | null) => {
    try {
      const targetId = overrideCountryId ?? resolveCountryId();
      if (!targetId) return;
      const allCities = await fetchAllCities();
      const filtered = allCities.filter((city) => {
        const cityCountryId =
          city?.country?.id ??
          city?.countryId ??
          (typeof city?.country === "string" ? city.country : null);
        return cityCountryId && String(cityCountryId) === String(targetId);
      });
      setCities(filtered);
    } catch (err) {
      console.error("Failed to refresh cities list:", err);
    }
  };

  const refreshAreas = async (overrideCountryId?: string | null) => {
    try {
      const targetId = overrideCountryId ?? resolveCountryId();
      if (!targetId) return;
      const allAreas = await fetchAllAreas();
      const filtered = allAreas.filter((area) => {
        const areaCountryId =
          area?.city?.country?.id ??
          area?.city?.countryId ??
          area?.country?.id ??
          area?.countryId ??
          (typeof area?.city?.country === "string"
            ? area.city.country
            : undefined);
        return areaCountryId && String(areaCountryId) === String(targetId);
      });
      setAreas(filtered);
    } catch (err) {
      console.error("Failed to refresh areas list:", err);
    }
  };

    useEffect(() => {
      const load = async () => {
        if (!id) {
          setError("معرف الدولة غير متوفر.");
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          let countryData = locationState?.country;
          if (!countryData) {
            const allCountries = await fetchAllCountries();
            countryData =
              allCountries.find(
                (entry) =>
                  String(entry?.id ?? entry?.docId ?? "") === String(id)
              ) ?? null;
          }

          if (!countryData) {
            setError("لم يتم العثور على بيانات لهذه الدولة.");
            setCountry(null);
            setCities([]);
            setAreas([]);
            return;
          }

          setCountry(countryData);

          const [allCities, allAreas] = await Promise.all([
            fetchAllCities(),
            fetchAllAreas(),
          ]);

          const filteredCities = allCities.filter((city) => {
            const cityCountryId =
              city?.country?.id ??
              city?.countryId ??
              (typeof city?.country === "string" ? city.country : null);
            return cityCountryId && String(cityCountryId) === String(id);
          });

          const filteredAreas = allAreas.filter((area) => {
            const areaCountryId =
              area?.city?.country?.id ??
              area?.city?.countryId ??
              area?.country?.id ??
              area?.countryId ??
              (typeof area?.city?.country === "string"
                ? area.city.country
                : undefined);
            return areaCountryId && String(areaCountryId) === String(id);
          });

          setCities(filteredCities);
          setAreas(filteredAreas);
        } catch (err) {
          console.error("Failed to load country details:", err);
          setError("فشل في تحميل بيانات الدولة.");
        } finally {
          setIsLoading(false);
        }
      };

      load();
    }, [id, locationState]);

  const formatDate = (value: any): string => {
    if (!value) return "-";

    try {
      const date =
        typeof value?.toDate === "function"
          ? value.toDate()
          : value instanceof Date
          ? value
          : typeof value === "number"
          ? new Date(value)
          : typeof value === "string"
          ? new Date(value)
          : value?.seconds
          ? new Date(value.seconds * 1000)
          : null;

      if (!date || Number.isNaN(date.getTime())) {
        return "-";
      }

      return new Intl.DateTimeFormat("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch (err) {
      console.warn("Failed to format date:", value, err);
      return "-";
    }
  };

  const extractText = (value: any, fallback = "-"): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : fallback;
    }
    if (typeof value === "number") return value.toString();
    if (typeof value === "object") {
      if (typeof value.ar === "string" && value.ar.trim().length) {
        return value.ar.trim();
      }
      if (typeof value.en === "string" && value.en.trim().length) {
        return value.en.trim();
      }
      if (value.name) {
        return extractText(value.name, fallback);
      }
      if (value.label) {
        return extractText(value.label, fallback);
      }
    }
    return fallback;
  };

  const citiesColumns = useMemo(
    () => [
      {
        key: "additionDate",
        label: "تاريخ الاضافة",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "cityNameEn",
        label: "اسم المدينة بالانجليزي",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "cityNameAr",
        label: "اسم المدينة بالعربي",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "id",
        label: "الرقم",
        width: "min-w-[80px]",
        priority: "high",
      },
    ],
    []
  );

  const regionsColumns = useMemo(
    () => [
      {
        key: "additionDate",
        label: "تاريخ الاضافة",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "cityName",
        label: "اسم المدينة",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "regionNameEn",
        label: "اسم المنطقة بالانجليزي",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "regionNameAr",
        label: "اسم المنطقة بالعربي",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "id",
        label: "الرقم",
        width: "min-w-[80px]",
        priority: "high",
      },
    ],
    []
  );

  const paginatedCities = useMemo(() => {
    return cities
      .slice((citiesPage - 1) * itemsPerPage, citiesPage * itemsPerPage)
      .map((city, index) => ({
        id: index + 1 + (citiesPage - 1) * itemsPerPage,
        cityNameAr: extractText(
          city?.name?.ar ?? city?.name ?? city?.label ?? city?.cityNameAr
        ),
        cityNameEn: extractText(
          city?.name?.en ?? city?.englishName ?? city?.label ?? city?.cityNameEn
        ),
        additionDate: formatDate(city?.createdDate ?? city?.createdAt),
      }));
  }, [cities, citiesPage, itemsPerPage]);

  const paginatedRegions = useMemo(() => {
    return areas
      .slice((regionsPage - 1) * itemsPerPage, regionsPage * itemsPerPage)
      .map((area, index) => ({
        id: index + 1 + (regionsPage - 1) * itemsPerPage,
        regionNameAr: extractText(
          area?.name?.ar ?? area?.name ?? area?.label ?? area?.regionNameAr
        ),
        regionNameEn: extractText(
          area?.name?.en ?? area?.englishName ?? area?.label ?? area?.regionNameEn
        ),
        cityName: extractText(
          area?.city?.name?.ar ??
            area?.city?.name ??
            area?.city?.label ??
            area?.cityName ??
            area?.city?.name
        ),
        additionDate: formatDate(area?.createdDate ?? area?.createdAt),
      }));
  }, [areas, regionsPage, itemsPerPage]);

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-16">
        <LoadingSpinner message="جاري تحميل بيانات الدولة..." />
      </div>
    );
  }

  if (error || !country) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20 gap-4">
        <div className="text-red-600 text-lg [direction:rtl]">
          {error || "لا توجد بيانات لهذه الدولة."}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A55AE] text-white"
        >
          الرجوع
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full items-start gap-5">
      {/* Country Info Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center justify-end gap-1.5">
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              معلومات الدولة
            </h1>
            <Building2 className="w-5 h-5 text-gray-500" />
          </div>
          <button
            onClick={() => navigate(-1)}
            aria-label="رجوع"
            className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)]"
          >
            <div className="flex w-10 h-10 items-center justify-center bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </div>
          </button>
        </div>

        {/* Country Info Fields */}
        <div className="w-full flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                اسم الدولة بالعربي
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                {extractText(country?.name?.ar ?? country?.name ?? country?.label)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                اسم الدولة بالانجليزي
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                {extractText(country?.name?.en ?? country?.name)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                عدد المناطق
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                {areas.length}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                المنشئ
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                {extractText(
                  country?.createdUserEmail ??
                    country?.createdUserId ??
                    country?.createdBy
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
              تاريخ الانشاء
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
              {formatDate(
                country?.createdDate ??
                  country?.createdAt ??
                  country?.timestamp ??
                  country?.dateCreated
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cities Table Section */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center justify-end gap-1.5">
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              المدن المضافة ({cities.length})
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCityForm({ cityNameAr: "", cityNameEn: "" });
                setIsCityModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-[10px] border-2 border-[#5A66C1] text-[#5A66C1] font-medium hover:bg-blue-50 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              إضافة مدينة جديدة
            </button>
            <ExportMenu items={cities} />
          </div>
        </header>

        <div className="w-full overflow-x-auto">
          <Table columns={citiesColumns} data={paginatedCities} />
        </div>

        <Pagination
          currentPage={citiesPage}
          totalPages={Math.ceil(cities.length / itemsPerPage) || 1}
          onPageChange={setCitiesPage}
        />
      </div>

      {/* Regions Table Section */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center justify-end gap-1.5">
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              المناطق المضافة ({areas.length})
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setRegionForm({ regionNameAr: "", regionNameEn: "", cityId: "" });
                setIsRegionModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-[10px] border-2 border-[#5A66C1] text-[#5A66C1] font-medium hover:bg-blue-50 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              إضافة منطقة جديدة
            </button>
            <ExportMenu items={areas} />
          </div>
        </header>

        <div className="w-full overflow-x-auto">
          <Table columns={regionsColumns} data={paginatedRegions} />
        </div>

        <Pagination
          currentPage={regionsPage}
          totalPages={Math.ceil(areas.length / itemsPerPage) || 1}
          onPageChange={setRegionsPage}
        />
      </div>

      {isCityModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!country) return;
                if (isSubmittingCity) return;

                setIsSubmittingCity(true);

                try {
                  const countryIdValue = resolveCountryId();
                  if (!countryIdValue) {
                    throw new Error("Missing country id for city creation");
                  }

                  await createCity({
                    countryId: countryIdValue,
                    countryNameAr: country?.name?.ar ?? null,
                    countryNameEn: country?.name?.en ?? null,
                    cityNameAr: cityForm.cityNameAr.trim(),
                    cityNameEn: cityForm.cityNameEn.trim(),
                  });

                  await refreshCities(countryIdValue);
                  setCityForm({ cityNameAr: "", cityNameEn: "" });
                  setIsCityModalOpen(false);
                } catch (err) {
                  console.error("Failed to add city from details:", err);
                } finally {
                  setIsSubmittingCity(false);
                }
              }}
              className="bg-white w-full max-w-[520px] rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
              dir="rtl"
            >
              <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-[18px] font-semibold text-gray-800">
                  إضافة مدينة جديدة
                </h2>
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-500" />
                </button>
              </header>
              <div className="px-6 py-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600 text-right">
                    اسم المدينة بالعربي
                  </label>
                  <input
                    type="text"
                    required
                    value={cityForm.cityNameAr}
                    onChange={(event) =>
                      setCityForm((prev) => ({
                        ...prev,
                        cityNameAr: event.target.value,
                      }))
                    }
                    className="h-11 rounded-[12px] border border-gray-300 px-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#5A66C1]"
                    placeholder="المدينة بالعربي هنا"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600 text-right">
                    اسم المدينة بالانجليزي
                  </label>
                  <input
                    type="text"
                    required
                    value={cityForm.cityNameEn}
                    onChange={(event) =>
                      setCityForm((prev) => ({
                        ...prev,
                        cityNameEn: event.target.value,
                      }))
                    }
                    className="h-11 rounded-[12px] border border-gray-300 px-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#5A66C1]"
                    placeholder="المدينة بالانجليزي هنا"
                  />
                </div>
              </div>
              <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(false)}
                  className="px-6 h-10 rounded-[10px] border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  إغلاق
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCity}
                  className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingCity ? "جاري الإضافة..." : "إضافة المدينة"}
                </button>
              </footer>
            </form>
          </div>,
          document.body
        )}

      {isRegionModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!country || !regionForm.cityId) return;
                if (isSubmittingRegion) return;

                setIsSubmittingRegion(true);

                try {
                  const countryIdValue = resolveCountryId();
                  if (!countryIdValue) {
                    throw new Error("Missing country id for area creation");
                  }

                  const matchedCity = cities.find((city) => {
                    const docId = city?.id ?? city?.docId;
                    return docId && String(docId) === String(regionForm.cityId);
                  });

                  const cityNameAr =
                    matchedCity?.name?.ar ?? matchedCity?.cityNameAr ?? null;
                  const cityNameEn =
                    matchedCity?.name?.en ?? matchedCity?.cityNameEn ?? null;
                  const cityLat = matchedCity?.latlng?.lat ?? 0;
                  const cityLng = matchedCity?.latlng?.lng ?? 0;

                  await createArea({
                    countryId: countryIdValue,
                    countryNameAr: country?.name?.ar ?? null,
                    countryNameEn: country?.name?.en ?? null,
                    cityId: regionForm.cityId,
                    cityNameAr,
                    cityNameEn,
                    cityLatitude: cityLat,
                    cityLongitude: cityLng,
                    areaNameAr: regionForm.regionNameAr.trim(),
                    areaNameEn: regionForm.regionNameEn.trim(),
                  });

                  await refreshAreas(countryIdValue);
                  setRegionForm({ regionNameAr: "", regionNameEn: "", cityId: "" });
                  setIsRegionModalOpen(false);
                } catch (err) {
                  console.error("Failed to add area from details:", err);
                } finally {
                  setIsSubmittingRegion(false);
                }
              }}
              className="bg-white w-full max-w-[520px] rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
              dir="rtl"
            >
              <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-[18px] font-semibold text-gray-800">
                  إضافة منطقة جديدة
                </h2>
                <button
                  type="button"
                  onClick={() => setIsRegionModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-500" />
                </button>
              </header>
              <div className="px-6 py-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600 text-right">
                    اسم المنطقة بالعربي
                  </label>
                  <input
                    type="text"
                    required
                    value={regionForm.regionNameAr}
                    onChange={(event) =>
                      setRegionForm((prev) => ({
                        ...prev,
                        regionNameAr: event.target.value,
                      }))
                    }
                    className="h-11 rounded-[12px] border border-gray-300 px-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#5A66C1]"
                    placeholder="المنطقة بالعربي هنا"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600 text-right">
                    اسم المنطقة بالانجليزي
                  </label>
                  <input
                    type="text"
                    required
                    value={regionForm.regionNameEn}
                    onChange={(event) =>
                      setRegionForm((prev) => ({
                        ...prev,
                        regionNameEn: event.target.value,
                      }))
                    }
                    className="h-11 rounded-[12px] border border-gray-300 px-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#5A66C1]"
                    placeholder="المنطقة بالانجليزي هنا"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-600 text-right">
                    المدينة التابع إليها هذه المنطقة
                  </label>
                  <select
                    required
                    value={regionForm.cityId}
                    onChange={(event) =>
                      setRegionForm((prev) => ({
                        ...prev,
                        cityId: event.target.value,
                      }))
                    }
                    className="h-11 rounded-[12px] border border-gray-300 px-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#5A66C1]"
                  >
                    <option value="" disabled>
                      اختر المدينة
                    </option>
                    {cities.map((city) => {
                      const optionId = city?.id ?? city?.docId;
                      if (!optionId) return null;
                      const label =
                        city?.name?.ar ??
                        city?.name?.en ??
                        city?.label ??
                        city?.cityNameAr ??
                        city?.cityNameEn ??
                        "مدينة";
                      return (
                        <option key={optionId} value={optionId}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsRegionModalOpen(false)}
                  className="px-6 h-10 rounded-[10px] border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  إغلاق
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRegion}
                  className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingRegion ? "جاري الإضافة..." : "إضافة المنطقة"}
                </button>
              </footer>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CountryDetails;

