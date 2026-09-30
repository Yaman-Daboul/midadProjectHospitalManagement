import { useState, useEffect, useMemo } from "react";
import { Pill, Syringe } from "lucide-react";
import type { FieldConfig } from "../types";
import useGet from "../hooks/useGet";
import useApiMutation from "../hooks/useApiMutation";
import {
  SectionHeader,
  Card,
  ConfirmDelete,
  FormModal,
  SearchBar,
  DataTable,
  Pagination,
  DateRangeFilter,
} from "../components/shared";
import type { ColumnDef } from "../components/shared/DataTable";

type ApiInventory = {
  id?: string | number;
  _id?: string | number;
  medicine?: { _id?: string; id?: string; name?: string } | string;
  quantity?: number;
  minimumQuantity?: number;
  batchNumber?: string;
  expiryDate?: string;
  location?: string;
};

type InventoryItem = {
  id: string | number;
  medicineId: string;
  medicineName: string;
  quantity: number;
  minimumQuantity: number;
  batchNumber: string;
  expiryDate: string;
  location: string;
};

type ApiEquipment = {
  id?: string | number;
  _id?: string | number;
  name?: string;
  code?: string;
  category?: string;
  quantity?: number;
  availableQuantity?: number;
  status?: string;
  location?: string;
  notes?: string;
};

type Equipment = {
  id: string | number;
  name: string;
  code: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  status: string;
  location: string;
  notes: string;
};

const getMedFields = (medOptions: { label: string; value: string }[]): FieldConfig[] => [
  { key: "medicine", label: "اسم الدواء", type: "select", options: medOptions },
  { key: "quantity", label: "الكمية الحالية", type: "number" },
  { key: "minimumQuantity", label: "الحد الأدنى", type: "number" },
  { key: "batchNumber", label: "رقم الدفعة", type: "text" },
  { key: "expiryDate", label: "تاريخ الانتهاء", type: "date" },
  { key: "location", label: "الموقع", type: "text" },
];

const EQ_FIELDS: FieldConfig[] = [
  { key: "name", label: "اسم المعدة", type: "text" },
  { key: "code", label: "الرمز", type: "text" },
  { key: "category", label: "الفئة", type: "text" },
  { key: "quantity", label: "الكمية الإجمالية", type: "number" },
  { key: "availableQuantity", label: "الكمية المتاحة", type: "number" },
  { key: "status", label: "الحالة", type: "select", options: ["available", "maintenance", "broken"] },
  { key: "location", label: "الموقع", type: "text" },
  { key: "notes", label: "ملاحظات", type: "text" },
];

const renderStatus = (status: string) => {
  if (status === "available") return <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">متاح</span>;
  if (status === "maintenance") return <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200">صيانة</span>;
  return <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200">معطل</span>;
};

const columns: ColumnDef<Equipment>[] = [
  {
    header: "المعدة",
    cell: (eq) => (
      <div>
        <p className="font-medium">{eq.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{eq.code}</p>
      </div>
    ),
  },
  {
    header: "الفئة",
    cell: (eq) => eq.category,
  },
  {
    header: "الكمية",
    cell: (eq) => (
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${eq.quantity > 0 ? (eq.availableQuantity / eq.quantity) * 100 : 0}%` }}
          />
        </div>
        <span className="font-mono font-semibold text-sm">{eq.availableQuantity} / {eq.quantity}</span>
      </div>
    ),
  },
  {
    header: "الحالة",
    cell: (eq) => renderStatus(eq.status),
  },
  {
    header: "الموقع",
    cell: (eq) => eq.location,
  },
];
const drugColumns: ColumnDef<InventoryItem>[] = [
  {
    header: "الدواء",
    cell: (d) => (
      <div>
        <p className="font-medium">{d.medicineName}</p>
        <p className="text-xs text-muted-foreground font-mono">{d.batchNumber}</p>
      </div>
    ),
  },
  {
    header: "الكمية",
    cell: (d) => (
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, (d.quantity / (d.minimumQuantity * 3 || 1)) * 100)}%`,
              background: d.quantity <= d.minimumQuantity ? "#EF4444" : "#10B981",
            }}
          />
        </div>
        <span className="font-mono font-semibold text-sm">{d.quantity}</span>
      </div>
    ),
  },
  {
    header: "الحد الأدنى",
    cell: (d) => <span className="font-mono">{d.minimumQuantity}</span>,
  },
  {
    header: "الحالة",
    cell: (d) =>
      d.quantity <= d.minimumQuantity ? (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200">
          نقص كمية
        </span>
      ) : (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
          متاح
        </span>
      ),
  },
  {
    header: "تاريخ الانتهاء",
    cell: (d) => <span className="font-mono text-sm">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString("en-GB") : "-"}</span>,
  },
  {
    header: "الموقع",
    cell: (d) => d.location,
  },
];

