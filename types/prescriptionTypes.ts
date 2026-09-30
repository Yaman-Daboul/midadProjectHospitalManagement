export type MedicineItem = {
  medicine?: string;
  name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

export type Prescription = {
  id: string | number;
  diagnosis: string;
  medicines: MedicineItem[];
  notes?: string;
};
