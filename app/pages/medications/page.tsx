import { useEffect, useMemo, useState } from "react";
import type { FieldConfig } from "../types";
import {
  SectionHeader,
  SearchBar,
  Card,
  ConfirmDelete,
  FormModal,
  DataTable,
  Pagination,
  DateRangeFilter,
} from "../components/shared";
import type { ColumnDef } from "../components/shared/DataTable";
import useGet from "../hooks/useGet";
import useApiMutation from "../hooks/useApiMutation";

type Medicine = {
  _id: string;
  name: string;
  code: string;
  category: string;
  manufacturer: string;
  description: string;
  unit: string;
  active: boolean;
};

type MedicinesApiResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
  items?: Medicine[];
  results?: Medicine[];
  medicines?: Medicine[];
  total?: number;
  totalPages?: number;
  count?: number;
  page?: number;
  limit?: number;
  pagination?: {
    total?: number;
    totalPages?: number;
    page?: number;
    limit?: number;
    count?: number;
  };
  meta?: {
    total?: number;
    totalPages?: number;
    page?: number;
    limit?: number;
    count?: number;
  };
  [key: string]: unknown;
};

const PAGE_SIZE = 10;

const MED_FIELDS: FieldConfig[] = [
  { key: "name", label: "اسم الدواء", type: "text" },
  { key: "code", label: "الرمز", type: "text" },
  { key: "category", label: "التصنيف", type: "text" },
  { key: "manufacturer", label: "الشركة المصنعة", type: "text" },
  { key: "description", label: "الوصف", type: "textarea" },
  { key: "unit", label: "الوحدة", type: "text" },
  {
    key: "active",
    label: "الحالة",
    type: "select",
    options: [
      { label: "نشط", value: "true" },
      { label: "غير نشط", value: "false" },
    ],
  },
];

const columns: ColumnDef<Medicine>[] = [
  {
    header: "الدواء",
    cell: (m) => (
      <div>
        <p className="font-semibold">{m.name}</p>
        <p className="text-xs text-muted-foreground mt-1">{m.code}</p>
      </div>
    ),
  },
  {
    header: "التصنيف",
    cell: (m) => <span className="text-sm">{m.category}</span>,
  },
  {
    header: "الشركة المصنعة",
    cell: (m) => <span className="text-sm">{m.manufacturer}</span>,
  },
  {
    header: "الوحدة",
    cell: (m) => <span className="text-sm">{m.unit}</span>,
  },
  {
    header: "الحالة",
    cell: (m) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          m.active
            ? "bg-emerald-100 text-emerald-700"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {m.active ? "نشط" : "غير نشط"}
      </span>
    ),
  },
];

const getNestedNumber = (value: unknown, keys: string[]) => {
  if (!value || typeof value !== "object") return undefined;

  const obj = value as Record<string, unknown>;

  for (const key of keys) {
    const nestedValue = obj[key];
    if (typeof nestedValue === "number") return nestedValue;
    if (nestedValue && typeof nestedValue === "object") {
      const nestedObj = nestedValue as Record<string, unknown>;
      const nestedNumber = nestedObj[key];
      if (typeof nestedNumber === "number") return nestedNumber;
    }
  }

  return undefined;
};

const findMedicineList = (value: unknown): Medicine[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Medicine => !!item && typeof item === "object",
    );
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const obj = value as Record<string, unknown>;

  const directKeys = [
    "data",
    "items",
    "results",
    "medicines",
    "list",
    "records",
  ];
  for (const key of directKeys) {
    const candidate = obj[key];
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (item): item is Medicine => !!item && typeof item === "object",
      );
    }
  }

  for (const nestedValue of Object.values(obj)) {
    const nestedList = findMedicineList(nestedValue);
    if (nestedList.length > 0) {
      return nestedList;
    }
  }

  return [];
};

const normalizeMedicines = (data: MedicinesApiResponse | undefined) => {
  const medicines = findMedicineList(data).map((m: any) => ({
    ...m,
    id: m._id,
  }));

  const total =
    getNestedNumber(data, ["total", "count", "totalItems"]) ?? medicines.length;
  const totalPages =
    getNestedNumber(data, ["totalPages", "pages"]) ??
    Math.max(
      1,
      Math.ceil(
        (typeof total === "number" ? total : medicines.length) / PAGE_SIZE,
      ),
    );

  return { medicines, total, totalPages };
};

