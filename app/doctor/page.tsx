"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FieldConfig } from "@/types";
import useGet from "@/hooks/useGet";
import useApiMutation from "@/hooks/useApiMutation";
import { usePermissions } from "@/hooks/usePermissions";
import {
  SectionHeader,
  SearchBar,
  Card,
  Avatar,
  statusBadge,
  ConfirmDelete,
  FormModal,
  DataTable,
  Pagination,
  DateRangeFilter,
} from "@/components/shared";
import type { ColumnDef } from "@/components/shared/DataTable";

type Doctor = {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  roomNumber: string;
  biography: string;
  available: boolean;
};

type ApiDoctor = {
  id?: string | number;
  _id?: string | number;
  specialization?: string;
  specialty?: string;
  licenseNumber?: string;
  roomNumber?: string;
  biography?: string;
  bio?: string;
  available?: boolean;
  isAvailable?: boolean;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  name?: string;
  email?: string;
  phone?: string;
};

type DoctorsApiResponse = {
  data?:
    | ApiDoctor[]
    | {
        doctors?: ApiDoctor[];
        items?: ApiDoctor[];
        docs?: ApiDoctor[];
        data?: ApiDoctor[];
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
  doctors?: ApiDoctor[];
  items?: ApiDoctor[];
  docs?: ApiDoctor[];
  total?: number;
  count?: number;
  totalDocs?: number;
  totalPages?: number;
  pages?: number;
  page?: number;
  pagination?: PaginationInfo;
  meta?: PaginationInfo;
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

const DOCTOR_FIELDS: FieldConfig[] = [
  { key: "name", label: "اسم الطبيب", type: "text" },
  { key: "email", label: "البريد الإلكتروني", type: "text" },
  { key: "phone", label: "الهاتف", type: "text" },
  { key: "password", label: "كلمة المرور", type: "text" },
  { key: "specialization", label: "التخصص", type: "text" },
  { key: "licenseNumber", label: "رقم الترخيص", type: "text" },
  { key: "roomNumber", label: "رقم الغرفة", type: "text" },
  {
    key: "available",
    label: "الحالة",
    type: "select",
    options: ["true", "false"],
  },
  { key: "biography", label: "نبذة", type: "textarea" },
];

const PAGE_SIZE = 10;

const toDoctor = (doctor: ApiDoctor): Doctor => {
  const user = doctor.user ?? {};
  const available = doctor.available ?? doctor.isAvailable ?? true;

  return {
    id:
      doctor.id ??
      doctor._id ??
      doctor.licenseNumber ??
      doctor.email ??
      crypto.randomUUID(),
    name: user.name ?? doctor.name ?? "",
    email: user.email ?? doctor.email ?? "",
    phone: user.phone ?? doctor.phone ?? "",
    specialization: doctor.specialization ?? doctor.specialty ?? "",
    licenseNumber: doctor.licenseNumber ?? "",
    roomNumber: doctor.roomNumber ?? "",
    biography: doctor.biography ?? doctor.bio ?? "",
    available,
  };
};

const getDoctorsPayload = (
  response: DoctorsApiResponse | undefined,
  page: number,
) => {
  const nested =
    response?.data && !Array.isArray(response.data) ? response.data : undefined;
  const list =
    (Array.isArray(response?.data) && response.data) ||
    response?.doctors ||
    response?.items ||
    response?.docs ||
    nested?.doctors ||
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
    doctors: list.map(toDoctor),
    total,
    totalPages: Math.max(1, fallbackPages),
  };
};

const isAvailableValue = (value: unknown) =>
  value === true || value === "true" || value === "متاح" || value === "نشط";

const toDoctorPayload = (
  data: Record<string, unknown>,
  mode: "add" | "edit",
) => {
  const payload: Record<string, unknown> = {
    user: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      ...(mode === "add" || data.password ? { password: data.password } : {}),
    },
    specialization: data.specialization,
    licenseNumber: data.licenseNumber,
    roomNumber: data.roomNumber,
    biography: data.biography,
    available: isAvailableValue(data.available),
  };

  return payload;
};

