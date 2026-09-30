import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { MedicineItem, Prescription } from "../types/prescriptionTypes";
import type {
  ApiPrescription,
  PrescriptionsApiResponse,
} from "../types/prescriptionApiTypes";
import useGet from "../hooks/useGet";
import useApiMutation from "../hooks/useApiMutation";
import {
  SectionHeader,
  SearchBar,
  Card,
  ConfirmDelete,
  DataTable,
  Pagination,
  DateRangeFilter,
} from "../components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import type { ColumnDef } from "../components/shared/DataTable";

const PAGE_SIZE = 10;

// --- Helper to extract lists from varied API responses ---
const extractList = (resp: any): any[] => {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp.data)) return resp.data;
  if (Array.isArray(resp.items)) return resp.items;
  if (Array.isArray(resp.docs)) return resp.docs;
  const nested = resp.data && typeof resp.data === "object" ? resp.data : resp;
  if (Array.isArray(nested.items)) return nested.items;
  if (Array.isArray(nested.docs)) return nested.docs;
  if (Array.isArray(nested.data)) return nested.data;
  return [];
};

// --- Helper to safely extract entity names (handles populated objects or raw IDs) ---
const getEntityName = (entity: any, list?: any[]) => {
  if (!entity) return "-";
  
  // إذا كان الـ Backend يرجع ID فقط (String)
  if (typeof entity === "string") {
    if (list) {
      const found = list.find((item) => String(item.id ?? item._id) === entity);
      if (found) {
        return (
          found.fullName ||
          found.name ||
          found.user?.name ||
          `${found.firstName ?? ""} ${found.lastName ?? ""}`.trim() ||
          entity
        );
      }
    }
    return entity; // إرجاع الـ ID إذا لم يتم العثور عليه في القائمة
  }
  
  // إذا كان الـ Backend يرجع الكائن كاملاً (Populated Object)
  return (
    entity.fullName ||
    entity.name ||
    entity.user?.name ||
    `${entity.firstName ?? ""} ${entity.lastName ?? ""}`.trim() ||
    "-"
  );
};

