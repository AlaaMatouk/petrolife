import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../../shared/Form";
import { ArrowLeft, CirclePlus } from "lucide-react";
import { createArea, createCity, createCountry, fetchAllCities } from "../../../../services/firestore";

interface PendingCity {
  tempId: string;
  arabicName: string;
  englishName: string;
}

interface PendingArea {
  tempId: string;
  arabicName: string;
  englishName: string;
  cityId: string;
}

const AddCountry = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    countryNameAr: "",
    countryNameEn: "",
  });
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [addedCities, setAddedCities] = useState<PendingCity[]>([]);
  const [addedAreas, setAddedAreas] = useState<PendingArea[]>([]);
  const [cityForm, setCityForm] = useState({
    cityNameAr: "",
    cityNameEn: "",
  });
  const [regionForm, setRegionForm] = useState({
    regionNameAr: "",
    regionNameEn: "",
    cityId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const citiesData = await fetchAllCities();
        setCities(citiesData);
      } catch (error) {
        console.error("Failed to load cities for country add modal:", error);
      }
    };

    load();
  }, []);

  const cityOptions = useMemo(() => {
    const existingOptions = cities.map((city) => {
      const label =
        city?.name?.ar ||
        city?.name?.en ||
        city?.label ||
        city?.cityNameAr ||
        city?.cityNameEn ||
        "مدينة غير معروفة";

      return {
        id: city?.id ?? city?.docId ?? "",
        label,
        raw: city,
      };
    });

    const pendingOptions = addedCities.map((city) => ({
      id: city.tempId,
      label: city.arabicName || city.englishName || "مدينة جديدة",
      raw: {
        id: city.tempId,
        name: {
          ar: city.arabicName,
          en: city.englishName,
        },
        latlng: {
          lat: 0,
          lng: 0,
        },
      },
      isPending: true,
    }));

    return [...pendingOptions, ...existingOptions];
  }, [cities, addedCities]);

  const handleCitySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const tempId = `temp-city-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setAddedCities((prev) => [
      ...prev,
      {
        tempId,
        arabicName: cityForm.cityNameAr.trim(),
        englishName: cityForm.cityNameEn.trim(),
      },
    ]);

    setIsCityModalOpen(false);
    setCityForm({ cityNameAr: "", cityNameEn: "" });
  };

  const handleRegionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!regionForm.cityId) {
      return;
    }

    const tempId = `temp-area-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setAddedAreas((prev) => [
      ...prev,
      {
        tempId,
        arabicName: regionForm.regionNameAr.trim(),
        englishName: regionForm.regionNameEn.trim(),
        cityId: regionForm.cityId,
      },
    ]);

    setIsRegionModalOpen(false);
    setRegionForm({ regionNameAr: "", regionNameEn: "", cityId: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.countryNameAr.trim() || !formData.countryNameEn.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const countryResult = await createCountry({
        arabicName: formData.countryNameAr.trim(),
        englishName: formData.countryNameEn.trim(),
      });

      const countryId = countryResult.id;
      const countryNameAr = formData.countryNameAr.trim();
      const countryNameEn = formData.countryNameEn.trim();

      const pendingCityIdMap = new Map<string, { id: string; nameAr: string; nameEn: string }>();

      for (const city of addedCities) {
        const createdCity = await createCity({
          countryId,
          countryNameAr,
          countryNameEn,
          cityNameAr: city.arabicName,
          cityNameEn: city.englishName,
        });

        pendingCityIdMap.set(city.tempId, {
          id: createdCity.id,
          nameAr: city.arabicName,
          nameEn: city.englishName,
        });
      }

      for (const area of addedAreas) {
        let resolvedCityId = area.cityId;
        let resolvedCityNameAr: string | null = null;
        let resolvedCityNameEn: string | null = null;
        let resolvedCityLat = 0;
        let resolvedCityLng = 0;

        const pendingCity = pendingCityIdMap.get(area.cityId);
        if (pendingCity) {
          resolvedCityId = pendingCity.id;
          resolvedCityNameAr = pendingCity.nameAr;
          resolvedCityNameEn = pendingCity.nameEn;
        } else {
          const existing = cityOptions.find((option) => option.id === area.cityId);
          const rawCity = existing?.raw;

          resolvedCityNameAr = rawCity?.name?.ar ?? rawCity?.cityNameAr ?? null;
          resolvedCityNameEn = rawCity?.name?.en ?? rawCity?.cityNameEn ?? null;
          resolvedCityLat = rawCity?.latlng?.lat ?? 0;
          resolvedCityLng = rawCity?.latlng?.lng ?? 0;
        }

        await createArea({
          countryId,
          countryNameAr,
          countryNameEn,
          cityId: resolvedCityId,
          cityNameAr: resolvedCityNameAr,
          cityNameEn: resolvedCityNameEn,
          cityLatitude: resolvedCityLat,
          cityLongitude: resolvedCityLng,
          areaNameAr: area.arabicName,
          areaNameEn: area.englishName,
        });
      }

      navigate("/admin-countries");
    } catch (error) {
      console.error("Failed to create country with related data:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full items-start gap-5" dir="rtl">
      {/* Form Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center justify-end gap-1.5" dir="rtl">
            <CirclePlus className="w-5 h-5 text-gray-500" />
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              إضافة بلد جديدة
            </h1>
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
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          {/* Country Name Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <Input
              label="اسم الدولة بالعربي"
              value={formData.countryNameAr}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, countryNameAr: value }))
              }
              placeholder="اسم الدولة هنا بالعربي"
              required
            />
            <Input
              label="اسم الدولة بالانجليزي"
              value={formData.countryNameEn}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, countryNameEn: value }))
              }
              placeholder="اسم الدولة هنا بالانجليزي"
              required
            />
          </div>

          {/* Add Country Button */}
          <div className="w-full flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "جاري الإضافة..." : "إضافة الدولة"}
            </button>
          </div>
        </form>

        {/* Cities Section */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              المدن المضافة ({addedCities.length})
            </h2>
            <button
              type="button"
              onClick={() => setIsCityModalOpen(true)}
              className="px-4 h-10 rounded-[10px] border-2 border-[#5A66C1] text-[#5A66C1] font-medium hover:bg-blue-50 transition-colors"
            >
              إضافة مدينة جديدة
            </button>
          </div>
          {addedCities.length === 0 ? (
            <div className="w-full py-8 text-center text-gray-400 border border-dashed border-gray-300 rounded-lg">
              لا توجد مدن مضافة حتى الآن
            </div>
          ) : (
            <ul className="w-full border border-dashed border-gray-300 rounded-lg divide-y divide-gray-200">
              {addedCities.map((city) => (
                <li key={city.tempId} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-gray-700">{city.arabicName || "-"}</span>
                  <span className="text-gray-500">{city.englishName || "-"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Regions Section */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              المناطق المضافة ({addedAreas.length})
            </h2>
            <button
              type="button"
              onClick={() => setIsRegionModalOpen(true)}
              className="px-4 h-10 rounded-[10px] border-2 border-[#5A66C1] text-[#5A66C1] font-medium hover:bg-blue-50 transition-colors"
            >
              إضافة منطقة جديدة
            </button>
          </div>
          {addedAreas.length === 0 ? (
            <div className="w-full py-8 text-center text-gray-400 border border-dashed border-gray-300 rounded-lg">
              لا توجد مناطق مضافة حتى الآن
            </div>
          ) : (
            <ul className="w-full border border-dashed border-gray-300 rounded-lg divide-y divide-gray-200">
              {addedAreas.map((area) => (
                <li key={area.tempId} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-gray-700">{area.arabicName || "-"}</span>
                  <span className="text-gray-500">{area.englishName || "-"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isCityModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
            <form
              onSubmit={handleCitySubmit}
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
                  disabled={isSubmitting}
                  className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  إضافة المدينة
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
              onSubmit={handleRegionSubmit}
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
                    {cityOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
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
                  disabled={isSubmitting}
                  className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  إضافة المنطقة
                </button>
              </footer>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AddCountry;

