import { useMemo, useState } from "react";
import { Calendar, FlaskConical, ClipboardList, Package, Shield, Bell, X, Send, Users, User, Briefcase } from "lucide-react";
import { Card, SectionHeader, DateRangeFilter, } from "../components/shared";
import useGet from "../hooks/useGet";
import useApiMutation from "../hooks/useApiMutation";
import type { ElementType } from "react";

// --- Types ---
type NotificationType = {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

type ApiNotification = {
  id?: string;
  _id?: string;
  recipient?: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
};

type NotificationsApiResponse = {
  data?: ApiNotification[] | { notifications?: ApiNotification[]; items?: ApiNotification[]; docs?: ApiNotification[]; data?: ApiNotification[] };
  notifications?: ApiNotification[];
  items?: ApiNotification[];
  docs?: ApiNotification[];
};

type ApiUser = {
  id?: string | number;
  _id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
};

type UsersApiResponse = {
  data?: ApiUser[] | { users?: ApiUser[]; items?: ApiUser[]; docs?: ApiUser[]; data?: ApiUser[] };
  users?: ApiUser[];
  items?: ApiUser[];
  docs?: ApiUser[];
};

type UserType = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
};

// --- Helpers ---
const mapNotificationType = (type: string | undefined): string => {
  if (!type) return "admin";
  if (type.toLowerCase() === "administrative") return "admin";
  return type.toLowerCase();
};

const toNotification = (n: ApiNotification): NotificationType => {
  return {
    id: n.id ?? n._id ?? crypto.randomUUID(),
    type: mapNotificationType(n.type),
    title: n.title ?? "",
    message: n.message ?? "",
    date: n.createdAt
      ? new Date(n.createdAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })
      : "",
    read: n.read ?? n.isRead ?? false,
  };
};

const toUser = (user: ApiUser): UserType => {
  return {
    id: (user.id ?? user._id ?? "").toString(),
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone,
    role: user.role ?? "",
  };
};

const getNotificationsPayload = (response: NotificationsApiResponse | undefined): NotificationType[] => {
  const nested = response?.data && !Array.isArray(response.data) ? response.data : undefined;
  const list =
    (Array.isArray(response?.data) && response.data) ||
    response?.notifications ||
    response?.items ||
    response?.docs ||
    nested?.notifications ||
    nested?.items ||
    nested?.docs ||
    nested?.data ||
    [];
  return list.map(toNotification);
};

const getUsersPayload = (response: UsersApiResponse | undefined): UserType[] => {
  const nested = response?.data && !Array.isArray(response.data) ? response.data : undefined;
  const list =
    (Array.isArray(response?.data) && response.data) ||
    response?.users ||
    response?.items ||
    response?.docs ||
    nested?.users ||
    nested?.items ||
    nested?.docs ||
    nested?.data ||
    [];
  return list.map(toUser);
};

// ✅ دالة مساعدة لجلب معلومات المستخدم الحالي
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (e) {
    console.error("Error parsing user data:", e);
  }
  return null;
};

