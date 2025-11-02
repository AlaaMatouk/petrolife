import { Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { InfoDisplay } from "../../components/sections/InfoDisplay";
import { fetchCurrentStationsCompany } from "../../services/firestore";

export const ServiceDistributerGeneralInformation = () => {
  const [provider, setProvider] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchCurrentStationsCompany();
        if (mounted) setProvider(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Format Firestore timestamp or date to Arabic display
  const formatArabicDateTime = (dateLike: any): string => {
    if (!dateLike) return "-";
    try {
      const d = dateLike.toDate ? dateLike.toDate() : new Date(dateLike);
      return d.toLocaleString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "-";
    }
  };

  const serviceDistributerData = useMemo(() => {
    return {
      logo: provider?.logo || "",
      name: provider?.name || "-",
      phone: provider?.phoneNumber || provider?.phone || "-",
      email: provider?.email || "-",
      city: provider?.formattedLocation?.address?.city || "-",
      address: provider?.address || "-",
      joinDate: formatArabicDateTime(provider?.createdDate),
      commercialRegister: provider?.commercialRegistrationNumber || "-",
      taxNumber: provider?.vatNumber || "-",
    };
  }, [provider]);

  const documentsData = useMemo(() => {
    return {
      commercialRegisterDoc: provider?.commercialRegistration || "",
      taxNumberDoc: provider?.taxCertificate || "",
      nationalAddressDoc: provider?.addressFile || "",
    };
  }, [provider]);

  // Define fields configuration
  const serviceDistributerFields = [
    // First row: Photo with change button (col-span-2) + empty space (col-span-4)
    {
      key: "logo",
      label: "",
      type: "logo" as const,
      span: 2 as const,
      onChangeLogo: () => {
        console.log("Change logo clicked");
        // TODO: Implement logo change functionality
      },
    },
    {
      key: "spacer1",
      label: "",
      type: "empty" as const,
      span: 4 as const,
    },
    // Second row: Name, Phone, Email (each col-span-2)
    {
      key: "name",
      label: "اسم مزود الخدمة",
      type: "text" as const,
      span: 2 as const,
    },
    {
      key: "phone",
      label: "رقم الهاتف",
      type: "phone" as const,
      span: 2 as const,
    },
    {
      key: "email",
      label: "البريد الالكتروني",
      type: "email" as const,
      span: 2 as const,
    },
    // Third row: City, Address, Join Date (each col-span-2)
    {
      key: "city",
      label: "المدينة",
      type: "text" as const,
      span: 2 as const,
    },
    {
      key: "address",
      label: "العنوان",
      type: "address" as const,
      span: 2 as const,
    },
    {
      key: "joinDate",
      label: "تاريخ الانضمام",
      type: "text" as const,
      span: 2 as const,
    },
    // Fourth row: Commercial Register, Tax Number (each col-span-3)
    {
      key: "commercialRegister",
      label: "السجل التجاري",
      type: "text" as const,
      span: 3 as const,
    },
    {
      key: "taxNumber",
      label: "الرقم الضريبي",
      type: "text" as const,
      span: 3 as const,
    },
  ];

  // Define documents fields configuration
  const documentsFields = [
    {
      key: "commercialRegisterDoc",
      label: "السجل التجاري",
      type: "document" as const,
      span: 2 as const,
      onDownload: () => {
        console.log("Download commercial register");
        // TODO: Implement download functionality
      },
      onUpdate: () => {
        console.log("Update commercial register");
        // TODO: Implement update functionality
      },
    },
    {
      key: "taxNumberDoc",
      label: "الرقم الضريبي",
      type: "document" as const,
      span: 2 as const,
      onDownload: () => {
        console.log("Download tax number");
        // TODO: Implement download functionality
      },
      onUpdate: () => {
        console.log("Update tax number");
        // TODO: Implement update functionality
      },
    },
    {
      key: "nationalAddressDoc",
      label: "العنوان الوطني",
      type: "document" as const,
      span: 2 as const,
      onDownload: () => {
        console.log("Download national address");
        // TODO: Implement download functionality
      },
      onUpdate: () => {
        console.log("Update national address");
        // TODO: Implement update functionality
      },
    },
  ];

  const handleEdit = () => {
    console.log("Edit service distributer data");
    // TODO: Implement edit functionality
  };

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center py-10 text-gray-500">
        جارِ التحميل...
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full items-start gap-5">
      <InfoDisplay
        data={serviceDistributerData}
        title="معلومات مزود الخدمة"
        titleIcon={<Eye className="w-5 h-5 text-gray-500" />}
        fields={serviceDistributerFields}
        onEdit={handleEdit}
        showEditButton={true}
        editButtonText="تعديل البيانات"
        showBackButton={true}
      />
      
      <InfoDisplay
        data={documentsData}
        title="الوثائق"
        titleIcon={<Eye className="w-5 h-5 text-gray-500" />}
        fields={documentsFields}
        showEditButton={false}
        showBackButton={false}
      />
    </div>
  );
};
