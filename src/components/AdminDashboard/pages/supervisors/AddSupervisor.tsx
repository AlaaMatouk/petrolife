import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, UserRound } from "lucide-react";
import { useToast } from "../../../../context/ToastContext";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../../../../config/firebase";
import { fetchSupervisorById } from "../../../../services/firestore";

// Permission mapping for Arabic labels
const PERMISSION_LABELS: Record<string, string> = {
  individualsManagement: "إدارة الأفراد",
  serviceProvidersManagement: "إدارة مزودي الخدمة",
  serviceProvidersReportsManagement: "إدارة تقارير مزودي الخدمة",
  salesReportsManagement: "إدارة تقارير المبيعات",
  fuelDeliveryRequestsManagement: "إدارة طلبات توصيل الوقود",
  vehicleConstantsManagement: "إدارة ثوابت المركبات",
  applicationServicesManagement: "إدارة خدمات التطبيق",
  applicationDefaultAccountsManagement: "إدارة الحسابات الافتراضية",
  subscriptionsManagement: "إدارة الاشتراكات",
  advertisementsManagement: "إدارة الإعلانات",
  technicalSupportManagement: "إدارة الدعم الفني",
  stationsManagement: "إدارة المحطات",
  driversManagement: "إدارة السائقين",
  financialReportsManagement: "إدارة التقارير المالية",
  walletManagement: "إدارة المحفظة",
  companiesManagement: "إدارة الشركات",
  supervisorsManagement: "إدارة المشرفين",
  petrolifeDriversManagement: "إدارة سائقي بترولايف",
  petrolifeRepresentativesManagement: "إدارة مندوبي بترولايف",
  petrolifeVehiclesManagement: "إدارة مركبات بترولايف",
  petrolifeProductsManagement: "إدارة منتجات بترولايف",
  governorRequestsManagement: "إدارة طلبات المحافظ",
  invoicesReportsManagement: "إدارة تقارير الفواتير",
  countriesConstantsManagement: "إدارة ثوابت البلدان",
  categoriesConstantsManagement: "إدارة ثوابت التصنيفات",
  discountCouponsManagement: "إدارة كوبونات الخصم",
  customNotificationsManagement: "إدارة الاشعارات المخصصة",
};

