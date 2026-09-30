import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FieldConfig } from "../types";
import useGet from "../hooks/useGet";
import useApiMutation from "../hooks/useApiMutation";
import { usePermissions } from "../hooks/usePermissions";
import {
  SectionHeader,
  SearchBar,
  Card,
  Avatar,
  ConfirmDelete,
  FormModal,
  DataTable,
  Pagination,
  DateRangeFilter,
} from "../components/shared";
import type { ColumnDef } from "../components/shared/DataTable";

type Staff = {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
};

type ApiStaff = {
  id?: string | number;
  _id?: string | number;
  position?: string;
  department?: string;
  dept?: string;
  hireDate?: string;
  joined?: string;
  user?:
    | string
    | {
        name?: string;
        email?: string;
        phone?: string;
      };
  name?: string;
  email?: string;
  phone?: string;
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
};

type StaffListData = PaginationInfo & {
  staff?: ApiStaff[];
  staffs?: ApiStaff[];
  employees?: ApiStaff[];
  items?: ApiStaff[];
  docs?: ApiStaff[];
  data?: ApiStaff[];
  pagination?: PaginationInfo;
  meta?: PaginationInfo;
};

type StaffApiResponse = PaginationInfo & {
  data?: ApiStaff[] | StaffListData;
  staff?: ApiStaff[];
  staffs?: ApiStaff[];
  employees?: ApiStaff[];
  items?: ApiStaff[];
  docs?: ApiStaff[];
  pagination?: PaginationInfo;
  meta?: PaginationInfo;
};

const PAGE_SIZE = 10;

const STAFF_FIELDS: FieldConfig[] = [
  { key: "name", label: "الاسم", type: "text" },
  { key: "email", label: "البريد الإلكتروني", type: "text" },
  { key: "phone", label: "الهاتف", type: "text" },
  { key: "password", label: "كلمة المرور", type: "text" },
  { key: "position", label: "المنصب", type: "text" },
  { key: "department", label: "القسم", type: "text" },
  { key: "hireDate", label: "تاريخ التوظيف", type: "date" },
];

const pickNumber = (...values: Array<number | undefined>) =>
  values.find((value) => typeof value === "number");

const formatDateForInput = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);

  return date.toISOString().slice(0, 10);
};

const formatDateForDisplay = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-CA");
};

const toStaff = (staff: ApiStaff): Staff => {
  const user = typeof staff.user === "object" && staff.user ? staff.user : {};

  return {
    id: staff.id ?? staff._id ?? staff.email ?? crypto.randomUUID(),
    name: staff.name ?? user.name ?? "",
    email: staff.email ?? user.email ?? "",
    phone: staff.phone ?? user.phone ?? "",
    position: staff.position ?? "",
    department: staff.department ?? staff.dept ?? "",
    hireDate: formatDateForInput(staff.hireDate ?? staff.joined),
  };
};

const getStaffPayload = (
  response: StaffApiResponse | undefined,
  page: number,
) => {
  const nested =
    response?.data && !Array.isArray(response.data) ? response.data : undefined;
  const list =
    (Array.isArray(response?.data) && response.data) ||
    response?.staff ||
    response?.staffs ||
    response?.employees ||
    response?.items ||
    response?.docs ||
    nested?.staff ||
    nested?.staffs ||
    nested?.employees ||
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
      meta?.totalDocs,
    ) ?? list.length;
  const apiTotalPages = pickNumber(
    response?.totalPages,
    response?.totalPage,
    response?.pages,
    response?.lastPage,
    nested?.totalPages,
    nested?.totalPage,
    nested?.pages,
    nested?.lastPage,
    pagination?.totalPages,
    pagination?.totalPage,
    pagination?.pages,
    pagination?.lastPage,
    meta?.totalPages,
    meta?.totalPage,
    meta?.pages,
    meta?.lastPage,
  );
  const totalPages = apiTotalPages ?? Math.ceil(total / PAGE_SIZE);
  const fallbackPages =
    apiTotalPages === undefined &&
    total === list.length &&
    list.length >= PAGE_SIZE
      ? page + 1
      : totalPages;

  return {
    staff: list.map(toStaff),
    total,
    totalPages: Math.max(1, fallbackPages),
  };
};

const toStaffPayload = (
  data: Record<string, unknown>,
  mode: "add" | "edit",
) => ({
  name: data.name,
  email: data.email,
  phone: data.phone,
  user: {
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: "staff",
    ...(mode === "add" || data.password ? { password: data.password } : {}),
  },
  position: data.position,
  department: data.department,
  hireDate: data.hireDate
    ? new Date(String(data.hireDate)).toISOString()
    : undefined,
});

