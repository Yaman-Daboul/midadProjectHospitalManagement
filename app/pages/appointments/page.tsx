import { useEffect, useMemo, useState } from "react";
import type { FieldConfig, ApptStatus } from "../types";
import { INIT_PATIENTS, INIT_DOCTORS } from "../data/initialData";
import {
  SectionHeader,
  SearchBar,
  Card,
  apptBadge,
  ConfirmDelete,
  FormModal,
  DataTable,
  DateRangeFilter,
} from "../components/shared";
import type { ColumnDef } from "../components/shared/DataTable";
import useGet from "../hooks/useGet";
import useApiMutation from "../hooks/useApiMutation";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../hooks/usePermissions";

type Appointment = {
  id: string | number;
  patient: string;
  doctor: string;
  patientId?: string;
  doctorId?: string;
  date: string;
  time: string;
  type: string;
  status: ApptStatus;
  notes?: string;
  durationMinutes?: number;
  scheduledAt?: string;
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const perm = usePermissions("appointments");

  const [filter, setFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [patientName, setPatientName] = useState("");
  const [debouncedPatientName, setDebouncedPatientName] = useState("");
  const [page] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedPatientName(patientName.trim()), 400);
    return () => window.clearTimeout(t);
  }, [patientName]);
  const [modal, setModal] = useState<null | {
    mode: "add" | "edit";
    data?: Appointment;
  }>(null);
  const [delId, setDelId] = useState<string | number | null>(null);

  const statusParam = filter === "all" ? "" : filter;

  const appointmentParams = {
    page,
    limit,
    status: statusParam,
    from: fromDate,
    to: toDate,
    patientName: debouncedPatientName,
    ...(user?.role === "doctor" ? { doctor: user.id } : {}),
    ...(user?.role === "patient" ? { patient: user.id } : {}),
  };

  const appointmentsQuery = useGet({
    endpoint: "appointments",
    queryKey: "appointments",
    params: appointmentParams,
  });
  const appointmentsData =
    appointmentsQuery.data?.data ?? appointmentsQuery.data;

  // Patients and doctors for selects and name lookup
  const patientsQuery = useGet({
    endpoint: "patients",
    queryKey: "patients-list",
  });
  const doctorsQuery = useGet({
    endpoint: "doctors",
    queryKey: "doctors-list",
    params: { page: 1, limit: 1000 },
  });

  const patientsList =
    patientsQuery.data?.data?.items ??
    patientsQuery.data?.items ??
    patientsQuery.data ??
    INIT_PATIENTS;
  const doctorsList =
    doctorsQuery.data?.data?.items ??
    doctorsQuery.data?.items ??
    doctorsQuery.data ??
    INIT_DOCTORS;

  const patientNameMap: Record<string, string> = {};
  (Array.isArray(patientsList) ? patientsList : []).forEach((p: any) => {
    const id = String(p.id ?? p._id ?? p._doc ?? p.name ?? "");
    const label =
      (p.fullName ??
        p.name ??
        `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()) ||
      id;
    if (id) patientNameMap[id] = label;
  });
  const doctorNameMap: Record<string, string> = {};
  (Array.isArray(doctorsList) ? doctorsList : []).forEach((d: any) => {
    const id = String(d.id ?? d._id ?? d._doc ?? d.name ?? "");
    const label =
      (d.fullName ??
        d.name ??
        d.user?.name ??
        `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim()) ||
      id;
    if (id) doctorNameMap[id] = label;
  });

  const items: Appointment[] = useMemo(() => {
    const list = appointmentsData?.items ?? [];
    return Array.isArray(list)
      ? list.map(
          (a: any) =>
            ({
              id: a.id ?? a._id ?? a._doc ?? crypto.randomUUID(),
              patientId:
                typeof a.patient === "object" && a.patient !== null
                  ? String(
                      a.patient.id ?? a.patient._id ?? a.patient._doc ?? "",
                    )
                  : String(a.patient ?? ""),
              doctorId:
                typeof a.doctor === "object" && a.doctor !== null
                  ? String(a.doctor.id ?? a.doctor._id ?? a.doctor._doc ?? "")
                  : String(a.doctor ?? ""),
              patient:
                typeof a.patient === "object" && a.patient !== null
                  ? (a.patient.fullName ??
                    a.patient.name ??
                    a.patient.user?.name ??
                    String(a.patient.id ?? a.patient._id ?? ""))
                  : (patientNameMap[String(a.patient ?? "")] ??
                    String(a.patient ?? "")),
              doctor:
                typeof a.doctor === "object" && a.doctor !== null
                  ? (a.doctor.fullName ??
                    a.doctor.name ??
                    a.doctor.user?.name ??
                    String(a.doctor.id ?? a.doctor._id ?? ""))
                  : (doctorNameMap[String(a.doctor ?? "")] ??
                    String(a.doctor ?? "")),
              date: "",
              time: "",
              type: a.type ?? a.reason ?? "",
              status: ([
                "pending",
                "confirmed",
                "completed",
                "cancelled",
              ].includes(a.status)
                ? a.status
                : "pending") as ApptStatus,
              notes: a.notes ?? "",
              durationMinutes: a.durationMinutes ?? a.duration_minutes ?? 30,
              scheduledAt: a.scheduledAt ?? a.scheduled_at ?? "",
            }) as Appointment,
        )
      : [];
  }, [appointmentsData]);

  // دالة مساعدة لتحويل الوقت إلى صيغة 24 ساعة
  const formatTimeTo24Hour = (timeStr: string): string => {
    if (!timeStr) return "";
    
    // إذا كان الوقت بالفعل بصيغة HH:mm
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    
    try {
      const date = new Date(`2000-01-01 ${timeStr}`);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    } catch (e) {
      // تجاهل الأخطاء
    }
    
    return timeStr;
  };

  // format date/time from scheduledAt or fallback fields
  const formattedItems = items.map((it) => {
    const out = { ...it } as Appointment & { date: string; time: string };
    const raw = (appointmentsData?.items ?? []).find(
      (a: any) => String(a.id ?? a._id ?? a._doc ?? "") === String(it.id),
    );
    const sched = raw?.scheduledAt ?? raw?.scheduled_at ?? raw?.scheduledAtISO ?? it.scheduledAt;
    if (sched) {
      const dt = new Date(sched);
      if (!Number.isNaN(dt.getTime())) {
        out.date = dt.toISOString().split("T")[0];
        out.time = dt.toLocaleTimeString('en-GB', {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
        return out;
      }
    }
    // fallbacks
    out.date = raw?.date ?? it.date ?? "";
    out.time = formatTimeTo24Hour(raw?.time ?? it.time ?? "");
    return out;
  });

  const columns: ColumnDef<Appointment>[] = [
    {
      header: "المريض",
      cell: (a) => (
        <span className="font-medium">
          {patientNameMap[(a as any).patientId ?? a.patient] ?? a.patient}
        </span>
      ),
    },
    {
      header: "الطبيب",
      cell: (a) => (
        <span className="text-sm">
          {doctorNameMap[(a as any).doctorId ?? a.doctor] ?? a.doctor}
        </span>
      ),
    },
    {
      header: "التاريخ",
      cell: (a) => <span className="font-mono text-sm">{a.date}</span>,
    },
    {
      header: "الوقت",
      cell: (a) => (
        <span className="font-mono text-sm font-semibold text-primary">
          {a.time}
        </span>
      ),
    },
    {
      header: "النوع",
      cell: (a) => (
        <span className="px-2 py-1 bg-muted/50 text-xs rounded-lg">
          {a.type}
        </span>
      ),
    },
    { header: "الحالة", cell: (a) => apptBadge(a.status as ApptStatus) },
  ];

  const total =
    appointmentsData?.meta?.total ??
    appointmentsQuery.data?.total ??
    items.length;

  const createAppt = useApiMutation({
    method: "post",
    endpoint: "appointments",
    queryKey: "appointments",
    successMessage: "تمت إضافة الموعد بنجاح",
  });
  const updateAppt = useApiMutation({
    method: "patch",
    endpoint: "appointments",
    queryKey: "appointments",
    successMessage: "تم تعديل الموعد بنجاح",
  });
  const deleteAppt = useApiMutation({
    method: "delete",
    endpoint: "appointments",
    queryKey: "appointments",
    successMessage: "تم حذف الموعد بنجاح",
  });

  const save = (d: Record<string, unknown>) => {
    if (!modal) return;
    const payload: any = {
      patient: d.patient,
      doctor: d.doctor,
      durationMinutes: (d as any).durationMinutes ?? 30,
      reason: d.type ?? d.reason,
      notes: d.notes,
      status: d.status ?? "pending",
    };

    // build scheduledAt only if date/time form valid
    const dateStr = d.date ? String(d.date).trim() : "";
    const timeStr = d.time ? String(d.time).trim() : "";
    if (dateStr) {
      const candidate = timeStr ? `${dateStr}T${timeStr}:00` : `${dateStr}T00:00:00`;
      const dt = new Date(candidate);
      if (!Number.isNaN(dt.getTime())) payload.scheduledAt = dt.toISOString();
    }

    if (!perm.canCreate && !perm.canEdit) return;

    if (modal.mode === "add") {
      createAppt.mutate({ data: payload });
    } else {
      updateAppt.mutate({ id: modal.data?.id, data: payload });
    }

    setModal(null);
  };

  const renderMobileCard = (a: Appointment, actions: React.ReactNode) => (
    <Card key={a.id} className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold">{a.patient}</p>
          <p className="text-xs text-muted-foreground">{a.doctor}</p>
        </div>
        {actions}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="font-mono">{a.date}</span> ·{" "}
          <span className="font-mono font-semibold text-primary">{a.time}</span>{" "}
          · {a.type}
        </div>
        {apptBadge(a.status)}
      </div>
    </Card>
  );

  const patientOptions = (Array.isArray(patientsList) ? patientsList : []).map(
    (p: any) => ({
      label:
        p.fullName ??
        p.name ??
        `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
      value: String(p.id ?? p._id ?? p._doc ?? p.name),
    }),
  );
  const doctorOptions = (Array.isArray(doctorsList) ? doctorsList : []).map(
    (d: any) => ({
      label:
        d.fullName ??
        d.name ??
        d.user?.name ??
        `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim(),
      value: String(d.id ?? d._id ?? d._doc ?? d.name),
    }),
  );

  const fields: FieldConfig[] = [
    {
      key: "patient",
      label: "المريض",
      type: "select",
      options: patientOptions,
    },
    { key: "doctor", label: "الطبيب", type: "select", options: doctorOptions },
    { key: "date", label: "التاريخ", type: "date" },
    { key: "time", label: "الوقت", type: "time" },
    { key: "durationMinutes", label: "المدة (دقائق)", type: "number" },
    { key: "type", label: "السبب", type: "text" },
    { key: "notes", label: "ملاحظات", type: "textarea" },
    {
      key: "status",
      label: "الحالة",
      type: "select",
      options: ["pending", "confirmed", "completed", "cancelled"],
    },
  ];

  // تحضير البيانات الأولية للفورم عند التعديل
  const getInitialFormData = (): Record<string, unknown> | undefined => {
    if (!modal?.data) return undefined;
    
    const appointment = modal.data;
    const raw = (appointmentsData?.items ?? []).find(
      (a: any) => String(a.id ?? a._id ?? a._doc ?? "") === String(appointment.id)
    );
    
    const sched = raw?.scheduledAt ?? raw?.scheduled_at ?? appointment.scheduledAt;
    let date = appointment.date || "";
    let time = appointment.time || "";
    
    if (sched) {
      const dt = new Date(sched);
      if (!Number.isNaN(dt.getTime())) {
        date = dt.toISOString().split("T")[0];
        time = dt.toLocaleTimeString('en-GB', {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
      }
    }
    
    // الحصول على patient ID و doctor ID الصحيحين
    let patientId = appointment.patientId || "";
    let doctorId = appointment.doctorId || "";
    
    // إذا كان raw موجوداً، نستخرج patient و doctor IDs منه
    if (raw) {
      if (typeof raw.patient === "object" && raw.patient !== null) {
        patientId = String(raw.patient.id ?? raw.patient._id ?? raw.patient._doc ?? patientId);
      } else if (raw.patient) {
        patientId = String(raw.patient);
      }
      
      if (typeof raw.doctor === "object" && raw.doctor !== null) {
        doctorId = String(raw.doctor.id ?? raw.doctor._id ?? raw.doctor._doc ?? doctorId);
      } else if (raw.doctor) {
        doctorId = String(raw.doctor);
      }
    }
    
    // إذا لم نجد patientId، نحاول البحث عن المريض بالاسم
    if (!patientId && appointment.patient) {
      const foundPatient = (Array.isArray(patientsList) ? patientsList : []).find(
        (p: any) => {
          const pName = p.fullName ?? p.name ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
          return pName === appointment.patient;
        }
      );
      if (foundPatient) {
        patientId = String(foundPatient.id ?? foundPatient._id ?? foundPatient._doc ?? "");
      }
    }
    
    // إذا لم نجد doctorId، نحاول البحث عن الطبيب بالاسم
    if (!doctorId && appointment.doctor) {
      const foundDoctor = (Array.isArray(doctorsList) ? doctorsList : []).find(
        (d: any) => {
          const dName = d.fullName ?? d.name ?? d.user?.name ?? `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim();
          return dName === appointment.doctor;
        }
      );
      if (foundDoctor) {
        doctorId = String(foundDoctor.id ?? foundDoctor._id ?? foundDoctor._doc ?? "");
      }
    }
    
    return {
      patient: patientId,
      doctor: doctorId,
      date: date,
      time: time,
      durationMinutes: appointment.durationMinutes || raw?.durationMinutes || raw?.duration_minutes || 30,
      type: appointment.type || raw?.type || raw?.reason || "",
      notes: appointment.notes || raw?.notes || "",
      status: appointment.status || raw?.status || "pending",
    };
  };

  return (
    <div>
      <SectionHeader
        title="إدارة المواعيد"
        subtitle={`${total} موعد`}
        onAdd={perm.canCreate ? () => setModal({ mode: "add" }) : undefined}
      />
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              value={patientName}
              onChange={setPatientName}
              placeholder="بحث باسم المريض..."
            />
          </div>
          <DateRangeFilter
            from={fromDate}
            to={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
          ["all", "الكل"],
          ["pending", "معلق"],
          ["confirmed", "مؤكد"],
          ["completed", "مكتمل"],
          ["cancelled", "ملغي"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filter === v
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:bg-muted/30"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      </div>

      <DataTable
        data={formattedItems}
        columns={columns}
        renderMobileCard={renderMobileCard}
        onEdit={
          perm.canEdit
            ? (a) => {
                const fullAppointment = formattedItems.find(
                  (item) => String(item.id) === String(a.id)
                );
                setModal({
                  mode: "edit",
                  data: fullAppointment || a,
                });
              }
            : undefined
        }
        onDelete={perm.canDelete ? (a) => setDelId(a.id) : undefined}
      />

      {modal && (
        <FormModal
          title={modal.mode === "add" ? "إضافة موعد" : "تعديل الموعد"}
          fields={fields}
          initial={getInitialFormData()}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
      {delId !== null && (
        <ConfirmDelete
          name={`موعد ${formattedItems.find((a) => a.id === delId)?.patient ?? ""}`}
          onConfirm={() => {
            if (perm.canDelete && delId !== null) deleteAppt.mutate({ id: delId });
            setDelId(null);
          }}
          onClose={() => setDelId(null)}
        />
      )}
    </div>
  );
}