const columns: ColumnDef<Doctor>[] = [
  {
    header: "الطبيب",
    cell: (d) => (
      <div className="flex items-center gap-2">
        <Avatar
          name={d.name.replace("د. ", "")}
          color="bg-cyan-100 text-cyan-700"
        />
        <div>
          <p className="font-medium">{d.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{d.email}</p>
          {d.phone && (
            <p className="text-xs text-muted-foreground font-mono">{d.phone}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    header: "التخصص",
    cell: (d) => (
      <span className="px-2 py-1 bg-secondary text-primary text-xs rounded-lg">
        {d.specialization}
      </span>
    ),
  },
  { header: "رقم الترخيص", cell: (d) => d.licenseNumber },
  { header: "الغرفة", cell: (d) => d.roomNumber },
  {
    header: "الحالة",
    cell: (d) => statusBadge(d.available ? "متاح" : "إجازة"),
  },
];

export default function DoctorsPage() {
  const perm = usePermissions("doctors");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | {
    mode: "add" | "edit";
    data?: Doctor;
  }>(null);
  const [delId, setDelId] = useState<string | number | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const doctorsQuery = useGet({
    endpoint: "doctors",
    queryKey: "doctors",
    params: { page, limit: PAGE_SIZE, search: debouncedSearch,       from: fromDate,
      to: toDate,
    },
  });

  const { doctors, total, totalPages } = useMemo(
    () =>
      getDoctorsPayload(
        doctorsQuery.data as DoctorsApiResponse | undefined,
        page,
      ),
    [doctorsQuery.data, page],
  );

  const createDoctor = useApiMutation({
    method: "post",
    endpoint: "doctors",
    queryKey: "doctors",
    successMessage: "تمت إضافة الطبيب بنجاح",
    onSuccess: () => setModal(null),
  });

  const updateDoctor = useApiMutation({
    method: "patch",
    endpoint: "doctors",
    queryKey: "doctors",
    successMessage: "تم تعديل بيانات الطبيب بنجاح",
    onSuccess: () => setModal(null),
  });

  const deleteDoctor = useApiMutation({
    method: "delete",
    endpoint: "doctors",
    queryKey: "doctors",
    successMessage: "تم حذف الطبيب بنجاح",
    onSuccess: () => setDelId(null),
  });

  const isSaving = createDoctor.isPending || updateDoctor.isPending;
  const selectedDoctor = doctors.find((d) => d.id === delId);

  const save = (data: Record<string, unknown>) => {
    if (!modal) return;

    const payload = toDoctorPayload(data, modal.mode);

    if (modal.mode === "add") {
      createDoctor.mutate({ data: payload });
      return;
    }

    updateDoctor.mutate({ id: modal.data?.id, data: payload });
  };

  const renderMobileCard = (d: Doctor, actions: ReactNode) => (
    <Card key={d.id} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar
            name={d.name.replace("د. ", "")}
            color="bg-cyan-100 text-cyan-700"
            size="w-10 h-10"
          />
          <div>
            <p className="font-semibold">{d.name}</p>
            <span className="px-2 py-0.5 bg-secondary text-primary text-xs rounded-lg">
              {d.specialization}
            </span>
          </div>
        </div>
        {actions}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <span className="text-muted-foreground">
          الترخيص: <span className="text-foreground">{d.licenseNumber}</span>
        </span>
        <span className="text-muted-foreground">
          الغرفة: <span className="text-foreground">{d.roomNumber}</span>
        </span>
        <span className="text-muted-foreground col-span-2 font-mono">
          {d.email}
        </span>
      </div>
      <div className="mt-2 pt-2 border-t border-border flex justify-end">
        {statusBadge(d.available ? "متاح" : "إجازة")}
      </div>
    </Card>
  );

  return (
    <div>
      <SectionHeader
        title="إدارة الأطباء"
        subtitle={`${total} طبيب`}
        onAdd={perm.canCreate ? () => setModal({ mode: "add" }) : undefined}
      />
      <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="بحث بالاسم أو التخصص..."
      />

      {doctorsQuery.isLoading ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          جاري تحميل الأطباء...
        </Card>
      ) : doctorsQuery.isError ? (
        <Card className="p-6 text-center text-sm text-red-600">
          تعذر تحميل الأطباء
        </Card>
      ) : (
        <>
          <DataTable
            data={doctors}
            columns={columns}
            renderMobileCard={renderMobileCard}
            onEdit={perm.canEdit ? (d) => setModal({ mode: "edit", data: d }) : undefined}
            onDelete={perm.canDelete ? (d) => setDelId(d.id) : undefined}
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
          title={modal.mode === "add" ? "إضافة طبيب" : "تعديل بيانات الطبيب"}
          fields={DOCTOR_FIELDS}
          initial={
            modal.mode === "edit"
              ? ({
                  ...modal.data,
                  available: String(modal.data?.available ?? true),
                  password: "",
                } as Record<string, unknown>)
              : ({
                  available: "true",
                } as Record<string, unknown>)
          }
          onSave={(data) => {
            if (!isSaving) save(data);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {delId !== null && (
        <ConfirmDelete
          name={selectedDoctor?.name ?? ""}
          onConfirm={() => {
            if (!deleteDoctor.isPending) deleteDoctor.mutate({ id: delId });
          }}
          onClose={() => setDelId(null)}
        />
      )}
    </div>
  );
}
