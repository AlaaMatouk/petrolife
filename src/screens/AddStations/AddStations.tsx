import { useState, useEffect } from "react";
import { Fuel, Plus, MapPin, ChevronDown } from "lucide-react";
import { AddForm, FormField } from "../../components/sections/AddForm";
import { useNavigate } from "react-router-dom";
import { addCarStation, fetchFuelCategories, AddStationData } from "../../services/firestore";
import { auth } from "../../config/firebase";

function AddStations() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Define form fields configuration
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
      placeholder: "ضع كلمة المرور هنا",
      span: 3,
      required: true
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
      required: true,
      icon: <ChevronDown className="w-4 h-4 text-gray-500" />
    },
  ];

  // Initial form values
  const initialValues = {
    stationName: "",
    email: "",
    phone: "",
    address: "",
    location: "",
    secretNumber: "",
    fuelProducts: ""
  };

  // Handle form submission
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      console.log("Station form submitted:", values);
      
      // Prepare station data for the API
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

      // Navigate back to stations list - user stays logged in!
      navigate("/service-distributer-stations");
    } catch (error) {
      console.error("Error adding station:", error);
      throw error; // Re-throw to let AddForm handle the error display
    }
  };

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">جاري تحميل الفئات...</div>
        </div>
      ) : (
        <AddForm
          title="إضافة محطة جديدة"
          titleIcon={<Plus className="w-5 h-5 text-gray-500" />}
          fields={stationFields}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitButtonText="إضافة المحطة"
          showBackButton={true}
          backButtonAction={() => navigate("/service-distributer-stations")}
        />
      )}
    </>
  );
}

export default AddStations;
