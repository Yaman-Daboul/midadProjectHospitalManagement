// import { Link, useLocation } from "react-router-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Bell, ChevronRight, Menu } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ROLE_LABELS, NAV_ITEMS } from "@/data/initialData";
import useGet from "@/hooks/useGet";
import { useMemo } from "react";

interface HeaderProps {
  onMenuOpen: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  const { user } = useAuth();
  // const { pathname } = useLocation();
  const pathname = usePathname();


  const notificationsQuery = useGet({
    endpoint: "notifications/me",
    queryKey: "notifications",
    params: { page: 1, limit: 100 },
    enabled: !!user,
  });

  const unreadCount = useMemo(() => {
    const resp = notificationsQuery.data;
    const nested = resp?.data && !Array.isArray(resp.data) ? resp.data : undefined;
    const list =
      (Array.isArray(resp?.data) && resp.data) ||
      resp?.notifications ||
      resp?.items ||
      resp?.docs ||
      nested?.notifications ||
      nested?.items ||
      nested?.docs ||
      nested?.data ||
      [];
    
    return list.filter((n: any) => !(n.read ?? n.isRead)).length;
  }, [notificationsQuery.data]);
  const currentLabel =
    NAV_ITEMS.find((n) =>
      n.path === "/" ? pathname === "/" : pathname.startsWith(n.path)
    )?.label ?? "";

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Left — breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors lg:hidden"
        >
          <Menu size={18} />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <span>الرئيسية</span>
          <ChevronRight size={13} className="rotate-180" />
          <span className="text-foreground font-medium">{currentLabel}</span>
        </div>
        <span className="sm:hidden text-sm font-semibold text-foreground">{currentLabel}</span>
      </div>

      {/* Right — bell + user */}
      <div className="flex items-center gap-2 lg:gap-3">
        <Link
          href="/notifications"
          className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </Link>


        <div className="flex items-center gap-2 pr-2 lg:pr-3 border-r border-border">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold leading-none">{user?.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user ? ROLE_LABELS[user.role] : ""}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
            {user?.avatar}
          </div>
        </div>
      </div>
    </header>
  );
}
