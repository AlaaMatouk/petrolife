import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { Upload, ArrowLeft } from "lucide-react";

const AddPeroDriver = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "الرياض",
    address: "",
    carNumber: "",
    imageFile: null as File | null,
  });

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setForm((prev) => ({ ...prev, imageFile: file }));
    };
    input.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting new driver:", form);
  };

  const fileName = form.imageFile ? form.imageFile.name : "hsgndkmmcjhpd.jpg";

  const cityOptions = [
    { value: "الرياض", label: "الرياض" },
    { value: "جدة", label: "جدة" },
    { value: "مكة", label: "مكة" },
    { value: "الدمام", label: "الدمام" },
  ];

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
            إضافة سائق جديد
          </h1>

          {/* Back button on the left using project icon style */}
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

        {/* Form fields - three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          <Input
            label="اسم السائق"
            value={form.name}
            onChange={(value) => setForm((p) => ({ ...p, name: value }))}
            placeholder="اكتب اسم السائق هنا"
          />

          <Input
            label="البريد الإلكتروني"
            type="email"
            value={form.email}
            onChange={(value) => setForm((p) => ({ ...p, email: value }))}
            placeholder="hesham@gmail.com"
          />

          <Input
            label="رقم الهاتف"
            type="tel"
            value={form.phone}
            onChange={(value) => setForm((p) => ({ ...p, phone: value }))}
            placeholder="رقم الهاتف هنا"
          />

          <Select
            label="المدينة"
            value={form.city}
            onChange={(value) => setForm((p) => ({ ...p, city: value }))}
            options={cityOptions}
          />

          {/* Profile Image - supervisor style */}
          <div className="flex items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
            <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
              <label className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                صورة السائق
              </label>
              <button
                type="button"
                onClick={handleFileUpload}
                className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                aria-label="رفع صورة السائق"
              >
                <Upload className="w-4 h-4 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
                <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                  <div className="w-full pr-2 text-right font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                    {fileName || "ارفع صورة السائق هنا"}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <Input
            label="العنوان"
            value={form.address}
            onChange={(value) => setForm((p) => ({ ...p, address: value }))}
            placeholder=", Riyadh 13245, Saudi Arabia ,شرطة ,7453 ص"
          />

          <Input
            label="رقم السيارة"
            value={form.carNumber}
            onChange={(value) => setForm((p) => ({ ...p, carNumber: value }))}
            placeholder="2145364"
          />
        </div>

        {/* Submit - aligned left */}
        <div className="w-full flex justify-end">
          <button
            type="submit"
            className="px-5 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors"
          >
            إضافة السائق
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddPeroDriver;
