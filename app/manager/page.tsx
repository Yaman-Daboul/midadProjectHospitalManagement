"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  HeartPulse,
  Calendar,
  Receipt,
  Stethoscope,
  AlertTriangle,
} from "lucide-react";

import { KPICard, Card, apptBadge } from "@/components/shared";
import { SectionHeader } from "@/components/shared/SectionHeader";
import useGet from "@/hooks/useGet";

// الأنواع كما هي
interface DashboardSummary {
  totalPatients?: number;
  todayAppointments?: number;
  pendingBills?: {
    count?: number;
    amount?: number;
  };
  activeDoctors?: {
    count?: number;
    total?: number;
  };
}

interface AppointmentStatus {
  pending?: number;
  confirmed?: number;
  completed?: number;
  cancelled?: number;
}

interface AppointmentDay {
  date: string;
  day: string;
  count: number;
}

interface MonthlyRevenue {
  year: number;
  month: number;
  monthName: string;
  amount: number;
}

interface PatientInfo {
  _id?: string;
  name?: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
}

interface DoctorInfo {
  _id?: string;
  name?: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  specialization?: string;
  roomNumber?: string;
}

type ApptStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface LatestAppointment {
  _id: string;
  patient?: PatientInfo;
  doctor?: DoctorInfo | null;
  scheduledAt: string;
  durationMinutes: number;
  reason: string;
  status: ApptStatus;
}

interface MedicineInfo {
  _id?: string;
  name?: string;
  code?: string;
  unit?: string;
}

interface InventoryAlert {
  _id: string;
  name?: string;
  medicine?: MedicineInfo;
  quantity: number;
  minimumQuantity: number;
  batchNumber?: string;
  expiryDate?: string;
  location?: string;
  type?: string;
}

interface DashboardData {
  summary?: DashboardSummary;
  appointmentStatus?: AppointmentStatus;
  appointmentsLast7Days?: AppointmentDay[];
  monthlyRevenue?: MonthlyRevenue[];
  latestAppointments?: LatestAppointment[];
  inventoryAlerts?: InventoryAlert[];
}

interface MappedAppointment {
  id: string;
  patient: string;
  doctor: string;
  date: string;
  status: ApptStatus;
}

