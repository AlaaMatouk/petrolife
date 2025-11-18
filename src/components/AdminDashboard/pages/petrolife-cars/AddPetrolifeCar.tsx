import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { Upload, ArrowLeft, ChevronLeft, Search, Loader2 } from "lucide-react";
import { useToast } from "../../../../context/ToastContext";
import {
  assignVehicleToDriver,
  createVehicleWithSchema,
  fetchDrivers,
} from "../../../../services/firestore";

interface DriverOption {
  id: string;
  assignmentIdentifier: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  isActive: boolean;
}

const AddPetrolifeCar = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    chassisNumber: "",
    carName: "",
    plateNumber: "",
    carImage: null as File | null,
  });
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [driversError, setDriversError] = useState<string | null>(null);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverOption | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setForm((prev) => ({ ...prev, carImage: file }));
    };
    input.click();
  };

  useEffect(() => {
    const loadDrivers = async () => {
      setDriversLoading(true);
      setDriversError(null);

      try {
        const driversSnapshot = await fetchDrivers();

        const normalizedDrivers = Array.isArray(driversSnapshot)
          ? driversSnapshot
              .map((driverDoc: Record<string, any>, index: number) => {
                const identifier =
                  (driverDoc?.uId && String(driverDoc.uId)) ||
                  (driverDoc?.email && String(driverDoc.email)) ||
                  (driverDoc?.docId && String(driverDoc.docId)) ||
                  String(index);

                return {
                  id: driverDoc?.docId ?? identifier,
                  assignmentIdentifier: identifier,
                  name: String(
                    driverDoc?.name ??
                      driverDoc?.driverName ??
                      driverDoc?.fullName ??
                      identifier
                  ),
                  email: String(driverDoc?.email ?? "-"),
                  phone: String(
                    driverDoc?.phoneNumber ?? driverDoc?.phone ?? "-"
                  ),
                  city: String(driverDoc?.city?.name?.en ?? "-"),
                  status: driverDoc?.isActive ? "نشط" : "معطل",
                  isActive: Boolean(driverDoc?.isActive),
                } as DriverOption;
              })
              .sort((a, b) => a.name.localeCompare(b.name))
          : [];

        setDrivers(normalizedDrivers);
      } catch (err) {
        console.error("Failed to load drivers:", err);
        setDriversError("فشل في تحميل قائمة السائقين.");
      } finally {
        setDriversLoading(false);
      }
    };

    loadDrivers();
  }, []);

  const filteredDrivers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return drivers;

    return drivers.filter((driver) => {
      return (
        driver.name.toLowerCase().includes(query) ||
        driver.email.toLowerCase().includes(query) ||
        driver.assignmentIdentifier.toLowerCase().includes(query)
      );
    });
  }, [drivers, searchTerm]);

  const handleDriverClick = (driver: DriverOption) => {
    if (selectedDriver?.id === driver.id) {
      setSelectedDriver(null);
      return;
    }

    setSelectedDriver(driver);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.chassisNumber.trim() ||
      !form.plateNumber.trim() ||
      !form.carName.trim()
    ) {
      addToast({
        type: "error",
        title: "بيانات ناقصة",
        message: "يرجى إدخال رقم الهيكل، رقم اللوحة واسم المركبة.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const driverIdentifier =
        selectedDriver?.id ??
        selectedDriver?.assignmentIdentifier ??
        null;

      const { id: vehicleId } = await createVehicleWithSchema({
        chassisNumber: form.chassisNumber.trim(),
        plateNumber: form.plateNumber.trim(),
        name: form.carName.trim(),
        imageFile: form.carImage,
        driverIdentifiers: driverIdentifier ? [driverIdentifier] : [],
      });

      if (driverIdentifier) {
        try {
          await assignVehicleToDriver({
            driverIdentifier,
            vehicleId,
            vehicleName: form.carName.trim(),
            plateNumber: form.plateNumber.trim(),
          });
        } catch (driverUpdateError) {
          console.error(
            "Failed to update driver with vehicle info:",
            driverUpdateError
          );
          addToast({
            type: "warning",
            title: "تحذير",
            message:
              "تم إنشاء المركبة لكن تعذر تحديث بيانات السائق المرتبط بها.",
          });
        }
      }

      addToast({
        type: "success",
        title: "تم إضافة المركبة",
        message: "تم حفظ بيانات المركبة بنجاح.",
      });

      setForm({
        chassisNumber: "",
        carName: "",
        plateNumber: "",
        carImage: null,
      });
      setSelectedDriver(null);
      setSearchTerm("");
      setShowDriverModal(false);

      setTimeout(() => {
        navigate(-1);
      }, 800);
    } catch (error: any) {
      console.error("Error adding vehicle:", error);
      addToast({
        type: "error",
        title: "خطأ",
        message:
          error?.message ??
          "حدث خطأ أثناء إضافة المركبة. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileName = form.carImage ? form.carImage.name : "ارفع صورة المركبة هنا";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full items-start gap-5"
    >
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
        dir="rtl"
      >
        <div className="flex items-center justify-between w-full">
          <h1 className="text-[length:var(--subtitle-subtitle-2-font-size)] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec">
            إضافة مركبة جديدة
          </h1>

          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="رجوع"
            className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
          >
            <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          <Input
            label="رقم الهيكل"
            value={form.chassisNumber}
            onChange={(value) => setForm((p) => ({ ...p, chassisNumber: value }))}
            placeholder="رقم الهيكل هنا"
          />

          <Input
            label="رقم اللوحة"
            value={form.plateNumber}
            onChange={(value) => setForm((p) => ({ ...p, plateNumber: value }))}
            placeholder="رقم اللوحة هنا"
          />

          <Input
            label="اسم المركبة"
            value={form.carName}
            onChange={(value) => setForm((p) => ({ ...p, carName: value }))}
            placeholder="اكتب اسم المركبة هنا"
          />

          <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
            <label className="self-stretch mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] tracking-[var(--body-body-2-letter-spacing)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
              صورة المركبة
            </label>
            <button
              type="button"
              onClick={handleImageUpload}
              className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
              aria-label="رفع صورة المركبة"
            >
              <Upload className="w-4 h-4 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                <div className="w-full pr-2 text-right font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                  {fileName}
                </div>
              </div>
            </button>
          </div>

          <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
            <label className="self-stretch mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] tracking-[var(--body-body-2-letter-spacing)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
              سائق المركبة
            </label>
            <button
              type="button"
              onClick={() => setShowDriverModal(true)}
              className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
              aria-label="اختر سائق المركبة"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                <div className="w-full pr-2 text-right font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                  {selectedDriver ? selectedDriver.name : "اختر سائق المركبة"}
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="w-full flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:bg-[#5A66C1]/60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            إضافة المركبة
          </button>
        </div>
      </div>

      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-[var(--corner-radius-large)] w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
            <div
              className="flex items-center justify-between p-4 border-b border-gray-200"
              dir="rtl"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                اضافة سائق للمركبة
              </h2>
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="ابحث هنا عن السائقين"
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="rtl"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-2">
                {driversLoading ? (
                  <div className="py-10 text-center text-gray-500">
                    جاري تحميل السائقين...
                  </div>
                ) : driversError ? (
                  <div className="py-10 text-center text-red-600">
                    {driversError}
                  </div>
                ) : filteredDrivers.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">
                    لا توجد نتائج مطابقة للبحث.
                  </div>
                ) : (
                  filteredDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedDriver?.id === driver.id
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                      onClick={() => handleDriverClick(driver)}
                      dir="rtl"
                    >
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
                        {driver.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {driver.name}
                        </p>
                        <p className="text-xs text-gray-500">{driver.email}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          driver.isActive
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {driver.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              className="flex items-center justify-between p-4 border-t border-gray-200 gap-3"
              dir="rtl"
            >
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                رجوع
              </button>
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="px-4 py-2 rounded-lg bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors"
              >
                حفظ الاختيار
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default AddPetrolifeCar;

