"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FieldConfig } from "@/types";
import useGet from "@/hooks/useGet";
import useApiMutation from "@/hooks/useApiMutation";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
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
} from "@/components/shared";
import type { ColumnDef } from "@/components/shared/DataTable";

type Gender = "male" | "female";

type Patient = {
  id: string | number;
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  gender: Gender | "";
  birthDate: string;
  address: string;
  bloodType: string;
  assignedDoctor: string;
  assignedDoctorName: string;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
};

type ApiPatient = {
  id?: string | number;
  _id?: string | number;
  fullName?: string;
  name?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  gender?: Gender | string;
  birthDate?: string;
  dob?: string;
  address?: string;
  bloodType?: string;
  blood?: string;
  assignedDoctor?:
    | string
    | {
        id?: string | number;
        _id?: string | number;
        name?: string;
        fullName?: string;
        user?: { name?: string };
      };
  allergies?: string[];
  chronicDiseases?: string[];
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  userAccount?: {
    email?: string;
    name?: string;
    phone?: string;
  };
};

type ApiDoctor = {
  id?: string | number;
  _id?: string | number;
  name?: string;
  fullName?: string;
  user?: { name?: string };
};

type DoctorsApiResponse = {
  data?:
    | ApiDoctor[]
    | {
        doctors?: ApiDoctor[];
        items?: ApiDoctor[];
        docs?: ApiDoctor[];
        data?: ApiDoctor[];
      };
  doctors?: ApiDoctor[];
  items?: ApiDoctor[];
  docs?: ApiDoctor[];
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

type PatientListData = PaginationInfo & {
  patients?: ApiPatient[];
  items?: ApiPatient[];
  docs?: ApiPatient[];
  data?: ApiPatient[];
  pagination?: PaginationInfo;
  meta?: PaginationInfo;
};

type PatientsApiResponse = PaginationInfo & {
  data?: ApiPatient[] | PatientListData;
  patients?: ApiPatient[];
  items?: ApiPatient[];
  docs?: ApiPatient[];
  pagination?: PaginationInfo;
  meta?: PaginationInfo;
};

const PAGE_SIZE = 10;

const PATIENT_FIELDS_BASE: FieldConfig[] = [
  { key: "fullName", label: "الاسم الكامل", type: "text" },
  { key: "email", label: "البريد الإلكتروني", type: "text" },
  { key: "password", label: "كلمة المرور", type: "text" },
  { key: "phone", label: "الهاتف", type: "text" },
  { key: "nationalId", label: "الرقم الوطني", type: "text" },
  {
    key: "gender",
    label: "الجنس",
    type: "select",
    options: ["male", "female"],
  },
  { key: "birthDate", label: "تاريخ الميلاد", type: "date" },
  {
    key: "bloodType",
    label: "فصيلة الدم",
    type: "select",
    options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  },
  { key: "address", label: "العنوان", type: "text" },
  { key: "assignedDoctor", label: "الطبيب", type: "select", options: [] },
  { key: "allergiesText", label: "الحساسيات", type: "text" },
  { key: "chronicDiseasesText", label: "الأمراض المزمنة", type: "text" },
  { key: "emergencyContactName", label: "اسم جهة الطوارئ", type: "text" },
  { key: "emergencyContactPhone", label: "هاتف جهة الطوارئ", type: "text" },
  { key: "emergencyContactRelation", label: "صلة القرابة", type: "text" },
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

const splitList = (value: unknown) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getDoctorId = (doctor: ApiPatient["assignedDoctor"]): string => {
  if (!doctor) return "";

  if (typeof doctor === "string") return doctor;

  return String(doctor.id ?? doctor._id ?? "");
};

const getDoctorName = (doctor: ApiPatient["assignedDoctor"]): string => {
  if (!doctor) return "";

  if (typeof doctor === "string") return "";

  return (
    doctor.user?.name ??
    doctor.name ??
    doctor.fullName ??
    String(doctor.id ?? doctor._id ?? "")
  );
};

const toPatient = (patient: ApiPatient): Patient => {
  const userAccount = patient.userAccount ?? {};

  return {
    id: patient.id ?? patient._id ?? patient.nationalId ?? crypto.randomUUID(),
    fullName: patient.fullName ?? patient.name ?? userAccount.name ?? "",
    nationalId: patient.nationalId ?? "",
    phone: patient.phone ?? userAccount.phone ?? "",
    email: patient.email ?? userAccount.email ?? "",
    gender: (patient.gender as Gender) ?? "",
    birthDate: formatDateForInput(patient.birthDate ?? patient.dob),
    address: patient.address ?? "",
    bloodType: patient.bloodType ?? patient.blood ?? "",
    assignedDoctor: getDoctorId(patient.assignedDoctor),
    assignedDoctorName: getDoctorName(patient.assignedDoctor),
    allergies: patient.allergies ?? [],
    chronicDiseases: patient.chronicDiseases ?? [],
    emergencyContactName: patient.emergencyContact?.name ?? "",
    emergencyContactPhone: patient.emergencyContact?.phone ?? "",
    emergencyContactRelation: patient.emergencyContact?.relation ?? "",
  };
};

const getDoctorOptions = (response: DoctorsApiResponse | undefined) => {
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

  return list
    .map((doctor) => {
      const id = String(doctor.id ?? doctor._id ?? "");
      const name = doctor.user?.name ?? doctor.fullName ?? doctor.name ?? id;
      return id ? { label: name, value: id } : null;
    })
    .filter(Boolean) as Array<{ label: string; value: string }>;
};

const getPatientsPayload = (
  response: PatientsApiResponse | undefined,
  page: number,
) => {
  const nested =
    response?.data && !Array.isArray(response.data) ? response.data : undefined;
  const list =
    (Array.isArray(response?.data) && response.data) ||
    response?.patients ||
    response?.items ||
    response?.docs ||
    nested?.patients ||
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
    patients: list.map(toPatient),
    total,
    totalPages: Math.max(1, fallbackPages),
  };
};

const toPatientPayload = (
  data: Record<string, unknown>,
  mode: "add" | "edit",
) => ({
  userAccount: {
    email: data.email,
    name: data.fullName,
    phone: data.phone,
    ...(mode === "add" || data.password ? { password: data.password } : {}),
  },
  fullName: data.fullName,
  nationalId: data.nationalId,
  phone: data.phone,
  email: data.email,
  gender: data.gender,
  birthDate: data.birthDate
    ? new Date(String(data.birthDate)).toISOString()
    : undefined,
  address: data.address,
  bloodType: data.bloodType,
  assignedDoctor: data.assignedDoctor,
  allergies: splitList(data.allergiesText),
  chronicDiseases: splitList(data.chronicDiseasesText),
  emergencyContact: {
    name: data.emergencyContactName,
    phone: data.emergencyContactPhone,
    relation: data.emergencyContactRelation,
  },
});

const toPatientForm = (patient: Patient): Record<string, unknown> => ({
  ...patient,
  password: "",
  allergiesText: patient.allergies.join(", "),
  chronicDiseasesText: patient.chronicDiseases.join(", "),
});

const columns: ColumnDef<Patient>[] = [
  {
    header: "المريض",
    cell: (patient) => (
      <div className="flex items-center gap-2">
        <Avatar name={patient.fullName} />
        <div>
          <p className="font-medium">{patient.fullName}</p>
          <p className="text-xs text-muted-foreground">{patient.address}</p>
        </div>
      </div>
    ),
  },
  { header: "الرقم الوطني", cell: (patient) => patient.nationalId },
  { header: "الجنس", cell: (patient) => patient.gender },
  {
    header: "فصيلة الدم",
    cell: (patient) => (
      <span className="font-mono font-semibold">{patient.bloodType}</span>
    ),
  },
  {
    header: "الطبيب",
    cell: (patient) => (
      <span className="text-xs">
        {patient.assignedDoctorName || patient.assignedDoctor}
      </span>
    ),
  },
  {
    header: "الهاتف",
    cell: (patient) => (
      <span className="font-mono text-xs">{patient.phone}</span>
    ),
  },
];

export default function PatientsPage() {
  const { user } = useAuth();
  const perm = usePermissions("patients");

  // للدكتور والمريض: نحتاج معرفة ID الحساب لفلترة البيانات
  const currentUserId = user?.id ?? "";
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | {
    mode: "add" | "edit";
    data?: Patient;
  }>(null);
  const [archiveId, setArchiveId] = useState<string | number | null>(null);

  const doctorsQuery = useGet({
    endpoint: "doctors",
    queryKey: "doctors",
    params: { page: 1, limit: 1000,       from: fromDate,
      to: toDate,
    },
  });

  const doctorOptions = useMemo(
    () => getDoctorOptions(doctorsQuery.data as DoctorsApiResponse | undefined),
    [doctorsQuery.data],
  );

  const PATIENT_FIELDS = useMemo(
    () =>
      PATIENT_FIELDS_BASE.map((field) =>
        field.key === "assignedDoctor"
          ? { ...field, options: doctorOptions }
          : field,
      ),
    [doctorOptions],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const patientsQuery = useGet({
    endpoint: "patients",
    queryKey: "patients",
    params: {
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      archived: false,
      // للدكتور: جلب مرضاه فقط | للمريض: بياناته فقط
      ...(user?.role === "doctor" ? { assignedDoctor: currentUserId } : {}),
      ...(user?.role === "patient" ? { userId: currentUserId } : {}),
          from: fromDate,
      to: toDate,
    },
  });

  const { patients, total, totalPages } = useMemo(
    () =>
      getPatientsPayload(
        patientsQuery.data as PatientsApiResponse | undefined,
        page,
      ),
    [patientsQuery.data, page],
  );
  const createPatient = useApiMutation({
    method: "post",
    endpoint: "patients",
    queryKey: "patients",
    successMessage: "تمت إضافة المريض بنجاح",
    onSuccess: () => setModal(null),
  });

  const updatePatient = useApiMutation({
    method: "patch",
    endpoint: "patients",
    queryKey: "patients",
    successMessage: "تم تعديل بيانات المريض بنجاح",
    onSuccess: () => setModal(null),
  });

  const archivePatient = useApiMutation({
    method: "patch",
    endpoint: "patients",
    queryKey: "patients",
    successMessage: "تم أرشفة المريض بنجاح",
    onSuccess: () => setArchiveId(null),
  });

  const isSaving = createPatient.isPending || updatePatient.isPending;
  const selectedPatient = patients.find((patient) => patient.id === archiveId);

  const save = (data: Record<string, unknown>) => {
    if (!modal) return;

    const payload = toPatientPayload(data, modal.mode);

    if (modal.mode === "add") {
      createPatient.mutate({ data: payload });
      return;
    }

    updatePatient.mutate({ id: modal.data?.id, data: payload });
  };

  const renderMobileCard = (patient: Patient, actions: ReactNode) => (
    <Card key={patient.id} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar name={patient.fullName} size="w-10 h-10" />
          <div>
            <p className="font-semibold">{patient.fullName}</p>
            <p className="text-xs text-muted-foreground">{patient.address}</p>
          </div>
        </div>
        {actions}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <span className="text-muted-foreground">
          الرقم الوطني:{" "}
          <span className="text-foreground">{patient.nationalId}</span>
        </span>
        <span className="text-muted-foreground">
          الجنس: <span className="text-foreground">{patient.gender}</span>
        </span>
        <span className="text-muted-foreground">
          فصيلة الدم:{" "}
          <span className="font-mono font-bold text-foreground">
            {patient.bloodType}
          </span>
        </span>
        <span className="text-muted-foreground">
          الهاتف:{" "}
          <span className="font-mono text-foreground">{patient.phone}</span>
        </span>
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {patient.assignedDoctorName || patient.assignedDoctor}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {formatDateForDisplay(patient.birthDate)}
        </span>
      </div>
    </Card>
  );

  return (
    <div>
      <SectionHeader
        title="إدارة المرضى"
        subtitle={`${total} مريض`}
        onAdd={perm.canCreate ? () => setModal({ mode: "add" }) : undefined}
      />
      <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="بحث بالاسم أو الهاتف..."
      />

      {patientsQuery.isLoading ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          جاري تحميل المرضى...
        </Card>
      ) : patientsQuery.isError ? (
        <Card className="p-6 text-center text-sm text-red-600">
          تعذر تحميل المرضى
        </Card>
      ) : (
        <>
          <DataTable
            data={patients}
            columns={columns}
            renderMobileCard={renderMobileCard}
            onEdit={perm.canEdit ? (patient) => setModal({ mode: "edit", data: patient }) : undefined}
            onDelete={perm.canDelete ? (patient) => setArchiveId(patient.id) : undefined}
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
          title={modal.mode === "add" ? "إضافة مريض" : "تعديل بيانات المريض"}
          fields={PATIENT_FIELDS}
          initial={
            modal.mode === "edit"
              ? toPatientForm(modal.data as Patient)
              : ({ gender: "male" } as Record<string, unknown>)
          }
          onSave={(data) => {
            if (!isSaving) save(data);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {archiveId !== null && (
        <ConfirmDelete
          name={selectedPatient?.fullName ?? ""}
          onConfirm={() => {
            if (!archivePatient.isPending) {
              archivePatient.mutate({ id: `${archiveId}/archive` });
            }
          }}
          onClose={() => setArchiveId(null)}
        />
      )}
    </div>
  );
}