const columns: ColumnDef<Staff>[] = [
  {
    header: "الموظف",
    cell: (staff) => (
      <div className="flex items-center gap-2">
        <Avatar name={staff.name} color="bg-violet-100 text-violet-700" />
        <div>
          <p className="font-medium">{staff.name}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {staff.email}
          </p>
          {staff.phone && (
            <p className="text-xs text-muted-foreground font-mono">
              {staff.phone}
            </p>
          )}
        </div>
      </div>
    ),
  },
  { header: "المنصب", cell: (staff) => staff.position },
  {
    header: "القسم",
    cell: (staff) => (
      <span className="px-2 py-1 bg-muted/50 text-xs rounded-lg">
        {staff.department}
      </span>
    ),
  },
  {
    header: "تاريخ التوظيف",
    cell: (staff) => (
      <span className="font-mono text-xs">
        {formatDateForDisplay(staff.hireDate)}
      </span>
    ),
  },
];

export default function StaffPage() {
  const perm = usePermissions("staff");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | {
    mode: "add" | "edit";
    data?: Staff;
  }>(null);
  const [delId, setDelId] = useState<string | number | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const staffQuery = useGet({
    endpoint: "staff",
    queryKey: "staff",
    params: { page, limit: PAGE_SIZE, search: debouncedSearch,       from: fromDate,
      to: toDate,
    },
  });

  const { staff, total, totalPages } = useMemo(
    () =>
      getStaffPayload(staffQuery.data as StaffApiResponse | undefined, page),
    [staffQuery.data, page],
  );

  const createStaff = useApiMutation({
    method: "post",
    endpoint: "staff",
    queryKey: "staff",
    successMessage: "تمت إضافة الموظف بنجاح",
    onSuccess: () => setModal(null),
  });

  const updateStaff = useApiMutation({
    method: "patch",
    endpoint: "staff",
    queryKey: "staff",
    successMessage: "تم تعديل بيانات الموظف بنجاح",
    onSuccess: () => setModal(null),
  });

  const deleteStaff = useApiMutation({
    method: "delete",
    endpoint: "staff",
    queryKey: "staff",
    successMessage: "تم حذف الموظف بنجاح",
    onSuccess: () => setDelId(null),
  });

  const isSaving = createStaff.isPending || updateStaff.isPending;
  const selectedStaff = staff.find((item) => item.id === delId);

  const save = (data: Record<string, unknown>) => {
    if (!modal) return;

    const payload = toStaffPayload(data, modal.mode);

    if (modal.mode === "add") {
      createStaff.mutate({ data: payload });
      return;
    }

    updateStaff.mutate({ id: modal.data?.id, data: payload });
  };

  const renderMobileCard = (staffItem: Staff, actions: ReactNode) => (
    <Card key={staffItem.id} className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            name={staffItem.name}
            color="bg-violet-100 text-violet-700"
            size="w-10 h-10"
          />
          <div>
            <p className="font-semibold">{staffItem.name}</p>
            <p className="text-xs text-muted-foreground">
              {staffItem.position} · {staffItem.department}
            </p>
          </div>
        </div>
        {actions}
      </div>
      <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-border">
        <span className="font-mono text-xs text-muted-foreground">
          {staffItem.phone || staffItem.email}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {formatDateForDisplay(staffItem.hireDate)}
        </span>
      </div>
    </Card>
  );

  return (
    <div>
      <SectionHeader
        title="إدارة الموظفين"
        subtitle={`${total} موظف`}
        onAdd={perm.canCreate ? () => setModal({ mode: "add" }) : undefined}
      />
      <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="بحث بالاسم أو المنصب..."
      />

      {staffQuery.isLoading ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          جاري تحميل الموظفين...
        </Card>
      ) : staffQuery.isError ? (
        <Card className="p-6 text-center text-sm text-red-600">
          تعذر تحميل الموظفين
        </Card>
      ) : (
        <>
          <DataTable
            data={staff}
            columns={columns}
            renderMobileCard={renderMobileCard}
            onEdit={perm.canEdit ? (staffItem) => setModal({ mode: "edit", data: staffItem }) : undefined}
            onDelete={perm.canDelete ? (staffItem) => setDelId(staffItem.id) : undefined}
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
          title={modal.mode === "add" ? "إضافة موظف" : "تعديل بيانات الموظف"}
          fields={STAFF_FIELDS}
          initial={
            modal.mode === "edit"
              ? ({ ...modal.data, password: "" } as Record<string, unknown>)
              : ({
                  hireDate: formatDateForInput(new Date().toISOString()),
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
          name={selectedStaff?.name ?? ""}
          onConfirm={() => {
            if (!deleteStaff.isPending) deleteStaff.mutate({ id: delId });
          }}
          onClose={() => setDelId(null)}
        />
      )}
    </div>
  );
}
