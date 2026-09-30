export type Role = "manager" | "admin" | "staff" | "doctor" | "patient";

export type Section =
  | "dashboard"
  | "patients"
  | "doctors"
  | "staff"
  | "shifts"
  | "appointments"
  | "labs"
  | "prescriptions"
  | "medications"
  | "inventory"
  | "billing"
  | "notifications"
  | "users";

export type ApptStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PayStatus = "paid" | "unpaid";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "time";
  options?: Array<string | FieldOption>;
}
