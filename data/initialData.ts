import type { ElementType } from "react";
import {
  LayoutDashboard,
  Calendar,
  FlaskConical,
  Pill,
  Package,
  Receipt,
  Bell,
  Shield,
  ClipboardList,
  HeartPulse,
  Coffee,
  Stethoscope,
  Users,
} from "lucide-react";
import type { Role, Section, ApptStatus, PayStatus } from "../types";

// ── Patients ────────────────────────────────────────────────────
export const INIT_PATIENTS = [
  {
    id: 1,
    name: "أحمد محمد السالم",
    age: 45,
    gender: "ذكر",
    phone: "0501234567",
    blood: "A+",
    address: "الرياض، حي النزهة",
    dob: "1979-03-15",
    status: "نشط",
    doctor: "د. خالد عبدالرحمن",
  },
  {
    id: 2,
    name: "فاطمة علي الزهراني",
    age: 32,
    gender: "أنثى",
    phone: "0552345678",
    blood: "O-",
    address: "جدة، حي الحمراء",
    dob: "1992-07-22",
    status: "نشط",
    doctor: "د. سارة محمود",
  },
  {
    id: 3,
    name: "عمر عبدالله القحطاني",
    age: 58,
    gender: "ذكر",
    phone: "0513456789",
    blood: "B+",
    address: "الدمام، حي الفيصلية",
    dob: "1966-11-08",
    status: "محجوز",
    doctor: "د. خالد عبدالرحمن",
  },
  {
    id: 4,
    name: "نورا سعد العتيبي",
    age: 28,
    gender: "أنثى",
    phone: "0564567890",
    blood: "AB+",
    address: "مكة المكرمة",
    dob: "1996-04-30",
    status: "نشط",
    doctor: "د. رانيا حسن",
  },
  {
    id: 5,
    name: "محمد إبراهيم الدوسري",
    age: 67,
    gender: "ذكر",
    phone: "0535678901",
    blood: "A-",
    address: "المدينة المنورة",
    dob: "1957-09-14",
    status: "حرج",
    doctor: "د. أحمد الشريف",
  },
  {
    id: 6,
    name: "ليلى خالد المطيري",
    age: 41,
    gender: "أنثى",
    phone: "0576789012",
    blood: "O+",
    address: "الرياض، حي العليا",
    dob: "1983-12-05",
    status: "نشط",
    doctor: "د. سارة محمود",
  },
];

// ── Doctors ─────────────────────────────────────────────────────
export const INIT_DOCTORS = [
  {
    id: 1,
    name: "د. خالد عبدالرحمن",
    specialty: "طب باطني",
    phone: "0551234567",
    email: "khalid@hospital.sa",
    patients: 24,
    shift: "صباحي",
    status: "نشط",
    exp: 12,
  },
  {
    id: 2,
    name: "د. سارة محمود",
    specialty: "طب الأطفال",
    phone: "0562345678",
    email: "sara@hospital.sa",
    patients: 18,
    shift: "مسائي",
    status: "نشط",
    exp: 8,
  },
  {
    id: 3,
    name: "د. أحمد الشريف",
    specialty: "القلب والأوعية",
    phone: "0543456789",
    email: "ahmed@hospital.sa",
    patients: 31,
    shift: "صباحي",
    status: "نشط",
    exp: 15,
  },
  {
    id: 4,
    name: "د. رانيا حسن",
    specialty: "النساء والتوليد",
    phone: "0514567890",
    email: "rania@hospital.sa",
    patients: 22,
    shift: "مسائي",
    status: "إجازة",
    exp: 10,
  },
  {
    id: 5,
    name: "د. فيصل الغامدي",
    specialty: "الجراحة العامة",
    phone: "0525678901",
    email: "faisal@hospital.sa",
    patients: 15,
    shift: "صباحي",
    status: "نشط",
    exp: 20,
  },
];

