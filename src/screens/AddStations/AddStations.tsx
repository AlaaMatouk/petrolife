import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Fuel, Info, MapPin, ChevronDown, Link as LinkIcon, Check } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addCarStation, fetchFuelCategories, fetchFuelStationById, AddStationData, parseGoogleMapsLink } from "../../services/firestore";
import { auth, db } from "../../config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "../../context/ToastContext";
import { StationLocationPicker } from "../../components/sections/StationLocationPicker";

// Fuel type configuration matching the images
const FUEL_TYPES = [
  { id: "diesel", label: "ديزل", color: "bg-yellow-100", colorDot: "bg-orange-500", colorBox: "bg-yellow-200" },
  { id: "gasoline98", label: "بنزين 98", color: "bg-blue-100", colorDot: "bg-blue-600", colorBox: "bg-blue-200" },
  { id: "gasoline95", label: "بنزين 95", color: "bg-pink-100", colorDot: "bg-red-500", colorBox: "bg-pink-200" },
  { id: "gasoline91", label: "بنزين 91", color: "bg-green-100", colorDot: "bg-green-500", colorBox: "bg-green-200" },
];

function AddStations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const editId = searchParams.get("edit");
  const providerEmail = searchParams.get("providerEmail"); // For admin dashboard
  const isEditMode = !!editId;

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingStation, setIsLoadingStation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    stationName: "",
    password: "",
    phoneNumber: "",
    address: "",
    locationLink: "",
    mainProductType: "",
    selectedFuels: [] as string[], // Array of fuel type IDs
    fuelPrices: {} as Record<string, number>, // Map fuel type ID to price
    mapCoordinates: null as { lat: number; lng: number } | null,
  });

  // Fetch categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await fetchFuelCategories();
        setCategories(fetchedCategories);
        console.log("Categories loaded:", fetchedCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Load station data when in edit mode
  useEffect(() => {
    const loadStationData = async () => {
      if (!isEditMode || !editId) return;

      try {
        setIsLoadingStation(true);
        const station = await fetchFuelStationById(editId);

        if (station) {
          console.log("✅ Station data loaded for edit:", station);

          // Build Google Maps link from coordinates if available
          let locationUrl = "";
          let coordinates = null;
          if (station.formattedLocation?.lat && station.formattedLocation?.lng) {
            coordinates = {
              lat: station.formattedLocation.lat,
              lng: station.formattedLocation.lng,
            };
            locationUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
          } else if (station.latitude && station.longitude) {
            coordinates = {
              lat: station.latitude,
              lng: station.longitude,
            };
            locationUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
          }

          // Extract fuel options from station
          const selectedFuels: string[] = [];
          const fuelPrices: Record<string, number> = {};
          
          if (station.options && Array.isArray(station.options)) {
            station.options.forEach((option: any) => {
              const label = option.title?.ar || option.name?.ar || option.label || "";
              const normalized = label.toLowerCase();
              
              // Map to fuel type IDs
              if (normalized.includes("ديزل") || normalized.includes("diesel")) {
                selectedFuels.push("diesel");
                fuelPrices["diesel"] = option.price || 0;
              } else if (normalized.includes("98")) {
                selectedFuels.push("gasoline98");
                fuelPrices["gasoline98"] = option.price || 0;
              } else if (normalized.includes("95")) {
                selectedFuels.push("gasoline95");
                fuelPrices["gasoline95"] = option.price || 0;
              } else if (normalized.includes("91")) {
                selectedFuels.push("gasoline91");
                fuelPrices["gasoline91"] = option.price || 0;
              }
            });
          }

          setFormData({
            email: station.email || "",
            stationName: station.stationName || station.name || "",
            password: "", // Don't populate password for security
            phoneNumber: station.phoneNumber || "",
            address: typeof station.address === 'string' 
              ? station.address 
              : station.formattedLocation?.address?.city || station.cityName || "",
            locationLink: locationUrl,
            mainProductType: "",
            selectedFuels,
            fuelPrices,
            mapCoordinates: coordinates,
          });
        } else {
          addToast({
            title: "خطأ",
            message: "فشل في تحميل بيانات المحطة",
            type: "error",
          });
          navigate("/service-distributer-stations");
        }
      } catch (error) {
        console.error("Error loading station data:", error);
        addToast({
          title: "خطأ",
          message: "فشل في تحميل بيانات المحطة",
          type: "error",
        });
        navigate("/service-distributer-stations");
      } finally {
        setIsLoadingStation(false);
      }
    };

    loadStationData();
  }, [isEditMode, editId, navigate, addToast]);

  // Handle input changes
  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle fuel checkbox toggle
  const handleFuelToggle = (fuelId: string) => {
    setFormData(prev => {
      const selectedFuels = prev.selectedFuels.includes(fuelId)
        ? prev.selectedFuels.filter(id => id !== fuelId)
        : [...prev.selectedFuels, fuelId];
      
      // Initialize price to 0 if not set
      const fuelPrices = { ...prev.fuelPrices };
      if (!fuelPrices[fuelId] && selectedFuels.includes(fuelId)) {
        fuelPrices[fuelId] = 0;
      } else if (!selectedFuels.includes(fuelId)) {
        delete fuelPrices[fuelId];
      }

      return { ...prev, selectedFuels, fuelPrices };
    });
  };

  // Handle fuel price change
  const handleFuelPriceChange = (fuelId: string, price: number) => {
    setFormData(prev => ({
      ...prev,
      fuelPrices: { ...prev.fuelPrices, [fuelId]: price },
    }));
  };

  // Handle location link change and parse coordinates
  const handleLocationLinkChange = useCallback((link: string) => {
    handleChange("locationLink", link);
    
    // Try to parse coordinates from the link
    const coordinates = parseGoogleMapsLink(link);
    if (coordinates) {
      handleChange("mapCoordinates", coordinates);
    }
  }, [handleChange]);

  // Handle map location selection
  const handleMapLocationSelect = useCallback((coordinates: { lat: number; lng: number } | null) => {
    handleChange("mapCoordinates", coordinates);
  }, [handleChange]);

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.email.trim()) errors.push("البريد الإلكتروني مطلوب");
    if (!formData.stationName.trim()) errors.push("اسم المحطة مطلوب");
    if (!isEditMode && !formData.password.trim()) errors.push("كلمة المرور مطلوبة");
    if (!formData.phoneNumber.trim()) errors.push("رقم الجوال مطلوب");
    if (!formData.address.trim()) errors.push("العنوان مطلوب");
    
    // Location validation - either map coordinates or location link
    if (!formData.mapCoordinates && !formData.locationLink.trim()) {
      errors.push("الموقع مطلوب (اختر موقع على الخريطة أو أدخل رابط الموقع)");
    }
    
    if (formData.selectedFuels.length === 0) {
      errors.push("يجب اختيار نوع وقود واحد على الأقل");
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      addToast({
        title: "خطأ في التحقق",
        message: errors.join(", "),
        type: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Station form submitted:", formData);

      // Get coordinates from map or parse from link
      let coordinates = formData.mapCoordinates;
      if (!coordinates && formData.locationLink) {
        coordinates = parseGoogleMapsLink(formData.locationLink);
      }

      if (!coordinates) {
        throw new Error("الموقع مطلوب. اختر موقع على الخريطة أو أدخل رابط صحيح من خرائط جوجل");
      }

      // Map fuel type IDs to category IDs from Firestore
      // We need to find matching categories from the fetched categories
      const selectedCategoryIds: string[] = [];
      const categoryPrices: Record<string, { price: number; companyPrice: number; desc: string }> = {};

      console.log("🔍 Matching fuel types to categories:", {
        selectedFuels: formData.selectedFuels,
        totalCategories: categories.length,
        categories: categories.map(cat => ({
          id: cat.id,
          nameAr: cat.name?.ar,
          nameEn: cat.name?.en,
          label: cat.label,
        }))
      });

      formData.selectedFuels.forEach(fuelId => {
        // Find category that matches this fuel type
        const fuelType = FUEL_TYPES.find(ft => ft.id === fuelId);
        const fuelLabel = fuelType?.label || "";
        
        console.log(`🔍 Looking for category matching fuel: ${fuelId} (${fuelLabel})`);
        
        const matchingCategory = categories.find(cat => {
          const catLabelAr = cat.name?.ar || "";
          const catLabelEn = cat.name?.en || "";
          const catLabel = cat.label || "";
          
          // Try multiple matching strategies
          const searchTexts = [catLabelAr, catLabelEn, catLabel].map(t => t.toLowerCase().trim());
          const normalizedAr = catLabelAr.toLowerCase().trim();
          const normalizedEn = catLabelEn.toLowerCase().trim();
          const normalizedLabel = catLabel.toLowerCase().trim();
          
          // Match diesel
          if (fuelId === "diesel") {
            const matches = searchTexts.some(text => 
              text.includes("ديزل") || 
              text.includes("ديزيل") ||
              text.includes("diesel")
            );
            if (matches) {
              console.log(`✅ Found diesel match: ${cat.id} - ${catLabelAr || catLabelEn || catLabel}`);
            }
            return matches;
          }
          
          // Match gasoline 98 - must include 98 and not 95 or 91
          if (fuelId === "gasoline98") {
            const matches = searchTexts.some(text => {
              const has98 = text.includes("98") || text.includes("٩٨");
              const has95 = text.includes("95") || text.includes("٩٥");
              const has91 = text.includes("91") || text.includes("٩١");
              return has98 && !has95 && !has91;
            });
            if (matches) {
              console.log(`✅ Found 98 match: ${cat.id} - ${catLabelAr || catLabelEn || catLabel}`);
            }
            return matches;
          }
          
          // Match gasoline 95 - must include 95 and not 98
          if (fuelId === "gasoline95") {
            const matches = searchTexts.some(text => {
              const has95 = text.includes("95") || text.includes("٩٥");
              const has98 = text.includes("98") || text.includes("٩٨");
              return has95 && !has98;
            });
            if (matches) {
              console.log(`✅ Found 95 match: ${cat.id} - ${catLabelAr || catLabelEn || catLabel}`);
            }
            return matches;
          }
          
          // Match gasoline 91 - must include 91
          if (fuelId === "gasoline91") {
            const matches = searchTexts.some(text => 
              text.includes("91") || 
              text.includes("٩١")
            );
            if (matches) {
              console.log(`✅ Found 91 match: ${cat.id} - ${catLabelAr || catLabelEn || catLabel}`);
            }
            return matches;
          }
          
          return false;
        });

        if (matchingCategory) {
          selectedCategoryIds.push(matchingCategory.id);
          categoryPrices[matchingCategory.id] = {
            price: formData.fuelPrices[fuelId] || 0,
            companyPrice: 0, // Can be set later
            desc: "",
          };
          console.log(`✅ Added category ${matchingCategory.id} for fuel ${fuelId} with price ${formData.fuelPrices[fuelId] || 0}`);
        } else {
          console.warn(`⚠️ No matching category found for fuel type: ${fuelId} (${fuelLabel})`);
        }
      });

      console.log("📊 Final category mapping:", {
        selectedCategoryIds,
        categoryPrices,
      });

      // If no categories matched and mainProductType is selected, use it as fallback
      if (selectedCategoryIds.length === 0) {
        if (formData.mainProductType) {
          console.log("⚠️ No fuel type matches found, using mainProductType as fallback:", formData.mainProductType);
          selectedCategoryIds.push(formData.mainProductType);
          categoryPrices[formData.mainProductType] = {
            price: Object.values(formData.fuelPrices)[0] || 0,
            companyPrice: 0,
            desc: "",
          };
        } else {
          console.error("❌ No categories matched. Available categories:", categories);
          throw new Error("لم يتم العثور على فئات متطابقة لأنواع الوقود المختارة. يرجى اختيار نوع المنتج الرئيسي أو التحقق من وجود الفئات في النظام.");
        }
      }
      
      if (isEditMode && editId) {
        // Update existing station
        const stationUpdateData: any = {
          name: formData.stationName.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          address: formData.address.trim(),
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          formattedLocation: {
            lat: coordinates.lat,
            lng: coordinates.lng,
            name: formData.address,
            address: {
              city: formData.address.split(",")[0] || formData.address,
              country: "Saudi Arabia",
              road: formData.address,
              postcode: "",
              state: "",
              stateDistrict: "",
              countryCode: "SA",
            },
            placeId: "",
            id: formData.email,
            display_name: formData.address,
          },
        };

        // Update document in Firestore
        const stationDocRef = doc(db, "carstations", editId);
        await updateDoc(stationDocRef, stationUpdateData);

        addToast({
          title: "تم بنجاح",
          message: "تم تحديث بيانات المحطة بنجاح",
          type: "success",
        });

        // Navigate back to station details
        navigate(`/service-distributer-station/${editId}`);
      } else {
        // Add new station
        // Use provider email if provided (from admin dashboard), otherwise use current user email
        const stationLocation = formData.mapCoordinates
          ? `https://www.google.com/maps?q=${formData.mapCoordinates.lat},${formData.mapCoordinates.lng}`
          : formData.locationLink;

        const stationData: AddStationData = {
          stationName: formData.stationName,
          email: formData.email,
          phone: formData.phoneNumber,
          address: formData.address,
          location: stationLocation,
          secretNumber: formData.password,
          selectedCategories: selectedCategoryIds,
          categoryPrices,
        };

        // Modify addCarStation call if needed to support provider email
        // For now, we'll need to check if the function accepts providerEmail parameter
        // If not, we may need to modify the service function

        // Call the addCarStation function
        const result = await addCarStation(stationData);
        
        // If providerEmail is provided (from admin dashboard), update the createdUserId after creation
        if (providerEmail) {
          try {
            const stationDocRef = doc(db, "carstations", formData.email);
            await updateDoc(stationDocRef, { createdUserId: providerEmail });
            console.log("✅ Updated station createdUserId to provider email:", providerEmail);
          } catch (updateError) {
            console.error("Error updating createdUserId:", updateError);
            // Don't fail the entire operation if this update fails
          }
        }

        console.log('Station added successfully:', result);

        addToast({
          title: "تم بنجاح",
          message: "تم إضافة المحطة بنجاح",
          type: "success",
        });

        // Navigate back to stations list or provider details
        if (providerEmail) {
          // If added from admin dashboard, navigate back to provider details
          navigate(-1); // Go back to previous page
        } else {
        navigate("/service-distributer-stations");
        }
      }
    } catch (error: any) {
      console.error("Error saving station:", error);
      const errorMessage = error.message || (isEditMode 
        ? "فشل في تحديث بيانات المحطة. يرجى المحاولة مرة أخرى."
        : "فشل في إضافة المحطة. يرجى المحاولة مرة أخرى.");
      
      addToast({
        title: "خطأ",
        message: errorMessage,
        type: "error",
      });
      
      // Stop propagation to prevent infinite loops
      setIsSubmitting(false);
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoadingStation) {
  return (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">
            {isLoadingStation ? "جاري تحميل بيانات المحطة..." : "جاري تحميل الفئات..."}
          </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col w-full items-start gap-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <h1 className="text-[length:var(--subtitle-subtitle-2-font-size)] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec">
          {isEditMode ? "تعديل بيانات المحطة" : "إضافة محطة جديدة"}
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

      <form onSubmit={handleSubmit} className="flex flex-col w-full items-start gap-5">
        {/* Section 1: Basic Information */}
        <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" />
            <h2 className="text-[length:var(--subtitle-subtitle-2-font-size)] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec">
              المعلومات الاساسية
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-5 w-full">
            {/* Left Column */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-normal text-[var(--form-readonly-label-color)]">
                  البريد الالكتروني
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="example@g.ail.com"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isEditMode}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-normal text-[var(--form-readonly-label-color)]">
                  الرقم السري للحساب
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={isEditMode ? "اتركه فارغاً للاحتفاظ بالكلمة الحالية" : "ادخل رقم سرى قوى"}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!isEditMode}
                  disabled={isEditMode}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-normal text-[var(--form-readonly-label-color)]">
                  اسم المحطة
                </label>
                <input
                  type="text"
                  value={formData.stationName}
                  onChange={(e) => handleChange("stationName", e.target.value)}
                  placeholder="ادخل اسم المحطه"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-normal text-[var(--form-readonly-label-color)]">
                  رقم الجوال
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  placeholder="+966 XXX XXX XXXX"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-normal text-[var(--form-readonly-label-color)]">
                  العنوان
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="ادخل عنوان المحطه بالتفصيل"
                  rows={3}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Location on Map */}
        <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-500" />
            <h2 className="text-[length:var(--subtitle-subtitle-2-font-size)] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec">
              الموقع على الخريطة
            </h2>
          </div>

          <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)]">
                اسم المحطة
              </label>
              <input
                type="text"
                value={formData.stationName}
                onChange={(e) => handleChange("stationName", e.target.value)}
                placeholder="اسم المحطة"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Map */}
            <StationLocationPicker
              onLocationSelect={handleMapLocationSelect}
              initialCoordinates={formData.mapCoordinates}
            />

            {/* Location Link */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)] flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                رابط الموقع
              </label>
              <input
                type="text"
                value={formData.locationLink}
                onChange={(e) => handleLocationLinkChange(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                يمكنك نسخ رابط الموقع من خرائط جوجل او اي خدمه خرائط اخري
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Products and Fuel Options */}
        <div className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] relative self-stretch w-full bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder">
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-gray-500" />
            <h2 className="text-[length:var(--subtitle-subtitle-2-font-size)] font-[number:var(--subtitle-subtitle-2-font-weight)] text-color-mode-text-icons-t-sec">
              المنتجات وخيارات الوقود
            </h2>
          </div>

          <div className="flex flex-col gap-5 w-full">
            {/* Main Product Type */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)] flex items-center gap-2">
                <ChevronDown className="w-4 h-4" />
                نوع المنتج الرئيسي
              </label>
              <select
                value={formData.mainProductType}
                onChange={(e) => handleChange("mainProductType", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر نوع المنتج</option>
                {categories
                  .filter((category) => category && category.id) // Only include categories with valid IDs
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name?.ar || category.label || category.name?.en || "Unknown"}
                    </option>
                  ))}
              </select>
            </div>

            {/* Fuel Options Cards */}
            <div>
              <label className="text-sm font-normal text-[var(--form-readonly-label-color)] mb-3 block">
                خيارات الوقود المتاحه
              </label>
              <div className="grid grid-cols-4 gap-4">
                {FUEL_TYPES.map((fuel) => (
                  <div
                    key={fuel.id}
                    className={`${fuel.color} rounded-lg p-4 border-2 cursor-pointer transition-all ${
                      formData.selectedFuels.includes(fuel.id)
                        ? "border-blue-500 shadow-md"
                        : "border-transparent hover:border-gray-300"
                    }`}
                    onClick={() => handleFuelToggle(fuel.id)}
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* Checkbox - Top Left */}
                      <div className="flex items-start justify-start w-full mb-3">
                        <div 
                          className={`relative w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center flex-shrink-0 ${
                            formData.selectedFuels.includes(fuel.id)
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-gray-400"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFuelToggle(fuel.id);
                          }}
                        >
                          {formData.selectedFuels.includes(fuel.id) && (
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                      
                      {/* Fuel Name with Color Indicator - Centered */}
                      <div className="w-full mb-3 flex items-center justify-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${fuel.colorBox} flex items-center justify-center flex-shrink-0`}>
                          <div className={`w-4 h-4 rounded-full ${fuel.colorDot}`}></div>
                        </div>
                        <div className="font-medium text-gray-800">{fuel.label}</div>
                      </div>
                      
                      {/* Price Input - Centered */}
                      <div className="w-full mt-auto">
                        <label className="text-xs text-gray-600 block mb-1 text-center">السعر / لتر</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={(formData.fuelPrices[fuel.id] === 0 || formData.fuelPrices[fuel.id] === undefined) ? "" : formData.fuelPrices[fuel.id]}
                          onChange={(e) => {
                            e.stopPropagation();
                            const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                            handleFuelPriceChange(fuel.id, value);
                          }}
                          onFocus={(e) => {
                            e.stopPropagation();
                            // Clear the input if value is 0
                            const currentPrice = formData.fuelPrices[fuel.id] || 0;
                            if (currentPrice === 0) {
                              e.target.value = "";
                            }
                          }}
                          onBlur={(e) => {
                            // If empty on blur, set to 0
                            if (e.target.value === "") {
                              handleFuelPriceChange(fuel.id, 0);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-start gap-5 w-full">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-medium)] pb-[var(--corner-radius-medium)] px-2.5 relative flex-[0_0_auto] rounded-[var(--corner-radius-small)] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-medium"
          >
            {isSubmitting ? "جاري الحفظ..." : "إضافة المحطة"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddStations;
