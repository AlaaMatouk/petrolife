import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Select } from "../../../shared/Form";
import { ArrowLeft, CirclePlus } from "lucide-react";
import UserSelectionModal from "./UserSelectionModal";
import {
  createNotification,
  UserItem,
  getAllClientIdentifiers,
  getAllCompanyIdentifiers,
  getAllDriverIdentifiers,
  getAllServiceProviderIdentifiers,
} from "../../../../services/notificationService";
import { useToast } from "../../../../context/ToastContext";

interface TargetedUsers {
  clients?: string[];
  companies?: string[];
  "companies-drivers"?: string[];
  fuelStationsWorkers?: string[];
  stationscompany?: string[];
}

const AddSpecialNotification = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targeting: "الكل",
  });
  const [isUserSelectionModalOpen, setIsUserSelectionModalOpen] =
    useState(false);
  const [targetedUsers, setTargetedUsers] = useState<TargetedUsers>({});
  const [selectedUsers, setSelectedUsers] = useState<UserItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get targetedUsers structure for non-custom options
  // Now async - fetches all users from collections and populates arrays
  const getTargetedUsersForOption = async (
    option: string
  ): Promise<TargetedUsers> => {
    switch (option) {
      case "الكل":
        // Fetch ALL users from ALL collections
        const [allClients, allCompanies, allDrivers, allServiceProviders] =
          await Promise.all([
            getAllClientIdentifiers(),
            getAllCompanyIdentifiers(),
            getAllDriverIdentifiers(),
            getAllServiceProviderIdentifiers(),
          ]);
        return {
          clients: allClients, // All clients/individuals (أفراد)
          companies: allCompanies, // All companies (شركات)
          "companies-drivers": allDrivers, // All drivers (تطبيق السائقين)
          stationscompany: allServiceProviders, // All service providers (مزودي الخدمة)
        };
      case "شركات":
        // Fetch all companies and populate companies array
        const companies = await getAllCompanyIdentifiers();
        console.log(`📊 Fetched ${companies.length} companies for "شركات"`);
        return { companies: companies };
      case "أفراد":
        // Fetch all clients and populate clients array
        const clients = await getAllClientIdentifiers();
        console.log(`📊 Fetched ${clients.length} clients for "أفراد"`);
        return { clients: clients };
      case "مزودو الخدمة":
        // Fetch all service providers and populate stationscompany array
        const serviceProviders = await getAllServiceProviderIdentifiers();
        console.log(
          `📊 Fetched ${serviceProviders.length} service providers for "مزودو الخدمة"`
        );
        return { stationscompany: serviceProviders };
      case "تطبيق السائق":
        // Fetch all drivers and populate companies-drivers array
        const drivers = await getAllDriverIdentifiers();
        console.log(`📊 Fetched ${drivers.length} drivers for "تطبيق السائق"`);
        return { "companies-drivers": drivers };
      default:
        return {};
    }
  };

  // Initialize targetedUsers on mount based on default targeting option
  useEffect(() => {
    const initializeTargetedUsers = async () => {
      const initialTargeted = await getTargetedUsersForOption(
        formData.targeting
      );
      setTargetedUsers(initialTargeted);
    };
    initializeTargetedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle targeting change
  const handleTargetingChange = async (value: string) => {
    setFormData((prev) => ({ ...prev, targeting: value }));

    if (value === "مخصص") {
      // Open modal for custom selection
      setIsUserSelectionModalOpen(true);
    } else {
      // Fetch and set targetedUsers based on option
      // IMPORTANT: Clear previous state first, then set new data
      setTargetedUsers({});
      setSelectedUsers([]);

      try {
        const targeted = await getTargetedUsersForOption(value);
        console.log(`🎯 Targeting changed to "${value}":`, {
          keys: Object.keys(targeted),
          clients: targeted.clients?.length || 0,
          companies: targeted.companies?.length || 0,
          "companies-drivers": targeted["companies-drivers"]?.length || 0,
          stationscompany: targeted.stationscompany?.length || 0,
          fullObject: targeted,
        });
        setTargetedUsers(targeted);
      } catch (error) {
        console.error("Error fetching users for targeting:", error);
        addToast({
          type: "error",
          title: "خطأ",
          message: "فشل في جلب بيانات المستخدمين",
        });
      }
    }
  };

  // Handle user selection save from modal
  const handleUserSelectionSave = (users: UserItem[]) => {
    setSelectedUsers(users);

    // Group users by type and build targetedUsers object
    const grouped: TargetedUsers = {};

    users.forEach((user) => {
      const identifier = user.email || user.id;

      switch (user.userType) {
        case "driver":
          if (!grouped["companies-drivers"]) {
            grouped["companies-drivers"] = [];
          }
          grouped["companies-drivers"].push(identifier);
          break;
        case "service-provider":
          if (!grouped.stationscompany) {
            grouped.stationscompany = [];
          }
          grouped.stationscompany.push(identifier);
          break;
        case "company":
          if (!grouped.companies) {
            grouped.companies = [];
          }
          grouped.companies.push(identifier);
          break;
        case "client":
          if (!grouped.clients) {
            grouped.clients = [];
          }
          grouped.clients.push(identifier);
          break;
      }
    });

    setTargetedUsers(grouped);
    setIsUserSelectionModalOpen(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      addToast({
        type: "error",
        title: "خطأ في البيانات",
        message: "يرجى ملء جميع الحقول المطلوبة",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // SIMPLIFIED: Always regenerate from current targeting option
      // This ensures we always have the correct structure with all users
      let finalTargetedUsers: TargetedUsers;

      if (formData.targeting === "مخصص") {
        // For custom, use the selected users from state
        finalTargetedUsers = targetedUsers;
      } else {
        // For all other options, fetch all users from collections
        finalTargetedUsers = await getTargetedUsersForOption(
          formData.targeting
        );
      }

      // Log what we're about to save
      console.log("📤 Final targetedUsers being submitted:", {
        targeting: formData.targeting,
        keys: Object.keys(finalTargetedUsers),
        clients: finalTargetedUsers.clients?.length || 0,
        companies: finalTargetedUsers.companies?.length || 0,
        "companies-drivers":
          finalTargetedUsers["companies-drivers"]?.length || 0,
        stationscompany: finalTargetedUsers.stationscompany?.length || 0,
        fullObject: finalTargetedUsers,
      });

      // Verify the structure matches the selected option
      if (formData.targeting === "شركات" && !finalTargetedUsers.companies) {
        console.error(
          "❌ Error: شركات selected but companies array is missing!"
        );
      } else if (
        formData.targeting === "أفراد" &&
        !finalTargetedUsers.clients
      ) {
        console.error("❌ Error: أفراد selected but clients array is missing!");
      } else if (
        formData.targeting === "مزودو الخدمة" &&
        !finalTargetedUsers.stationscompany
      ) {
        console.error(
          "❌ Error: مزودو الخدمة selected but stationscompany array is missing!"
        );
      } else if (
        formData.targeting === "تطبيق السائق" &&
        !finalTargetedUsers["companies-drivers"]
      ) {
        console.error(
          "❌ Error: تطبيق السائق selected but companies-drivers array is missing!"
        );
      }

      await createNotification({
        title: formData.title,
        body: formData.description,
        targetedUsers: finalTargetedUsers,
      });

      addToast({
        type: "success",
        title: "نجح الحفظ",
        message: "تم حفظ الاشعار بنجاح",
      });

      navigate("/special-notifications");
    } catch (error: any) {
      console.error("Error creating notification:", error);
      addToast({
        type: "error",
        title: "خطأ في الحفظ",
        message: error.message || "فشل في حفظ الاشعار",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save and send
  const handleSaveAndSend = async (e: React.FormEvent) => {
    e.preventDefault();

    // Same as handleSubmit for now
    // In the future, this could trigger immediate sending
    await handleSubmit(e);
  };

  const targetingOptions = [
    { value: "الكل", label: "الكل" },
    { value: "شركات", label: "شركات" },
    { value: "أفراد", label: "أفراد" },
    { value: "مزودو الخدمة", label: "مزودو الخدمة" },
    { value: "تطبيق السائق", label: "تطبيق السائق" },
    { value: "مخصص", label: "مخصص" },
  ];

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
              اضافة اشعار مخصص
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
          {/* Notification Title */}
          <div className="w-full">
            <Input
              label="عنوان الاشعار"
              value={formData.title}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, title: value }))
              }
              placeholder="اكتب العنوان هنا"
              required
            />
          </div>

          {/* Notification Description */}
          <div className="w-full">
            <div className="flex flex-col items-end gap-[var(--corner-radius-extra-small)] relative w-full">
              <label className="self-stretch mt-[-1.00px] font-body-body-2 font-[number:var(--body-body-2-font-weight)] text-[var(--form-active-label-color)] text-[length:var(--body-body-2-font-size)] tracking-[var(--body-body-2-letter-spacing)] leading-[var(--body-body-2-line-height)] [direction:rtl] [font-style:var(--body-body-2-font-style)]">
                وصف الاشعار
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full min-h-[100px] pr-4 pl-4 py-2.5 border-[0.5px] border-solid border-color-mode-text-icons-t-placeholder rounded-[var(--corner-radius-small)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="اكتب الوصف هنا"
                dir="rtl"
                required
              />
            </div>
          </div>

          {/* Targeting */}
          <div className="w-full">
            <Select
              label="التوجيه"
              value={formData.targeting}
              onChange={handleTargetingChange}
              options={targetingOptions}
              required
            />
            {formData.targeting === "مخصص" && selectedUsers.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                تم اختيار {selectedUsers.length} مستخدم
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-[10px] border-[1.5px] border-solid border-[#5A66C1] text-[#5A66C1] bg-white hover:bg-blue-50 font-medium transition-colors"
            >
              رجوع
            </button>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-[10px] border-[1.5px] border-solid border-[#5A66C1] text-[#5A66C1] bg-white hover:bg-blue-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "جاري الحفظ..." : "حفظ الاشعار"}
              </button>
              <button
                type="button"
                onClick={handleSaveAndSend}
                disabled={isSubmitting}
                className="px-6 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "جاري الحفظ..." : "حفظ & ارسال الاشعار"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* User Selection Modal */}
      <UserSelectionModal
        isOpen={isUserSelectionModalOpen}
        onClose={() => setIsUserSelectionModalOpen(false)}
        onSave={handleUserSelectionSave}
        initialSelectedUsers={selectedUsers}
      />
    </div>
  );
};

export default AddSpecialNotification;