// ── Staff ────────────────────────────────────────────────────────
export const INIT_STAFF = [
  {
    id: 1,
    name: "سلمى ناصر",
    position: "ممرضة أولى",
    dept: "طوارئ",
    phone: "0501111111",
    status: "نشط",
    joined: "2021-03-15",
  },
  {
    id: 2,
    name: "عبدالعزيز السعيد",
    position: "مسؤول استقبال",
    dept: "الاستقبال",
    phone: "0502222222",
    status: "نشط",
    joined: "2020-07-01",
  },
  {
    id: 3,
    name: "تغريد المالكي",
    position: "محاسبة",
    dept: "المالية",
    phone: "0503333333",
    status: "نشط",
    joined: "2019-11-10",
  },
  {
    id: 4,
    name: "طارق العمري",
    position: "فني مختبر",
    dept: "المختبر",
    phone: "0504444444",
    status: "إجازة",
    joined: "2022-01-20",
  },
];

// ── Appointments ─────────────────────────────────────────────────
export const INIT_APPOINTMENTS = [
  {
    id: 1,
    patient: "أحمد محمد السالم",
    doctor: "د. خالد عبدالرحمن",
    date: "2026-06-24",
    time: "09:00",
    status: "confirmed" as ApptStatus,
    type: "متابعة",
  },
  {
    id: 2,
    patient: "فاطمة علي الزهراني",
    doctor: "د. سارة محمود",
    date: "2026-06-24",
    time: "09:30",
    status: "pending" as ApptStatus,
    type: "كشف",
  },
  {
    id: 3,
    patient: "عمر عبدالله القحطاني",
    doctor: "د. أحمد الشريف",
    date: "2026-06-24",
    time: "10:00",
    status: "completed" as ApptStatus,
    type: "استشارة",
  },
  {
    id: 4,
    patient: "نورا سعد العتيبي",
    doctor: "د. رانيا حسن",
    date: "2026-06-25",
    time: "11:00",
    status: "pending" as ApptStatus,
    type: "كشف",
  },
  {
    id: 5,
    patient: "محمد إبراهيم الدوسري",
    doctor: "د. خالد عبدالرحمن",
    date: "2026-06-25",
    time: "14:00",
    status: "confirmed" as ApptStatus,
    type: "متابعة",
  },
  {
    id: 6,
    patient: "ليلى خالد المطيري",
    doctor: "د. سارة محمود",
    date: "2026-06-23",
    time: "08:30",
    status: "cancelled" as ApptStatus,
    type: "كشف",
  },
];

// ── Labs ─────────────────────────────────────────────────────────
export const INIT_LABS = [
  {
    id: 1,
    patient: "أحمد محمد السالم",
    doctor: "د. خالد عبدالرحمن",
    test: "تحليل الدم الشامل CBC",
    date: "2026-06-20",
    result: "طبيعي",
    flag: "normal",
  },
  {
    id: 2,
    patient: "فاطمة علي الزهراني",
    doctor: "د. سارة محمود",
    test: "سكر الدم الصيامي FBS",
    date: "2026-06-21",
    result: "مرتفع — 7.1 mmol/L",
    flag: "warning",
  },
  {
    id: 3,
    patient: "محمد إبراهيم الدوسري",
    doctor: "د. أحمد الشريف",
    test: "تخطيط القلب ECG",
    date: "2026-06-22",
    result: "غير طبيعي — ST elevation",
    flag: "critical",
  },
  {
    id: 4,
    patient: "عمر عبدالله القحطاني",
    doctor: "د. خالد عبدالرحمن",
    test: "وظائف الكلى",
    date: "2026-06-23",
    result: "قيد المعالجة",
    flag: "pending",
  },
];

