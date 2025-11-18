import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Table, Pagination, LoadingSpinner } from "../../../shared";
import {
  ArrowLeft,
  Eye,
  MoreVertical,
  Download,
  FileSpreadsheet,
  FileText,
  UserRound,
  Plus,
  Building2,
} from "lucide-react";
import { createPortal } from "react-dom";
import {
  fetchDriverByIdentifier,
  fetchVehicleById,
  fetchDrivers,
  addDriverToVehicle,
  updatePetrolifeDriverIsActive,
  fetchPetrolifeDriverById,
} from "../../../../services/firestore";
import { useToast } from "../../../../context/ToastContext";
import { StatusToggle } from "../../../shared/StatusToggle";

interface VehicleInfo {
  plateNumber: string;
  creator: string;
  carName: string;
  creationDate: string;
  chassisNumber: string;
  numberOfDrivers: string;
  carImage: string;
}

interface VehicleDriverRow {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  accountStatus: { active: boolean; text: string };
  driverDocId: string; // Store the document ID for toggle functionality
}

interface AllDriverRow {
  id: string;
  assignmentIdentifier: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  status: string;
  isActive: boolean;
}

const formatValue = (value: any, placeholder = "-") => {
  if (value === null || value === undefined) {
    return placeholder;
  }
  const stringValue = String(value).trim();
  return stringValue.length === 0 ? placeholder : stringValue;
};

const formatDateValue = (value: any): string => {
  if (!value) {
    return "-";
  }

  try {
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString("ar-EG");
      }
      return value;
    }

    if (typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString("ar-EG");
      }
      return "-";
    }

    if (value?.toDate) {
      const parsed = value.toDate();
      return parsed.toLocaleString("ar-EG");
    }

    if (value?.seconds) {
      const parsed = new Date(value.seconds * 1000);
      return parsed.toLocaleString("ar-EG");
    }

    return "-";
  } catch {
    return "-";
  }
};

const VEHICLE_FALLBACK_IMAGE = "/img/car-image.png";

const ExportMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updateMenuPosition = () => {
    if (!buttonRef) return;
    const rect = buttonRef.getBoundingClientRect();
    const menuWidth = 150;
    const viewportWidth = window.innerWidth;
    let left = rect.right + 4;
    if (left + menuWidth > viewportWidth) left = rect.left - menuWidth - 4;
    setMenuPosition({ top: rect.bottom + 4, left: Math.max(4, left) });
  };

  const handleExport = (format: "excel" | "pdf") => {
    console.log("Export drivers as", format);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={setButtonRef}
        onClick={() => {
          setIsOpen((v) => !v);
          setTimeout(updateMenuPosition, 0);
        }}
        className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray"
      >
        <div className="flex items-center gap-[var(--corner-radius-small)]">
          <span className="font-body-body-2 text-[length:var(--body-body-2-font-size)] text-color-mode-text-icons-t-sec [direction:rtl]">
            تصدير
          </span>
          <Download className="w-4 h-4 text-gray-500" />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {createPortal(
            <div
              className="fixed w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              <div className="py-1">
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2"
                >
                  <span>ملف Excel</span>
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-end gap-2"
                >
                  <span>ملف PDF</span>
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

const PetrolifeCarDetails = (): JSX.Element => {
  const navigate = useNavigate();
  const { id: vehicleId } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [drivers, setDrivers] = useState<VehicleDriverRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDriversListOpen, setIsDriversListOpen] = useState(false);
  const [allDrivers, setAllDrivers] = useState<AllDriverRow[]>([]);
  const [isAllDriversLoading, setIsAllDriversLoading] = useState(false);
  const [allDriversError, setAllDriversError] = useState<string | null>(null);
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(
    null
  );
  const [assignedDriverIdentifiers, setAssignedDriverIdentifiers] = useState<
    string[]
  >([]);

  const handleToggleStatus = useCallback(async (driverDocId: string) => {
    try {
      // Fetch current driver data from Firestore to get the current isActive status
      const currentDriverData = await fetchPetrolifeDriverById(driverDocId);
      
      // Get current isActive status
      // Handle null, undefined, or missing values - treat as false/inactive
      let currentIsActive: boolean;
      if (currentDriverData.isActive === null || currentDriverData.isActive === undefined) {
        // If isActive is null/undefined, treat as inactive
        currentIsActive = false;
      } else {
        currentIsActive = currentDriverData.isActive === true;
      }
      
      const newIsActive = !currentIsActive;
      await updatePetrolifeDriverIsActive(driverDocId, newIsActive);
      addToast({
        type: "success",
        message: newIsActive
          ? "تم تفعيل حساب السائق بنجاح"
          : "تم تعطيل حساب السائق بنجاح",
        duration: 3000,
      });
      
      // Update local state
      setDrivers((prevDrivers) =>
        prevDrivers.map((driver) =>
          driver.driverDocId === driverDocId
            ? {
                ...driver,
                accountStatus: {
                  active: newIsActive,
                  text: newIsActive ? "مفعل" : "معطل",
                },
              }
            : driver
        )
      );
    } catch (error) {
      console.error("Error toggling driver status:", error);
      addToast({
        type: "error",
        message: "فشل في تحديث حالة الحساب",
        duration: 3000,
      });
    }
  }, [addToast]);

  const columns = useMemo(
    () => [
      {
        key: "actions",
        label: "الإجراءات",
        width: "w-16",
        priority: "high",
        render: () => (
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        ),
      },
      {
        key: "accountStatus",
        label: "حالة الحساب",
        width: "min-w-[120px]",
        priority: "high",
        render: (_: any, row: VehicleDriverRow) => (
          <StatusToggle
            isActive={row.accountStatus.active}
            onToggle={() => handleToggleStatus(row.driverDocId)}
            statusText={row.accountStatus.text}
          />
        ),
      },
      {
        key: "city",
        label: "المدينة",
        width: "min-w-[100px]",
        priority: "high",
      },
      {
        key: "email",
        label: "البريد الألكتروني",
        width: "min-w-[150px]",
        priority: "medium",
      },
      {
        key: "phone",
        label: "رقم الهاتف",
        width: "min-w-[130px]",
        priority: "high",
      },
      {
        key: "name",
        label: "اسم السائق",
        width: "min-w-[180px]",
        priority: "high",
      },
      {
        key: "code",
        label: "كود السائق",
        width: "min-w-[120px]",
        priority: "high",
      },
    ],
    [handleToggleStatus]
  );

  const columnsReversed = useMemo(
    () => [...(columns as any[])],
    [columns]
  );

  const paginated = useMemo(() => {
    return drivers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [drivers, currentPage]);

  const assignedIdentifiers = useMemo(() => {
    return new Set(assignedDriverIdentifiers);
  }, [assignedDriverIdentifiers]);

  const handleAddDriverToVehicle = async (driver: AllDriverRow) => {
    if (!vehicleId) {
      addToast({
        type: "error",
        title: "خطأ",
        message: "معرف المركبة غير متوفر.",
      });
      return;
    }

    if (assignedIdentifiers.has(driver.assignmentIdentifier)) {
      addToast({
        type: "info",
        title: "إشعار",
        message: "هذا السائق مضاف بالفعل إلى المركبة.",
      });
      return;
    }

    try {
      setAssigningDriverId(driver.assignmentIdentifier);
      await addDriverToVehicle(vehicleId, driver.assignmentIdentifier);

      setDrivers((prev) => [
        ...prev,
        {
          id: driver.assignmentIdentifier,
          code: driver.assignmentIdentifier,
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          city: driver.city,
          accountStatus: {
            active: driver.isActive,
            text: driver.status,
          },
          driverDocId: driver.assignmentIdentifier,
        },
      ]);

      setAssignedDriverIdentifiers((prev) => {
        if (prev.includes(driver.assignmentIdentifier)) {
          return prev;
        }
        return [...prev, driver.assignmentIdentifier];
      });

      setVehicleInfo((prev) => {
        if (!prev) return prev;
        const nextCount = Number(prev.numberOfDrivers || "0") + 1;
        return { ...prev, numberOfDrivers: String(nextCount) };
      });

      addToast({
        type: "success",
        title: "تم الإضافة",
        message: "تم إضافة السائق إلى المركبة بنجاح.",
      });
    } catch (err) {
      console.error("Failed to add driver to vehicle:", err);
      addToast({
        type: "error",
        title: "فشل الإضافة",
        message: "تعذر إضافة السائق. حاول مرة أخرى.",
      });
    } finally {
      setAssigningDriverId(null);
    }
  };

  useEffect(() => {
    const loadVehicleDetails = async () => {
      if (!vehicleId) {
        setError("معرف المركبة غير متوفر.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const vehicle: Record<string, any> = await fetchVehicleById(vehicleId);

        const driverIds = Array.isArray(vehicle?.driverIds)
          ? vehicle.driverIds.filter(
              (driverId: any) =>
                driverId !== null &&
                driverId !== undefined &&
                String(driverId).trim() !== ""
            )
          : [];

        const vehicleDetails: VehicleInfo = {
          plateNumber: formatValue(
            vehicle?.plateNumber?.ar ?? vehicle?.plateNumber?.en
          ),
          creator: formatValue(vehicle?.createdUserId),
          carName: formatValue(vehicle?.name),
          creationDate: formatDateValue(vehicle?.createdDate),
          chassisNumber: formatValue(vehicle?.chassisNumber),
          numberOfDrivers: String(driverIds.length),
          carImage:
            vehicle?.image ||
            vehicle?.car?.carModelImageUrl ||
            VEHICLE_FALLBACK_IMAGE,
        };

        setVehicleInfo(vehicleDetails);
        setAssignedDriverIdentifiers(driverIds.map((id: any) => String(id)));

        if (driverIds.length === 0) {
          setDrivers([]);
          return;
        }

        const driverDocs = await Promise.all<Record<string, any> | null>(
          driverIds.map(async (identifier: any) => {
            const identifierString = String(identifier);
            try {
              return await fetchDriverByIdentifier(identifierString);
            } catch (err) {
              console.error(
                `Error fetching driver with identifier ${identifierString}:`,
                err
              );
              return null;
            }
          })
        );

        const driverRows = driverDocs
          .filter((driverDoc): driverDoc is Record<string, any> =>
            Boolean(driverDoc)
          )
          .map((driverDoc: Record<string, any>, index: number) => {
            // Use refid as primary source for code, with fallbacks
            const code = formatValue(
              driverDoc?.refid ??
                driverDoc?.uId ??
                driverDoc?.email ??
                driverDoc?.id ??
                driverDoc?.docId
            );

            const driverDocId = String(driverDoc?.docId ?? driverDoc?.id ?? index);
            const isActive = driverDoc?.isActive === true;

            return {
              id: driverDocId,
              code,
              name: formatValue(
                driverDoc?.name ?? driverDoc?.driverName ?? driverDoc?.fullName
              ),
              phone: formatValue(driverDoc?.phoneNumber ?? driverDoc?.phone),
              email: formatValue(driverDoc?.email),
              city: formatValue(driverDoc?.city?.name?.en),
              accountStatus: {
                active: isActive,
                text: isActive ? "مفعل" : "معطل",
              },
              driverDocId: driverDocId,
            } as VehicleDriverRow;
          });

        setDrivers(driverRows);
      } catch (err) {
        console.error("Failed to load vehicle details:", err);
        setError("فشل في تحميل بيانات المركبة.");
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicleDetails();
  }, [vehicleId]);

  useEffect(() => {
    const loadAllDrivers = async () => {
      if (!isDriversListOpen || isAllDriversLoading || allDrivers.length > 0) {
        return;
      }

      setIsAllDriversLoading(true);
      setAllDriversError(null);

      try {
        const driversSnapshot = await fetchDrivers();
        const normalizedDrivers = Array.isArray(driversSnapshot)
          ? driversSnapshot.map(
              (driverDoc: Record<string, any>, index: number) => {
                const identifier = String(
                  driverDoc?.docId ??
                    driverDoc?.id ??
                    driverDoc?.uId ??
                    driverDoc?.email ??
                    index
                );

                const status = driverDoc?.isActive ? "نشط" : "معطل";

                return {
                  id: identifier,
                  assignmentIdentifier: identifier,
                  name: formatValue(
                    driverDoc?.name ??
                      driverDoc?.driverName ??
                      driverDoc?.fullName
                  ),
                  phone: formatValue(
                    driverDoc?.phoneNumber ?? driverDoc?.phone
                  ),
                  email: formatValue(driverDoc?.email),
                  city: formatValue(driverDoc?.city?.name?.en),
                  status,
                  isActive: Boolean(driverDoc?.isActive),
                } as AllDriverRow;
              }
            )
          : [];

        setAllDrivers(normalizedDrivers);
      } catch (err) {
        console.error("Failed to load all drivers:", err);
        setAllDriversError("فشل في تحميل قائمة السائقين.");
      } finally {
        setIsAllDriversLoading(false);
      }
    };

    loadAllDrivers();
  }, [isDriversListOpen, isAllDriversLoading, allDrivers.length]);

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-16">
        <LoadingSpinner message="جاري تحميل بيانات المركبة..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-20 gap-4">
        <div className="text-red-600 text-lg [direction:rtl]">{error}</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 h-10 rounded-[10px] bg-[#5A66C1] hover:bg-[#4A5AB1] text-white"
        >
          الرجوع
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full items-start gap-5">
      {/* Car Info Card */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <div className="flex items-center justify-between w-full">
          {/* Title on right */}
          <div className="flex items-center justify-end gap-1.5">
            <h1 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              معلومات المركبة
            </h1>
            <Eye className="w-5 h-5 text-gray-500" />
          </div>
          {/* Back button on left */}
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

        {/* Car info - read-only inputs style */}
        <section className="flex flex-col items-start gap-5 relative self-stretch w-full">
          {/* Car Image */}
          <div className="flex items-start gap-5 w-full">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                {vehicleInfo?.carImage ? (
                  <img
                    src={vehicleInfo.carImage}
                    alt="Car"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Bordered frame around read-only fields */}
          <div className="w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white p-4 shadow-sm">
            {(() => {
              const fields = [
                { label: "رقم اللوحة", value: vehicleInfo?.plateNumber ?? "-" },
                { label: "المنشيء", value: vehicleInfo?.creator ?? "-" },
                {
                  label: "اسم المركبة",
                  value: vehicleInfo?.carName ?? "الاسم",
                },
                {
                  label: "تاريخ الانشاء",
                  value: vehicleInfo?.creationDate ?? "-",
                },
                {
                  label: "رقم الهيكل",
                  value: vehicleInfo?.chassisNumber ?? "-",
                },
                {
                  label: "عدد السائقين",
                  value: vehicleInfo?.numberOfDrivers ?? "0",
                },
              ];

              const rows = [] as JSX.Element[];
              for (let i = 0; i < fields.length; i += 3) {
                const row = fields.slice(i, i + 3);
                rows.push(
                  <div key={i} className="flex items-start gap-5 w-full mb-4">
                    {row.map((f, idx) => (
                      <div key={idx} className="flex flex-col gap-2 flex-1">
                        <label className="text-sm font-normal text-[var(--form-readonly-label-color)] text-right [direction:rtl]">
                          {f.label}
                        </label>
                        <div className="px-3 py-2 bg-gray-50 rounded-[10px] border border-color-mode-text-icons-t-placeholder text-[var(--form-readonly-input-text-color)] text-right [direction:rtl]">
                          {f.value}
                        </div>
                      </div>
                    ))}
                    {row.length < 3 &&
                      Array.from({ length: 3 - row.length }).map((_, k) => (
                        <div key={`empty-${k}`} className="flex-1" />
                      ))}
                  </div>
                );
              }
              return rows;
            })()}
          </div>
        </section>
      </div>

      {/* Drivers table section */}
      <div
        className="flex flex-col items-start gap-[var(--corner-radius-extra-large)] pt-[var(--corner-radius-large)] pr-[var(--corner-radius-large)] pb-[var(--corner-radius-large)] pl-[var(--corner-radius-large)] bg-color-mode-surface-bg-screen rounded-[var(--corner-radius-large)] border-[0.3px] border-solid border-color-mode-text-icons-t-placeholder w-full"
        dir="rtl"
      >
        <header className="flex items-center justify-between w-full">
          <div className="flex items-center justify-end gap-1.5">
            <UserRound className="w-5 h-5 text-gray-500" />
            <h2 className="font-subtitle-subtitle-2 text-[length:var(--subtitle-subtitle-2-font-size)] text-color-mode-text-icons-t-sec">
              السائقين المضافين للمركبة
            </h2>
          </div>
          <div className="inline-flex items-center gap-[var(--corner-radius-medium)]">
            <button
              onClick={() => setIsDriversListOpen(true)}
              className="inline-flex flex-col items-start gap-2.5 pt-[var(--corner-radius-small)] pb-[var(--corner-radius-small)] px-2.5 rounded-[var(--corner-radius-small)] border-[0.8px] border-solid border-color-mode-text-icons-t-placeholder hover:bg-color-mode-surface-bg-icon-gray"
            >
              <div className="flex items-center gap-[var(--corner-radius-small)]">
                <span className="font-body-body-2 text-[length:var(--body-body-2-font-size)] text-color-mode-text-icons-t-sec [direction:rtl]">
                  إضافة سائق جديد للمركبة
                </span>
                <Plus className="w-4 h-4 text-gray-500" />
              </div>
            </button>
            <ExportMenu />
          </div>
        </header>

        {/* Bordered frame around table and pagination */}
        <div className="w-full rounded-[var(--corner-radius-large)] border border-color-mode-text-icons-t-placeholder bg-white p-4 shadow-sm">
          <div className="w-full overflow-x-auto hidden lg:block">
            <Table columns={columnsReversed as any} data={paginated as any} />
          </div>
          <div className="w-full overflow-x-auto hidden md:block lg:hidden">
            <Table
              columns={(columnsReversed as any).filter(
                (c: any) => c.priority !== "low"
              )}
              data={paginated as any}
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={
              paginated.length === 0
                ? 1
                : Math.ceil(drivers.length / itemsPerPage)
            }
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {isDriversListOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <UserRound className="w-5 h-5 text-gray-500" />
                  <h3 className="text-base font-semibold text-gray-900">
                    جميع السائقين المتاحين
                  </h3>
                </div>
                <button
                  onClick={() => setIsDriversListOpen(false)}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  aria-label="إغلاق"
                >
                  ×
                </button>
              </div>

              <div
                className="px-5 py-4 max-h-[55vh] overflow-y-auto space-y-2"
                dir="rtl"
              >
                {isAllDriversLoading ? (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner message="جاري تحميل قائمة السائقين..." />
                  </div>
                ) : allDriversError ? (
                  <div className="py-10 text-center text-red-600">
                    {allDriversError}
                  </div>
                ) : allDrivers.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">
                    لا توجد بيانات للسائقين حالياً.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allDrivers.map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {driver.name}
                        </span>
                        <button
                          onClick={() => handleAddDriverToVehicle(driver)}
                          disabled={
                            assigningDriverId === driver.assignmentIdentifier ||
                            assignedIdentifiers.has(driver.assignmentIdentifier)
                          }
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#5A66C1] text-white hover:bg-[#4A5AB1] disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
                        >
                          {assignedIdentifiers.has(driver.assignmentIdentifier)
                            ? "مضاف"
                            : assigningDriverId === driver.assignmentIdentifier
                            ? "جاري الإضافة..."
                            : "إضافة"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default PetrolifeCarDetails;
