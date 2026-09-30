import { Calendar, Receipt, ClipboardList, FlaskConical } from "lucide-react";
import { KPICard, Card, apptBadge, payBadge, labBadge } from "../../../components/shared";
import { SectionHeader } from "../../../components/shared/SectionHeader";
import {
  INIT_APPOINTMENTS, INIT_BILLS, INIT_PRESCRIPTIONS, INIT_LABS,
} from "../../data/initialData";
import { useAuth } from "../../../contexts/AuthContext";

export default function PatientDashboard() {
  const { user } = useAuth();
  const patientName = user?.name ?? "";

  // Filter data for this patient
  const myAppointments = INIT_APPOINTMENTS.filter((a) => a.patient === patientName);
  const myBills = INIT_BILLS.filter((b) => b.patient === patientName);
  const myPrescriptions = INIT_PRESCRIPTIONS.filter((p) => p.patient === patientName);
  const myLabs = INIT_LABS.filter((l) => l.patient === patientName);

  const nextAppt = myAppointments.find(
    (a) => a.status === "confirmed" || a.status === "pending"
  );
  const unpaidBills = myBills.filter((b) => b.status === "unpaid");
  const unpaidTotal = unpaidBills.reduce((s, b) => s + b.amount, 0);

  return (
    <div>
      <SectionHeader title="بوابة المريض" subtitle={`مرحباً، ${patientName}`} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KPICard label="مواعيدي القادمة"  value={myAppointments.filter((a) => a.status !== "cancelled" && a.status !== "completed").length} sub="موعد قادم"    icon={Calendar}     color="bg-cyan-600" />
        <KPICard label="فواتير غير مدفوعة" value={unpaidBills.length} sub={`${unpaidTotal.toLocaleString()} ر.س`} icon={Receipt}  trend="down" color="bg-amber-600" />
        <KPICard label="وصفاتي النشطة"    value={myPrescriptions.length} sub="وصفة طبية"  icon={ClipboardList} color="bg-emerald-600" />
        <KPICard label="تحاليلي"           value={myLabs.length}          sub="تحليل مكتمل" icon={FlaskConical}  color="bg-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Next Appointment */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">موعدي القادم</h3>
          {nextAppt ? (
            <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-cyan-900">{nextAppt.doctor}</p>
                {apptBadge(nextAppt.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-cyan-800">
                <div>
                  <p className="text-xs text-cyan-600 mb-0.5">التاريخ</p>
                  <p className="font-mono font-semibold">{nextAppt.date}</p>
                </div>
                <div>
                  <p className="text-xs text-cyan-600 mb-0.5">الوقت</p>
                  <p className="font-mono font-semibold">{nextAppt.time}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-cyan-600 mb-0.5">النوع</p>
                  <p className="font-semibold">{nextAppt.type}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد مواعيد قادمة</p>
          )}
        </Card>

        {/* My Bills */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">فواتيري</h3>
          {myBills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد فواتير</p>
          ) : (
            <div className="space-y-2">
              {myBills.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-primary">#{b.id}</p>
                    <p className="text-sm text-muted-foreground truncate">{b.services}</p>
                    <p className="font-mono font-semibold text-sm">{b.amount.toLocaleString()} ر.س</p>
                  </div>
                  {payBadge(b.status)}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    <p className="text-xs text-muted-foreground">{rx.doctor}</p>
                    <span className="px-2 py-0.5 bg-secondary text-primary text-xs rounded-lg font-medium">
                      {rx.duration}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{rx.medications}</p>
                  {rx.notes && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-1">
                      {rx.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Lab Results */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">نتائج تحاليلي</h3>
          {myLabs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد نتائج</p>
          ) : (
            <div className="space-y-2">
              {myLabs.map((l) => (
                <div key={l.id} className="py-2 border-b border-border last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{l.test}</p>
                    {labBadge(l.flag)}
                  </div>
                  <p className="text-xs text-muted-foreground">{l.result}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{l.date}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
