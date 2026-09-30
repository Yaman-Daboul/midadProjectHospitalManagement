import { useEffect, useMemo, useState } from "react";
import type { FieldConfig } from "../types";
import useGet from "../hooks/useGet";
import useApiMutation from "../hooks/useApiMutation";
import { usePermissions } from "../hooks/usePermissions";
import {
  SectionHeader,
  SearchBar,
  Card,
  RowActions,
  ConfirmDelete,
  FormModal,
  Pagination,
  DateRangeFilter,
} from "../components/shared";

// --- Types ---
type ShiftType = {
  id: string | number;
  department: string;
  doctor: string; // ID قادم من الـ Backend
  startsAt: string;
  endsAt: string;
  notes?: string;
};

type ApiShift = {
  id?: string | number;
  _id?: string | number;
  department?: string;
  doctor?: string;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
};

type PaginationInfo = {
  total?: number;
  totalItems?: number;
  totalRecords?: number;
  totalCount?: number;
  count?: number;
  totalDocs?: number;
  totalPages?: number;
  totalPage?: number;
  pages?: number;
  lastPage?: number;
  page?: number;
  currentPage?: number;
};

type ShiftsApiResponse = {
  data?:
    | ApiShift[]
    | {
        shifts?: ApiShift[];
        items?: ApiShift[];
        docs?: ApiShift[];
        data?: ApiShift[];
        total?: number;
        count?: number;
        totalDocs?: number;
        totalPages?: number;
        pages?: number;
        lastPage?: number;
        page?: number;
        pagination?: PaginationInfo;
        meta?: PaginationInfo;
      };
  shifts?: ApiShift[];
  items?: ApiShift[];
  docs?: ApiShift[];
  total?: number;
  count?: number;
  totalDocs?: number;
  totalPages?: number;
  pages?: number;
  page?: number;
  pagination?: PaginationInfo;
  meta?: PaginationInfo;
};

// --- Constants ---
const PAGE_SIZE = 10;

const SHIFT_FIELDS: FieldConfig[] = [
  { key: "department", label: "القسم / المناوبة", type: "select", options: ["Emergency", "ICU", "مناوبة الصباح", "مناوبة المساء", "مناوبة الليل"] },
  { key: "doctor", label: "الطبيب", type: "select", options: [] }, 
  { key: "startDate", label: "تاريخ البداية", type: "date" },
  { key: "startTime", label: "وقت البداية", type: "time" },
  { key: "endDate", label: "تاريخ النهاية", type: "date" },
  { key: "endTime", label: "وقت النهاية", type: "time" },
  { key: "notes", label: "ملاحظات", type: "textarea" },
];

const SHIFT_COLORS: Record<string, string> = {
  "مناوبة الصباح": "#0E7490",
  "مناوبة المساء": "#8B5CF6",
  "مناوبة الليل": "#1E293B",
  "Emergency": "#EF4444",
  "ICU": "#F59E0B",
};

// --- Helpers ---
const formatTime = (iso: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("ar-EG", { timeStyle: "short" });
};

const formatDate = (iso: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-EG", { dateStyle: "medium" });
};

const toLocalDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const toLocalTime = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

const toShift = (shift: ApiShift): ShiftType => {
  return {
    id: shift.id ?? shift._id ?? crypto.randomUUID(),
    department: shift.department ?? "",
    doctor: shift.doctor ?? "",
    startsAt: shift.startsAt ?? "",
    endsAt: shift.endsAt ?? "",
    notes: shift.notes ?? "",
  };
};

