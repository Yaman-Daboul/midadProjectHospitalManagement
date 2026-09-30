/* Types for LabsPage (Medical Tests) */

export type TestStatus = "requested" | "in_progress" | "completed" | "cancelled";

export type MedicalTest = {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  title: string;
  type: string;
  resultSummary: string;
  status: TestStatus;
  requestedAt: string;
  completedAt: string;
  hasPdf: boolean;
};

export type ApiTest = {
  _id?: string;
  id?: string;
  patient?:
    | { _id?: string; fullName?: string; user?: { name?: string } }
    | string;
  doctor?:
    | { _id?: string; user?: { name?: string }; name?: string }
    | string;
  title?: string;
  type?: string;
  resultSummary?: string;
  status?: string;
  requestedAt?: string;
  completedAt?: string;
  createdAt?: string;
  pdfFile?: { originalName?: string } | null;
};

export type PaginationInfo = {
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
};

export type TestsApiResponse = {
  success?: boolean;
  message?: string;
  data?:
    | {
        items?: ApiTest[];
        docs?: ApiTest[];
        data?: ApiTest[];
        meta?: PaginationInfo;
        pagination?: PaginationInfo;
        total?: number;
        totalPages?: number;
        pages?: number;
      }
    | ApiTest[];
  items?: ApiTest[];
  total?: number;
  meta?: PaginationInfo;
};

export type ApiPatientOption = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  user?: { name?: string; _id?: string };
};

export type PatientsApiResponse = {
  data?:
    | ApiPatientOption[]
    | {
        items?: ApiPatientOption[];
        docs?: ApiPatientOption[];
        data?: ApiPatientOption[];
        patients?: ApiPatientOption[];
      };
  items?: ApiPatientOption[];
  patients?: ApiPatientOption[];
};
