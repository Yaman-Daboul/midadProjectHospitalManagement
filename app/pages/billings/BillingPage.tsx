import { useState } from "react";
import type { FieldConfig } from "../types";
import { INIT_BILLS, INIT_PATIENTS } from "../data/initialData";
import {
  SectionHeader, SearchBar, Card,
  payBadge, ConfirmDelete, FormModal, DataTable,
} from "../components/shared";
import type { ColumnDef } from "../components/shared/DataTable";

type Bill = typeof INIT_BILLS[0];

const BILL_FIELDS: FieldConfig[] = [
  { key: "patient",  label: "المريض",       type: "select", options: INIT_PATIENTS.map((p) => p.name) },
  { key: "date",     label: "التاريخ",      type: "date" },
  { key: "amount",   label: "المبلغ (ر.س)", type: "number" },
  { key: "services", label: "الخدمات",      type: "text" },
  { key: "status",   label: "حالة الدفع",   type: "select", options: ["paid", "unpaid"] },
];

const columns: ColumnDef<Bill>[] = [
  { header: "رقم الفاتورة", cell: (b) => <span className="font-mono font-semibold text-primary">#{b.id}</span> },
  { header: "المريض", cell: (b) => <span className="font-medium">{b.patient}</span> },
  { header: "التاريخ", cell: (b) => <span className="font-mono text-sm">{b.date}</span> },
  { header: "الخدمات", cell: (b) => <span className="text-sm text-muted-foreground">{b.services}</span> },
  { header: "المبلغ", cell: (b) => <span className="font-mono font-semibold">{b.amount.toLocaleString()} ر.س</span> },
  { header: "الحالة", cell: (b) => payBadge(b.status) },
];

export default function BillingPage() {
  const [items, setItems] = useState(INIT_BILLS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; data?: Bill }>(null);
  const [delId, setDelId] = useState<number | null>(null);

  const searched = items.filter(
    (b) => b.patient.includes(search) || b.id.toString().includes(search)
  );
  
  const filtered = filter === "all" ? searched : searched.filter((b) => b.status === filter);
  const totalUnpaid = items.filter((b) => b.status === "unpaid").reduce((s, b) => s + b.amount, 0);

  const save = (d: Record<string, unknown>) => {
    if (modal?.mode === "add") setItems((p) => [...p, { ...(d as Bill), id: Date.now() }]);
    else setItems((p) => p.map((x) => (x.id === modal?.data?.id ? { ...x, ...(d as Bill) } : x)));
    setModal(null);
  };

  const renderMobileCard = (b: Bill, actions: React.ReactNode) => (
    <Card key={b.id} className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-mono text-xs font-bold text-primary">#{b.id}</span>
          <p className="font-semibold">{b.patient}</p>
          <p className="text-xs text-muted-foreground">{b.services}</p>
        </div>
        {actions}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="font-mono font-bold text-sm">{b.amount.toLocaleString()} ر.س</span>
        {payBadge(b.status)}
      </div>
    </Card>
  );

  return (
    <div>
      <SectionHeader
        title="الفواتير والمدفوعات"
        subtitle="إدارة السجل المالي"
        onAdd={() => setModal({ mode: "add" })}
      />
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">الإجمالي</p>
          <p className="text-xl font-bold">{items.length}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">غير مدفوعة</p>
          <p className="text-xl font-bold text-red-600">{items.filter((b) => b.status === "unpaid").length}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">المتأخر</p>
          <p className="text-lg font-bold text-amber-600">
            {totalUnpaid.toLocaleString()} <span className="text-xs">ر.س</span>
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="بحث برقم الفاتورة أو المريض..." />
        <div className="flex gap-2">
          {[["all", "الكل"], ["paid", "مدفوع"], ["unpaid", "غير مدفوع"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filter === v ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:bg-muted/30"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        renderMobileCard={renderMobileCard}
        onEdit={(b) => setModal({ mode: "edit", data: b })}
        onDelete={(b) => setDelId(b.id)}
      />

      {modal && (
        <FormModal
          title={modal.mode === "add" ? "إصدار فاتورة جديدة" : "تعديل الفاتورة"}
          fields={BILL_FIELDS}
          initial={modal.data as Record<string, unknown>}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
      {delId !== null && (
        <ConfirmDelete
          name={`فاتورة #${delId}`}
          onConfirm={() => { setItems((p) => p.filter((x) => x.id !== delId)); setDelId(null); }}
          onClose={() => setDelId(null)}
        />
      )}
    </div>
  );
}