const getShiftsPayload = (
  response: ShiftsApiResponse | undefined,
  page: number,
) => {
  const nested =
    response?.data && !Array.isArray(response.data) ? response.data : undefined;

  const list =
    (Array.isArray(response?.data) && response.data) ||
    response?.shifts ||
    response?.items ||
    response?.docs ||
    nested?.shifts ||
    nested?.items ||
    nested?.docs ||
    nested?.data ||
    [];

  const pagination = response?.pagination ?? nested?.pagination;
  const meta = response?.meta ?? nested?.meta;

  const total =
    response?.total ??
    response?.count ??
    response?.totalDocs ??
    response?.pagination?.total ??
    response?.pagination?.totalItems ??
    response?.pagination?.totalRecords ??
    response?.pagination?.totalCount ??
    response?.pagination?.count ??
    response?.pagination?.totalDocs ??
    response?.meta?.total ??
    response?.meta?.totalItems ??
    response?.meta?.totalRecords ??
    response?.meta?.totalCount ??
    response?.meta?.count ??
    response?.meta?.totalDocs ??
    nested?.total ??
    nested?.count ??
    nested?.totalDocs ??
    pagination?.total ??
    pagination?.totalItems ??
    pagination?.totalRecords ??
    pagination?.totalCount ??
    pagination?.count ??
    pagination?.totalDocs ??
    meta?.total ??
    meta?.totalItems ??
    meta?.totalRecords ??
    meta?.totalCount ??
    meta?.count ??
    meta?.totalDocs ??
    list.length;

  const apiTotalPages =
    response?.totalPages ??
    response?.pages ??
    response?.pagination?.totalPage ??
    response?.pagination?.totalPages ??
    response?.pagination?.pages ??
    response?.pagination?.lastPage ??
    response?.meta?.totalPage ??
    response?.meta?.totalPages ??
    response?.meta?.pages ??
    response?.meta?.lastPage ??
    nested?.totalPages ??
    nested?.pages ??
    nested?.lastPage ??
    pagination?.totalPage ??
    pagination?.totalPages ??
    pagination?.pages ??
    pagination?.lastPage ??
    meta?.totalPage ??
    meta?.totalPages ??
    meta?.pages ??
    meta?.lastPage;

  const totalPages = apiTotalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fallbackPages =
    apiTotalPages === undefined &&
    total === list.length &&
    list.length >= PAGE_SIZE
      ? page + 1
      : totalPages;

  return {
    shifts: list.map(toShift),
    total,
    totalPages: Math.max(1, fallbackPages),
  };
};

const getDoctorsPayload = (response: any) => {
  const nested = response?.data && !Array.isArray(response.data) ? response.data : undefined;
  return (
    (Array.isArray(response?.data) && response.data) ||
    response?.doctors ||
    response?.items ||
    response?.docs ||
    nested?.doctors ||
    nested?.items ||
    nested?.docs ||
    nested?.data ||
    []
  );
};

const toShiftPayload = (data: Record<string, unknown>) => {
  const startsAt = data.startDate && data.startTime
    ? new Date(`${data.startDate}T${data.startTime}`).toISOString()
    : undefined;
    
  const endsAt = data.endDate && data.endTime
    ? new Date(`${data.endDate}T${data.endTime}`).toISOString()
    : undefined;

  return {
    department: data.department,
    doctor: data.doctor, // الآن يحتوي على الـ ID فقط مباشرة
    startsAt,
    endsAt,
    notes: data.notes,
  };
};