// --- Component ---
export default function NotificationsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTargetType, setSelectedTargetType] = useState<"role" | "user" | "users">("role");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "administrative",
    role: "doctor",
    recipient: "",
  });

  // ✅ جلب معلومات المستخدم الحالي من localStorage
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role;
  const canCreateNotification = userRole === "admin" || userRole === "manager";
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const notificationsQuery = useGet({
    endpoint: "notifications/me",
    queryKey: "notifications",
    params: {
      page: 1, limit: 100, from: fromDate,
      to: toDate,
    },
  });

  const usersQuery = useGet({
    endpoint: "users",
    queryKey: "users-for-notifications",
    params: {
      page: 1, limit: 1000, from: fromDate,
      to: toDate,
    },
    enabled: showCreateModal && canCreateNotification,
  });

  const notifications = useMemo(
    () => getNotificationsPayload(notificationsQuery.data as NotificationsApiResponse | undefined),
    [notificationsQuery.data]
  );

  const users = useMemo(
    () => getUsersPayload(usersQuery.data as UsersApiResponse | undefined),
    [usersQuery.data]
  );

  const unread = notifications.filter((n) => !n.read);

  const markAsRead = useApiMutation({
    method: "patch",
    endpoint: "notifications",
    queryKey: "notifications",
  });
  const createNotification = useApiMutation({
    method: "post",
    endpoint: "notifications",
    queryKey: "notifications",
    successMessage: "تم إرسال الإشعار بنجاح",
    onSuccess: () => {
      setShowCreateModal(false);
      setSelectedRecipients([]);
      setSelectedTargetType("role");
      setFormData({
        title: "",
        message: "",
        type: "administrative",
        role: "doctor",
        recipient: "",
      });
    },
  });

  const handleMarkAllAsRead = () => {
    unread.forEach((n) => {
      markAsRead.mutate({ id: `${n.id}/read` });
    });
  };

  const handleMarkSingleAsRead = (id: string) => {
    markAsRead.mutate({ id: `${id}/read` });
  };

  const handleCreateNotification = () => {
    const payload: Record<string, unknown> = {
      targetType: selectedTargetType,
      title: formData.title,
      message: formData.message,
      type: formData.type,
    };

    if (selectedTargetType === "role") {
      payload.role = formData.role;
    } else if (selectedTargetType === "user") {
      payload.recipient = formData.recipient;
    } else if (selectedTargetType === "users") {
      payload.recipients = selectedRecipients;
    }

    createNotification.mutate({ data: payload });
  };

  const iconFor = (type: string): { icon: ElementType; color: string } => {
    const m: Record<string, { icon: ElementType; color: string }> = {
      appointment: { icon: Calendar, color: "bg-cyan-100 text-cyan-600" },
      lab: { icon: FlaskConical, color: "bg-violet-100 text-violet-600" },
      prescription: { icon: ClipboardList, color: "bg-emerald-100 text-emerald-600" },
      inventory: { icon: Package, color: "bg-red-100 text-red-600" },
      admin: { icon: Shield, color: "bg-slate-100 text-slate-600" },
      administrative: { icon: Shield, color: "bg-slate-100 text-slate-600" },
    };
    return m[type] ?? { icon: Bell, color: "bg-muted text-muted-foreground" };
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedRecipients.includes(userId)) {
      setSelectedRecipients(selectedRecipients.filter((id) => id !== userId));
    } else {
      setSelectedRecipients([...selectedRecipients, userId]);
    }
  };

  const removeUser = (userId: string) => {
    setSelectedRecipients(selectedRecipients.filter((id) => id !== userId));
  };

  const isFormValid = () => {
    if (!formData.title || !formData.message) return false;
    if (selectedTargetType === "user" && !formData.recipient) return false;
    if (selectedTargetType === "users" && selectedRecipients.length === 0) return false;
    return true;
  };

  return (
    <div>
      <SectionHeader
        title="الإشعارات"
        subtitle={unread.length > 0 ? `${unread.length} غير مقروء` : undefined}
        onAdd={canCreateNotification ? () => setShowCreateModal(true) : undefined}
      />
      <div className="mb-4">
        <DateRangeFilter
          from={fromDate}
          to={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
        />
      </div>

      {notificationsQuery.isLoading ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          جاري تحميل الإشعارات...
        </Card>
      ) : notificationsQuery.isError ? (
        <Card className="p-6 text-center text-sm text-red-600">
          تعذر تحميل الإشعارات
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          لا توجد إشعارات حالياً
        </Card>
      ) : (
        <div className="space-y-3">
          {unread.length > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAsRead.isPending}
                className="text-xs text-primary font-medium hover:underline disabled:opacity-50"
              >
                تعيين الكل كمقروء
              </button>
            </div>
          )}

          {notifications.map((n) => {
            const { icon: Icon, color } = iconFor(n.type);
            return (
              <div
                key={n.id}
                onClick={!n.read ? () => handleMarkSingleAsRead(n.id) : undefined}
                className={!n.read ? "cursor-pointer" : ""}
              >
                <Card
                  className={`p-4 transition-all ${!n.read ? "border-primary/20 bg-primary/[0.02] hover:bg-primary/[0.04]" : ""
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${color}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1 font-mono">{n.date}</p>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && canCreateNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">إنشاء إشعار جديد</h2>
                    <p className="text-xs text-muted-foreground">أرسل إشعار للمستخدمين</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedRecipients([]);
                    setSelectedTargetType("role");
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Target Type Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">نوع المستهدف</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTargetType("role");
                        setSelectedRecipients([]);
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${selectedTargetType === "role"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                        }`}
                    >
                      <Briefcase className="w-5 h-5 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">حسب الدور</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTargetType("user");
                        setSelectedRecipients([]);
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${selectedTargetType === "user"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                        }`}
                    >
                      <User className="w-5 h-5 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">مستخدم واحد</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTargetType("users");
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${selectedTargetType === "users"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                        }`}
                    >
                      <Users className="w-5 h-5 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">مجموعة مستخدمين</p>
                    </button>
                  </div>
                </div>

                {/* Role Selection */}
                {selectedTargetType === "role" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">اختر الدور</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="manager">مدير</option>
                      <option value="admin">مشرف</option>
                      <option value="doctor">طبيب</option>
                      <option value="patient">مريض</option>
                      <option value="staff">موظف</option>
                    </select>
                  </div>
                )}

                {/* Single User Selection */}
                {selectedTargetType === "user" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">اختر المستخدم</label>
                    <select
                      value={formData.recipient}
                      onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">اختر مستخدم...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Multiple Users Selection */}
                {selectedTargetType === "users" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">اختر المستخدمين</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowUsersDropdown(!showUsersDropdown)}
                        className="w-full px-4 py-2.5 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-primary bg-white flex items-center justify-between"
                      >
                        <span>
                          {selectedRecipients.length > 0
                            ? `تم اختيار ${selectedRecipients.length} مستخدم`
                            : "اختر المستخدمين..."}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${showUsersDropdown ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showUsersDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto z-10">
                          {users.map((user) => (
                            <label
                              key={user.id}
                              className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            >
                              <input
                                type="checkbox"
                                checked={selectedRecipients.includes(user.id)}
                                onChange={() => toggleUserSelection(user.id)}
                                className="rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedRecipients.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedRecipients.map((userId) => {
                          const user = users.find((u) => u.id === userId);
                          if (!user) return null;
                          return (
                            <span
                              key={userId}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-lg font-medium"
                            >
                              {user.name}
                              <button
                                type="button"
                                onClick={() => removeUser(userId)}
                                className="hover:text-red-600 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Notification Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">نوع الإشعار</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="administrative">إداري</option>
                    <option value="appointment">موعد</option>
                    <option value="lab">مختبر</option>
                    <option value="prescription">وصفة طبية</option>
                    <option value="inventory">مخزون</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">عنوان الإشعار</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="أدخل عنوان الإشعار"
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium mb-2">نص الإشعار</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="أدخل نص الإشعار"
                    rows={4}
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Preview */}
                {formData.title && formData.message && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-2">معاينة الإشعار:</p>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{formData.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{formData.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCreateNotification}
                    disabled={!isFormValid() || createNotification.isPending}
                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {createNotification.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        إرسال الإشعار
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedRecipients([]);
                      setSelectedTargetType("role");
                    }}
                    className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-muted transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}