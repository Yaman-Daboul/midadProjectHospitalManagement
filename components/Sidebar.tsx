"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, HeartPulse, X } from "lucide-react";
import type { Role } from "@/types";
import { NAV_ITEMS } from "@/data/initialData";
import { useAuth } from "@/contexts/AuthContext";
import useGet from "@/hooks/useGet";
import { useMemo } from "react";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const role: Role = user?.role ?? "patient";
  const nav = NAV_ITEMS.filter((n) => n.roles.includes(role));

  const notificationsQuery = useGet({
    endpoint: "notifications/me",
    queryKey: "notifications",
    params: { page: 1, limit: 100 },
    enabled: !!user,
  });

  const unread = useMemo(() => {
    const resp = notificationsQuery.data;
    const nested =
      resp?.data && !Array.isArray(resp.data) ? resp.data : undefined;

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

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "#0C1A2E", width: 240, minWidth: 240 }}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <HeartPulse size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              مستشفى الرعاية
            </p>
            <p className="text-white/40 text-xs">إدارة متكاملة</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white lg:hidden"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {nav.map(({ path, label, icon: Icon, section }) => {
          const isActive =
            path === "/"
              ? pathname === "/"
              : pathname.startsWith(path);

          const hasBadge = section === "notifications" && unread > 0;

          return (
            <Link
              key={section}
              href={path}
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span className="flex-1 text-right">{label}</span>

              {hasBadge && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={15} className="flex-shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
