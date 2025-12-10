import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoveLeft, Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "../../../../context/ToastContext";
import { parseCarDataFromExcel } from "../../../../utils/excelParser";
import {
  uploadCarBrandsFromExcel,
  uploadCarTypesFromExcel,
} from "../../../../services/firestore";

const UploadCarData = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<{
    brandsCreated: number;
    brandsSkipped: number;
    modelsCreated: number;
    modelsSkipped: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validExtensions = [
        ".xlsx",
        ".xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      const fileExtension = selectedFile.name
        .substring(selectedFile.name.lastIndexOf("."))
        .toLowerCase();
      const isValidType =
        validExtensions.includes(fileExtension) ||
        validExtensions.includes(selectedFile.type);

      if (!isValidType) {
        addToast({
          type: "error",
          title: "خطأ",
          message: "يرجى اختيار ملف Excel صحيح (.xlsx أو .xls)",
        });
        return;
      }

      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      addToast({
        type: "error",
        title: "خطأ",
        message: "يرجى اختيار ملف Excel أولاً",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress("جاري قراءة ملف Excel...");
    setUploadResult(null);

    try {
      // Parse Excel file
      setUploadProgress("جاري تحليل بيانات Excel...");
      const parsedData = await parseCarDataFromExcel(file);

      if (parsedData.brands.length === 0) {
        throw new Error("لم يتم العثور على أي ماركات في الملف");
      }

      // Upload brands
      setUploadProgress(
        `جاري رفع ${parsedData.brands.length} ماركة إلى Firestore...`
      );
      const brandsResult = await uploadCarBrandsFromExcel(parsedData.brands);

      // Upload models
      const totalModels = Array.from(parsedData.brandModels.values()).reduce(
        (sum, models) => sum + models.length,
        0
      );
      setUploadProgress(
        `جاري رفع ${totalModels} طراز إلى Firestore...`
      );
      const modelsResult = await uploadCarTypesFromExcel(
        parsedData.brandModels,
        brandsResult.brandMap
      );

      // Set result
      setUploadResult({
        brandsCreated: brandsResult.created,
        brandsSkipped: brandsResult.skipped,
        modelsCreated: modelsResult.created,
        modelsSkipped: modelsResult.skipped,
      });

      addToast({
        type: "success",
        title: "تم الرفع بنجاح",
        message: `تم رفع ${brandsResult.created} ماركة و ${modelsResult.created} طراز بنجاح`,
      });

      setUploadProgress("");
    } catch (error: any) {
      console.error("Error uploading car data:", error);
      addToast({
        type: "error",
        title: "خطأ في الرفع",
        message: error.message || "حدث خطأ أثناء رفع البيانات. يرجى المحاولة مرة أخرى.",
      });
      setUploadProgress("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadResult(null);
    setUploadProgress("");
    // Reset file input
    const fileInput = document.getElementById(
      "excel-file-input"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className="flex flex-col items-start gap-6 relative self-stretch w-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between relative self-stretch w-full">
        <div className="inline-flex items-center gap-2.5 relative flex-[0_0_auto]">
          <button
            onClick={() => navigate("/admin-cars")}
            className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto]"
            aria-label="العودة"
            type="button"
          >
            <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
              <MoveLeft className="w-5 h-5 text-gray-500" />
            </div>
          </button>
        </div>

        <h1 className="relative w-fit mt-[-1.00px] font-subtitle-subtitle-1 font-[number:var(--subtitle-subtitle-1-font-weight)] text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-1-font-size)] tracking-[var(--subtitle-subtitle-1-letter-spacing)] leading-[var(--subtitle-subtitle-1-line-height)] whitespace-nowrap [direction:rtl] [font-style:var(--subtitle-subtitle-1-font-style)]">
          رفع بيانات السيارات من Excel
        </h1>
      </div>

      {/* Instructions */}
      <div className="flex flex-col items-start gap-4 relative self-stretch w-full p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="font-subtitle-subtitle-2 text-blue-900 [direction:rtl]">
          تعليمات تنسيق ملف Excel:
        </h2>
        <ul className="list-disc list-inside space-y-2 text-body-body-2 text-blue-800 [direction:rtl]">
          <li>الصف الأول يجب أن يحتوي على أسماء الماركات (كل عمود = ماركة)</li>
          <li>الصفوف التالية تحت كل عمود تحتوي على طرازات تلك الماركة</li>
          <li>يمكن ترك الخلايا الفارغة - سيتم تجاهلها</li>
          <li>يجب أن يكون الملف بصيغة .xlsx أو .xls</li>
        </ul>
      </div>

      {/* File Upload Section */}
      <div className="flex flex-col items-start gap-4 relative self-stretch w-full p-6 bg-white rounded-lg border border-gray-200">
        <label
          htmlFor="excel-file-input"
          className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors w-full"
        >
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="w-12 h-12 text-green-500" />
              <p className="font-body-body-1 text-gray-700 [direction:rtl]">
                {file.name}
              </p>
              <p className="text-sm text-gray-500 [direction:rtl]">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-12 h-12 text-gray-400" />
              <p className="font-body-body-1 text-gray-700 [direction:rtl]">
                اضغط لاختيار ملف Excel
              </p>
              <p className="text-sm text-gray-500 [direction:rtl]">
                .xlsx أو .xls
              </p>
            </div>
          )}
        </label>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 w-full [direction:rtl]">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-body-body-1 transition-opacity ${
              !file || isUploading
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-color-mode-surface-primary-blue text-white hover:opacity-90"
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري الرفع...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>رفع البيانات</span>
              </>
            )}
          </button>

          {file && !isUploading && (
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-body-body-1 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              <span>إعادة تعيين</span>
            </button>
          )}
        </div>

        {/* Progress */}
        {uploadProgress && (
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg w-full [direction:rtl]">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <p className="font-body-body-2 text-blue-700">{uploadProgress}</p>
          </div>
        )}

        {/* Results */}
        {uploadResult && (
          <div className="flex flex-col gap-4 p-6 bg-green-50 rounded-lg border border-green-200 w-full">
            <div className="flex items-center gap-2 [direction:rtl]">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h3 className="font-subtitle-subtitle-2 text-green-900">
                تم الرفع بنجاح
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 [direction:rtl]">
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">الماركات المضافة:</p>
                <p className="text-2xl font-bold text-green-600">
                  {uploadResult.brandsCreated}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">الماركات المكررة (تم تخطيها):</p>
                <p className="text-2xl font-bold text-orange-600">
                  {uploadResult.brandsSkipped}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">الطرازات المضافة:</p>
                <p className="text-2xl font-bold text-green-600">
                  {uploadResult.modelsCreated}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">الطرازات المكررة (تم تخطيها):</p>
                <p className="text-2xl font-bold text-orange-600">
                  {uploadResult.modelsSkipped}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadCarData;

