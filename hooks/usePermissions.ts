import { useAuth } from "../contexts/AuthContext";
import type { Role } from "../types";

// ────────────────────────────────────────────────────────────────────────────
// مركزية الصلاحيات — كل قواعد الوصول مكتوبة هنا فقط
// ────────────────────────────────────────────────────────────────────────────

export interface SectionPermissions {
  /** هل يمكن الوصول لهذا القسم أصلاً؟ */
  canAccess: boolean;
  /** هل يمكن إضافة سجل جديد؟ */
  canCreate: boolean;
  /** هل يمكن تعديل سجل موجود؟ */
  canEdit: boolean;
  /** هل يمكن حذف سجل؟ */
  canDelete: boolean;
  /** هل المستخدم يرى بياناته فقط؟ (مريض / دكتور) */
  isOwnDataOnly: boolean;
}

type Section =
  | "patients"
  | "doctors"
  | "staff"
  | "shifts"
  | "appointments"
  | "labs"
  | "prescriptions";

const FULL: SectionPermissions = {
  canAccess: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  isOwnDataOnly: false,
};

const VIEW_ONLY: SectionPermissions = {
  canAccess: true,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  isOwnDataOnly: false,
};

const NO_ACCESS: SectionPermissions = {
  canAccess: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  isOwnDataOnly: false,
};

// خريطة الصلاحيات: [section][role] → SectionPermissions
const PERMISSION_MAP: Record<Section, Record<Role, SectionPermissions>> = {
  // ──────── إدارة المرضى ────────────────────────────────────────────────
  patients: {
    manager: FULL,
    admin: FULL,
    // موظف: إضافة + تعديل بدون حذف
    staff: { canAccess: true, canCreate: true, canEdit: true, canDelete: false, isOwnDataOnly: false },
    // دكتور: يرى ويعدّل مرضاه فقط، بدون إضافة/حذف
    doctor: { canAccess: true, canCreate: false, canEdit: true, canDelete: false, isOwnDataOnly: true },
    // مريض: يرى بياناته فقط
    patient: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, isOwnDataOnly: true },
  },

  // ──────── إدارة الأطباء ───────────────────────────────────────────────
  doctors: {
    manager: FULL,
    // إدارة: إضافة + تعديل بدون حذف
    admin: { canAccess: true, canCreate: true, canEdit: true, canDelete: false, isOwnDataOnly: false },
    // موظف: عرض فقط
    staff: VIEW_ONLY,
    // دكتور: عرض فقط
    doctor: VIEW_ONLY,
    patient: NO_ACCESS,
  },

  // ──────── إدارة الموظفين ──────────────────────────────────────────────
  staff: {
    manager: FULL,
    // إدارة: إضافة + تعديل بدون حذف
    admin: { canAccess: true, canCreate: true, canEdit: true, canDelete: false, isOwnDataOnly: false },
    staff: NO_ACCESS,
    doctor: NO_ACCESS,
    patient: NO_ACCESS,
  },

  // ──────── المناوبات ───────────────────────────────────────────────────
  shifts: {
    manager: FULL,
    admin: FULL,
    // موظف: إضافة + تعديل بدون حذف
    staff: { canAccess: true, canCreate: true, canEdit: true, canDelete: false, isOwnDataOnly: false },
    // دكتور: عرض فقط
    doctor: VIEW_ONLY,
    patient: NO_ACCESS,
  },

  // ──────── المواعيد ────────────────────────────────────────────────────
  appointments: {
    manager: FULL,
    admin: FULL,
    staff: FULL,
    // دكتور: عرض + تعديل مواعيده فقط (بدون إضافة أو حذف)
    doctor: { canAccess: true, canCreate: false, canEdit: true, canDelete: false, isOwnDataOnly: true },
    // مريض: عرض مواعيده فقط
    patient: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, isOwnDataOnly: true },
  },

  // ──────── التحاليل ────────────────────────────────────────────────────
  labs: {
    manager: NO_ACCESS,
    admin: NO_ACCESS,
    staff: NO_ACCESS,
    // دكتور: إدارة كاملة (إنشاء + تعديل + حذف + رفع PDF)
    doctor: FULL,
    // مريض: عرض تحاليله فقط
    patient: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, isOwnDataOnly: true },
  },

  // ──────── الوصفات ─────────────────────────────────────────────────────
  prescriptions: {
    manager: VIEW_ONLY,
    // إدارة: عرض فقط
    admin: VIEW_ONLY,
    staff: NO_ACCESS,
    // دكتور: إنشاء + تعديل + حذف
    doctor: FULL,
    // مريض: عرض وصفاته فقط
    patient: { canAccess: true, canCreate: false, canEdit: false, canDelete: false, isOwnDataOnly: true },
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Hook الرئيسي
// ────────────────────────────────────────────────────────────────────────────

export function usePermissions(section: Section): SectionPermissions {
  const { user } = useAuth();

  if (!user) return NO_ACCESS;

  const role = user.role as Role;
  const sectionMap = PERMISSION_MAP[section];

  if (!sectionMap) return NO_ACCESS;

  return sectionMap[role] ?? NO_ACCESS;
}

/**
 * مساعد للتحقق من دور المستخدم الحالي
 */
export function useRole() {
  const { user } = useAuth();
  const role = (user?.role ?? "patient") as Role;

  return {
    role,
    isManager: role === "manager",
    isAdmin: role === "admin",
    isStaff: role === "staff",
    isDoctor: role === "doctor",
    isPatient: role === "patient",
    isManagerOrAdmin: role === "manager" || role === "admin",
  };
}