// ── Medications ──────────────────────────────────────────────────
export const INIT_MEDS = [
  {
    id: 1,
    name: "أموكسيسيلين 500mg",
    category: "مضاد حيوي",
    unit: "علبة",
    qty: 245,
    minQty: 50,
    price: 25,
    expiry: "2027-12-31",
  },
  {
    id: 2,
    name: "باراسيتامول 1g",
    category: "مسكن",
    unit: "علبة",
    qty: 18,
    minQty: 100,
    price: 8,
    expiry: "2027-06-30",
  },
  {
    id: 3,
    name: "أملوديبين 5mg",
    category: "قلب وأوعية",
    unit: "علبة",
    qty: 89,
    minQty: 30,
    price: 45,
    expiry: "2028-03-31",
  },
  {
    id: 4,
    name: "ميتفورمين 500mg",
    category: "سكري",
    unit: "علبة",
    qty: 156,
    minQty: 40,
    price: 18,
    expiry: "2027-09-30",
  },
  {
    id: 5,
    name: "أسبرين 81mg",
    category: "مميع الدم",
    unit: "علبة",
    qty: 12,
    minQty: 50,
    price: 12,
    expiry: "2027-08-31",
  },
];

// ── Equipment ────────────────────────────────────────────────────
export const INIT_EQUIPMENT = [
  {
    id: 1,
    name: "جهاز تخطيط القلب ECG",
    qty: 4,
    available: 3,
    status: "متاح",
    lastMaintenance: "2026-04-01",
  },
  {
    id: 2,
    name: "جهاز الأشعة السينية",
    qty: 2,
    available: 1,
    status: "متاح",
    lastMaintenance: "2026-03-15",
  },
  {
    id: 3,
    name: "سرير طبي كهربائي",
    qty: 45,
    available: 38,
    status: "متاح",
    lastMaintenance: "2026-05-01",
  },
  {
    id: 4,
    name: "مضخة الحقن IV Pump",
    qty: 15,
    available: 12,
    status: "صيانة",
    lastMaintenance: "2026-06-10",
  },
];

// ── Bills ────────────────────────────────────────────────────────
export const INIT_BILLS = [
  {
    id: 1001,
    patient: "أحمد محمد السالم",
    date: "2026-06-20",
    amount: 850,
    status: "paid" as PayStatus,
    services: "كشف + تحاليل",
  },
  {
    id: 1002,
    patient: "فاطمة علي الزهراني",
    date: "2026-06-21",
    amount: 1200,
    status: "unpaid" as PayStatus,
    services: "استشارة + أدوية",
  },
  {
    id: 1003,
    patient: "محمد إبراهيم الدوسري",
    date: "2026-06-22",
    amount: 3500,
    status: "paid" as PayStatus,
    services: "قسطرة قلبية",
  },
  {
    id: 1004,
    patient: "عمر عبدالله القحطاني",
    date: "2026-06-23",
    amount: 650,
    status: "unpaid" as PayStatus,
    services: "كشف + أشعة",
  },
];

// ── Shifts ───────────────────────────────────────────────────────
export const INIT_SHIFTS = [
  {
    id: 1,
    name: "مناوبة الصباح",
    start: "07:00",
    end: "15:00",
    date: "2026-06-24",
    doctors: "د. خالد عبدالرحمن، د. أحمد الشريف",
  },
  {
    id: 2,
    name: "مناوبة المساء",
    start: "15:00",
    end: "23:00",
    date: "2026-06-24",
    doctors: "د. سارة محمود، د. رانيا حسن",
  },
  {
    id: 3,
    name: "مناوبة الليل",
    start: "23:00",
    end: "07:00",
    date: "2026-06-24",
    doctors: "د. فيصل الغامدي",
  },
];

// ── Users ────────────────────────────────────────────────────────
export const INIT_USERS = [
  {
    id: 1,
    name: "عبدالله المنصور",
    email: "a.mansour@hospital.sa",
    role: "manager" as Role,
    status: "نشط",
  },
  {
    id: 2,
    name: "سلطان العمري",
    email: "s.omari@hospital.sa",
    role: "admin" as Role,
    status: "نشط",
  },
  {
    id: 3,
    name: "د. خالد عبدالرحمن",
    email: "khalid@hospital.sa",
    role: "doctor" as Role,
    status: "نشط",
  },
  {
    id: 4,
    name: "أحمد محمد السالم",
    email: "ahmed@email.com",
    role: "patient" as Role,
    status: "نشط",
  },
];

