import { Trash2 } from "lucide-react";

export function ConfirmDelete({
  name,
  onConfirm,
  onClose,
}: {
  name: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 size={20} className="text-red-600" />
        </div>
        <h3 className="text-center font-bold text-foreground mb-2">تأكيد الحذف</h3>
        <p className="text-center text-sm text-muted-foreground mb-6">
          هل أنت متأكد من حذف{" "}
          <span className="font-semibold text-foreground">"{name}"</span>؟ لا
          يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            حذف
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-muted text-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
