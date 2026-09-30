"use client"; // 👈 يجب أن يكون هذا في السطر رقم 1 تماماً

import { useMemo, useEffect } from "react";
import { X } from "lucide-react";
// باقي الكود الخاص بك أسفله كما هو...

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { FieldConfig } from "../../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const generateSchema = (fields: FieldConfig[], isEdit: boolean) => {
  const shape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((f) => {
    let fieldSchema: z.ZodTypeAny = z.string().min(1, "هذا الحقل مطلوب");

    if (f.type === "number") {
      fieldSchema = z.coerce
        .number({ invalid_type_error: "يجب إدخال رقم" })
        .min(0, "القيمة غير صالحة");
    } else if (
      f.key.toLowerCase().includes("phone") ||
      f.key.toLowerCase().includes("mobile") ||
      f.label.includes("هاتف")
    ) {
      fieldSchema = z
        .string()
        .regex(/^\d{10}$/, "رقم الهاتف يجب أن يتكون من 10 أرقام");
    } else if (f.key.toLowerCase().includes("name") || f.label.includes("اسم")) {
      fieldSchema = z.string().min(3, "يجب أن يتكون من 3 أحرف على الأقل");
    } else if (f.type === "select") {
      fieldSchema = z.string().min(1, "الرجاء الاختيار من القائمة");
    }

    if (f.key === "password" && isEdit) {
      fieldSchema = z.string().optional().or(z.literal(""));
    }

    shape[f.key] = fieldSchema;
  });
  return z.object(shape);
};

export function FormModal({
  title,
  fields,
  initial,
  onSave,
  onClose,
  extraContent,
}: {
  title: string;
  fields: FieldConfig[];
  initial?: Record<string, unknown>;
  onSave: (d: Record<string, unknown>) => void;
  onClose: () => void;
  extraContent?: React.ReactNode;
}) {
  const isEdit = !!initial;
  const schema = useMemo(() => generateSchema(fields, isEdit), [fields, isEdit]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: initial ?? {},
  });

  useEffect(() => {
    if (initial) {
      reset(initial);
    }
  }, [initial, reset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-bold text-base text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit(onSave)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="overflow-y-auto flex-1 px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div
                  key={f.key}
                  className={f.type === "textarea" ? "sm:col-span-2" : ""}
                >
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    {f.label}
                  </label>
                  {f.type === "select" ? (
                    <Controller
                      name={f.key}
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={
                            field.value !== undefined && field.value !== null
                              ? String(field.value)
                              : ""
                          }
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            className={`w-full ${
                              errors[f.key]
                                ? "border-red-500 focus:ring-red-500/30"
                                : ""
                            }`}
                          >
                            <SelectValue placeholder="اختر..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[240px]">
                            {f.options?.map((o) => {
                              const optionValue =
                                typeof o === "string" ? o : o.value;
                              const optionLabel =
                                typeof o === "string" ? o : o.label;

                              return (
                                <SelectItem
                                  key={String(optionValue)}
                                  value={String(optionValue)}
                                >
                                  {optionLabel}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      {...register(f.key)}
                      rows={3}
                      className={`w-full px-3 py-2.5 text-sm bg-input-background border ${
                        errors[f.key]
                          ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                          : "border-border focus:ring-primary/30 focus:border-primary/40"
                      } rounded-lg focus:outline-none focus:ring-2 resize-none transition-colors`}
                    />
                  ) : (
                    <input
                      type={f.type}
                      {...register(f.key)}
                      className={`w-full px-3 py-2.5 text-sm bg-input-background border ${
                        errors[f.key]
                          ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                          : "border-border focus:ring-primary/30 focus:border-primary/40"
                      } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                      dir={f.type === "date" ? "ltr" : undefined}
                    />
                  )}
                  {errors[f.key] && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">
                      {errors[f.key]?.message as string}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {extraContent && <div className="mt-5">{extraContent}</div>}
          </div>
          <div className="flex gap-3 px-5 py-4 border-t border-border flex-shrink-0">
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-muted text-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}