// ── Prescriptions ────────────────────────────────────────────────
export const INIT_PRESCRIPTIONS = [
  {
    id: 1,
    patient: "أحمد محمد السالم",
    doctor: "د. خالد عبدالرحمن",
    date: "2026-06-20",
    medications: "أموكسيسيلين 500mg × 3/يوم، باراسيتامول 1g × 4/يوم",
    duration: "7 أيام",
    notes: "يؤخذ بعد الأكل",
  },
  {
    id: 2,
    patient: "فاطمة علي الزهراني",
    doctor: "د. سارة محمود",
    date: "2026-06-21",
    medications: "ميتفورمين 500mg × 2/يوم، أوميغا 3 × 1/يوم",
    duration: "30 يوم",
    notes: "مرتبط بوجبات الطعام",
  },
  {
    id: 3,
    patient: "محمد إبراهيم الدوسري",
    doctor: "د. أحمد الشريف",
    date: "2026-06-22",
    medications: "أملوديبين 5mg × 1/يوم، أسبرين 81mg × 1/يوم",
    duration: "90 يوم",
    notes: "مراقبة ضغط الدم يومياً",
  },
];

// ── Notifications ────────────────────────────────────────────────
export const INIT_NOTIFS = [
  {
    id: 1,
    type: "appointment",
    title: "موعد قريب",
    message: "لديك موعد مع د. خالد عبدالرحمن غداً الساعة 9:00",
    date: "2026-06-23 14:30",
    read: false,
  },
  {
    id: 2,
    type: "lab",
    title: "نتائج التحاليل جاهزة",
    message: "نتائج تحليل الدم الشامل لأحمد محمد جاهزة",
    date: "2026-06-23 12:00",
    read: false,
  },
  {
    id: 3,
    type: "prescription",
    title: "وصفة طبية جديدة",
    message: "تم إصدار وصفة طبية جديدة من د. سارة محمود",
    date: "2026-06-23 10:15",
    read: true,
  },
  {
    id: 4,
    type: "inventory",
    title: "تنبيه نقص مخزون",
    message: "الكمية المتاحة من باراسيتامول 1g وصلت للحد الأدنى",
    date: "2026-06-23 09:00",
    read: false,
  },
  {
    id: 5,
    type: "admin",
    title: "تحديث النظام",
    message: "سيتم إجراء صيانة للنظام الليلة من 2:00 - 4:00 صباحاً",
    date: "2026-06-22 16:00",
    read: true,
  },
  {
    id: 6,
    type: "inventory",
    title: "تنبيه نقص مخزون",
    message: "الكمية المتاحة من أسبرين 81mg وصلت للحد الأدنى",
    date: "2026-06-22 08:00",
    read: false,
  },
];

// ── Demo Credentials ─────────────────────────────────────────────
export const DEMO_USERS: Record<
  string,
  { name: string; email: string; role: Role; avatar: string; password: string }
> = {
  "manager@hospital.sa": {
    name: "عبدالله المنصور",
    email: "manager@hospital.sa",
    role: "manager",
    avatar: "ع",
    password: "123456",
  },
  "admin@hospital.sa": {
    name: "سلطان العمري",
    email: "admin@hospital.sa",
    role: "admin",
    avatar: "س",
    password: "123456",
  },
  "doctor@hospital.sa": {
    name: "د. خالد عبدالرحمن",
    email: "doctor@hospital.sa",
    role: "doctor",
    avatar: "خ",
    password: "123456",
  },
  "staff@hospital.sa": {
    name: "سلمى ناصر",
    email: "staff@hospital.sa",
    role: "staff",
    avatar: "س",
    password: "123456",
  },
  "patient@hospital.sa": {
    name: "أحمد محمد السالم",
    email: "patient@hospital.sa",
    role: "patient",
    avatar: "أ",
    password: "123456",
  },
};