export default function ManagerDashboard() {
  const { data: apiData, isLoading, isError } = useGet({
    endpoint: "dashboard/overview",
    queryKey: "dashboardOverview",
  });

  const data = (apiData?.data as DashboardData) || {};
  const summary = data.summary || {};
  const appointmentsLast7Days = data.appointmentsLast7Days || [];
  const appointmentStatus = data.appointmentStatus || {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  const monthlyRevenue = data.monthlyRevenue || [];
  const latestAppointments = data.latestAppointments || [];
  const inventoryAlerts = data.inventoryAlerts || [];

  const totalApptsStatus =
    (appointmentStatus.pending || 0) +
    (appointmentStatus.confirmed || 0) +
    (appointmentStatus.completed || 0) +
    (appointmentStatus.cancelled || 0);

  const statusPieData = [
    {
      name: "قيد الانتظار",
      value: totalApptsStatus
        ? Math.round(((appointmentStatus.pending || 0) / totalApptsStatus) * 100)
        : 0,
      color: "#f59e0b",
    },
    {
      name: "مؤكد",
      value: totalApptsStatus
        ? Math.round(((appointmentStatus.confirmed || 0) / totalApptsStatus) * 100)
        : 0,
      color: "#10b981",
    },
    {
      name: "مكتمل",
      value: totalApptsStatus
        ? Math.round(((appointmentStatus.completed || 0) / totalApptsStatus) * 100)
        : 0,
      color: "#3b82f6",
    },
    {
      name: "ملغي",
      value: totalApptsStatus
        ? Math.round(((appointmentStatus.cancelled || 0) / totalApptsStatus) * 100)
        : 0,
      color: "#ef4444",
    },
  ];

  const revenueData = monthlyRevenue.map((m: MonthlyRevenue) => ({
    month: m.monthName,
    amount: m.amount,
  }));

  const mappedAppointments: MappedAppointment[] = latestAppointments.map(
    (a: LatestAppointment) => {
      const statusMap: Record<string, ApptStatus> = {
        pending: "pending",
        confirmed: "confirmed",
        completed: "completed",
        cancelled: "cancelled",
      };
      return {
        id: a._id,
        patient: a.patient?.name || a.patient?.user?.name || "مريض غير معروف",
        doctor: a.doctor?.name || a.doctor?.user?.name || "غير محدد",
        date: new Date(a.scheduledAt).toLocaleDateString("ar-EG"),
        status: statusMap[a.status] || "pending",
      };
    }
  );

  const mappedInventory = inventoryAlerts.map((m: InventoryAlert) => ({
    id: m._id,
    name: m.name || m.medicine?.name || "دواء",
    qty: m.quantity,
    minQty: m.minimumQuantity,
  }));

  if (isLoading) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        جاري تحميل بيانات لوحة التحكم...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-sm text-red-600">
        تعذر تحميل بيانات لوحة التحكم
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="لوحة التحكم"
        subtitle="نظرة عامة شاملة على نشاط المستشفى"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KPICard
          label="إجمالي المرضى"
          value={String(summary.totalPatients || 0)}
          sub="هذا الشهر"
          icon={HeartPulse}
          color="bg-cyan-600"
        />
        <KPICard
          label="مواعيد اليوم"
          value={String(summary.todayAppointments || 0)}
          sub="موعد"
          icon={Calendar}
          color="bg-violet-600"
        />
        <KPICard
          label="فواتير معلقة"
          value={String(summary.pendingBills?.count || 0)}
          sub={`بقيمة ${summary.pendingBills?.amount || 0} ر.س`}
          icon={Receipt}
          trend="down"
          color="bg-amber-600"
        />
        <KPICard
          label="أطباء نشطون"
          value={String(summary.activeDoctors?.count || 0)}
          sub={`من أصل ${summary.activeDoctors?.total || 0}`}
          icon={Stethoscope}
          color="bg-emerald-600"
        />
      </div>

      {/* Appointments Area + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2 p-4">
          <h3 className="text-sm font-semibold mb-4">المواعيد — آخر 7 أيام</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={appointmentsLast7Days}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0E7490" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0E7490" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#0E7490"
                strokeWidth={2}
                fill="url(#grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">حالة المواعيد</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
              >
                {statusPieData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {statusPieData.map((e) => (
              <div key={e.name} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: e.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {e.name} {e.value}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue Bar Chart */}
      <Card className="p-4 mb-4">
        <h3 className="text-sm font-semibold mb-4">الإيرادات الشهرية (ر.س)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
              formatter={(value) => [
                `${Number(value ?? 0).toLocaleString()} ر.س`,
                "الإيراد",
              ]}
            />
            <Bar dataKey="amount" fill="#0E7490" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">آخر المواعيد</h3>
          <div className="space-y-2">
            {mappedAppointments.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.patient}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.doctor} · {a.date}
                  </p>
                </div>
                {apptBadge(a.status)}
              </div>
            ))}

            {mappedAppointments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                لا توجد مواعيد حديثة
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">تنبيهات المخزون</h3>
          <div className="space-y-2">
            {mappedInventory
              .filter((m) => m.qty <= m.minQty)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className="p-1.5 bg-red-50 rounded-lg flex-shrink-0">
                    <AlertTriangle size={13} className="text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      متبقي:{" "}
                      <span className="text-red-600 font-semibold">
                        {m.qty}
                      </span>{" "}
                      / حد أدنى: {m.minQty}
                    </p>
                  </div>
                </div>
              ))}

            {mappedInventory.filter((m) => m.qty <= m.minQty).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                لا توجد تنبيهات مخزون
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
