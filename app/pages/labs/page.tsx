import { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import type { FieldConfig } from "../types";
import type {
  TestStatus,
  MedicalTest,
  ApiTest,
  TestsApiResponse,
  PatientsApiResponse,
} from "../types/labsTypes";
import useGet from "../hooks/useGet";
import useApiMutation from "../hooks/useApiMutation";
import axiosInstance from "../utils/axiosInstance";
import {
  SectionHeader,
  SearchBar,
  Card,
  Avatar,
  ConfirmDelete,
  FormModal,
  DataTable,
  Pagination,
  labBadge,
  DateRangeFilter,
} from "../components/shared";
import type { ColumnDef } from "../components/shared/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { FileText, Upload, Download, X, Eye } from "lucide-react";
import { toast } from "react-toastify";

/* ───────── constants ───────── */

const PAGE_SIZE = 10;

const STATUS_FLAG: Record<TestStatus, string> = {
  requested: "pending",
  in_progress: "warning",
  completed: "normal",
  cancelled: "critical",
};

const TEST_FIELDS: FieldConfig[] = [
  { key: "title", label: "عنوان التحليل", type: "text" },
  { key: "type", label: "نوع التحليل", type: "text" },
  { key: "resultSummary", label: "ملخص النتيجة", type: "textarea" },
  {
    key: "status",
    label: "الحالة",
    type: "select",
    options: [
      { label: "مطلوب", value: "requested" },
      { label: "قيد التنفيذ", value: "in_progress" },
      { label: "مكتمل", value: "completed" },
      { label: "ملغي", value: "cancelled" },
    ],
  },
];

/* ───────── helpers ───────── */

const getPatientId = (p: ApiTest["patient"]): string => {
  if (!p) return "";
  return typeof p === "string" ? p : (p._id ?? "");
};
const getPatientName = (p: ApiTest["patient"]): string => {
  if (!p || typeof p === "string") return "";
  return p.fullName ?? p.user?.name ?? "";
};
const getDoctorName = (d: ApiTest["doctor"]): string => {
  if (!d || typeof d === "string") return "";
  return d.user?.name ?? d.name ?? "";
};
const fmtDate = (v?: string) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const toTest = (t: ApiTest): MedicalTest => ({
  id: t._id ?? t.id ?? crypto.randomUUID(),
  patientId: getPatientId(t.patient),
  patientName: getPatientName(t.patient),
  doctorName: getDoctorName(t.doctor),
  title: t.title ?? "",
  type: t.type ?? "",
  resultSummary: t.resultSummary ?? "",
  status: (t.status as TestStatus) ?? "requested",
  requestedAt: t.requestedAt ?? t.createdAt ?? "",
  completedAt: t.completedAt ?? "",
  hasPdf: !!t.pdfFile || !!(t as any).pdf,
});

const parseResponse = (res: TestsApiResponse | undefined, page: number) => {
  const nested = res?.data && !Array.isArray(res.data) ? res.data : undefined;
  const list =
    (Array.isArray(res?.data) && res.data) ||
    res?.items ||
    nested?.items ||
    nested?.docs ||
    nested?.data ||
    [];
  const meta = res?.meta ?? nested?.meta ?? nested?.pagination;
  const total =
    res?.total ??
    nested?.total ??
    meta?.total ??
    meta?.totalItems ??
    meta?.count ??
    list.length;
  const apiPages =
    nested?.totalPages ??
    nested?.pages ??
    meta?.totalPages ??
    meta?.pages ??
    meta?.lastPage;
  const totalPages = apiPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
  const fallback =
    apiPages === undefined && total === list.length && list.length >= PAGE_SIZE
      ? page + 1
      : totalPages;
  return { tests: list.map(toTest), total, totalPages: Math.max(1, fallback) };
};

const parsePatients = (res: PatientsApiResponse | undefined) => {
  const nested = res?.data && !Array.isArray(res.data) ? res.data : undefined;
  const list =
    (Array.isArray(res?.data) && res.data) ||
    res?.patients ||
    res?.items ||
    nested?.patients ||
    nested?.items ||
    nested?.docs ||
    nested?.data ||
    [];
  return list
    .map((p) => {
      const id = String(p._id ?? p.id ?? "");
      const name = p.fullName ?? p.user?.name ?? p.name ?? id;
      return id ? { label: name, value: id } : null;
    })
    .filter(Boolean) as Array<{ label: string; value: string }>;
};

/* ───────── PDF modal ───────── */

function PdfModal({
  testId,
  patientId,
  patientName,
  testTitle,
  hasPdf,
  canUpload,
  onClose,
}: {
  testId: string;
  patientId: string;
  patientName: string;
  testTitle: string;
  hasPdf: boolean;
  canUpload: boolean;
  onClose: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [localHasPdf, setLocalHasPdf] = useState(hasPdf);
  const fileRef = useRef<HTMLInputElement>(null);
  const ep = `patients/${patientId}/tests/${testId}/pdf`;

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const viewPdf = async () => {
    setLoadingPdf(true);
    try {
      const r = await axiosInstance.get(ep, { responseType: "blob" });
      const blob = new Blob([r.data], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
    } catch {
      toast.error("تعذر تحميل ملف PDF");
    } finally {
      setLoadingPdf(false);
    }
  };

  const uploadPdf = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("pdf", file);
      await axiosInstance.post(ep, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم رفع ملف PDF بنجاح");
      setPdfUrl(null);
      setLocalHasPdf(true);
      setTimeout(viewPdf, 500);
    } catch {
      toast.error("تعذر رفع ملف PDF");
    } finally {
      setUploading(false);
    }
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const r = await axiosInstance.get(ep, { responseType: "blob" });
      const blob = new Blob([r.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${testTitle || "analysis"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("تعذر تنزيل ملف PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-base text-foreground">
              ملف تحليل: {testTitle}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              المريض: {patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-3 mb-4">
            {localHasPdf && (
              <>
                <button
                  onClick={viewPdf}
                  disabled={loadingPdf}
                  className="flex items-center gap-2 px-4 py-2.5 bg-cyan-50 text-cyan-700 rounded-xl text-sm font-medium hover:bg-cyan-100 transition-colors disabled:opacity-50"
                >
                  <Eye size={15} />
                  {loadingPdf ? "جاري التحميل..." : "عرض PDF"}
                </button>
                <button
                  onClick={downloadPdf}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                  <Download size={15} />
                  {downloading ? "جاري التنزيل..." : "تنزيل PDF"}
                </button>
              </>
            )}
            {canUpload && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  <Upload size={15} />
                  {uploading
                    ? "جاري الرفع..."
                    : localHasPdf
                      ? "تحديث PDF"
                      : "رفع PDF"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPdf(f);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>

          {pdfUrl ? (
            <div className="rounded-xl overflow-hidden border border-border">
              <iframe
                src={pdfUrl}
                title="PDF Viewer"
                className="w-full"
                style={{ height: "60vh" }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText size={48} className="mb-3 opacity-30" />
              <p className="text-sm">
                {localHasPdf
                  ? 'اضغط "عرض PDF" لاستعراض ملف النتيجة'
                  : "لا يوجد ملف PDF مرفوع لهذا التحليل"}
              </p>
              {!localHasPdf && canUpload && (
                <p className="text-xs mt-1">
                  اضغط "رفع PDF" لإضافة ملف النتيجة
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── columns ───────── */

const columns: ColumnDef<MedicalTest>[] = [
  {
    header: "التحليل",
    cell: (t) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
          <FileText size={14} />
        </div>
        <div>
          <p className="font-medium text-sm">{t.title}</p>
          <p className="text-xs text-muted-foreground">{t.type}</p>
        </div>
      </div>
    ),
  },
  {
    header: "المريض",
    cell: (t) => (
      <div className="flex items-center gap-2">
        <Avatar name={t.patientName} color="bg-slate-100 text-slate-700" />
        <span className="text-sm">{t.patientName}</span>
      </div>
    ),
  },
  {
    header: "الطبيب",
    cell: (t) => (
      <span className="text-xs text-muted-foreground">{t.doctorName}</span>
    ),
  },
  {
    header: "ملخص النتيجة",
    cell: (t) => (
      <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
        {t.resultSummary}
      </span>
    ),
  },
  {
    header: "التاريخ",
    cell: (t) => (
      <span className="font-mono text-xs">{fmtDate(t.requestedAt)}</span>
    ),
  },
  {
    header: "الحالة",
    cell: (t) => labBadge(STATUS_FLAG[t.status] ?? "pending"),
  },
  {
    header: "PDF",
    cell: (t) => (
      <span
        className={t.hasPdf ? "text-emerald-600" : "text-muted-foreground/30"}
      >
        <FileText size={14} />
      </span>
    ),
  },
];

/* ───────── main page ───────── */

export default function LabsPage() {
  const { user } = useAuth();
  const perm = usePermissions("labs");

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(
    perm.isOwnDataOnly ? (user?.id ?? "__all__") : "__all__",
  );
  const [modal, setModal] = useState<null | {
    mode: "add" | "edit";
    data?: MedicalTest;
  }>(null);
  const [delTarget, setDelTarget] = useState<MedicalTest | null>(null);
  const [pdfTarget, setPdfTarget] = useState<MedicalTest | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);
    return () => window.clearTimeout(t);
  }, [search]);

  /* ── patients dropdown ── */
  const patientsQuery = useGet({
    endpoint: "patients",
    queryKey: "patients-list",
    params: { page: 1, limit: 1000, archived: false,       from: fromDate,
      to: toDate,
    },
  });
  const patientOptions = useMemo(
    () => parsePatients(patientsQuery.data as PatientsApiResponse | undefined),
    [patientsQuery.data],
  );

  /* ── fetch tests — include selectedPatient in params so the queryKey changes ── */
  const isFiltered = selectedPatient !== "__all__";
  const testsEndpoint = isFiltered
    ? `patients/${selectedPatient}/tests`
    : "tests";

  const testsQuery = useGet({
    endpoint: testsEndpoint,
    queryKey: "tests",
    params: {
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      _patient: selectedPatient,
          from: fromDate,
      to: toDate,
    },
  });

  const { tests, total, totalPages } = useMemo(
    () => parseResponse(testsQuery.data as TestsApiResponse | undefined, page),
    [testsQuery.data, page],
  );

  /* ── form fields with patient dropdown (add mode only) ── */
  const addFields = useMemo<FieldConfig[]>(
    () => [
      {
        key: "patientId",
        label: "المريض",
        type: "select",
        options: patientOptions,
      },
      ...TEST_FIELDS,
    ],
    [patientOptions],
  );

  /* ── mutations ── */
  const createTest = useApiMutation({
    method: "post",
    endpoint: "",
    queryKey: "tests",
    successMessage: "تم طلب التحليل بنجاح",
    onSuccess: () => setModal(null),
  });
  const updateTest = useApiMutation({
    method: "patch",
    endpoint: "",
    queryKey: "tests",
    successMessage: "تم تعديل التحليل بنجاح",
    onSuccess: () => setModal(null),
  });
  const deleteTest = useApiMutation({
    method: "delete",
    endpoint: "",
    queryKey: "tests",
    successMessage: "تم حذف التحليل بنجاح",
    onSuccess: () => setDelTarget(null),
  });
  const isSaving = createTest.isPending || updateTest.isPending;

  const save = (d: Record<string, unknown>) => {
    if (!modal) return;
    const payload = {
      title: d.title,
      type: d.type,
      resultSummary: d.resultSummary,
      status: d.status,
    };

    if (modal.mode === "add") {
      const pid = d.patientId as string;
      if (!pid) {
        toast.error("يرجى اختيار المريض");
        return;
      }
      createTest.mutate({
        id: `patients/${pid}/tests` as unknown as string,
        data: payload,
      });
      return;
    }
    const t = modal.data!;
    updateTest.mutate({
      id: `patients/${t.patientId}/tests/${t.id}` as unknown as string,
      data: payload,
    });
  };

  const renderMobileCard = (t: MedicalTest, actions: React.ReactNode) => (
    <Card key={t.id} className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
            <FileText size={14} />
          </div>
          <div>
            <p className="font-semibold text-sm">{t.title}</p>
            <p className="text-xs text-muted-foreground">{t.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPdfTarget(t)}
            className="p-1.5 text-muted-foreground hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
            title="ملف PDF"
          >
            <FileText size={13} />
          </button>
          {actions}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Avatar
          name={t.patientName}
          color="bg-slate-100 text-slate-700"
          size="w-6 h-6"
        />
        <span className="text-xs">{t.patientName}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
        {t.resultSummary}
      </p>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="font-mono text-xs text-muted-foreground">
          {fmtDate(t.requestedAt)} · {t.doctorName}
        </span>
        {labBadge(STATUS_FLAG[t.status] ?? "pending")}
      </div>
    </Card>
  );

  return (
    <div>
      <SectionHeader
        title="التحاليل الطبية والمختبر"
        subtitle={`${total} تحليل`}
        onAdd={user?.role !== "patient" ? () => setModal({ mode: "add" }) : undefined}
      />

      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="بحث بعنوان التحليل..."
          />
        </div>
        {!perm.isOwnDataOnly && (
          <Select
            value={selectedPatient}
            onValueChange={(v) => {
              setSelectedPatient(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="كل المرضى" />
            </SelectTrigger>
            <SelectContent className="max-h-[240px]">
              <SelectItem value="__all__">كل المرضى</SelectItem>
              {patientOptions.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {testsQuery.isLoading ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          جاري تحميل التحاليل...
        </Card>
      ) : testsQuery.isError ? (
        <Card className="p-6 text-center text-sm text-red-600">
          تعذر تحميل التحاليل
        </Card>
      ) : (
        <>
          <DataTable
            data={tests}
            columns={columns}
            renderMobileCard={renderMobileCard}
            onEdit={
              perm.canEdit
                ? (t) => setModal({ mode: "edit", data: t })
                : undefined
            }
            onDelete={perm.canDelete ? (t) => setDelTarget(t) : undefined}
            onView={(t) => setPdfTarget(t)}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {modal && (
        <FormModal
          title={modal.mode === "add" ? "طلب تحليل جديد" : "تعديل التحليل"}
          fields={modal.mode === "add" ? addFields : TEST_FIELDS}
          initial={
            modal.mode === "edit"
              ? ({
                  title: modal.data?.title ?? "",
                  type: modal.data?.type ?? "",
                  resultSummary: modal.data?.resultSummary ?? "",
                  status: modal.data?.status ?? "requested",
                } as Record<string, unknown>)
              : ({ status: "requested" } as Record<string, unknown>)
          }
          onSave={(data) => {
            if (!isSaving) save(data);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {delTarget && (
        <ConfirmDelete
          name={`تحليل ${delTarget.title}`}
          onConfirm={() => {
            if (!deleteTest.isPending)
              deleteTest.mutate({
                id: `patients/${delTarget.patientId}/tests/${delTarget.id}` as unknown as string,
              });
          }}
          onClose={() => setDelTarget(null)}
        />
      )}

      {pdfTarget && (
        <PdfModal
          canUpload={perm.canCreate}
          testId={pdfTarget.id}
          patientId={pdfTarget.patientId}
          patientName={pdfTarget.patientName}
          testTitle={pdfTarget.title}
          hasPdf={pdfTarget.hasPdf}
          onClose={() => {
            setPdfTarget(null);
            testsQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