export const AddSupervisor = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    city: "الرياض", // Default to الرياض
    address: "",
    employeeNumber: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    individualsManagement: false,
    serviceProvidersManagement: false,
    serviceProvidersReportsManagement: false,
    salesReportsManagement: false,
    fuelDeliveryRequestsManagement: false,
    vehicleConstantsManagement: false,
    applicationServicesManagement: false,
    applicationDefaultAccountsManagement: false,
    subscriptionsManagement: false,
    advertisementsManagement: false,
    technicalSupportManagement: false,
    stationsManagement: false,
    driversManagement: false,
    financialReportsManagement: false,
    walletManagement: false,
    companiesManagement: false,
    supervisorsManagement: false,
    petrolifeDriversManagement: false,
    petrolifeRepresentativesManagement: false,
    petrolifeVehiclesManagement: false,
    petrolifeProductsManagement: false,
    governorRequestsManagement: false,
    invoicesReportsManagement: false,
    countriesConstantsManagement: false,
    categoriesConstantsManagement: false,
    discountCouponsManagement: false,
    customNotificationsManagement: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permissionKey: string) => {
    setPermissions((prev) => ({
      ...prev,
      [permissionKey]: !prev[permissionKey],
    }));
  };

  // Reverse permission mapping: Arabic label to key
  const getPermissionKeyFromLabel = (label: string): string | null => {
    for (const [key, value] of Object.entries(PERMISSION_LABELS)) {
      if (value === label) {
        return key;
      }
    }
    return null;
  };

  // Load supervisor data when in edit mode
  useEffect(() => {
    const loadSupervisorData = async () => {
      if (!isEditMode || !editId) return;

      try {
        setIsLoading(true);
        const supervisorData = await fetchSupervisorById(editId);

        // Populate form data
        setFormData({
          name: supervisorData.name || supervisorData.supervisorName || "",
          email: supervisorData.email || "",
          phoneNumber: supervisorData.phone || supervisorData.phoneNumber || "",
          city: supervisorData.city || "",
          address: supervisorData.address || "",
          employeeNumber:
            supervisorData.supervisorCode ||
            supervisorData.employeeNumber ||
            supervisorData.code ||
            "",
        });

        // Set existing image URL
        if (supervisorData.image) {
          setExistingImageUrl(supervisorData.image);
        }

        // Populate permissions
        if (supervisorData.permissions && Array.isArray(supervisorData.permissions)) {
          const newPermissions: Record<string, boolean> = {
            individualsManagement: false,
            serviceProvidersManagement: false,
            serviceProvidersReportsManagement: false,
            salesReportsManagement: false,
            fuelDeliveryRequestsManagement: false,
            vehicleConstantsManagement: false,
            applicationServicesManagement: false,
            applicationDefaultAccountsManagement: false,
            subscriptionsManagement: false,
            advertisementsManagement: false,
            technicalSupportManagement: false,
            stationsManagement: false,
            driversManagement: false,
            financialReportsManagement: false,
            walletManagement: false,
            companiesManagement: false,
            supervisorsManagement: false,
            petrolifeDriversManagement: false,
            petrolifeRepresentativesManagement: false,
            petrolifeVehiclesManagement: false,
            petrolifeProductsManagement: false,
            governorRequestsManagement: false,
            invoicesReportsManagement: false,
            countriesConstantsManagement: false,
            categoriesConstantsManagement: false,
            discountCouponsManagement: false,
            customNotificationsManagement: false,
          };

          supervisorData.permissions.forEach((permissionLabel: string) => {
            const key = getPermissionKeyFromLabel(permissionLabel);
            if (key) {
              newPermissions[key] = true;
            }
          });

          setPermissions(newPermissions);
        }
      } catch (error) {
        console.error("Error loading supervisor data:", error);
        addToast({
          title: "خطأ",
          message: "فشل في تحميل بيانات المشرف",
          type: "error",
        });
        navigate("/supervisors");
      } finally {
        setIsLoading(false);
      }
    };

    loadSupervisorData();
  }, [isEditMode, editId, navigate, addToast]);

  // Validate form data
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push("اسم المشرف مطلوب");
    }

    if (!formData.email.trim()) {
      errors.push("البريد الإلكتروني مطلوب");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("البريد الإلكتروني غير صحيح");
    }

    if (!formData.phoneNumber.trim()) {
      errors.push("رقم الهاتف مطلوب");
    }

    if (!formData.city || !formData.city.trim()) {
      errors.push("المدينة مطلوبة");
    }

    // Image is only required when adding new supervisor
    if (!isEditMode && !imageFile) {
      errors.push("صورة المشرف مطلوبة");
    }

    return errors;
  };

  // Check if email already exists (excluding current supervisor in edit mode)
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return false;
      }
      
      // In edit mode, check if the email belongs to another user
      if (isEditMode && editId) {
        const emailBelongsToCurrentUser = querySnapshot.docs.some(
          (doc) => doc.id === editId
        );
        return !emailBelongsToCurrentUser;
      }
      
      return true;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `supervisors/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      addToast({
        title: "خطأ في التحقق",
        message: validationErrors.join(", "),
        type: "error",
      });
      return;
    }

    // Check if email already exists
    const emailExists = await checkEmailExists(formData.email);
    if (emailExists) {
      addToast({
        title: "خطأ في البيانات",
        message: "البريد الإلكتروني مستخدم بالفعل",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("لا يوجد مستخدم مسجل الدخول حالياً");
      }

      // Upload image to Firebase Storage (only if new image is provided)
      let imageUrl = existingImageUrl;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Get selected permissions as array of Arabic strings
      const selectedPermissions = Object.entries(permissions)
        .filter(([_, isSelected]) => isSelected)
        .map(([key, _]) => PERMISSION_LABELS[key]);

      if (isEditMode && editId) {
        // Update existing supervisor
        const supervisorData = {
          // Basic info
          name: formData.name.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          city: formData.city.trim() || "الرياض",
          address: formData.address.trim(),
          employeeNumber: formData.employeeNumber.trim(),
          image: imageUrl,
          permissions: selectedPermissions,
        };

        // Update document in Firestore
        const userDocRef = doc(db, "users", editId);
        await updateDoc(userDocRef, supervisorData);

        // Success message
        addToast({
          title: "تم بنجاح",
          message: "تم تحديث بيانات المشرف بنجاح",
          type: "success",
        });
      } else {
        // Generate unique 8-digit refid for new supervisor
        let refid: string = "";
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
          // Generate 8-digit number (10000000 to 99999999)
          const randomCode = Math.floor(10000000 + Math.random() * 90000000);
          refid = randomCode.toString();

          // Check if refid already exists
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("refid", "==", refid));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            isUnique = true;
          } else {
            attempts++;
          }
        }

        if (!isUnique || !refid) {
          throw new Error("فشل في إنشاء كود المشرف. يرجى المحاولة مرة أخرى.");
        }

        // Create new supervisor document
        const supervisorData = {
          // Basic info
          name: formData.name.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          city: formData.city.trim() || "الرياض",
          address: formData.address.trim(),
          employeeNumber: formData.employeeNumber.trim(),
          image: imageUrl,
          permissions: selectedPermissions,

          // Supervisor code (8-digit refid)
          refid: refid,

          // Default values
          isSupervisor: false,
          isAdmin: true,
          isSuperAdmin: false,
          isActive: true,

          // Timestamps and user info
          createdDate: serverTimestamp(),
          createdUserId: currentUser.email || currentUser.uid,

          // Account status for display
          accountStatus: {
            active: true,
            text: "مفعل",
          },
        };

        // Add document to Firestore
        await addDoc(collection(db, "users"), supervisorData);

        // Success message
        addToast({
          title: "تم بنجاح",
          message: "تم إضافة المشرف بنجاح",
          type: "success",
        });
      }

      // Clear form only if not in edit mode
      if (!isEditMode) {
        setFormData({
          name: "",
          email: "",
          phoneNumber: "",
          city: "",
          address: "",
          employeeNumber: "",
        });
        setImageFile(null);
        setExistingImageUrl("");
        setPermissions({
          individualsManagement: false,
          serviceProvidersManagement: false,
          serviceProvidersReportsManagement: false,
          salesReportsManagement: false,
          fuelDeliveryRequestsManagement: false,
          vehicleConstantsManagement: false,
          applicationServicesManagement: false,
          applicationDefaultAccountsManagement: false,
          subscriptionsManagement: false,
          advertisementsManagement: false,
          technicalSupportManagement: false,
          stationsManagement: false,
          driversManagement: false,
          financialReportsManagement: false,
          walletManagement: false,
          companiesManagement: false,
          supervisorsManagement: false,
          petrolifeDriversManagement: false,
          petrolifeRepresentativesManagement: false,
          petrolifeVehiclesManagement: false,
          petrolifeProductsManagement: false,
          governorRequestsManagement: false,
          invoicesReportsManagement: false,
          countriesConstantsManagement: false,
          categoriesConstantsManagement: false,
          discountCouponsManagement: false,
          customNotificationsManagement: false,
        });
      }

      // Navigate back to supervisors list or details page
      if (isEditMode && editId) {
        navigate(`/supervisors/${editId}`);
      } else {
        navigate("/supervisors");
      }
    } catch (error) {
      console.error("Error saving supervisor:", error);
      addToast({
        title: "خطأ",
        message: isEditMode
          ? "فشل في تحديث بيانات المشرف. يرجى المحاولة مرة أخرى."
          : "فشل في إضافة المشرف. يرجى المحاولة مرة أخرى.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/supervisors");
  };

  return (
    <div
      className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder"
      data-model-id="add-supervisor"
    >
      {/* Header Section with Back Arrow */}
      <header className="flex flex-col items-end gap-[var(--corner-radius-extra-large)] relative self-stretch w-full flex-[0_0_auto]">
        <nav className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
          <button
            onClick={handleCancel}
            className="inline-flex h-10 items-center gap-[var(--corner-radius-medium)] relative flex-[0_0_auto] hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="العودة"
            type="button"
          >
            <div className="flex flex-col w-10 items-center justify-center gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 relative self-stretch bg-color-mode-surface-bg-icon-gray rounded-[var(--corner-radius-small)]">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </div>
          </button>

          <div className="flex items-center justify-end gap-1.5 relative">
            <h1 className="mt-[-1.00px] font-bold text-[var(--form-section-title-color)] text-[length:var(--subtitle-subtitle-2-font-size)] tracking-[var(--subtitle-subtitle-2-letter-spacing)] leading-[var(--subtitle-subtitle-2-line-height)] relative [direction:rtl] [font-style:var(--subtitle-subtitle-2-font-style)]">
              {isEditMode ? "تعديل بيانات المشرف" : "إضافة مشرف جديد"}
            </h1>
            <UserRound className="w-5 h-5 text-gray-500" />
          </div>
        </nav>
      </header>

      {/* Form Content */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل بيانات المشرف...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Supervisor Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                اسم المشرف
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="اسم المشرف هنا"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                البريد الالكتروني
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="test@gmail.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                رقم الهاتف
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="رقم الهاتف هنا"
              />
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                المدينة
              </label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 text-[#5B738B]  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              >
                <option value="الرياض">الرياض</option>
                <option value="جدة">جدة</option>
                <option value="مكة المكرمة">مكة المكرمة</option>
                <option value="المدينة المنورة">المدينة المنورة</option>
                <option value="الدمام">الدمام</option>
                <option value="الخبر">الخبر</option>
                <option value="الطائف">الطائف</option>
                <option value="أبها">أبها</option>
                <option value="تبوك">تبوك</option>
                <option value="بريدة">بريدة</option>
                <option value="حائل">حائل</option>
              </select>
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                العنوان
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="العنوان بالتفصيل هنا"
              />
            </div>

            {/* Image */}
            <div>
              <label
                htmlFor="supervisorImage"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                صوره المشرف
                {isEditMode && existingImageUrl && (
                  <span className="text-xs text-gray-500 mr-2">
                    (اختياري - سيتم الاحتفاظ بالصورة الحالية إذا لم تقم برفع صورة جديدة)
                  </span>
                )}
              </label>
              {existingImageUrl && !imageFile && (
                <div className="mb-2">
                  <img
                    src={existingImageUrl}
                    alt="صورة المشرف الحالية"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
              <input
                type="file"
                id="supervisorImage"
                name="supervisorImage"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                required={!isEditMode}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              />
            </div>

            {/* Employee Number */}
            <div>
              <label
                htmlFor="employeeNumber"
                className="block text-sm font-normal text-[#5B738B] mb-1"
              >
                الرقم الوظيفي
              </label>
              <input
                type="text"
                id="employeeNumber"
                name="employeeNumber"
                value={formData.employeeNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="الرقم الوظيفي هنا"
              />
            </div>

            {/* Supervisor Access */}
            <div className="md:col-span-3">
              <label className="block text-sm font-normal text-[#5B738B] mb-[12px]">
                صلاحيات المشرف
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* إدارة الأفراد */}
                <div
                  className="relative flex items-center gap-2  p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.individualsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("individualsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.individualsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.individualsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    {PERMISSION_LABELS.individualsManagement}
                  </span>
                </div>

                {/* إدارة مزودي الخدمة */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.serviceProvidersManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("serviceProvidersManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.serviceProvidersManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.serviceProvidersManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    {PERMISSION_LABELS.serviceProvidersManagement}
                  </span>
                </div>

                {/* إدارة تقارير المبيعات */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.salesReportsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("salesReportsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.salesReportsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.salesReportsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة تقارير المبيعات
                  </span>
                </div>

                {/* إدارة طلبات توصيل الوقود */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.fuelDeliveryRequestsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("fuelDeliveryRequestsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.fuelDeliveryRequestsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.fuelDeliveryRequestsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة طلبات توصيل الوقود
                  </span>
                </div>

                {/* إدارة ثوابت المركبات */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.vehicleConstantsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("vehicleConstantsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.vehicleConstantsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.vehicleConstantsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة ثوابت المركبات
                  </span>
                </div>

                {/* إدارة خدمات التطبيق */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.applicationServicesManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("applicationServicesManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.applicationServicesManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.applicationServicesManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة خدمات التطبيق
                  </span>
                </div>

                {/* إدارة الاشتراكات */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.subscriptionsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("subscriptionsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.subscriptionsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.subscriptionsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    {PERMISSION_LABELS.subscriptionsManagement}
                  </span>
                </div>

                {/* إدارة الدعم الفني */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.technicalSupportManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("technicalSupportManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.technicalSupportManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.technicalSupportManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة الدعم الفني
                  </span>
                </div>

                {/* إدارة المحطات */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.stationsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() => handlePermissionChange("stationsManagement")}
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.stationsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.stationsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة المحطات
                  </span>
                </div>

                {/* إدارة السائقين */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.driversManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() => handlePermissionChange("driversManagement")}
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.driversManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.driversManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة السائقين
                  </span>
                </div>

                {/* إدارة التقارير المالية */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.financialReportsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("financialReportsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.financialReportsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.financialReportsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة التقارير المالية
                  </span>
                </div>

                {/* إدارة المحفظة */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.walletManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() => handlePermissionChange("walletManagement")}
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.walletManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.walletManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة المحفظة
                  </span>
                </div>

                {/* إدارة الشركات */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.companiesManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() => handlePermissionChange("companiesManagement")}
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.companiesManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.companiesManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة الشركات
                  </span>
                </div>

                {/* إدارة المشرفين */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.supervisorsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("supervisorsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.supervisorsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.supervisorsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة المشرفين
                  </span>
                </div>

                {/* إدارة سائقي بترولايف */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.petrolifeDriversManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("petrolifeDriversManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.petrolifeDriversManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.petrolifeDriversManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة سائقي بترولايف
                  </span>
                </div>

                {/* إدارة مندوبي بترولايف */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.petrolifeRepresentativesManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("petrolifeRepresentativesManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.petrolifeRepresentativesManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.petrolifeRepresentativesManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة مندوبي بترولايف
                  </span>
                </div>

                {/* إدارة مركبات بترولايف */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.petrolifeVehiclesManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("petrolifeVehiclesManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.petrolifeVehiclesManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.petrolifeVehiclesManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة مركبات بترولايف
                  </span>
                </div>

                {/* إدارة منتجات بترولايف */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.petrolifeProductsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("petrolifeProductsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.petrolifeProductsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.petrolifeProductsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة منتجات بترولايف
                  </span>
                </div>

                {/* إدارة تقارير مزودي الخدمة */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.serviceProvidersReportsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("serviceProvidersReportsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.serviceProvidersReportsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.serviceProvidersReportsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة تقارير مزودي الخدمة
                  </span>
                </div>

                {/* إدارة طلبات المحافظ */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.governorRequestsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("governorRequestsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.governorRequestsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.governorRequestsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة طلبات المحافظ
                  </span>
                </div>

                {/* إدارة تقارير الفواتير */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.invoicesReportsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("invoicesReportsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.invoicesReportsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.invoicesReportsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة تقارير الفواتير
                  </span>
                </div>

                {/* إدارة ثوابت البلدان */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.countriesConstantsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("countriesConstantsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.countriesConstantsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.countriesConstantManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة ثوابت البلدان
                  </span>
                </div>

                {/* إدارة ثوابت التصنيفات */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.categoriesConstantsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("categoriesConstantsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.categoriesConstantsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.categoriesConstantsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة ثوابت التصنيفات
                  </span>
                </div>

                {/* إدارة الحسابات الافتراضية */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.applicationDefaultAccountsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange(
                      "applicationDefaultAccountsManagement"
                    )
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.applicationDefaultAccountsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.applicationDefaultAccountsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة الحسابات الافتراضية
                  </span>
                </div>

                {/* إدارة الإعلانات */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.advertisementsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("advertisementsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.advertisementsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.advertisementsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة الإعلانات
                  </span>
                </div>

                {/* إدارة كوبونات الخصم */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.discountCouponsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("discountCouponsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.discountCouponsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.discountCouponsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة كوبونات الخصم
                  </span>
                </div>

                {/* إدارة الاشعارات المخصصة */}
                <div
                  className="relative flex items-center gap-2 p-[10px] rounded-[4px] cursor-pointer "
                  style={{
                    border: permissions.customNotificationsManagement
                      ? "1px solid #5A66C1"
                      : "0.5px solid #A9B4BE",
                  }}
                  onClick={() =>
                    handlePermissionChange("customNotificationsManagement")
                  }
                >
                  <div
                    className={`w-3 h-3 rounded-[2px] border-[0.7px] flex items-center justify-center ${
                      permissions.customNotificationsManagement
                        ? "bg-[#5A66C1]"
                        : "border-[#A9B4BE] "
                    }`}
                  >
                    {permissions.customNotificationsManagement ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-[#A9B4BE] border-[0.7px] border-[#A9B4BE] rounded-[2px]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#5B738B] text-right">
                    إدارة الاشعارات المخصصة
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-[10px] py-3 bg-gray-500 text-white rounded-[8px] hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-[10px] py-3 bg-[#5A66C1] text-white rounded-[8px] hover:bg-[#4A56B1] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditMode ? "جاري التحديث..." : "جاري الإضافة..."}
                </>
              ) : (
                isEditMode ? "تحديث البيانات" : "إضافة المشرف"
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
