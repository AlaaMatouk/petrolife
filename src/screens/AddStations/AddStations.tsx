import { useState, useEffect } from "react";
import { Fuel, Plus, MapPin, ChevronDown } from "lucide-react";
import { AddForm, FormField } from "../../components/sections/AddForm";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addCarStation, fetchFuelCategories, fetchFuelStationById, AddStationData } from "../../services/firestore";
import { auth, db } from "../../config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "../../context/ToastContext";

function AddStations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingStation, setIsLoadingStation] = useState(false);

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
          if (station.formattedLocation?.lat && station.formattedLocation?.lng) {
            locationUrl = `https://www.google.com/maps?q=${station.formattedLocation.lat},${station.formattedLocation.lng}`;
          } else if (station.latitude && station.longitude) {
            locationUrl = `https://www.google.com/maps?q=${station.latitude},${station.longitude}`;
          }

          // Get first fuel product category ID from options
          let fuelProductId = "";
          if (station.options && Array.isArray(station.options) && station.options.length > 0) {
            // Try to find category ID from options - this might need adjustment based on actual data structure
            fuelProductId = station.options[0]?.id || station.options[0]?.categoryId || "";
          }

          // Update initial values with station data
          setInitialValues({
            stationName: station.stationName || station.name || "",
            email: station.email || "",
            phone: station.phoneNumber || "",
            address: typeof station.address === 'string' 
              ? station.address 
              : station.formattedLocation?.address?.city || station.cityName || "",
            location: locationUrl,
            secretNumber: "", // Don't populate password for security
            fuelProducts: fuelProductId
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

  // Define form fields configuration (moved inside component to access isEditMode)
  const stationFields: FormField[] = [
    // Row 1: 3 fields, each taking 2 columns (1/3 width each) - Right to left
    {
      key: "stationName",
      label: "اسم المحطة",
      type: "text",
      placeholder: "اسم المحطة هنا",
      span: 2,
      required: true
    },
    {
      key: "email",
      label: "البريد الالكتروني",
      type: "email",
      placeholder: "hesham@gmail.com",
      span: 2,
      required: true
    },
    {
      key: "phone",
      label: "رقم الهاتف",
      type: "tel",
      placeholder: "رقم الهاتف هنا",
      span: 2,
      required: true
    },
    // Row 2: Full width (6 columns)
    {
      key: "address",
      label: "العنوان",
      type: "text",
      placeholder: "العنوان بالتفصيل هنا",
      span: 6,
      required: true
    },
    // Row 3: Full width (6 columns)
    {
      key: "location",
      label: "الموقع (رابط خرائط جوجل)",
      type: "text",
      placeholder: "مثال: https://www.google.com/maps?q=24.620178,46.709404",
      span: 6,
      required: true,
      icon: <MapPin className="w-4 h-4 text-gray-500" />
    },
    // Row 4: 2 fields, each taking 3 columns (1/2 width each) - Right to left
    {
      key: "secretNumber",
      label: "كلمة المرور (لحساب المحطة)",
      type: "password",
      placeholder: isEditMode ? "اتركه فارغاً للاحتفاظ بالكلمة الحالية" : "ضع كلمة المرور هنا",
      span: 3,
      required: !isEditMode // Only required when adding new station
    },
    {
      key: "fuelProducts",
      label: "منتجات المحطة",
      type: "select",
      span: 3,
      options: categories.map(category => ({
        value: category.id,
        label: category.name?.ar || category.label || category.name?.en || "Unknown"
      })),
      required: !isEditMode, // Not required in edit mode since we're just updating basic info
      icon: <ChevronDown className="w-4 h-4 text-gray-500" />
    },
  ];

  // Initial form values
  const [initialValues, setInitialValues] = useState({
    stationName: "",
    email: "",
    phone: "",
    address: "",
    location: "",
    secretNumber: "",
    fuelProducts: ""
  });

  // Handle form submission
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      console.log("Station form submitted:", values);
      
      if (isEditMode && editId) {
        // Update existing station
        const stationUpdateData: any = {
          name: values.stationName.trim(),
          email: values.email.trim(),
          phoneNumber: values.phone.trim(),
          address: values.address.trim(),
        };

        // Update location if provided
        if (values.location) {
          // Parse Google Maps link to extract coordinates
          const urlMatch = values.location.match(/[?&]q=([^&]+)/);
          if (urlMatch) {
            const coords = urlMatch[1].split(',');
            if (coords.length === 2) {
              const lat = parseFloat(coords[0]);
              const lng = parseFloat(coords[1]);
              if (!isNaN(lat) && !isNaN(lng)) {
                stationUpdateData.latitude = lat;
                stationUpdateData.longitude = lng;
                stationUpdateData.formattedLocation = {
                  lat,
                  lng,
                  name: values.stationName,
                  address: {
                    city: values.address
                  }
                };
              }
            }
          }
        }

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
        const stationData: AddStationData = {
          stationName: values.stationName,
          email: values.email,
          phone: values.phone,
          address: values.address,
          location: values.location,
          secretNumber: values.secretNumber,
          selectedCategories: [values.fuelProducts], // Convert single selection to array
          categoryPrices: {
            [values.fuelProducts]: {
              price: 0, // Default price - could be enhanced with price inputs
              companyPrice: 0, // Default company price
              desc: "" // Default description
            }
          }
        };

        // Call the addCarStation function
        const result = await addCarStation(stationData);
        console.log('Station added successfully:', result);

        addToast({
          title: "تم بنجاح",
          message: "تم إضافة المحطة بنجاح",
          type: "success",
        });

        // Navigate back to stations list
        navigate("/service-distributer-stations");
      }
    } catch (error) {
      console.error("Error saving station:", error);
      addToast({
        title: "خطأ",
        message: isEditMode 
          ? "فشل في تحديث بيانات المحطة. يرجى المحاولة مرة أخرى."
          : "فشل في إضافة المحطة. يرجى المحاولة مرة أخرى.",
        type: "error",
      });
      throw error; // Re-throw to let AddForm handle the error display
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    if (isEditMode && editId) {
      navigate(`/service-distributer-station/${editId}`);
    } else {
      navigate("/service-distributer-stations");
    }
  };

  return (
    <>
      {(loading || isLoadingStation) ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">
            {isLoadingStation ? "جاري تحميل بيانات المحطة..." : "جاري تحميل الفئات..."}
          </div>
        </div>
      ) : (
        <AddForm
          title={isEditMode ? "تعديل بيانات المحطة" : "إضافة محطة جديدة"}
          titleIcon={<Plus className="w-5 h-5 text-gray-500" />}
          fields={stationFields}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitButtonText={isEditMode ? "تحديث البيانات" : "إضافة المحطة"}
          showBackButton={true}
          backButtonAction={() => navigate("/service-distributer-stations")}
          showCancelButton={isEditMode}
          cancelButtonText="الغاء"
          cancelButtonAction={handleCancel}
        />
      )}
    </>
  );
}

export default AddStations;
