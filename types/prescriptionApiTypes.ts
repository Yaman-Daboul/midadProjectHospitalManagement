import type { MedicineItem } from "./prescriptionTypes";

export type ApiPrescription = {
  id?: string | number;
  _id?: string | number;
  diagnosis?: string;
  medicines?: MedicineItem[];
  notes?: string;
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
  currentPage?: number;
};

export type PrescriptionsApiResponse = PaginationInfo & {
  data?:
    | ApiPrescription[]
    | {
        prescriptions?: ApiPrescription[];
        items?: ApiPrescription[];
        docs?: ApiPrescription[];
        data?: ApiPrescription[];
        pagination?: PaginationInfo;
        meta?: PaginationInfo;
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
  items?: ApiPrescription[];
  docs?: ApiPrescription[];
  pagination?: PaginationInfo;
  meta?: PaginationInfo;
};
