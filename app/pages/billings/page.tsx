import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { FieldConfig, FieldOption } from "../types";
import useGet from "../hooks/useGet";
import useApiMutation from "../hooks/useApiMutation";
import { useAuth } from "../contexts/AuthContext";
import { useRole } from "../hooks/usePermissions";
import {
  SectionHeader,
  SearchBar,
  Card,
  payBadge,
  ConfirmDelete,
  FormModal,
  DataTable,
  Pagination,
  DateRangeFilter,
} from "../components/shared";
import type { ColumnDef } from "../components/shared/DataTable";

type BillingItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

type Billing = {
  _id?: string;
  patient: string | number | { _id?: string; id?: string; fullName?: string; name?: string };
  patientName?: string;
  items: BillingItem[];
  discount: number;
  status: "paid" | "unpaid";
  notes?: string;
};

type BillingRow = Billing & { id: string | number };

type Patient = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
};

const PAGE_SIZE = 10;

const EMPTY_ITEM: BillingItem = {
  description: "",
  quantity: 1,
  unitPrice: 0,
};

const getId = (obj: any): string | number => {
  return obj?.id ?? obj?._id ?? "";
};

const extractList = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is T => !!item && typeof item === "object");
  }
  if (!value || typeof value !== "object") return [];
  
  const obj = value as Record<string, unknown>;
  
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    const dataObj = obj.data as Record<string, unknown>;
    for (const key of ["items", "results", "list", "records", "docs"]) {
      if (Array.isArray(dataObj[key])) {
        return dataObj[key].filter((item): item is T => !!item && typeof item === "object");
      }
    }
  }
  
  for (const key of ["data", "items", "results", "list", "records", "docs"]) {
    const candidate = obj[key];
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is T => !!item && typeof item === "object");
    }
  }
  
  return [];
};

const extractMeta = (response: unknown) => {
  if (!response || typeof response !== "object") return { total: 0, pages: 1 };
  const obj = response as Record<string, unknown>;
  
  const meta = (obj.data as Record<string, unknown>)?.meta || obj.meta || {};
  const metaObj = meta as Record<string, unknown>;
  
  return {
    total: (metaObj.total as number) || 0,
    pages: (metaObj.pages as number) || 1,
  };
};

function ItemsEditor({ items, onChange }: { items: BillingItem[]; onChange: (items: BillingItem[]) => void }) {
  const updateItem = (index: number, field: keyof BillingItem, value: string) => {
    const next = items.map((it, i) => {
      if (i !== index) return it;
      if (field === "description") return { ...it, description: value };
      const num = Number(value);
      return { ...it, [field]: Number.isFinite(num) ? num : 0 };
    });
    onChange(next);
  };

  const addItem = () => onChange([...items, { ...EMPTY_ITEM }]);
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">عناصر الفاتورة</label>
        <button type="button" onClick={addItem} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:opacity-90 transition">
          + إضافة عنصر
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-4 border border-dashed border-border rounded-lg">
          لا توجد عناصر. اضغط "إضافة عنصر" للبدء.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="p-3 bg-muted/30 border border-border rounded-lg space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">عنصر #{index + 1}</span>
                <button type="button" onClick={() => removeItem(index)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition">
                  ✕ حذف
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">الوصف</label>
                  <input type="text" value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} placeholder="مثال: كشف طبي" className="w-full px-3 py-2 text-sm rounded-md border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">الكمية</label>
                  <input type="number" min={0} value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} className="w-full px-3 py-2 text-sm rounded-md border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">سعر الوحدة</label>
                  <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", e.target.value)} className="w-full px-3 py-2 text-sm rounded-md border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <div className="text-left text-xs font-semibold text-primary pt-1">
                الإجمالي: {(item.quantity * item.unitPrice).toLocaleString()} ر.س
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end text-sm font-bold text-primary pt-2 border-t border-border">
        المجموع الفرعي: {subtotal.toLocaleString()} ر.س
      </div>
    </div>
  );
}

