import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { Upload, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "../../../../context/ToastContext";
import { createProductWithSchema } from "../../../../services/firestore";

const AddPetrolifeProduct = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    productName: "",
    category: "فلاتر",
    availableQuantity: "",
    price: "",
    description: "",
    productImage: null as File | null,
  });

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setForm((prev) => ({ ...prev, productImage: file }));
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.productName.trim() || !form.category.trim()) {
      addToast({
        type: "error",
        title: "بيانات ناقصة",
        message: "يرجى إدخال اسم المنتج والتصنيف على الأقل.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedQuantity = form.availableQuantity.trim();
      const parsedPrice = form.price.trim();

      const payload: Record<string, any> = {
        title: {
          ar: form.productName || null,
          en: null,
        },
        desc: {
          ar: form.description || null,
          en: null,
        },
        category: form.category || null,
        quantity:
          parsedQuantity.length > 0 && !Number.isNaN(Number(parsedQuantity))
            ? Number(parsedQuantity)
            : null,
        price:
          parsedPrice.length > 0 && !Number.isNaN(Number(parsedPrice))
            ? Number(parsedPrice)
            : null,
        productName: form.productName || null,
        productDescription: form.description || null,
      };

      await createProductWithSchema(payload, form.productImage);

      addToast({
        type: "success",
        title: "تم إضافة المنتج",
        message: "تم حفظ بيانات المنتج بنجاح.",
      });

      setForm({
        productName: "",
        category: "فلاتر",
        availableQuantity: "",
        price: "",
        description: "",
        productImage: null,
      });

      setTimeout(() => navigate(-1), 600);
    } catch (error: any) {
      console.error("Error adding product:", error);
      addToast({
        type: "error",
        title: "خطأ",
        message:
          error?.message || "حدث خطأ أثناء إضافة المنتج. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileName = form.productImage
    ? form.productImage.name
    : "ارفع صورة المنتج هنا";

  const categoryOptions = [
    { value: "فلاتر", label: "فلاتر" },
    { value: "زيوت", label: "زيوت" },
    { value: "إطارات", label: "إطارات" },
    { value: "اكسسوارات", label: "اكسسوارات" },
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
            إضافة منتج جديد
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
            label="اسم المنتج"
            value={form.productName}
            onChange={(value) => setForm((p) => ({ ...p, productName: value }))}
            placeholder="اكتب اسم المنتج هنا"
          />

          <Select
            label="تصنيف المنتج"
            value={form.category}
            onChange={(value) => setForm((p) => ({ ...p, category: value }))}
            options={categoryOptions}
          />

          <Input
            label="الكمية المتاحة"
            type="number"
            value={form.availableQuantity}
            onChange={(value) =>
              setForm((p) => ({ ...p, availableQuantity: value }))
            }
            placeholder="150"
          />

          <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
            <label className="self-stretch mt-[-1.00px] font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] tracking-[var(--body-body-2-letter-spacing)] relative font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
              السعر (ر.س)
            </label>
            <div className="relative w-full">
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                className="w-full pr-4 pl-12 py-2.5 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
                dir="rtl"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-lg">
                ﷼
              </span>
            </div>
          </div>

          <Input
            label="وصف المنتج"
            value={form.description}
            onChange={(value) => setForm((p) => ({ ...p, description: value }))}
            placeholder="اكتب وصف المنتج هنا"
          />

          <div className="flex items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
            <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative flex-1 grow">
              <label className="relative self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                صورة المنتج
              </label>
              <button
                type="button"
                onClick={handleImageUpload}
                className="flex h-[46px] items-center justify-end gap-[var(--corner-radius-small)] pt-[var(--corner-radius-small)] pr-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] pl-[var(--corner-radius-small)] relative self-stretch w-full rounded-[var(--corner-radius-small)] border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder bg-transparent cursor-pointer hover:bg-color-mode-surface-bg-icon-gray transition-colors"
                aria-label="رفع صورة المنتج"
              >
                <Upload className="w-4 h-4 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
                <div className="flex items-center justify-end pt-[3px] pb-0 px-0 relative flex-1 grow">
                  <div className="w-full pr-2 text-right font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-input-text-color)] tracking-[var(--body-body-2-letter-spacing)] whitespace-nowrap relative mt-[-1.00px] font-body-body-2 text-[length:var(--body-body-2-font-size)] leading-[var(--body-body-2-line-height)] [font-style:var(--body-body-2-font-style)]">
                    {fileName}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:bg-[#5A66C1]/60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            إضافة المنتج
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddPetrolifeProduct;

