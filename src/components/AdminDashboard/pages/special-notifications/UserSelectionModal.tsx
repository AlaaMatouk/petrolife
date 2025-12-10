import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check } from "lucide-react";
import {
  fetchAllDriversForNotification,
  fetchAllServiceProvidersForNotification,
  fetchAllCompaniesForNotification,
  fetchAllClientsForNotification,
  UserItem,
} from "../../../../services/notificationService";

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedUsers: UserItem[]) => void;
  initialSelectedUsers?: UserItem[];
}

const UserSelectionModal = ({
  isOpen,
  onClose,
  onSave,
  initialSelectedUsers = [],
}: UserSelectionModalProps) => {
  const [activeTab, setActiveTab] = useState<
    "drivers" | "service-providers" | "companies" | "clients"
  >("drivers");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserItem[]>(initialSelectedUsers);
  const [loading, setLoading] = useState(true);

  // User data state
  const [drivers, setDrivers] = useState<UserItem[]>([]);
  const [serviceProviders, setServiceProviders] = useState<UserItem[]>([]);
  const [companies, setCompanies] = useState<UserItem[]>([]);
  const [clients, setClients] = useState<UserItem[]>([]);

  // Fetch all users on mount
  useEffect(() => {
    if (isOpen) {
      const fetchAllUsers = async () => {
        setLoading(true);
        try {
          const [driversData, serviceProvidersData, companiesData, clientsData] =
            await Promise.all([
              fetchAllDriversForNotification(),
              fetchAllServiceProvidersForNotification(),
              fetchAllCompaniesForNotification(),
              fetchAllClientsForNotification(),
            ]);

          setDrivers(driversData);
          setServiceProviders(serviceProvidersData);
          setCompanies(companiesData);
          setClients(clientsData);
        } catch (error) {
          console.error("Error fetching users:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchAllUsers();
    }
  }, [isOpen]);

  // Reset selected users when modal opens with initial selection
  useEffect(() => {
    if (isOpen && initialSelectedUsers.length > 0) {
      setSelectedUsers(initialSelectedUsers);
    } else if (isOpen) {
      setSelectedUsers([]);
    }
  }, [isOpen, initialSelectedUsers]);

  // Get current tab's users
  const currentUsers = useMemo(() => {
    switch (activeTab) {
      case "drivers":
        return drivers;
      case "service-providers":
        return serviceProviders;
      case "companies":
        return companies;
      case "clients":
        return clients;
      default:
        return [];
    }
  }, [activeTab, drivers, serviceProviders, companies, clients]);

  // Filter users by search query - only filter within the active tab
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentUsers;
    }

    const query = searchQuery.toLowerCase();
    // Filter only within the current tab's users
    return currentUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [currentUsers, searchQuery]);

  // Create a unique key for each user
  const getUserKey = (user: UserItem): string => {
    // Ensure we have valid identifiers
    const id = user.id || '';
    const email = user.email || '';
    const userType = user.userType || '';
    return `${userType}-${id}-${email}`;
  };

  // Check if user is selected
  const isUserSelected = (user: UserItem) => {
    if (!user || !user.id) return false;
    const userKey = getUserKey(user);
    return selectedUsers.some((selected) => {
      if (!selected || !selected.id) return false;
      return getUserKey(selected) === userKey;
    });
  };

  // Toggle user selection
  const toggleUserSelection = (user: UserItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!user || !user.id) {
      console.warn("Cannot select user with missing data:", user);
      return;
    }

    const userKey = getUserKey(user);
    if (isUserSelected(user)) {
      setSelectedUsers((prev) =>
        prev.filter((selected) => {
          if (!selected || !selected.id) return true;
          return getUserKey(selected) !== userKey;
        })
      );
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  // Handle save
  const handleSave = () => {
    onSave(selectedUsers);
    onClose();
  };

  // Tabs configuration
  const tabs = [
    {
      id: "drivers" as const,
      label: "تطبيق السائق",
      count: drivers.length,
    },
    {
      id: "service-providers" as const,
      label: "مزودو الخدمة",
      count: serviceProviders.length,
    },
    {
      id: "companies" as const,
      label: "الشركات",
      count: companies.length,
    },
    {
      id: "clients" as const,
      label: "الأفراد",
      count: clients.length,
    },
  ];

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">اختر المستخدمين</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث هنا"
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A66C1]"
              dir="rtl"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-[#5A66C1] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">جاري التحميل...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-500 text-lg">
                {searchQuery ? "لا توجد نتائج" : "لا يوجد مستخدمين"}
              </div>
              {searchQuery && (
                <div className="text-gray-400 text-sm mt-2">
                  جرب البحث بكلمات مختلفة
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user, index) => {
                if (!user || !user.id) {
                  console.warn("Skipping user with missing data:", user);
                  return null;
                }
                
                const isSelected = isUserSelected(user);
                const uniqueKey = `${user.userType}-${user.id}-${user.email || 'no-email'}-${index}`;
                return (
                  <div
                    key={uniqueKey}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer select-none"
                    onClick={(e) => toggleUserSelection(user, e)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-[#5A66C1] border-[#5A66C1]"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 text-right">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      {user.email && (
                        <div className="text-sm text-gray-500">{user.email}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
          >
            رجوع
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-[#5A66C1] hover:bg-[#4A5AB1] text-white font-medium transition-colors"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UserSelectionModal;

