import { useEffect, useMemo, useState } from "react";
import type { FieldConfig, Role } from "../types";
import { ROLE_LABELS } from "../data/initialData";
import useGet from "../hooks/useGet";
import useApiMutation from "../hooks/useApiMutation";
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
} from "../components/shared";
import type { ColumnDef } from "../components/shared/DataTable";

type UserRole = Role | "staff";

type UserType = {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: "نشط" | "موقوف";
  isActive: boolean;
};

type ApiUser = {
  id?: string | number;
  _id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: string;
  isActive?: boolean;
};

type UsersApiResponse = {
  data?:
    | ApiUser[]
    | {
        users?: ApiUser[];
        items?: ApiUser[];
        docs?: ApiUser[];
        data?: ApiUser[];
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
  users?: ApiUser[];
  items?: ApiUser[];
  docs?: ApiUser[];
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

const USER_FIELDS: FieldConfig[] = [
  { key: "name", label: "الاسم", type: "text" },
  { key: "email", label: "البريد الإلكتروني", type: "text" },
  { key: "phone", label: "الهاتف", type: "text" },
  { key: "password", label: "كلمة المرور", type: "text" },
  {
    key: "role",
    label: "الصلاحية",
    type: "select",
    options: ["manager", "admin", "doctor", "patient", "staff"],
  },
  { key: "status", label: "الحالة", type: "select", options: ["نشط", "موقوف"] },
];

const PAGE_SIZE = 10;

const getRoleLabel = (role: UserRole) =>
  role === "staff" ? "موظف" : (ROLE_LABELS[role] ?? role);

const toUser = (user: ApiUser): UserType => {
  const isActive = user.isActive ?? user.status !== "موقوف";

  return {
    id: user.id ?? user._id ?? user.email ?? crypto.randomUUID(),
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    role: user.role ?? "staff",
    status: isActive ? "نشط" : "موقوف",
    isActive,
  };
};

const getUsersPayload = (
  response: UsersApiResponse | undefined,
  page: number,
) => {
  const nested =
    response?.data && !Array.isArray(response.data) ? response.data : undefined;
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
    users: list.map(toUser),
    total,
    totalPages: Math.max(1, fallbackPages),
  };
};

const toUserPayload = (data: Record<string, unknown>, mode: "add" | "edit") => {
  const payload: Record<string, unknown> = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    isActive: data.status !== "موقوف",
  };

  if (mode === "add" || data.password) {
    payload.password = data.password;
  }

  return payload;
};

const columns: ColumnDef<UserType>[] = [
  {
    header: "المستخدم",
    cell: (u) => (
      <div className="flex items-center gap-2">
        <Avatar name={u.name} color="bg-slate-100 text-slate-700" />
        <div>
          <p className="font-medium">{u.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
          {u.phone && (
            <p className="text-xs text-muted-foreground font-mono">{u.phone}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    header: "الصلاحية",
    cell: (u) => (
      <span className="px-2 py-1 bg-secondary text-primary text-xs rounded-lg font-medium">
        {getRoleLabel(u.role)}
      </span>
    ),
  },
  {
    header: "الحالة",
    cell: (u) =>
      u.status === "نشط" ? (
        statusBadge("نشط")
      ) : (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200">
          موقوف
        </span>
      ),
  },
];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | {
    mode: "add" | "edit";
    data?: UserType;
  }>(null);
  const [delId, setDelId] = useState<string | number | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const usersQuery = useGet({
    endpoint: "users",
    queryKey: "users",
    params: { page, limit: PAGE_SIZE, search: debouncedSearch,from: fromDate,
      to: toDate,
    },
  });

  const { users, total, totalPages } = useMemo(
    () =>
      getUsersPayload(usersQuery.data as UsersApiResponse | undefined, page),
    [usersQuery.data, page],
  );

  const createUser = useApiMutation({
    method: "post",
    endpoint: "users",
    queryKey: "users",
    successMessage: "تمت إضافة المستخدم بنجاح",
    onSuccess: () => setModal(null),
  });

  const updateUser = useApiMutation({
    method: "patch",
    endpoint: "users",
    queryKey: "users",
    successMessage: "تم تعديل المستخدم بنجاح",
    onSuccess: () => setModal(null),
  });

  const deleteUser = useApiMutation({
    method: "delete",
    endpoint: "users",
    queryKey: "users",
    successMessage: "تم حذف المستخدم بنجاح",
    onSuccess: () => setDelId(null),
  });

  const isSaving = createUser.isPending || updateUser.isPending;
  const selectedUser = users.find((u) => u.id === delId);

  const save = (d: Record<string, unknown>) => {
    if (!modal) return;

    const payload = toUserPayload(d, modal.mode);

    if (modal.mode === "add") {
      createUser.mutate({ data: payload });
      return;
    }

    updateUser.mutate({ id: modal.data?.id, data: payload });
  };

  const renderMobileCard = (u: UserType, actions: React.ReactNode) => (
    <Card key={u.id} className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            name={u.name}
            color="bg-slate-100 text-slate-700"
            size="w-10 h-10"
          />
          <div>
            <p className="font-semibold">{u.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
            {u.phone && (
              <p className="text-xs text-muted-foreground font-mono">
                {u.phone}
              </p>
            )}
          </div>
        </div>
        {actions}
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <span className="px-2 py-0.5 bg-secondary text-primary text-xs rounded-lg font-medium">
          {getRoleLabel(u.role)}
        </span>
        {u.status === "نشط" ? (
          statusBadge("نشط")
        ) : (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200">
            موقوف
          </span>
        )}
      </div>
    </Card>
  );

  return (
    <div>
      <SectionHeader
        title="إدارة المستخدمين"
        subtitle={`${total} مستخدم`}
        onAdd={() => setModal({ mode: "add" })}
      />
      <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="بحث بالاسم أو البريد..."
      />

      {usersQuery.isLoading ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          جاري تحميل المستخدمين...
        </Card>
      ) : usersQuery.isError ? (
        <Card className="p-6 text-center text-sm text-red-600">
          تعذر تحميل المستخدمين
        </Card>
      ) : (
        <>
          <DataTable
            data={users}
            columns={columns}
            renderMobileCard={renderMobileCard}
            onEdit={(u) => setModal({ mode: "edit", data: u })}
            onDelete={(u) => setDelId(u.id)}
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
          title={modal.mode === "add" ? "إضافة مستخدم" : "تعديل المستخدم"}
          fields={USER_FIELDS}
          initial={
            modal.mode === "edit"
              ? ({ ...modal.data, password: "" } as Record<string, unknown>)
              : ({ status: "نشط", isActive: true, role: "staff" } as Record<
                  string,
                  unknown
                >)
          }
          onSave={(data) => {
            if (!isSaving) save(data);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {delId !== null && (
        <ConfirmDelete
          name={selectedUser?.name ?? ""}
          onConfirm={() => {
            if (!deleteUser.isPending) deleteUser.mutate({ id: delId });
          }}
          onClose={() => setDelId(null)}
        />
      )}
    </div>
  );
}
