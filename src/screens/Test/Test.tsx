import React, { useState, useEffect } from "react";
import { ToggleButton } from "../../components/shared/ToggleButton";
import { StatusToggle } from "../../components/shared/StatusToggle";
import {
  Lightbulb,
  Bell,
  Moon,
  Sun,
  Wifi,
  Table,
  Database,
  ShoppingCart,
} from "lucide-react";
import { fetchAllServices, createTestOrderForTransferTesting, updateLastTransferToFullBalance } from "../../services/firestore";

export const Test = (): JSX.Element => {
  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(true);
  const [toggle3, setToggle3] = useState(false);
  const [toggle4, setToggle4] = useState(false);
  const [toggle5, setToggle5] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [wifi, setWifi] = useState(false);
  const [accountStatus1, setAccountStatus1] = useState(true);
  const [accountStatus2, setAccountStatus2] = useState(false);
  const [accountStatus3, setAccountStatus3] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTestOrder, setCreatingTestOrder] = useState(false);
  const [testOrderResult, setTestOrderResult] = useState<string | null>(null);

  // Fetch services data on component mount
  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      try {
        const data = await fetchAllServices();
        setServices(data);
        console.log("Services data in component:", data);
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setLoading(false);
      }
    };

    loadServices();

    // Make functions available in console for testing
    (window as any).createTestOrderForTransferTesting = createTestOrderForTransferTesting;
    (window as any).updateLastTransferToFullBalance = updateLastTransferToFullBalance;
    console.log("✅ Test functions available in console:");
    console.log("  - window.createTestOrderForTransferTesting()");
    console.log("  - window.updateLastTransferToFullBalance(companyEmail)");
  }, []);

  const handleCreateTestOrder = async () => {
    setCreatingTestOrder(true);
    setTestOrderResult(null);
    try {
      const orderId = await createTestOrderForTransferTesting();
      setTestOrderResult(`✅ Test order created successfully! Order ID: ${orderId}`);
      console.log("✅ Test order created:", orderId);
    } catch (error: any) {
      setTestOrderResult(`❌ Error: ${error.message}`);
      console.error("❌ Error creating test order:", error);
    } finally {
      setCreatingTestOrder(false);
    }
  };

  return (
    <div className="flex flex-col w-full items-start gap-8 p-6">
      {/* Test Order Creation Section */}
      <div className="w-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="w-6 h-6" />
              <h2 className="text-2xl font-bold">
                إنشاء طلب تجريبي للتحويل
              </h2>
            </div>
            <p className="text-green-100 text-sm mb-4">
              إنشاء طلب تجريبي بقيمة 3000 ريال لاختبار نظام طلبات التحويل التلقائية
            </p>
            {testOrderResult && (
              <p className={`text-sm font-semibold ${testOrderResult.includes('✅') ? 'text-green-100' : 'text-red-200'}`}>
                {testOrderResult}
              </p>
            )}
          </div>
          <button
            onClick={handleCreateTestOrder}
            disabled={creatingTestOrder}
            className="px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            {creatingTestOrder ? "جاري الإنشاء..." : "إنشاء طلب تجريبي"}
          </button>
        </div>
        <p className="text-green-100 text-xs mt-2">
          💡 يمكنك أيضاً استخدام: window.createTestOrderForTransferTesting() في Console
        </p>
      </div>

      {/* Page Header */}
      <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-8 h-8" />
          <h1 className="text-3xl font-bold">
            اختبار زر التبديل (Toggle Button)
          </h1>
        </div>
        <p className="text-blue-100 text-lg">
          صفحة اختبار لمكون زر التبديل بمختلف الأحجام والألوان والحالات
        </p>
      </div>

      {/* Basic Toggles Section */}
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-lg text-lg">
            1
          </span>
          أزرار التبديل الأساسية
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">زر التبديل الأول</p>
              <p className="text-sm text-gray-600">
                حالة: {toggle1 ? "مفعل ✓" : "غير مفعل ✗"}
              </p>
            </div>
            <ToggleButton
              isOn={toggle1}
              onToggle={setToggle1}
              label="تفعيل/إيقاف"
              color="blue"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">زر التبديل الثاني</p>
              <p className="text-sm text-gray-600">
                حالة: {toggle2 ? "مفعل ✓" : "غير مفعل ✗"}
              </p>
            </div>
            <ToggleButton
              isOn={toggle2}
              onToggle={setToggle2}
              label="تفعيل/إيقاف"
              color="green"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">زر التبديل الثالث</p>
              <p className="text-sm text-gray-600">
                حالة: {toggle3 ? "مفعل ✓" : "غير مفعل ✗"}
              </p>
            </div>
            <ToggleButton
              isOn={toggle3}
              onToggle={setToggle3}
              label="تفعيل/إيقاف"
              color="purple"
            />
          </div>
        </div>
      </div>

      {/* Size Variants */}
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-lg">
            2
          </span>
          أحجام مختلفة
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-800">حجم صغير (Small)</p>
            <ToggleButton
              isOn={toggle4}
              onToggle={setToggle4}
              size="sm"
              color="orange"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-800">حجم متوسط (Medium)</p>
            <ToggleButton
              isOn={toggle4}
              onToggle={setToggle4}
              size="md"
              color="orange"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-800">حجم كبير (Large)</p>
            <ToggleButton
              isOn={toggle4}
              onToggle={setToggle4}
              size="lg"
              color="orange"
            />
          </div>
        </div>
      </div>

      {/* Color Variants */}
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-purple-500 text-white px-3 py-1 rounded-lg text-lg">
            3
          </span>
          ألوان مختلفة
        </h2>

        <div className="space-y-4">
          <ToggleButton
            isOn={toggle5}
            onToggle={setToggle5}
            label="أزرق (Blue)"
            color="blue"
          />
          <ToggleButton
            isOn={toggle5}
            onToggle={setToggle5}
            label="أخضر (Green)"
            color="green"
          />
          <ToggleButton
            isOn={toggle5}
            onToggle={setToggle5}
            label="بنفسجي (Purple)"
            color="purple"
          />
          <ToggleButton
            isOn={toggle5}
            onToggle={setToggle5}
            label="أحمر (Red)"
            color="red"
          />
          <ToggleButton
            isOn={toggle5}
            onToggle={setToggle5}
            label="برتقالي (Orange)"
            color="orange"
          />
        </div>
      </div>

      {/* Practical Examples */}
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-lg">
            4
          </span>
          أمثلة عملية
        </h2>

        <div className="space-y-6">
          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-6 h-6 text-blue-600" />
              ) : (
                <Sun className="w-6 h-6 text-yellow-500" />
              )}
              <div>
                <p className="font-semibold text-gray-800">الوضع الليلي</p>
                <p className="text-sm text-gray-600">
                  {darkMode ? "الوضع الليلي مفعل" : "الوضع النهاري مفعل"}
                </p>
              </div>
            </div>
            <ToggleButton
              isOn={darkMode}
              onToggle={setDarkMode}
              color="purple"
              size="md"
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell
                className={`w-6 h-6 ${
                  notifications ? "text-green-600" : "text-gray-400"
                }`}
              />
              <div>
                <p className="font-semibold text-gray-800">الإشعارات</p>
                <p className="text-sm text-gray-600">
                  {notifications
                    ? "تلقي الإشعارات مفعل"
                    : "تلقي الإشعارات معطل"}
                </p>
              </div>
            </div>
            <ToggleButton
              isOn={notifications}
              onToggle={setNotifications}
              color="green"
              size="md"
            />
          </div>

          {/* WiFi */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Wifi
                className={`w-6 h-6 ${
                  wifi ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <div>
                <p className="font-semibold text-gray-800">الواي فاي</p>
                <p className="text-sm text-gray-600">
                  {wifi ? "متصل بالشبكة" : "غير متصل بالشبكة"}
                </p>
              </div>
            </div>
            <ToggleButton
              isOn={wifi}
              onToggle={setWifi}
              color="blue"
              size="md"
            />
          </div>

          {/* Disabled State */}
          <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <div>
              <p className="font-semibold text-gray-500">
                حالة معطلة (Disabled)
              </p>
              <p className="text-sm text-gray-400">
                لا يمكن التفاعل مع هذا الزر
              </p>
            </div>
            <ToggleButton
              isOn={true}
              onToggle={() => {}}
              label="معطل"
              color="red"
              disabled={true}
            />
          </div>
        </div>
      </div>

      {/* StatusToggle Component Section */}
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-lg">
            5
          </span>
          مكون StatusToggle (للاستخدام في الجداول)
        </h2>

        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Table className="w-5 h-5 text-blue-600" />
            <p className="font-semibold text-blue-900">
              هذا المكون تم إنشاؤه خصيصاً للاستخدام في الجداول
            </p>
          </div>
          <p className="text-sm text-blue-800 [direction:rtl]">
            يستخدم الإعدادات الموحدة: لون أخضر، حجم متوسط - يظهر تلقائياً في
            جميع الجداول التي تحتوي على حالة الحساب
          </p>
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-xs text-green-800">
              ✅ تم إصلاح مشكلة التركيز (focus ring) في المكون
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">حساب نشط 1</p>
              <p className="text-sm text-gray-600">
                حالة: {accountStatus1 ? "مفعل" : "معطل"}
              </p>
            </div>
            <StatusToggle
              isActive={accountStatus1}
              onToggle={() => setAccountStatus1(!accountStatus1)}
              statusText={accountStatus1 ? "مفعل" : "معطل"}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">حساب نشط 2</p>
              <p className="text-sm text-gray-600">
                حالة: {accountStatus2 ? "مفعل" : "معطل"}
              </p>
            </div>
            <StatusToggle
              isActive={accountStatus2}
              onToggle={() => setAccountStatus2(!accountStatus2)}
              statusText={accountStatus2 ? "مفعل" : "معطل"}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">حساب نشط 3</p>
              <p className="text-sm text-gray-600">
                حالة: {accountStatus3 ? "مفعل" : "معطل"}
              </p>
            </div>
            <StatusToggle
              isActive={accountStatus3}
              onToggle={() => setAccountStatus3(!accountStatus3)}
              statusText={accountStatus3 ? "مفعل" : "معطل"}
            />
          </div>

          {/* Without status text */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">بدون نص الحالة</p>
              <p className="text-sm text-gray-600">
                StatusToggle بدون عرض نص الحالة
              </p>
            </div>
            <StatusToggle
              isActive={accountStatus3}
              onToggle={() => setAccountStatus3(!accountStatus3)}
            />
          </div>
        </div>
      </div>

      {/* Services Data Section */}
      <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="bg-indigo-500 text-white px-3 py-1 rounded-lg text-lg">
            6
          </span>
          بيانات الخدمات (Services Collection)
        </h2>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل البيانات...</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <p className="font-semibold text-indigo-900">
                  عدد الخدمات: {services.length}
                </p>
              </div>
              <p className="text-sm text-indigo-800">
                تم جلب جميع البيانات من مجموعة "services" في Firestore
              </p>
            </div>

            {services.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 mb-2">
                  لا توجد خدمات في قاعدة البيانات
                </p>
                <p className="text-sm text-gray-500">
                  تأكد من وجود بيانات في مجموعة "services" في Firestore
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div
                    key={service.id || index}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-800">
                        خدمة #{index + 1}{" "}
                        {service.nameAr && `- ${service.nameAr}`}
                      </h3>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        ID: {service.id}
                      </span>
                    </div>
                    <div className="mt-2">
                      <pre className="bg-white p-4 rounded border border-gray-200 overflow-x-auto text-xs">
                        {JSON.stringify(service, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Console Log Indicator */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>ملاحظة:</strong> يمكنك فتح أدوات المطور (Console)
                لرؤية البيانات المطبوعة
              </p>
            </div>
          </div>
        )}
      </div>

      {/* State Summary */}
      <div className="w-full bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-6">
        <h2 className="text-xl font-bold text-purple-800 mb-4">
          ملخص الحالة الحالية
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">زر التبديل 1</p>
            <p className="text-lg font-bold text-gray-800">
              {toggle1 ? "✓ مفعل" : "✗ معطل"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">زر التبديل 2</p>
            <p className="text-lg font-bold text-gray-800">
              {toggle2 ? "✓ مفعل" : "✗ معطل"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">زر التبديل 3</p>
            <p className="text-lg font-bold text-gray-800">
              {toggle3 ? "✓ مفعل" : "✗ معطل"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">الوضع الليلي</p>
            <p className="text-lg font-bold text-gray-800">
              {darkMode ? "✓ مفعل" : "✗ معطل"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">الإشعارات</p>
            <p className="text-lg font-bold text-gray-800">
              {notifications ? "✓ مفعل" : "✗ معطل"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">الواي فاي</p>
            <p className="text-lg font-bold text-gray-800">
              {wifi ? "✓ مفعل" : "✗ معطل"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">حساب نشط 1</p>
            <p className="text-lg font-bold text-gray-800">
              {accountStatus1 ? "✓ مفعل" : "✗ معطل"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">حساب نشط 2</p>
            <p className="text-lg font-bold text-gray-800">
              {accountStatus2 ? "✓ مفعل" : "✗ معطل"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">حساب نشط 3</p>
            <p className="text-lg font-bold text-gray-800">
              {accountStatus3 ? "✓ مفعل" : "✗ معطل"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