// --- Component ---
export default function ShiftsPage() {
  const perm = usePermissions("shifts");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; data?: ShiftType }>(null);
  const [delId, setDelId] = useState<string | number | null>(null);

  // جلب الأطباء
  const doctorsQuery = useGet({
    endpoint: "doctors",
    queryKey: "doctors",
    params: { limit: 100, page: 1,       from: fromDate,
      to: toDate,
    },
  });

  // جلب قائمة الأطباء الخام
  const doctorsList = useMemo(() => getDoctorsPayload(doctorsQuery.data), [doctorsQuery.data]);

  // دالة مساعدة لتحويل الـ ID إلى اسم طبيب لعرضه في البطاقات
  const getDoctorName = (doctorId: string | undefined) => {
    if (!doctorId) return "";
    const doc = doctorsList.find((d: any) => (d._id || d.id) === doctorId);
    return doc ? (doc.name || doc.email || "طبيب غير معروف") : doctorId;
  };

  // تحويل الخيارات إلى { label, value } لضمان عرض الاسم فقط مع الحفاظ على تفريد الـ ID داخلياً
  const doctorOptions = useMemo(() => {
    return doctorsList.map((doc: any) => ({
      label: doc.name || doc.email || "طبيب غير معروف",
      value: String(doc._id || doc.id)
    }));
  }, [doctorsList]);

  // حقن الخيارات ديناميكياً في الـ Fields
  const formFields = useMemo(() => {
    return SHIFT_FIELDS.map((f) => {
      if (f.key === "doctor") {
        return { ...f, options: doctorOptions };
      }
      return f;
    });
  }, [doctorOptions]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const shiftsQuery = useGet({
    endpoint: "shifts",
    queryKey: "shifts",
    params: { page, limit: PAGE_SIZE, search: debouncedSearch,       from: fromDate,
      to: toDate,
    },
  });

  const { shifts, total, totalPages } = useMemo(
    () => getShiftsPayload(shiftsQuery.data as ShiftsApiResponse | undefined, page),
    [shiftsQuery.data, page]
  );

  const createShift = useApiMutation({
    method: "post",
    endpoint: "shifts",
    queryKey: "shifts",
    successMessage: "تمت إضافة المناوبة بنجاح",
    onSuccess: () => setModal(null),
  });

  const updateShift = useApiMutation({
    method: "patch",
    endpoint: "shifts",
    queryKey: "shifts",
    successMessage: "تم تعديل المناوبة بنجاح",
    onSuccess: () => setModal(null),
  });

  const deleteShift = useApiMutation({
    method: "delete",
    endpoint: "shifts",
    queryKey: "shifts",
    successMessage: "تم حذف المناوبة بنجاح",
    onSuccess: () => setDelId(null),
  });

  const isSaving = createShift.isPending || updateShift.isPending;
  const selectedShift = shifts.find((s) => s.id === delId);

  const save = (d: Record<string, unknown>) => {
    if (!modal) return;
    const payload = toShiftPayload(d);
    
    if (modal.mode === "add") {
      createShift.mutate({ data: payload });
    } else {
      updateShift.mutate({ id: modal.data?.id, data: payload });
    }
  };

  return (
    <div>
      <SectionHeader
        title="جدول المناوبات"
        subtitle={`${total} مناوبة`}
        onAdd={perm.canCreate ? () => setModal({ mode: "add" }) : undefined}
      />
      
      <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="بحث بالقسم أو اسم الطبيب..."
      />

      {shiftsQuery.isLoading ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          جاري تحميل المناوبات...
        </Card>
      ) : shiftsQuery.isError ? (
        <Card className="p-6 text-center text-sm text-red-600">
          تعذر تحميل المناوبات
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map((sh) => (
              <Card key={sh.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: SHIFT_COLORS[sh.department] ?? "#64748B" }}
                      />
                      <h3 className="font-semibold text-sm">{sh.department}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatTime(sh.startsAt)} — {formatTime(sh.endsAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(sh.startsAt)}
                    </p>
                  </div>
                  {(perm.canEdit || perm.canDelete) && (
                    <RowActions
                      onEdit={perm.canEdit ? () => setModal({ mode: "edit", data: sh }) : undefined}
                      onDelete={perm.canDelete ? () => setDelId(sh.id) : undefined}
                    />
                  )}
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  {/* عرض اسم الطبيب بدلاً من الـ ID */}
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    الطبيب: {getDoctorName(sh.doctor)}
                  </p>
                  {sh.notes && (
                    <p className="text-xs text-muted-foreground">{sh.notes}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {modal && (
        <FormModal
          title={modal.mode === "add" ? "إضافة مناوبة" : "تعديل المناوبة"}
          fields={formFields}
          initial={
            modal.mode === "edit" && modal.data
              ? {
                  department: modal.data.department,
                  doctor: modal.data.doctor, // الآن يحتوي على الـ ID فقط مباشرة
                  startDate: toLocalDate(modal.data.startsAt),
                  startTime: toLocalTime(modal.data.startsAt),
                  endDate: toLocalDate(modal.data.endsAt),
                  endTime: toLocalTime(modal.data.endsAt),
                  notes: modal.data.notes,
                }
              : { department: "Emergency" }
          }
          onSave={(data) => {
            if (!isSaving) save(data);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {delId !== null && (
        <ConfirmDelete
          name={selectedShift?.department ?? ""}
          onConfirm={() => {
            if (!deleteShift.isPending) deleteShift.mutate({ id: delId });
          }}
          onClose={() => setDelId(null)}
        />
      )}
    </div>
  );
}