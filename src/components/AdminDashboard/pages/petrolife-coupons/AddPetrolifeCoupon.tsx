import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { Calendar, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "../../../../context/ToastContext";
import { createCouponWithSchema } from "../../../../services/firestore";

const AddPetrolifeCoupon = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [form, setForm] = useState({
    discountCode: "",
    discountPercentage: "0",
    capacity: "0",
    expirationDate: "",
    categories: "",
    beneficiary: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  useEffect(() => {
    if (!isCalendarOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  useEffect(() => {
    if (form.expirationDate) {
      const [year, month] = form.expirationDate.split("-").map((part) => Number(part));
      if (!Number.isNaN(year) && !Number.isNaN(month)) {
        setCalendarMonth(new Date(year, month - 1, 1));
      }
    }
  }, [form.expirationDate]);

  const getDisplayDate = () => {
    if (!form.expirationDate) return "عين تاريخ الانتهاء";
    const [year, month, day] = form.expirationDate.split("-").map((p) => Number(p));
    if ([year, month, day].some((part) => Number.isNaN(part))) return "عين تاريخ الانتهاء";

    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "long", day: "numeric" }).format(date);
  };

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sunday) - 6 (Saturday)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<number | null> = [];
    for (let i = 0; i < startDayOfWeek; i += 1) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(day);
    }
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    const weeks: Array<Array<number | null>> = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const weekdays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

    const handleDaySelect = (day: number) => {
      const isoDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      setForm((prev) => ({
        ...prev,
        expirationDate: isoDate,
      }));
      setIsCalendarOpen(false);
    };

    const selectedDay = (() => {
      if (!form.expirationDate) return null;
      const [selectedYear, selectedMonth, selectedDayValue] = form.expirationDate.split("-").map((p) => Number(p));
      if (selectedYear === year && selectedMonth - 1 === month) {
        return selectedDayValue;
      }
      return null;
    })();

    return (
      <div
        ref={calendarRef}
        className="absolute top-full mt-2 w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white shadow-lg z-20 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="font-medium text-gray-800">
            {new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "long" }).format(calendarMonth)}
          </div>
          <button
            type="button"
            onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="الشهر التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-600">
          {weekdays.map((day) => (
            <div key={day} className="font-medium py-1">
              {day}
            </div>
          ))}
          {weeks.map((week, index) =>
            week.map((day, dayIndex) => {
              if (day === null) {
                return (
                  <div key={`empty-${index}-${dayIndex}`} className="py-2" />
                );
              }

              const isSelected = day === selectedDay;
              const isToday = (() => {
                const today = new Date();
                return (
                  today.getFullYear() === year &&
                  today.getMonth() === month &&
                  today.getDate() === day
                );
              })();

              return (
                <button
                  key={`day-${index}-${day}`}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  className={`py-2 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-[#5A66C1] text-white"
                      : isToday
                      ? "bg-gray-100 text-gray-900"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {day}
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const toggleCalendar = () => {
    if (!isCalendarOpen) {
      if (form.expirationDate) {
        const [year, month] = form.expirationDate.split("-").map((p) => Number(p));
        if (!Number.isNaN(year) && !Number.isNaN(month)) {
          setCalendarMonth(new Date(year, month - 1, 1));
        } else {
          setCalendarMonth(new Date());
        }
      } else {
        setCalendarMonth(new Date());
      }
    }
    setIsCalendarOpen((prev) => !prev);
  };

  const resetForm = () => {
    setForm({
      discountCode: "",
      discountPercentage: "0",
      capacity: "0",
      expirationDate: "",
      categories: "",
      beneficiary: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.discountCode.trim()) {
      addToast({
        type: "error",
        title: "كود الخصم مطلوب",
        message: "يرجى إدخال كود الخصم قبل متابعة الإضافة.",
      });
      return;
    }

    if (!form.discountPercentage.trim()) {
      addToast({
        type: "error",
        title: "نسبة الخصم مطلوبة",
        message: "يرجى إدخال نسبة الخصم قبل متابعة الإضافة.",
      });
      return;
    }

    const beneficiaryValue = form.beneficiary.trim();
    if (!beneficiaryValue) {
      addToast({
        type: "error",
        title: "تحديد الجهة المستفيدة",
        message: "يرجى اختيار الجهة المستفيدة من الكوبون.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const percentageValue = form.discountPercentage.trim();
      const parsedPercentage =
        percentageValue.length > 0 && !Number.isNaN(Number(percentageValue))
          ? Number(percentageValue)
          : null;

      const capacityValue = form.capacity.trim();
      const parsedCapacity =
        capacityValue.length > 0 && !Number.isNaN(Number(capacityValue))
          ? Number(capacityValue)
          : null;

      const expireDateValue = form.expirationDate.trim().length
        ? form.expirationDate.trim()
        : null;

      const mappedCategories =
        form.categories && form.categories.trim().length
          ? form.categories.trim()
          : null;

      let isCompany: boolean | null = null;
      if (beneficiaryValue === "شركات") {
        isCompany = true;
      } else if (beneficiaryValue === "افراد") {
        isCompany = false;
      } else {
        isCompany = null;
      }

      const payload: Record<string, any> = {
        code: form.discountCode.trim() || null,
        percentage: parsedPercentage,
        precentage: parsedPercentage,
        minmumValueToApplyCoupon: parsedCapacity,
        expireDate: expireDateValue,
        categories: mappedCategories,
        beneficiary: beneficiaryValue || null,
        isCompany,
        capacity: parsedCapacity,
        numberOfUsers: null,
        usage: null,
      };

      await createCouponWithSchema(payload);

      addToast({
        type: "success",
        title: "تمت الإضافة",
        message: "تم إضافة الكوبون الجديد بنجاح.",
      });

      resetForm();
      setTimeout(() => navigate(-1), 600);
    } catch (error: any) {
      console.error("Error adding coupon:", error);
      addToast({
        type: "error",
        title: "خطأ",
        message:
          error?.message || "حدث خطأ أثناء إضافة الكوبون. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <button
                type="button"
                onClick={toggleCalendar}
                className="w-full pr-10 py-2.5 pl-4 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] text-right focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"
              >
                <span className="text-[length:var(--body-body-2-font-size)] text-color-mode-text-icons-t-sec">
                  {getDisplayDate()}
                </span>
              </button>
              <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">&lt;</span>
              {isCalendarOpen && renderCalendar()}
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
            disabled={isSubmitting}
            className="px-5 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:bg-[#5A66C1]/60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            إضافة الكوبون
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddPetrolifeCoupon;