export default function MedicationsPage() {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | {
    mode: "add" | "edit";
    data?: Medicine;
  }>(null);
  const [delId, setDelId] = useState<string | number | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const medicinesQuery = useGet({
    endpoint: "medicines",
    queryKey: "medicines",
    params: { page, limit: PAGE_SIZE, search: debouncedSearch,       from: fromDate,
      to: toDate,
    },
  });

  const { medicines, total, totalPages } = useMemo(
    () =>
      normalizeMedicines(
        medicinesQuery.data as MedicinesApiResponse | undefined,
      ),
    [medicinesQuery.data],
  );

  const createMedicine = useApiMutation({
    method: "post",
    endpoint: "medicines",
    queryKey: "medicines",
    successMessage: "تمت إضافة الدواء بنجاح",
    onSuccess: () => {
      setModal(null);
      medicinesQuery.refetch();
    },
  });

  const updateMedicine = useApiMutation({
    method: "patch",
    endpoint: "medicines",
    queryKey: "medicines",
    successMessage: "تم تعديل الدواء بنجاح",
    onSuccess: () => {
      setModal(null);
      medicinesQuery.refetch();
    },
  });

  const deleteMedicine = useApiMutation({
    method: "delete",
    endpoint: "medicines",
    queryKey: "medicines",
    successMessage: "تم حذف الدواء بنجاح",
    onSuccess: () => {
      setDelId(null);
      medicinesQuery.refetch();
    },
  });

  const save = (data: Record<string, unknown>) => {
    if (!modal) return;

    const payload = {
      ...data,
      active: data.active === "true" || data.active === true,
    };

    if (modal.mode === "add") {
      createMedicine.mutate({ data: payload });
      return;
    }

    // استخدام code كـ id احتياطي إذا لم يكن id موجوداً
    const itemId = modal.data?._id;
    if (!itemId) {
      return;
    }

    updateMedicine.mutate({ id: itemId, data: payload });
  };

  const renderMobileCard = (m: Medicine, actions: React.ReactNode) => (
    <Card key={m._id} className="p-4">
      <div className="flex justify-between mb-3">
        <div>
          <p className="font-semibold text-primary">{m.name}</p>
          <p className="text-xs text-muted-foreground mt-1">{m.code}</p>
        </div>
        {actions}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-muted/30 rounded-lg">
          <span className="text-muted-foreground block mb-1">التصنيف</span>
          <span className="font-medium">{m.category}</span>
        </div>
        <div className="p-2 bg-muted/30 rounded-lg">
          <span className="text-muted-foreground block mb-1">الحالة</span>
          <span
            className={`font-medium ${m.active ? "text-emerald-600" : "text-muted-foreground"}`}
          >
            {m.active ? "نشط" : "غير نشط"}
          </span>
        </div>
      </div>
    </Card>
  );

  return (
    <div>
      <SectionHeader
        title="الأدوية"
        subtitle={total ? `${total} دواء` : "لا توجد أدوية"}
        onAdd={() => setModal({ mode: "add" })}
      />
      <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="بحث باسم الدواء أو الرمز أو التصنيف..."
      />

      {medicinesQuery.isLoading ? (
        <div className="mt-4 text-sm text-muted-foreground">
          جاري تحميل الأدوية...
        </div>
      ) : medicinesQuery.isError ? (
        <div className="mt-4 text-sm text-red-500">
          تعذر تحميل الأدوية. يرجى التحقق من الاتصال أو بيانات الاعتماد.
        </div>
      ) : (
        <>
          <DataTable
            data={medicines}
            columns={columns}
            renderMobileCard={renderMobileCard}
            onEdit={(m) => {
              setModal({ mode: "edit", data: m });
            }}
            onDelete={(m) => {
              setDelId(m._id);
            }}
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {modal && (
        <FormModal
          title={modal.mode === "add" ? "إضافة دواء" : "تعديل دواء"}
          fields={MED_FIELDS}
          initial={
            modal.data
              ? { ...modal.data, active: String(modal.data.active) }
              : { active: "true" }
          }
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}

      {delId !== null && (
        <ConfirmDelete
          name={`دواء ${medicines.find((m) => m._id === delId)?.name ?? ""}`}
          onConfirm={() => {
            if (!delId) return;
            deleteMedicine.mutate({ id: delId });
          }}
          onClose={() => {
            setDelId(null);
          }}
        />
      )}
    </div>
  );
}