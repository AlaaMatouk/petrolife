import { useState, useMemo, useEffect } from "react";
import { Table, Pagination, ExportButton, LoadingSpinner } from "../../../shared";
import { Globe, CirclePlus, MoreVertical, Eye, Trash2, MapPin, Building2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  fetchAllCountries,
  fetchAllCities,
  fetchAllAreas,
  createCity,
  createArea,
  deleteCountry,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { ConfirmDialog } from "../../../shared/ConfirmDialog/ConfirmDialog";

// Action Menu Component for each row
interface ActionMenuProps {
  item: any;
  onView: (item: any) => void;
  onAddCity: (item: any) => void;
  onAddRegion: (item: any) => void;
  onDelete: (item: any) => void;
}

const ActionMenu = ({ item, onView, onAddCity, onAddRegion, onDelete }: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 192;
    let left = rect.right + 4;
    if (left + menuWidth > window.innerWidth) {
      left = rect.left - menuWidth - 4;
    }
    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.max(4, left),
    });
  };

  const handleAction = (action: string) => {
    if (action === "view") {
      onView(item);
      setIsOpen(false);
    } else if (action === "add-city") {
      onAddCity(item);
      setIsOpen(false);
    } else if (action === "add-region") {
      onAddRegion(item);
      setIsOpen(false);
    } else if (action === "delete") {
      // Close menu first, then call onDelete after a small delay
      setIsOpen(false);
      setTimeout(() => {
        onDelete(item);
      }, 0);
    }
  };

  return (
    <div className="relative">
      <button
        ref={setButtonRef}
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(updateMenuPosition, 0);
        }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="إجراءات"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {createPortal(
            <div
              className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="py-1">
                <button
                  onClick={() => handleAction("view")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>مشاهدة بيانات الدولة</span>
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("add-city")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>إضافة مدينة جديدة للدولة</span>
                  <MapPin className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleAction("add-region")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>إضافة منطقة جديدة للدولة</span>
                  <Building2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAction("delete");
                  }}
                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center justify-end gap-2 transition-colors"
                >
                  <span>حذف الدولة</span>
                  <Trash2 className="w-4 h-4" />
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

const Countries = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    countryId: string | null;
    countryName: string;
  }>({
    isOpen: false,
    countryId: null,
    countryName: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const refreshCities = async () => {
    try {
      const citiesData = await fetchAllCities();
      setCities(citiesData);
    } catch (error) {
      console.error("Failed to refresh cities:", error);
    }
  };

  const refreshAreas = async () => {
    try {
      const areasData = await fetchAllAreas();
      setAreas(areasData);
    } catch (error) {
      console.error("Failed to refresh areas:", error);
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [countriesData, citiesData, areasData] = await Promise.all([
          fetchAllCountries(),
          fetchAllCities(),
          fetchAllAreas(),
        ]);

        setCountries(countriesData);
        setCities(citiesData);
        setAreas(areasData);
      } catch (err) {
        console.error("Failed to load countries/cities:", err);
        setError("فشل في تحميل بيانات الدول.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const columns = useMemo(
    () => [
      {
        key: "actions",
        label: "الإجراءات",
        width: "w-16",
        priority: "high",
        render: (_: any, row: any) => (
          <div className="flex items-center justify-center">
            <ActionMenu
              item={row}
              onView={(item) => {
                const targetId = item.rowId ?? item.id;
                navigate(`/admin-countries/${targetId}`, {
                  state: { country: item.raw },
                });
              }}
              onAddCity={(item) => {
                setSelectedCountry(item);
                setCityForm({ cityNameAr: "", cityNameEn: "" });
                setIsCityModalOpen(true);
              }}
              onAddRegion={(item) => {
                setSelectedCountry(item);
                setRegionForm({ regionNameAr: "", regionNameEn: "", cityId: "" });
                setIsRegionModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          </div>
        ),
      },
      {
        key: "creationDate",
        label: "تاريخ الانشاء",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "creator",
        label: "المنشئ",
        width: "min-w-[140px]",
        priority: "high",
      },
      {
        key: "numberOfRegions",
        label: "عدد المناطق",
        width: "min-w-[120px]",
        priority: "high",
      },
      {
        key: "numberOfCities",
        label: "عدد المدن",
        width: "min-w-[120px]",
        priority: "high",
      },
      {
        key: "countryNameEn",
        label: "اسم الدولة بالانجليزي",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "countryNameAr",
        label: "اسم الدولة",
        width: "min-w-[150px]",
        priority: "high",
      },
      {
        key: "displayIndex",
        label: "الرقم",
        width: "min-w-[80px]",
        priority: "high",
      },
    ],
    [navigate]
  );

  const paginatedData = useMemo(() => {
    return countries
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .map((country, index) => {
        const countryDocId = country?.id ?? country?.docId ?? `temp-${index}`;

        const countryNameAr =
          (country?.name?.ar && typeof country.name.ar === "string"
            ? country.name.ar.trim()
            : "") ||
          (typeof country?.name === "string" ? country.name.trim() : "") ||
          "-";

        const countryNameEn =
          (country?.name?.en && typeof country.name.en === "string"
            ? country.name.en.trim()
            : "") ||
          (typeof country?.label === "string" ? country.label.trim() : "") ||
          (typeof country?.name === "string" ? country.name.trim() : "") ||
          "-";

        const citiesCount = cities.filter((city) => {
          const target =
            city?.countryId ??
            city?.country?.id ??
            (typeof city?.country === "string" ? city.country : null);
          return target && String(target) === String(countryDocId);
        }).length;

        const areasCount = areas.filter((area) => {
          const areaCountryId =
            area?.city?.country?.id ??
            area?.city?.countryId ??
            area?.country?.id ??
            area?.countryId ??
            (typeof area?.city?.country === "string"
              ? area.city.country
              : undefined);

          return areaCountryId && String(areaCountryId) === String(countryDocId);
        }).length;

        const creatorId =
          country?.createdUserEmail ??
          country?.createdUserId ??
          country?.createdBy ??
          "-";

        let formattedDate = "-";
        const createdDate =
          country?.createdDate ??
          country?.createdAt ??
          country?.timestamp ??
          country?.dateCreated;

        if (createdDate) {
          try {
            const date =
              typeof createdDate?.toDate === "function"
                ? createdDate.toDate()
                : createdDate instanceof Date
                ? createdDate
                : typeof createdDate === "number"
                ? new Date(createdDate)
                : typeof createdDate === "string"
                ? new Date(createdDate)
                : createdDate?.seconds
                ? new Date(createdDate.seconds * 1000)
                : null;

            if (date && !Number.isNaN(date.getTime())) {
              formattedDate = new Intl.DateTimeFormat("ar-SA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(date);
            }
          } catch (err) {
            console.warn("Failed to format country date:", createdDate, err);
          }
        }

        return {
          id: countryDocId,
          displayIndex: index + 1 + (currentPage - 1) * itemsPerPage,
          rowId: countryDocId,
          countryNameAr,
          countryNameEn,
          numberOfCities: citiesCount,
          numberOfRegions: areasCount,
          creator: creatorId || "-",
          creationDate: formattedDate,
          raw: country,
        };
      });
  }, [countries, cities, currentPage, itemsPerPage]);

  const handleExport = (format: string) => {
    console.log(`Exporting countries as ${format}`);
  };

  const handleDelete = (item: any) => {
    console.log("handleDelete called with item:", item);
    const countryId = item.rowId ?? item.id;
    const countryName = item.countryNameAr || item.countryNameEn || "الدولة";
    console.log("Setting delete confirm with:", { countryId, countryName });
    setDeleteConfirm({
      isOpen: true,
      countryId,
      countryName,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.countryId) return;

    try {
      setDeletingId(deleteConfirm.countryId);

      // Delete from Firestore
      await deleteCountry(deleteConfirm.countryId);

      // Show success message
      addToast({
        type: "success",
        message: `تم حذف ${deleteConfirm.countryName} بنجاح`,
        duration: 3000,
      });

      // Close confirmation popup
      setDeleteConfirm({
        isOpen: false,
        countryId: null,
        countryName: "",
      });

      // Reload countries data
      const countriesData = await fetchAllCountries();
      setCountries(countriesData);
    } catch (error: any) {
      console.error("Error deleting country:", error);
      addToast({
        type: "error",
        message: error.message || "فشل في حذف الدولة",
        duration: 3000,
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-16">
        <LoadingSpinner message="جاري تحميل بيانات الدول..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20 gap-4">
        <div className="text-red-600 text-lg [direction:rtl]">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A55AE] text-white"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full flex-[0_0_auto] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        {/* Title on right */}
        <div className="flex items-center justify-end gap-1.5" dir="rtl">
          <Globe className="w-5 h-5 text-gray-500" />
          <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
            البلدان ({countries.length})
          </h1>
        </div>
        {/* Buttons on left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin-countries/add")}
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray transition-colors"
          >
            <div className="flex items-center gap-[var(--corner-radius-small)] relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex items-center justify-center gap-2.5 pt-1 pb-0 px-0 relative flex-[0_0_auto]">
                <span className="w-fit mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-color-mode-text-icons-t-sec text-left tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] whitespace-nowrap [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                  إضافة بلد جديد
                </span>
              </div>
              <CirclePlus className="w-4 h-4 text-gray-500" />
            </div>
          </button>
          <ExportButton onExport={handleExport} buttonText="تصدير" />
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full overflow-x-auto">
        <Table columns={columns} data={paginatedData} />
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(countries.length / itemsPerPage) || 1}
        onPageChange={setCurrentPage}
      />

      {isCityModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedCountry) {
                  return;
                }

                setIsSubmittingCity(true);

                try {
                  const countryId = selectedCountry.rowId ?? selectedCountry.id;
                  const countryRaw = selectedCountry.raw ?? {};
                  const countryNameAr =
                    countryRaw?.name?.ar ?? selectedCountry.countryNameAr ?? null;
                  const countryNameEn =
                    countryRaw?.name?.en ?? selectedCountry.countryNameEn ?? null;

                  await createCity({
                    countryId,
                    countryNameAr,
                    countryNameEn,
                    cityNameAr: cityForm.cityNameAr.trim(),
                    cityNameEn: cityForm.cityNameEn.trim(),
                  });

                  await refreshCities();
                  setCityForm({ cityNameAr: "", cityNameEn: "" });
                  setIsCityModalOpen(false);
                } catch (error) {
                  console.error("Failed to create city:", error);
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
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedCountry || !regionForm.cityId) {
                  return;
                }

                setIsSubmittingRegion(true);

                try {
                  const countryId = selectedCountry.rowId ?? selectedCountry.id;
                  const countryRaw = selectedCountry.raw ?? {};
                  const countryNameAr =
                    countryRaw?.name?.ar ?? selectedCountry.countryNameAr ?? null;
                  const countryNameEn =
                    countryRaw?.name?.en ?? selectedCountry.countryNameEn ?? null;

                  const matchedCity = cities.find((city) => {
                    const docId = city?.id ?? city?.docId;
                    return docId && docId === regionForm.cityId;
                  });

                  const cityNameAr =
                    matchedCity?.name?.ar ?? matchedCity?.cityNameAr ?? null;
                  const cityNameEn =
                    matchedCity?.name?.en ?? matchedCity?.cityNameEn ?? null;
                  const cityLat = matchedCity?.latlng?.lat ?? 0;
                  const cityLng = matchedCity?.latlng?.lng ?? 0;

                  await createArea({
                    countryId,
                    countryNameAr,
                    countryNameEn,
                    cityId: regionForm.cityId,
                    cityNameAr,
                    cityNameEn,
                    cityLatitude: cityLat,
                    cityLongitude: cityLng,
                    areaNameAr: regionForm.regionNameAr.trim(),
                    areaNameEn: regionForm.regionNameEn.trim(),
                  });

                  await refreshAreas();
                  setRegionForm({ regionNameAr: "", regionNameEn: "", cityId: "" });
                  setIsRegionModalOpen(false);
                } catch (error) {
                  console.error("Failed to create area:", error);
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
                    {cities.map((city) => (
                      <option key={city.id ?? city.docId} value={city.id ?? city.docId}>
                        {city?.name?.ar ??
                          city?.name?.en ??
                          city?.label ??
                          city?.cityNameAr ??
                          city?.cityNameEn ??
                          "مدينة غير معروفة"}
                      </option>
                    ))}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onCancel={() =>
          setDeleteConfirm({
            isOpen: false,
            countryId: null,
            countryName: "",
          })
        }
        onConfirm={handleDeleteConfirm}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف ${deleteConfirm.countryName}؟\n\nهذه العملية لا يمكن التراجع عنها.`}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default Countries;

