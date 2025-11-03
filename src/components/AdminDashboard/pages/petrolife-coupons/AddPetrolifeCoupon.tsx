import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { Calendar, ArrowLeft } from "lucide-react";

const AddPetrolifeCoupon = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    discountCode: "",
    discountPercentage: "0",
    capacity: "0",
    expirationDate: "",
    categories: "",
    beneficiary: "",
  });

  const handleDateChange = () => {
    const input = document.createElement("input");
    input.type = "date";
    input.onchange = (e) => {
      const date = (e.target as HTMLInputElement).value;
      setForm((prev) => ({ ...prev, expirationDate: date }));
    };
    input.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting new coupon:", form);
  };

  const categoryOptions = [
    { value: "فلاتر", label: "فلاتر" },
    { value: "زيوت", label: "زيوت" },
    { value: "إطارات", label: "إطارات" },
    { value: "اكسسوارات", label: "اكسسوارات" },
  ];

  const beneficiaryOptions = [
    { value: "شركات", label: "شركات" },
    { value: "افراد", label: "افراد" },
    { value: "شركات وافراد", label: "شركات وأفراد" },
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
          <div className="flex items-center gap-2">
            <span className="text-2xl">➕</span>
            <h1 className="text-[length:var(--subtitle-subtitle-2-font-size)] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec">
              إضافة كوبون جديد
            </h1>
          </div>

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
          <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
            <label className="self-stretch mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] tracking-[var(--body-body-2-letter-spacing)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
              نسبة الخصم (%)
            </label>
            <input
              type="number"
              value={form.discountPercentage}
              onChange={(e) => setForm((p) => ({ ...p, discountPercentage: e.target.value }))}
              className="w-full py-2.5 pr-4 pl-4 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              dir="rtl"
            />
          </div>

          <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
            <label className="self-stretch mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] tracking-[var(--body-body-2-letter-spacing)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
              سعة
            </label>
            <div className="relative w-full">
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                className="w-full pr-12 py-2.5 pl-4 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                dir="rtl"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">
                ريال
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
            <label className="self-stretch mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] tracking-[var(--body-body-2-letter-spacing)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
              تاريخ الانتهاء
            </label>
            <div className="relative w-full">
              <input
                type="text"
                value={form.expirationDate}
                readOnly
                onClick={handleDateChange}
                className="w-full pr-10 py-2.5 pl-4 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                placeholder="عين تاريخ الانتهاء"
                dir="rtl"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">&lt;</span>
            </div>
          </div>

          <Input
            label="كود الخصم"
            value={form.discountCode}
            onChange={(value) => setForm((p) => ({ ...p, discountCode: value }))}
            placeholder="اكتب كود الخصم هنا"
          />

          <Select
            label="التصنيفات المتاحة"
            value={form.categories}
            onChange={(value) => setForm((p) => ({ ...p, categories: value }))}
            options={categoryOptions}
            placeholder="اختر التصنيفات"
          />

          <Select
            label="الجهة المستفيدة"
            value={form.beneficiary}
            onChange={(value) => setForm((p) => ({ ...p, beneficiary: value }))}
            options={beneficiaryOptions}
            placeholder="اختر الجهة"
          />
        </div>

        {/* Submit button */}
        <div className="w-full flex justify-end">
          <button
            type="submit"
            className="px-5 h-10 rounded-[10px] bg-[#4c5bd4] text-white hover:opacity-95"
          >
            إضافة الكوبون
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddPetrolifeCoupon;