function RxModal({
  mode,
  initial,
  isSaving,
  onSave,
  onClose,
}: {
  mode: "add" | "edit";
  initial?: Prescription;
  isSaving?: boolean;
  onSave: (payload: {
    diagnosis?: string;
    medicines?: MedicineItem[];
    notes?: string;
    patientId?: string;
    doctorId?: string;
  }) => void;
  onClose: () => void;
}) {
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [medicines, setMedicines] = useState<MedicineItem[]>(
    initial?.medicines ?? [{}]
  );

  const patientsQuery = useGet({
    endpoint: "patients",
    queryKey: "patients-list",
    params: { page: 1, limit: 500 },
  });
  const patientsList = extractList(patientsQuery.data);

  const doctorsQuery = useGet({
    endpoint: "doctors",
    queryKey: "doctors-list",
    params: { page: 1, limit: 1000 },
  });
  const doctorsList = extractList(doctorsQuery.data);

  const [selectedPatient, setSelectedPatient] = useState<string>(
    initial?.id ? String(initial.id) : ""
  );
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");

  const updateMedicine = (
    index: number,
    key: keyof MedicineItem,
    value: string
  ) =>
    setMedicines((s) =>
      s.map((m, i) => (i === index ? { ...m, [key]: value } : m))
    );

  const medsQuery = useGet({
    endpoint: "medicines",
    queryKey: "medicines",
    params: { page: 1, limit: 200 },
  });
  const medsList = extractList(medsQuery.data);

  function MedSelect({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="اختر..." />
        </SelectTrigger>
        <SelectContent className="max-h-[240px]">
          <SelectItem value=" ">اختر...</SelectItem>
          {medsList.map((m: any) => {
            const id = String(m.id ?? m._id ?? m.name ?? " ");
            const label = m.name ?? id;
            return (
              <SelectItem key={id} value={id}>
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-bold text-base text-foreground">
            {mode === "add" ? "إضافة وصفة" : "تعديل الوصفة"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                التشخيص
              </label>
              <input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-input-background border border-border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  المريض
                </label>
                <Select
                  value={selectedPatient}
                  onValueChange={setSelectedPatient}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر مريض..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[240px]">
                    <SelectItem value="">اختر مريض...</SelectItem>
                    {patientsList.map((p: any) => (
                      <SelectItem
                        key={p.id ?? p._id}
                        value={String(p.id ?? p._id)}
                      >
                        {getEntityName(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  الطبيب
                </label>
                <Select
                  value={selectedDoctor}
                  onValueChange={setSelectedDoctor}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر طبيب..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[240px]">
                    <SelectItem value="">اختر طبيب...</SelectItem>
                    {doctorsList.map((d: any) => (
                      <SelectItem
                        key={d.id ?? d._id}
                        value={String(d.id ?? d._id)}
                      >
                        {getEntityName(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-muted-foreground">
                  الأدوية
                </label>
              </div>
              <div className="space-y-2">
                {medicines.map((m, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 items-end">
                    <div>
                      <label className="text-xs text-muted-foreground">الاسم</label>
                      <input
                        value={m.name ?? ""}
                        onChange={(e) => updateMedicine(i, "name", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">الرقم/المعرف</label>
                      <MedSelect
                        value={m.medicine ?? ""}
                        onChange={(val) => updateMedicine(i, "medicine", val)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">الجرعة</label>
                      <input
                        value={m.dosage ?? ""}
                        onChange={(e) => updateMedicine(i, "dosage", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">التكرار</label>
                      <input
                        value={m.frequency ?? ""}
                        onChange={(e) => updateMedicine(i, "frequency", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">المدة</label>
                      <input
                        value={m.duration ?? ""}
                        onChange={(e) => updateMedicine(i, "duration", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-border rounded"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground">تعليمات</label>
                      <input
                        value={m.instructions ?? ""}
                        onChange={(e) => updateMedicine(i, "instructions", e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-border rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                ملاحظات
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 text-sm bg-input-background border border-border rounded-lg resize-none"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={() =>
              onSave({
                diagnosis,
                medicines,
                notes,
                patientId: selectedPatient,
                doctorId: selectedDoctor,
              })
            }
            disabled={isSaving}
            className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold"
          >
            حفظ
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-muted text-foreground py-2.5 rounded-xl text-sm font-semibold"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

const pickNumber = (...values: Array<number | undefined>) =>
  values.find((value) => typeof value === "number");

// --- تعديل هام: استخدام spread (...) للحفاظ على حقول patient و doctor و createdAt القادمة من الـ API ---
const toPrescription = (p: ApiPrescription): Prescription => {
  const base = {
    id: p.id ?? p._id ?? crypto.randomUUID(),
    diagnosis: p.diagnosis ?? "",
    medicines: p.medicines ?? [],
    notes: p.notes ?? "",
  };
  // دمج كل الحقول الأخرى (بما في ذلك patient, doctor, createdAt)
  return { ...base, ...(p as any) } as Prescription;
};

const getPrescriptionsPayload = (
  response: PrescriptionsApiResponse | undefined,
  page: number
) => {
  const nested =
    response?.data && !Array.isArray(response.data) ? response.data : undefined;
  const list =
    (Array.isArray(response?.data) && response.data) ||
    response?.items ||
    response?.docs ||
    nested?.items ||
    nested?.docs ||
    nested?.data ||
    [];

  const pagination = response?.pagination ?? nested?.pagination;
  const meta = response?.meta ?? nested?.meta;

  const total =
    pickNumber(
      response?.total,
      response?.totalItems,
      response?.totalRecords,
      response?.totalCount,
      response?.count,
      response?.totalDocs,
      nested?.total,
      nested?.totalItems,
      nested?.totalRecords,
      nested?.totalCount,
      nested?.count,
      nested?.totalDocs,
      pagination?.total,
      pagination?.totalItems,
      pagination?.totalRecords,
      pagination?.totalCount,
      pagination?.count,
      pagination?.totalDocs,
      meta?.total,
      meta?.totalItems,
      meta?.totalRecords,
      meta?.totalCount,
      meta?.count,
      meta?.totalDocs
    ) ?? list.length;

  const apiTotalPages = pickNumber(
    response?.totalPages,
    response?.totalPage,
    response?.pages,
    response?.lastPage,
    nested?.totalPages,
    pagination?.totalPages,
    pagination?.totalPage,
    pagination?.pages,
    pagination?.lastPage,
    meta?.totalPages,
    meta?.totalPage,
    meta?.pages,
    meta?.lastPage
  );

  const totalPages = apiTotalPages ?? Math.ceil(total / PAGE_SIZE);
  const fallbackPages =
    apiTotalPages === undefined &&
    total === list.length &&
    list.length >= PAGE_SIZE
      ? page + 1
      : totalPages;

  return {
    prescriptions: list.map(toPrescription),
    total,
    totalPages: Math.max(1, fallbackPages),
  };
};

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | {
    mode: "add" | "edit";
    data?: Prescription;
  }>(null);
  const [delId, setDelId] = useState<string | number | null>(null);

  // جلب قوائم المرضى والأطباء لاستخدامها في عرض الأسماء في الجدول
  const patientsQuery = useGet({
    endpoint: "patients",
    queryKey: "patients-list",
    params: { page: 1, limit: 500,       from: fromDate,
      to: toDate,
    },
  });
  const patientsList = extractList(patientsQuery.data);

  const doctorsQuery = useGet({
    endpoint: "doctors",
    queryKey: "doctors-list",
    params: { page: 1, limit: 1000,       from: fromDate,
      to: toDate,
    },
  });
  const doctorsList = extractList(doctorsQuery.data);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const prescriptionsQuery = useGet({
    endpoint: "prescriptions",
    queryKey: "prescriptions",
    params: { page, limit: PAGE_SIZE, search: debouncedSearch,       from: fromDate,
      to: toDate,
    },
  });

  const { prescriptions, total, totalPages } = useMemo(
    () =>
      getPrescriptionsPayload(
        prescriptionsQuery.data as PrescriptionsApiResponse | undefined,
        page
      ),
    [prescriptionsQuery.data, page]
  );

  const createPrescription = useApiMutation({
    method: "post",
    endpoint: "patients",
    queryKey: "prescriptions",
    successMessage: "تمت إضافة الوصفة بنجاح",
    onSuccess: () => setModal(null),
  });

  const updatePrescription = useApiMutation({
    method: "patch",
    endpoint: "prescriptions",
    queryKey: "prescriptions",
    successMessage: "تم تعديل الوصفة بنجاح",
    onSuccess: () => setModal(null),
  });

  const deletePrescription = useApiMutation({
    method: "delete",
    endpoint: "prescriptions",
    queryKey: "prescriptions",
    successMessage: "تم حذف الوصفة بنجاح",
    onSuccess: () => setDelId(null),
  });

  const isSaving = createPrescription.isPending || updatePrescription.isPending;
  const selected = (prescriptions ?? []).find((p) => p.id === delId);

  // --- تحديث الأعمدة لتشمل المريض، الطبيب، والتاريخ ---
  const columns = useMemo<ColumnDef<Prescription>[]>(
    () => [
      {
        header: "المريض",
        cell: (p) => (
          <span className="font-medium text-sm">
            {getEntityName((p as any).patient, patientsList)}
          </span>
        ),
      },
      {
        header: "الطبيب",
        cell: (p) => (
          <span className="text-sm text-muted-foreground">
            {getEntityName((p as any).doctor, doctorsList)}
          </span>
        ),
      },
      {
        header: "التشخيص",
        cell: (p) => <span className="font-medium">{p.diagnosis}</span>,
      },
      {
        header: "الأدوية",
        cell: (p) => (
          <div className="text-xs text-muted-foreground">
            {p.medicines.length === 0
              ? "-"
              : p.medicines.map((m) => m.name ?? m.medicine ?? " ").join(", ")}
          </div>
        ),
      },
      {
        header: "التاريخ",
        cell: (p) => {
          const date = (p as any).createdAt;
          return date ? (
            <span className="text-xs font-mono">
              {new Date(date).toLocaleDateString("ar-EG")}
            </span>
          ) : (
            "-"
          );
        },
      },
      {
        header: "ملاحظات",
        cell: (p) => (
          <span className="text-xs text-muted-foreground">{p.notes}</span>
        ),
      },
    ],
    [patientsList, doctorsList]
  );

  // --- تحديث بطاقة الموبايل لعرض كافة التفاصيل ---
  const renderMobileCard = (p: Prescription, actions: ReactNode) => (
    <Card key={p.id} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1">
            المريض: {getEntityName((p as any).patient, patientsList)}
          </p>
          <p className="text-xs text-muted-foreground mb-1">
            الطبيب: {getEntityName((p as any).doctor, doctorsList)}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {new Date((p as any).createdAt || Date.now()).toLocaleDateString("ar-EG")}
          </p>
        </div>
        {actions}
      </div>

      <div className="bg-muted/30 rounded-lg p-2 mb-2">
        <p className="text-xs font-semibold text-foreground mb-1">التشخيص:</p>
        <p className="text-xs text-muted-foreground">{p.diagnosis}</p>
      </div>

      <div className="bg-muted/30 rounded-lg p-2 mb-2">
        <p className="text-xs font-semibold text-foreground mb-1">الأدوية:</p>
        <p className="text-xs text-muted-foreground">
          {(p.medicines || []).map((m) => m.name ?? m.medicine ?? " ").join(", ") || "-"}
        </p>
      </div>

      {p.notes && (
        <div className="text-xs text-muted-foreground border-t border-border pt-2">
          <span className="font-semibold">ملاحظات: </span>
          {p.notes}
        </div>
      )}
    </Card>
  );

  return (
    <div>
      <SectionHeader
        title="إدارة الوصفات"
        subtitle={`${total} وصفة`}
        onAdd={isDoctor ? () => setModal({ mode: "add" }) : undefined}
      />

      <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="بحث بالتشخيص، المريض، أو ملاحظة..."
      />

      {prescriptionsQuery.isLoading ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          جارٍ تحميل الوصفات...
        </Card>
      ) : prescriptionsQuery.isError ? (
        <Card className="p-6 text-center text-sm text-red-600">
          تعذر تحميل الوصفات
        </Card>
      ) : (
        <>
          <DataTable
            data={prescriptions ?? []}
            columns={columns}
            renderMobileCard={renderMobileCard}
            onEdit={
              isDoctor ? (p) => setModal({ mode: "edit", data: p }) : undefined
            }
            onDelete={isDoctor ? (p) => setDelId(p.id) : undefined}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {modal && (
        <RxModal
          mode={modal.mode}
          initial={modal.data}
          isSaving={isSaving}
          onSave={(payload) => {
            const data = {
              diagnosis: payload.diagnosis,
              medicines: payload.medicines,
              notes: payload.notes,
              doctor: payload.doctorId,
            } as Record<string, unknown>;

            if (!isDoctor) return;

            if (modal.mode === "add") {
              if (payload.patientId)
                createPrescription.mutate({
                  id: `${payload.patientId}/prescriptions`,
                  data,
                });
              else createPrescription.mutate({ data });
            } else {
              updatePrescription.mutate({ id: modal.data?.id, data });
            }
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {delId !== null && (
        <ConfirmDelete
          name={selected?.diagnosis ?? ""}
          onConfirm={() => {
            if (!deletePrescription.isPending && isDoctor && delId !== null)
              deletePrescription.mutate({ id: delId });
          }}
          onClose={() => setDelId(null)}
        />
      )}
    </div>
  );
}