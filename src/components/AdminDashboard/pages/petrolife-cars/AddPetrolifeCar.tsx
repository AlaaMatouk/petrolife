import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { Upload, ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";

const AddPetrolifeCar = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    chassisNumber: "",
    carName: "",
    plateNumber: "",
    carImage: null as File | null,
  });
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);

  // Mock drivers data - replace with actual API call
  const driversList = [
    { id: 1, name: "محمد أحمد علي", avatar: undefined },
    { id: 2, name: "أحمد محمد", avatar: undefined },
    { id: 3, name: "خالد علي", avatar: undefined },
    { id: 4, name: "علي حسن", avatar: undefined },
    { id: 5, name: "حسن محمود", avatar: undefined },
  ];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting new car:", form, selectedDrivers);
  };

  const fileName = form.carImage ? form.carImage.name : "ارفع صورة المركبة هنا";

  const toggleDriverSelection = (driverId: number) => {
    setSelectedDrivers((prev) =>
      prev.includes(driverId)
        ? prev.filter((id) => id !== driverId)
        : [...prev, driverId]
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full items-start gap-5"
    >
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
        dir="rtl"
      >
        {/* Top bar with title on right and back on left */}
        <div className="flex items-center justify-between w-full">
          {/* Title on the right */}
          <h1 className="text-[length:var(--subtitle-subtitle-2-font-size)] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec">
            إضافة مركبة جديدة
          </h1>

          {/* Back button on the left */}
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

        {/* Form fields - two columns */}
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
                  {selectedDrivers.length > 0
                    ? `تم اختيار ${selectedDrivers.length} سائق`
                    : "اختر سائق المركبة"}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Submit - aligned right */}
        <div className="w-full flex justify-end">
          <button
            type="submit"
            className="px-5 h-10 rounded-[10px] bg-[#4c5bd4] text-white hover:opacity-95"
          >
            إضافة المركبة
          </button>
        </div>
      </div>

      {/* Driver Selection Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-[var(--corner-radius-large)] w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200" dir="rtl">
              <h2 className="text-lg font-semibold text-gray-900">اضافة سائق للمركبة</h2>
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="ابحث هنا عن السائقين"
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Drivers List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-2">
                {driversList.map((driver) => (
                  <div
                    key={driver.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDrivers.includes(driver.id)
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                    onClick={() => toggleDriverSelection(driver.id)}
                    dir="rtl"
                  >
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
                      {driver.avatar ? (
                        <img
                          src={driver.avatar}
                          alt={driver.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        driver.name.charAt(0)
                      )}
                    </div>
                    <span className="flex-1 text-gray-900 font-medium">{driver.name}</span>
                    <input
                      type="checkbox"
                      checked={selectedDrivers.includes(driver.id)}
                      onChange={() => toggleDriverSelection(driver.id)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 gap-3" dir="rtl">
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                رجوع
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDriverModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#4c5bd4] text-white hover:opacity-95"
              >
                إضافة للمركبة
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default AddPetrolifeCar;