// ── Labels ────────────────────────────────────────────────────
export const ROLE_LABELS: Record<Role, string> = {
  manager: "مدير",
  admin: "إداري",
  staff: "موظف",
  doctor: "طبيب",
  patient: "مريض",
};

// ── Nav Items ────────────────────────────────────────────────────
export const NAV_ITEMS: {
  section: Section;
  path: string;
  label: string;
  icon: ElementType;
  roles: Role[];
}[] = [
  {
    section: "dashboard",
    path: "/",
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    roles: ["manager", "admin"],
  },
  {
    section: "patients",
    path: "/patients",
    label: "المرضى",
    icon: HeartPulse,
    // موظف يرى المرضى أيضاً (له صلاحية إضافة+تعديل)، دكتور يرى مرضاه
    roles: ["manager", "admin", "staff", "doctor"],
  },
  {
    section: "doctors",
    path: "/doctors",
    label: "الأطباء",
    icon: Stethoscope,
    // موظف ودكتور يرون (عرض فقط)
    roles: ["manager", "admin", "staff", "doctor"],
  },
  {
    section: "staff",
    path: "/staff",
    label: "الموظفون",
    icon: Users,
    // فقط مدير وإدارة
    roles: ["manager", "admin"],
  },
  {
    section: "shifts",
    path: "/shifts",
    label: "المناوبات",
    icon: Coffee,
    // موظف: إضافة+تعديل، دكتور: عرض فقط
    roles: ["manager", "admin", "staff", "doctor"],
  },
  {
    section: "appointments",
    path: "/appointments",
    label: "المواعيد",
    icon: Calendar,
    roles: ["manager", "admin", "staff", "doctor", "patient"],
  },
  {
    section: "labs",
    path: "/labs",
    label: "التحاليل",
    icon: FlaskConical,
    // دكتور: كاملة، مريض: عرض تحاليله
    roles: ["doctor", "patient"],
  },
  {
    section: "prescriptions",
    path: "/prescriptions",
    label: "الوصفات الطبية",
    icon: ClipboardList,
    // مدير وإدارة: عرض فقط، دكتور: كاملة، مريض: وصفاته فقط
    roles: ["manager", "admin", "doctor", "patient"],
  },
  {
    section: "medications",
    path: "/medications",
    label: "الأدوية",
    icon: Pill,
    roles: ["manager", "admin"],
  },
  {
    section: "inventory",
    path: "/inventory",
    label: "المستودع",
    icon: Package,
    roles: ["manager", "admin"],
  },
  {
    section: "billing",
    path: "/billing",
    label: "الفواتير",
    icon: Receipt,
    roles: ["manager", "admin", "patient"],
  },
  {
    section: "notifications",
    path: "/notifications",
    label: "الإشعارات",
    icon: Bell,
    roles: ["manager", "admin", "staff", "doctor", "patient"],
  },
  {
    section: "users",
    path: "/users",
    label: "المستخدمون",
    icon: Shield,
    roles: ["manager"],
  },
];

// ── Chart Data ───────────────────────────────────────────────────
export const apptChartData = [
  { day: "الأحد", count: 12 },
  { day: "الإثنين", count: 19 },
  { day: "الثلاثاء", count: 15 },
  { day: "الأربعاء", count: 22 },
  { day: "الخميس", count: 18 },
  { day: "الجمعة", count: 8 },
  { day: "السبت", count: 5 },
];

export const revenueData = [
  { month: "يناير", amount: 45000 },
  { month: "فبراير", amount: 52000 },
  { month: "مارس", amount: 48000 },
  { month: "أبريل", amount: 61000 },
  { month: "مايو", amount: 55000 },
  { month: "يونيو", amount: 67000 },
];

export const statusPieData = [
  { name: "مؤكد", value: 35, color: "#0E7490" },
  { name: "معلق", value: 25, color: "#F59E0B" },
  { name: "مكتمل", value: 30, color: "#10B981" },
  { name: "ملغي", value: 10, color: "#EF4444" },
];
