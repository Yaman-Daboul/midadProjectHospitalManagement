import type { ApptStatus, PayStatus } from "../../types";

export function apptBadge(s: ApptStatus) {
  const m = {
    pending:   ["معلق",  "bg-amber-50 text-amber-700 border-amber-200"],
    confirmed: ["مؤكد",  "bg-cyan-50 text-cyan-700 border-cyan-200"],
    completed: ["مكتمل", "bg-emerald-50 text-emerald-700 border-emerald-200"],
    cancelled: ["ملغي",  "bg-red-50 text-red-700 border-red-200"],
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${m[s][1]}`}>
      {m[s][0]}
    </span>
  );
}

export function statusBadge(s: string) {
  const m: Record<string, string> = {
    "نشط":    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "إجازة":  "bg-amber-50 text-amber-700 border-amber-200",
    "محجوز":  "bg-cyan-50 text-cyan-700 border-cyan-200",
    "حرج":    "bg-red-50 text-red-700 border-red-200",
    "خرج":    "bg-slate-50 text-slate-500 border-slate-200",
    "صيانة":  "bg-amber-50 text-amber-700 border-amber-200",
    "متاح":   "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${m[s] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}>
      {s}
    </span>
  );
}

export function payBadge(s: PayStatus) {
  return s === "paid"
    ? <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">مدفوع</span>
    : <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200">غير مدفوع</span>;
}

export function labBadge(f: string) {
  const m: Record<string, string> = {
    normal:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning:  "bg-amber-50 text-amber-700 border-amber-200",
    critical: "bg-red-50 text-red-700 border-red-200",
    pending:  "bg-slate-50 text-slate-500 border-slate-200",
  };
  const l: Record<string, string> = {
    normal: "طبيعي", warning: "تحذير", critical: "حرج", pending: "معلق",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${m[f]}`}>
      {l[f]}
    </span>
  );
}
