import { Calendar } from "lucide-react";

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
}

export function DateRangeFilter({ from, to, onFromChange, onToChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-border rounded-lg shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <Calendar size={16} />
        <span>تاريخ:</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">من</label>
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">إلى</label>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {(from || to) && (
        <button
          onClick={() => {
            onFromChange("");
            onToChange("");
          }}
          className="text-xs text-red-500 hover:text-red-700 underline px-2"
        >
          مسح
        </button>
      )}
    </div>
  );
}
