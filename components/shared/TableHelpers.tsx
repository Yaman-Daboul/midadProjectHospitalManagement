import type { MouseEvent, ReactNode } from "react";
import { Edit, Trash2, Eye } from "lucide-react";

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="text-right px-3 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-3 py-3 text-sm text-foreground ${className}`}>
      {children}
    </td>
  );
}

export function RowActions({
  onEdit,
  onDelete,
  onView,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}) {
  const handleAction =
    (callback?: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      callback?.();
    };

  return (
    <div
      className="relative z-10 inline-flex items-center gap-1"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {onView && (
        <button
          type="button"
          onClick={handleAction(onView)}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className="p-1.5 text-muted-foreground hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
        >
          <Eye size={13} />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={handleAction(onEdit)}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <Edit size={13} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={handleAction(onDelete)}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
