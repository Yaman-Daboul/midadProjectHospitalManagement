import { Calendar, HeartPulse, FlaskConical, ClipboardList } from "lucide-react";
import { KPICard, Card, apptBadge, labBadge, statusBadge } from "../../../components/shared";
import { Avatar } from "../../../components/shared/Avatar";
import { SectionHeader } from "../../../components/shared/SectionHeader";
import {
  INIT_APPOINTMENTS, INIT_PATIENTS, INIT_LABS, INIT_PRESCRIPTIONS,
} from "@/data/initialData";
import { useAuth } from "../../../contexts/AuthContext";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const doctorName = user?.name ?? "";

  // Filter data for this doctor
  const myAppointments = INIT_APPOINTMENTS.filter((a) => a.doctor === doctorName);
  const myLabs = INIT_LABS.filter((l) => l.doctor === doctorName);
  const myPrescriptions = INIT_PRESCRIPTIONS.filter((p) => p.doctor === doctorName);
  const myPatientNames = [...new Set(myAppointments.map((a) => a.patient))];
  const myPatients = INIT_PATIENTS.filter((p) => myPatientNames.includes(p.name));

  const todayAppts = myAppointments.filter((a) => a.date === "2026-06-24");
  const pendingLabs = myLabs.filter((l) => l.flag === "pending").length;

  return (
    <div>
      <SectionHeader title="لوحة الطبيب" subtitle={`مرحباً، ${doctorName}`} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KPICard label="مرضاي"           value={myPatients.length}     sub="ضمن رعايتي"     icon={HeartPulse}  color="bg-cyan-600" />
        <KPICard label="مواعيد اليوم"    value={todayAppts.length}     sub="موعد اليوم"     icon={Calendar}    color="bg-violet-600" />
        <KPICard label="تحاليل معلقة"   value={pendingLabs}            sub="بانتظار النتيجة" icon={FlaskConical} color="bg-amber-600" />
        <KPICard label="وصفاتي"          value={myPrescriptions.length} sub="وصفة نشطة"      icon={ClipboardList} color="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Today's Appointments */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">مواعيدي اليوم</h3>
          {todayAppts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد مواعيد اليوم</p>
          ) : (
            <div className="space-y-2">
              {todayAppts.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={a.patient} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.patient}</p>
                      <p className="text-xs text-muted-foreground font-mono">{a.time} · {a.type}</p>
                    </div>
                  </div>
                  {apptBadge(a.status)}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Patients */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">مرضاي</h3>
          <div className="space-y-2">
            {myPatients.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <Avatar name={p.name} />
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.age} سنة · {p.blood}</p>
                  </div>
                </div>
                {statusBadge(p.status)}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Lab Results */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">نتائج التحاليل الخاصة بي</h3>
          {myLabs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد نتائج</p>
          ) : (
            <div className="space-y-2">
              {myLabs.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.patient}</p>
                    <p className="text-xs text-muted-foreground truncate">{l.test}</p>
                  </div>
                  {labBadge(l.flag)}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Prescriptions */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">وصفاتي الطبية</h3>
          {myPrescriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد وصفات</p>
          ) : (
            <div className="space-y-3">
              {myPrescriptions.map((rx) => (
                <div key={rx.id} className="py-2 border-b border-border last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{rx.patient}</p>
                    <span className="px-2 py-0.5 bg-secondary text-primary text-xs rounded-lg font-medium">
                      {rx.duration}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{rx.medications}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{rx.date}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
