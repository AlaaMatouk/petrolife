import {
  Car,
  Users,
  DollarSign,
  Fuel,
  Wallet,
  Truck,
  Rocket,
  Building2,
} from "lucide-react";
import { StatData } from "./StatsCardsSection";

// Format number with thousands separator (English)
export const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

// Static wallet balance data for testing
const walletBalance = 720250;

export const statsData: StatData[] = [
  // Row 1
  {
    title: "المستخدمين",
    categories: [
      { name: "مزودي الخدمة", count: 0 },
      { name: "افراد", count: 0 },
      { name: "شركات", count: 0 },
      { name: "مشرفين", count: 0 },
    ],
    icon: <Users className="w-5 h-5" style={{ color: "#E76500" }} />,
  },
  {
    title: "الشركات",
    categories: [
      { name: "حسابات بواسطة المناديب", count: 0 },
      { name: "حسابات مباشرة", count: 0 },
    ],
    total: { name: "الاجمالي", count: 0 },
    icon: <Building2 className="w-5 h-5" style={{ color: "#E76500" }} />,
  },
  {
    title: "السائقين",
    categories: [
      { name: "سائقونا بتوصيل الوقود", count: 0 },
      { name: "سائقي الشركات", count: 0 },
    ],
    total: { name: "الاجمالي", count: 0 },
    icon: <Truck className="w-5 h-5" style={{ color: "#E76500" }} />,
  },

  // Row 2
  {
    title: "اجمالي السيارات",
    categories: [
      { name: "صغيرة", count: 0 },
      { name: "متوسطة", count: 0 },
      { name: "كبيرة", count: 0 },
      { name: "VIP", count: 0 },
    ],
    total: { name: "الاجمالي", count: 0 },
    icon: <Car className="w-5 h-5" style={{ color: "#E76500" }} />,
  },
  {
    title: "السيارات المشتركة",
    categories: [
      { name: "صغيرة", count: 0 },
      { name: "متوسطة", count: 0 },
      { name: "كبيرة", count: 0 },
      { name: "VIP", count: 0 },
    ],
    total: { name: "الاجمالي", count: 0 },
    icon: <Car className="w-5 h-5" style={{ color: "#E76500" }} />,
  },
  {
    title: "الاشتراكات",
    categories: [
      { name: "Premium", count: 0 },
      { name: "Classic", count: 0 },
      { name: "Basic", count: 0 },
    ],
    total: { name: "الاشتراكات المنتهية", count: 0 },
    options: ["الأفراد", "الشركات"],
    optionCategories: {
      الأفراد: [
        { name: "Premium", count: 0 },
        { name: "Classic", count: 0 },
        { name: "Basic", count: 0 },
      ],
      الشركات: [
        { name: "Premium", count: 0 },
        { name: "Classic", count: 0 },
        { name: "Basic", count: 0 },
      ],
    },
    optionTotals: {
      الأفراد: { name: "الاشتراكات المنتهية", count: 0 },
      الشركات: { name: "الاشتراكات المنتهية", count: 0 },
    },
    icon: <Rocket className="w-5 h-5" style={{ color: "#E76500" }} />,
  },

  // Row 3
  {
    title: "رصيد محافظ العملاء",
    amount: formatNumber(walletBalance),
    icon: <Wallet className="w-5 h-5" style={{ color: "#E76500" }} />,
    type: "wallet",
  },
  {
    title: "اجمالي اللترات",
    breakdown: [
      {
        type: "ديزل",
        amount: "185 .L",
        color: "text-color-mode-text-icons-t-orange",
      },
      {
        type: "بنزين 95",
        amount: "548 .L",
        color: "text-color-mode-text-icons-t-red",
      },
      {
        type: "بنزين 91",
        amount: "845 .L",
        color: "text-color-mode-text-icons-t-green",
      },
    ],
    icon: <Fuel className="w-5 h-5" style={{ color: "#E76500" }} />,
  },
  {
    title: "اجمالي تكلفة الوقود",
    breakdown: [
      {
        type: "ديزل",
        amount: "0 ر.س",
        color: "text-color-mode-text-icons-t-orange",
      },
      {
        type: "بنزين 95",
        amount: "0 ر.س",
        color: "text-color-mode-text-icons-t-red",
      },
      {
        type: "بنزين 91",
        amount: "0 ر.س",
        color: "text-color-mode-text-icons-t-green",
      },
    ],
    total: { name: "الاجمالي", count: 0 },
    icon: <DollarSign className="w-5 h-5" style={{ color: "#E76500" }} />,
  },

  // Row 4
  {
    title: "عمليات تغيير الزيوت",
    categories: [
      { name: "صغيرة", count: 1250 },
      { name: "متوسطة", count: 3250 },
      { name: "كبيرة", count: 4536 },
      { name: "VIP", count: 425 },
    ],
    icon: <Car className="w-5 h-5" style={{ color: "#E76500" }} />,
  },
  {
    title: "عمليات غسيل السيارات",
    categories: [
      { name: "صغيرة", count: 1250 },
      { name: "متوسطة", count: 3250 },
      { name: "كبيرة", count: 4536 },
      { name: "VIP", count: 425 },
    ],
    icon: <Car className="w-5 h-5" style={{ color: "#E76500" }} />,
  },
  {
    title: "عمليات تغيير الإطارات",
    categories: [
      { name: "صغيرة", count: 1250 },
      { name: "متوسطة", count: 3250 },
      { name: "كبيرة", count: 4536 },
      { name: "VIP", count: 425 },
    ],
    icon: <Car className="w-5 h-5" style={{ color: "#E76500" }} />,
  },
];

// Default selected options for cards with option buttons
export const defaultSelectedOptions = {};