function FakePaymentModal({ invoice, onClose, onSuccess }: { invoice: any; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1500);
  };

  const total = (invoice.items ?? []).reduce((sum: number, item: any) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0) - (invoice.discount || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" dir="rtl">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-bold text-lg">دفع إلكتروني - فاتورة #{invoice._originalIndex || invoice.id}</h3>
          <p className="text-sm text-muted-foreground mt-1">المبلغ المطلوب: {total.toLocaleString()} ر.س</p>
        </div>
        <form onSubmit={handlePay} className="p-5 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">رقم البطاقة</label>
              <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-3 py-2 text-sm rounded-md border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">تاريخ الانتهاء</label>
                <input type="text" placeholder="MM/YY" className="w-full px-3 py-2 text-sm rounded-md border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">رمز التحقق (CVV)</label>
                <input type="text" placeholder="123" className="w-full px-3 py-2 text-sm rounded-md border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">الاسم على البطاقة</label>
              <input type="text" placeholder="الاسم الكامل" className="w-full px-3 py-2 text-sm rounded-md border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" required />
            </div>
          </div>
          
          <div className="pt-4 flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50">
              {loading ? "جاري المعالجة..." : "تأكيد الدفع"}
            </button>
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition disabled:opacity-50">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const { isPatient, isManagerOrAdmin } = useRole();

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentModal, setPaymentModal] = useState<any | null>(null);
  const [searchParams] = useSearchParams();

  // إذا كان المستخدم مريضاً، نستخدم الـ patientId من الـ user تلقائياً
  // وإلا نستخدم patientId من الـ query params (للروابط المباشرة)
  const patientIdFromUrl = searchParams.get("patient") ?? "";
  const patientId = isPatient ? (user?.id ?? "") : patientIdFromUrl;

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; data?: BillingRow }>(null);
  const [delId, setDelId] = useState<string | number | null>(null);
  const [items, setItems] = useState<BillingItem[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (!modal) {
      setItems([]);
      return;
    }
    if (modal.mode === "edit" && Array.isArray(modal.data?.items) && modal.data!.items.length > 0) {
      setItems(modal.data!.items.map((it) => ({ ...it })));
    } else {
      setItems([{ ...EMPTY_ITEM }]);
    }
  }, [modal]);

  const patientsQuery = useGet({
    endpoint: "patients",
    queryKey: "patients",
    params: { page: 1, limit: 1000 },
    // المريض لا يحتاج لقائمة المرضى (لا يستطيع تعديل الفواتير)
    enabled: !isPatient,
  });

  // بناء params للـ billing query
  // حسب الـ API: patientName للبحث بالاسم، patient للفلترة بالـ ID
  const billingQueryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page,
      limit: PAGE_SIZE,
      status: filter === "all" ? "" : filter,
      from: fromDate,
      to: toDate,
    };

    // إذا كان هناك نص بحث، نرسله كـ patientName (حسب API endpoint المحدد)
    if (debouncedSearch) {
      params.patientName = debouncedSearch;
    }

    // إذا كان المريض أو هناك patientId محدد، نرسله للفلترة
    if (patientId) {
      params.patient = patientId;
    }

    return params;
  }, [page, filter, fromDate, toDate, debouncedSearch, patientId]);

  const billingQuery = useGet({
    endpoint: "billings",
    queryKey: "billings",
    params: billingQueryParams,
    enabled: true,
  });

  const patients = useMemo(() => extractList<Patient>(patientsQuery.data), [patientsQuery.data]);
  
  const billings = useMemo(() => {
    const list = extractList<Billing>(billingQuery.data);
    return list.map((item, index) => {
      // استخراج patientId بشكل صحيح
      let pid: string | number = "";
      if (typeof item.patient === "object" && item.patient !== null) {
        pid = getId(item.patient);
      } else {
        pid = item.patient as string | number;
      }
      
      return { 
        ...item, 
        id: getId(item),
        patient: pid, // نخزن الـ ID فقط
        _originalIndex: (page - 1) * PAGE_SIZE + index + 1 // رقم تسلسلي
      };
    }) as (BillingRow & { _originalIndex: number })[];
  }, [billingQuery.data, page]);

  const { total, pages: totalPages } = useMemo(() => extractMeta(billingQuery.data), [billingQuery.data]);

  const createBilling = useApiMutation({
    method: "post",
    endpoint: "billings",
    queryKey: "billings",
    successMessage: "تمت إضافة الفاتورة بنجاح",
    onSuccess: () => setModal(null),
  });

  const updateBilling = useApiMutation({
    method: "patch",
    endpoint: "billings",
    queryKey: "billings",
    successMessage: "تم تعديل الفاتورة بنجاح",
    onSuccess: () => setModal(null),
  });

  const deleteBilling = useApiMutation({
    method: "delete",
    endpoint: "billings",
    queryKey: "billings",
    successMessage: "تم حذف الفاتورة بنجاح",
    onSuccess: () => setDelId(null),
  });

  const getBillingTotal = (billing: BillingRow) => {
    const subtotal = (billing.items ?? []).reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
    return subtotal - (billing.discount || 0);
  };

  // إنشاء patientNameMap للوصول السريع
  const patientNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    patients.forEach((p) => {
      const id = String(getId(p));
      if (id) {
        map[id] = p.fullName || p.name || id;
      }
    });
    return map;
  }, [patients]);

  const getPatientLabel = (patientValue: string | number | object) => {
    if (!patientValue) return "—";
    
    // إذا كان patient كائن، نستخرج الـ ID
    let actualPatientId: string;
    if (typeof patientValue === "object" && patientValue !== null) {
      actualPatientId = String(getId(patientValue));
    } else {
      actualPatientId = String(patientValue);
    }
    
    // إذا كان المستخدم مريضاً، نعرض اسمه مباشرة
    if (isPatient && user?.name) {
      return user.name;
    }
    
    // إذا كان الـ ID موجود في patientNameMap، نستخدمه
    if (patientNameMap[actualPatientId]) {
      return patientNameMap[actualPatientId];
    }
    
    // إذا لم نجده، نبحث في قائمة المرضى
    const match = patients.find((p) => String(getId(p)) === actualPatientId);
    if (match) {
      return match.fullName || match.name || actualPatientId;
    }
    
    // إذا كان الكائن يحتوي على اسم مباشر
    if (typeof patientValue === "object" && patientValue !== null) {
      const obj = patientValue as any;
      return obj.fullName || obj.name || String(getId(obj));
    }
    
    return actualPatientId;
  };

  const billFields = useMemo<FieldConfig[]>(() => {
    const patientOptions: FieldOption[] = patients.map((p) => ({
      label: p.fullName || p.name || String(getId(p)),
      value: String(getId(p)),
    }));
    
    return [
      { key: "patient", label: "المريض", type: "select", options: patientOptions },
      { key: "discount", label: "الخصم (ر.س)", type: "number" },
      { key: "status", label: "حالة الدفع", type: "select", options: ["paid", "unpaid"] },
      { key: "notes", label: "الملاحظات", type: "textarea" },
    ];
  }, [patients]);

  const handleEdit = (row: { id: string | number }) => {
    const billing = row as BillingRow;
    setModal({ mode: "edit", data: billing });
  };

  const handleDelete = (row: { id: string | number }) => {
    setDelId(row.id);
  };

  const handleConfirmDelete = () => {
    if (!delId) return;
    deleteBilling.mutate({ id: delId });
  };

  const save = (data: Record<string, unknown>) => {
    if (!modal) return;

    const validItems = items.filter((it) => it.description.trim() && it.quantity >= 0 && it.unitPrice >= 0);

    if (validItems.length === 0) {
      alert("يجب إضافة عنصر واحد على الأقل للفاتورة");
      return;
    }

    const payload = {
      patient: patientId || data.patient,
      items: validItems,
      discount: Number(data.discount) || 0,
      status: data.status,
      notes: (data.notes as string) ?? "",
    };

    if (modal.mode === "add") {
      createBilling.mutate({ data: payload });
      return;
    }
    
    updateBilling.mutate({ id: modal.data?.id, data: payload });
  };

  // دالة الدفع الإلكتروني — تعمل لكل الأدوار
  const handlePaymentSuccess = (invoice: any) => {
    updateBilling.mutate({
      id: invoice.id,
      data: {
        patient: invoice.patient,
        items: invoice.items,
        discount: invoice.discount,
        status: "paid",
        notes: invoice.notes,
      },
    });
    setPaymentModal(null);
    alert("تم الدفع بنجاح! تم تحديث حالة الفاتورة.");
  };

  const columns: ColumnDef<BillingRow>[] = [
    { 
      header: "رقم الفاتورة", 
      cell: (b) => {
        const row = b as BillingRow & { _originalIndex?: number };
        return (
          <span className="font-mono font-semibold text-primary">
            #{row._originalIndex || b.id}
          </span>
        );
      }
    },
    { 
      header: "المريض", 
      cell: (b) => {
        const patientLabel = getPatientLabel(b.patient);
        return <span className="font-medium">{patientLabel}</span>;
      }
    },
    { 
      header: "الخدمات", 
      cell: (b) => <span className="text-sm text-muted-foreground">{b.items?.[0]?.description ?? "—"}</span>
    },
    { 
      header: "المبلغ", 
      cell: (b) => <span className="font-mono font-semibold">{getBillingTotal(b).toLocaleString()} ر.س</span>
    },
    { 
      header: "الحالة", 
      cell: (b) => payBadge(b.status) 
    },
    { 
      header: "الدفع الإلكتروني", 
      cell: (b) => b.status === "unpaid" ? (
        <button 
          onClick={() => setPaymentModal(b)}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
        >
          💳 دفع إلكتروني
        </button>
      ) : (
        <span className="text-xs text-muted-foreground">✓ مكتمل</span>
      )
    },
  ];

  const renderMobileCard = (row: { id: string | number }, actions: React.ReactNode) => {
    const billing = row as BillingRow & { _originalIndex?: number };
    const patientLabel = getPatientLabel(billing.patient);
    
    return (
      <Card key={billing.id} className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="font-mono text-xs font-bold text-primary">
              #{billing._originalIndex || billing.id}
            </span>
            <p className="font-semibold">{patientLabel}</p>
            <p className="text-xs text-muted-foreground">{billing.items?.[0]?.description ?? "—"}</p>
          </div>
          {actions}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="font-mono font-bold text-sm">{getBillingTotal(billing).toLocaleString()} ر.س</span>
          <div className="flex items-center gap-2">
            {billing.status === "unpaid" && (
              <button 
                onClick={() => setPaymentModal(billing)}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
              >
                💳 دفع
              </button>
            )}
            {payBadge(billing.status)}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <SectionHeader
        title={isPatient ? "فواتيري" : "الفواتير والمدفوعات"}
        subtitle={
          isPatient
            ? `مرحباً ${user?.name ?? ""}، هنا فواتيرك`
            : total
            ? `${total} فاتورة`
            : "لا توجد فواتير"
        }
        // المريض لا يستطيع إضافة فواتير
        onAdd={isPatient ? undefined : () => setModal({ mode: "add" })}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">الإجمالي</p>
          <p className="text-xl font-bold">{total}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">غير مدفوعة</p>
          <p className="text-xl font-bold text-red-600">{billings.filter((b) => b.status === "unpaid").length}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">المتأخر</p>
          <p className="text-lg font-bold text-amber-600">
            {billings.filter((b) => b.status === "unpaid").reduce((sum, b) => sum + getBillingTotal(b), 0).toLocaleString()}{" "}
            <span className="text-xs">ر.س</span>
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <DateRangeFilter
          from={fromDate}
          to={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
        />
        {/* حقل البحث — للمدير/الإدارة للبحث بالاسم؛ مخفي للمريض (يرى فواتيره فقط) */}
        {!isPatient && (
          <SearchBar value={search} onChange={setSearch} placeholder="بحث باسم المريض..." />
        )}
        <div className="flex gap-2 flex-wrap">
          {[["all", "الكل"], ["paid", "مدفوع"], ["unpaid", "غير مدفوع"]].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filter === value ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:bg-muted/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {billingQuery.isLoading ? (
        <div className="mt-4 text-sm text-muted-foreground">جاري تحميل الفواتير...</div>
      ) : billingQuery.isError ? (
        <div className="mt-4 text-sm text-red-500">تعذر تحميل الفواتير. يرجى المحاولة لاحقًا.</div>
      ) : (
        <>
          <DataTable 
            data={billings} 
            columns={columns} 
            renderMobileCard={renderMobileCard}
            // المريض لا يرى أزرار التعديل والحذف
            onEdit={isPatient ? undefined : handleEdit} 
            onDelete={isPatient ? undefined : handleDelete} 
          />
          {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}

      {modal && !isPatient && (
        <FormModal
          title={modal.mode === "add" ? "إصدار فاتورة جديدة" : "تعديل الفاتورة"}
          fields={billFields}
          initial={
            modal.data
              ? { 
                  ...modal.data, 
                  patient: String(typeof modal.data.patient === "object" && modal.data.patient !== null 
                    ? getId(modal.data.patient) 
                    : modal.data.patient ?? patientId ?? ""), 
                  discount: modal.data.discount ?? 0, 
                  status: modal.data.status ?? "unpaid", 
                  notes: modal.data.notes ?? "" 
                }
              : { patient: patientId, discount: 0, status: "unpaid", notes: "" }
          }
          onSave={save}
          onClose={() => setModal(null)}
          extraContent={<ItemsEditor items={items} onChange={setItems} />}
        />
      )}

      {delId !== null && !isPatient && (
        <ConfirmDelete
          name={`فاتورة #${delId}`}
          onConfirm={handleConfirmDelete}
          onClose={() => setDelId(null)}
        />
      )}

      {paymentModal && (
        <FakePaymentModal
          invoice={paymentModal}
          onClose={() => setPaymentModal(null)}
          onSuccess={() => handlePaymentSuccess(paymentModal)}
        />
      )}
    </div>
  );
}