export default function InventoryPage() {
  const [tab, setTab] = useState<"drugs" | "equipment">("drugs");

  // --- Drugs State (API) ---
  const [medModal, setMedModal] = useState<null | { mode: "add" | "edit"; data?: InventoryItem }>(null);
  const [medDelId, setMedDelId] = useState<string | number | null>(null);

  // --- Equipment State (API) ---
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [eqModal, setEqModal] = useState<null | { mode: "add" | "edit"; data?: Equipment }>(null);
  const [eqDelId, setEqDelId] = useState<string | number | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  // --- Fetch Medications for Dropdown ---
  const medsQuery = useGet({
    endpoint: "medicines",
    queryKey: "medicines",
    params: { page: 1, limit: 200,from: fromDate,
      to: toDate,
    },
    enabled: tab === "drugs",
  });
  
  const medOptions = useMemo(() => {
    const res = medsQuery.data as any;
    const nested = res?.data && !Array.isArray(res.data) ? res.data : undefined;
    const list =
      (Array.isArray(res?.data) && res.data) ||
      res?.items || res?.docs || nested?.items || nested?.docs || nested?.data || [];
    return list.map((m: any) => ({
      label: m.name ?? "-",
      value: String(m.id ?? m._id),
    }));
  }, [medsQuery.data]);

  // --- Fetch Inventory (Drugs) ---
  const inventoryQuery = useGet({
    endpoint: "inventory",
    queryKey: "inventory",
    params: { page, limit: 10, search: debouncedSearch ,from: fromDate,
      to: toDate,
    },
    enabled: tab === "drugs",
  });
  const inventoryData = useMemo(() => {
    const res = inventoryQuery.data as any;
    const nested = res?.data && !Array.isArray(res.data) ? res.data : undefined;
    const rawList =
      (Array.isArray(res?.data) && res.data) ||
      res?.items || res?.docs || nested?.items || nested?.docs || nested?.data || [];
    
    const list = Array.isArray(rawList) ? rawList : [];
    const meta = res?.meta || res?.pagination || nested?.meta || nested?.pagination || {};
    const total = meta.total ?? res?.total ?? list.length;
    const totalPages = meta.pages ?? res?.pages ?? Math.ceil(total / 10);

    return {
      inventory: list.map((d: ApiInventory): InventoryItem => {
        const medObj = typeof d.medicine === "object" && d.medicine !== null ? d.medicine : null;
        const medicineIdStr = medObj ? String(medObj.id ?? medObj._id) : (typeof d.medicine === "string" ? d.medicine : "");
        const matchedMed = medOptions.find((o: { label: string; value: string }) => o.value === medicineIdStr);
        const resolvedName = medObj?.name || matchedMed?.label || "-";

        return {
          id: d.id ?? d._id ?? crypto.randomUUID(),
          medicineId: medicineIdStr,
          medicineName: resolvedName,
          quantity: d.quantity ?? 0,
          minimumQuantity: d.minimumQuantity ?? 0,
          batchNumber: d.batchNumber ?? "",
          expiryDate: d.expiryDate ? d.expiryDate.split("T")[0] : "", // Formatted for input type="date"
          location: d.location ?? "",
        };
      }),
      total,
      totalPages: Math.max(1, totalPages),
    };
  }, [inventoryQuery.data, medOptions]);

  const equipQuery = useGet({
    endpoint: "equipment",
    queryKey: "equipment",
    params: { page, limit: 10, search: debouncedSearch,from: fromDate,
      to: toDate,
    },
    enabled: tab === "equipment",
  });

  const equipData = useMemo(() => {
    const res = equipQuery.data as any;
    // فحص آمن للبيانات المتداخلة (Nested Data)
    const nested = res?.data && !Array.isArray(res.data) ? res.data : undefined;

    const rawList =
      (Array.isArray(res?.data) && res.data) ||
      res?.equipment ||
      res?.items ||
      res?.docs ||
      nested?.equipment ||
      nested?.items ||
      nested?.docs ||
      nested?.data ||
      [];

    // ضمان أن القائمة مصفوفة دائماً قبل استخدام .map
    const list = Array.isArray(rawList) ? rawList : [];

    const meta = res?.meta || res?.pagination || nested?.meta || nested?.pagination || {};
    const total = meta.total ?? res?.total ?? list.length;
    const totalPages = meta.pages ?? res?.pages ?? Math.ceil(total / 10);

    return {
      equipment: list.map((e: ApiEquipment) => ({
        id: e.id ?? e._id ?? crypto.randomUUID(),
        name: e.name ?? "",
        code: e.code ?? "",
        category: e.category ?? "",
        quantity: e.quantity ?? 0,
        availableQuantity: e.availableQuantity ?? 0,
        status: e.status ?? "available",
        location: e.location ?? "",
        notes: e.notes ?? "",
      })),
      total,
      totalPages: Math.max(1, totalPages),
    };
  }, [equipQuery.data]);

  const createEquip = useApiMutation({
    method: "post",
    endpoint: "equipment",
    queryKey: "equipment",
    successMessage: "تمت إضافة المعدة بنجاح",
    onSuccess: () => setEqModal(null),
  });

  const updateEquip = useApiMutation({
    method: "patch",
    endpoint: "equipment",
    queryKey: "equipment",
    successMessage: "تم تعديل المعدة بنجاح",
    onSuccess: () => setEqModal(null),
  });

  const deleteEquip = useApiMutation({
    method: "delete",
    endpoint: "equipment",
    queryKey: "equipment",
    successMessage: "تم حذف المعدة بنجاح",
    onSuccess: () => setEqDelId(null),
  });

  const isSavingEquip = createEquip.isPending || updateEquip.isPending;

  const createDrug = useApiMutation({
    method: "post",
    endpoint: "inventory",
    queryKey: "inventory",
    successMessage: "تمت إضافة الدواء للمستودع بنجاح",
    onSuccess: () => setMedModal(null),
  });

  const updateDrug = useApiMutation({
    method: "patch",
    endpoint: "inventory",
    queryKey: "inventory",
    successMessage: "تم تعديل الدواء بنجاح",
    onSuccess: () => setMedModal(null),
  });

  const deleteDrug = useApiMutation({
    method: "delete",
    endpoint: "inventory",
    queryKey: "inventory",
    successMessage: "تم حذف الدواء من المستودع بنجاح",
    onSuccess: () => setMedDelId(null),
  });

  const isSavingDrug = createDrug.isPending || updateDrug.isPending;

  const saveDrug = (d: Record<string, unknown>) => {
    if (!medModal) return;
    
    // Ensure expiryDate is sent in full ISO format if provided
    let isoExpiry = d.expiryDate;
    if (isoExpiry && typeof isoExpiry === "string" && isoExpiry.length === 10) {
      isoExpiry = new Date(isoExpiry).toISOString();
    }

    const payload = {
      medicine: d.medicine,
      quantity: Number(d.quantity),
      minimumQuantity: Number(d.minimumQuantity),
      batchNumber: d.batchNumber,
      expiryDate: isoExpiry,
      location: d.location,
    };

    if (medModal.mode === "add") {
      createDrug.mutate({ data: payload });
    } else {
      updateDrug.mutate({ id: medModal.data?.id, data: payload });
    }
  };

  const saveEquip = (d: Record<string, unknown>) => {
    if (!eqModal) return;
    if (eqModal.mode === "add") {
      createEquip.mutate({ data: d });
    } else {
      updateEquip.mutate({ id: eqModal.data?.id, data: d });
    }
  };

  const renderMobileCard = (eq: Equipment, actions: React.ReactNode) => (
    <Card key={eq.id} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{eq.name}</h3>
          <p className="text-xs text-muted-foreground font-mono">{eq.code}</p>
        </div>
        <div className="flex items-center gap-2">
          {renderStatus(eq.status)}
          {actions}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">المتاح / الإجمالي</span>
          <span className="font-mono font-semibold">{eq.availableQuantity} / {eq.quantity}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${eq.quantity > 0 ? (eq.availableQuantity / eq.quantity) * 100 : 0}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>الفئة: {eq.category}</span>
          <span>الموقع: {eq.location}</span>
        </div>
      </div>
    </Card>
  );

  return (
    <div>
      <SectionHeader
        title="إدارة المستودع"
        onAdd={() => {
          if (tab === "drugs") setMedModal({ mode: "add" });
          else setEqModal({ mode: "add" });
        }}
      />
      
      <div className="flex gap-1 mb-5 bg-muted/40 rounded-xl p-1 w-fit">
        <button
          onClick={() => {
            setTab("drugs");
            setSearch("");
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "drugs" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pill size={14} /> الأدوية
        </button>
        <button
          onClick={() => {
            setTab("equipment");
            setSearch("");
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "equipment" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Syringe size={14} /> المعدات
        </button>
      </div>

      {tab === "drugs" ? (
        <>
          <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="بحث باسم الدواء أو رقم الدفعة..."
          />
          {inventoryQuery.isLoading ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              جاري تحميل مخزون الأدوية...
            </Card>
          ) : inventoryQuery.isError ? (
            <Card className="p-6 text-center text-sm text-red-600">
              تعذر تحميل مخزون الأدوية
            </Card>
          ) : (
            <>
              <DataTable
                data={inventoryData.inventory}
                columns={drugColumns}
                renderMobileCard={(d, actions) => (
                  <Card key={d.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">{d.medicineName}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{d.batchNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.quantity <= d.minimumQuantity ? (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200">
                            نقص كمية
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                            متاح
                          </span>
                        )}
                        {actions}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الكمية / الحد الأدنى</span>
                        <span className={`font-mono font-bold ${d.quantity <= d.minimumQuantity ? "text-red-600" : ""}`}>
                          {d.quantity} / {d.minimumQuantity}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${Math.min(100, (d.quantity / (d.minimumQuantity * 3 || 1)) * 100)}%`,
                            background: d.quantity <= d.minimumQuantity ? "#EF4444" : "#10B981",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>انتهاء: {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString("en-GB") : "-"}</span>
                        <span>الموقع: {d.location}</span>
                      </div>
                    </div>
                  </Card>
                )}
                onEdit={(d) => setMedModal({ mode: "edit", data: d })}
                onDelete={(d) => setMedDelId(d.id)}
              />
              <Pagination
                currentPage={page}
                totalPages={inventoryData.totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      ) : (
        <>
          <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="بحث باسم المعدة أو الرمز..."
          />
          {equipQuery.isLoading ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              جاري تحميل المعدات...
            </Card>
          ) : equipQuery.isError ? (
            <Card className="p-6 text-center text-sm text-red-600">
              تعذر تحميل المعدات
            </Card>
          ) : (
            <>
              <DataTable
                data={equipData.equipment}
                columns={columns}
                renderMobileCard={renderMobileCard}
                onEdit={(eq) => setEqModal({ mode: "edit", data: eq })}
                onDelete={(eq) => setEqDelId(eq.id)}
              />
              <Pagination
                currentPage={page}
                totalPages={equipData.totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}

      {/* Drugs Modals & Confirmations */}
      {tab === "drugs" && medModal && (
        <FormModal
          title={medModal.mode === "add" ? "إضافة دواء" : "تعديل الدواء"}
          fields={getMedFields(medOptions)}
          initial={
            medModal.data
              ? {
                  medicine: medModal.data.medicineId,
                  quantity: medModal.data.quantity,
                  minimumQuantity: medModal.data.minimumQuantity,
                  batchNumber: medModal.data.batchNumber,
                  expiryDate: medModal.data.expiryDate,
                  location: medModal.data.location,
                }
              : {}
          }
          onSave={(data) => {
            if (!isSavingDrug) saveDrug(data);
          }}
          onClose={() => setMedModal(null)}
        />
      )}
      {tab === "drugs" && medDelId !== null && (
        <ConfirmDelete
          name={inventoryData.inventory.find((m: InventoryItem) => m.id === medDelId)?.medicineName ?? ""}
          onConfirm={() => {
            if (!deleteDrug.isPending) deleteDrug.mutate({ id: medDelId });
          }}
          onClose={() => setMedDelId(null)}
        />
      )}

      {/* Equipment Modals & Confirmations */}
      {tab === "equipment" && eqModal && (
        <FormModal
          title={eqModal.mode === "add" ? "إضافة معدة" : "تعديل المعدة"}
          fields={EQ_FIELDS}
          initial={eqModal.data as Record<string, unknown>}
          onSave={(data) => {
            if (!isSavingEquip) saveEquip(data);
          }}
          onClose={() => setEqModal(null)}
        />
      )}
      {tab === "equipment" && eqDelId !== null && (
        <ConfirmDelete
          name={equipData.equipment.find((e: Equipment) => e.id === eqDelId)?.name ?? ""}
          onConfirm={() => {
            if (!deleteEquip.isPending) deleteEquip.mutate({ id: eqDelId });
          }}
          onClose={() => setEqDelId(null)}
        />
      )}
    </div>
  );
}