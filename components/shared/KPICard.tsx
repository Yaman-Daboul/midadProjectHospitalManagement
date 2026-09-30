import { TrendingUp, TrendingDown } from "lucide-react";
import type { ElementType } from "react";
import { Card } from "./Card";

export function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ElementType;
  trend?: "up" | "down";
  color: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {trend === "up" && <TrendingUp size={11} className="text-emerald-500" />}
              {trend === "down" && <TrendingDown size={11} className="text-red-500" />}
              {sub}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </Card>
  );
}
