import { Plus } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  onAdd,
}: {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div>
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> إضافة جديد
        </button>
      )}
    </div>
  );
}
