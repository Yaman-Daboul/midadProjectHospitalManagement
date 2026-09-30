import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  HeartPulse,
  Calendar,
  FlaskConical,
  Package,
  Eye,
  EyeOff,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../contexts/AuthContext";
import { DEMO_USERS, ROLE_LABELS } from "../data/initialData";
import useApiMutation from "../hooks/useApiMutation";
import { setAuthTokens } from "../utils/axiosInstance";
import type { Role, User } from "../types";

type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
    };
    accessToken: string;
    refreshToken: string;
  };
};

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, login } = useAuth();
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useApiMutation({
    method: "post",
    endpoint: "auth/login",
    onSuccess: (response: LoginResponse) => {
      const { accessToken, refreshToken, user: apiUser } = response.data;

      setAuthTokens(accessToken, refreshToken);
      login({
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
        avatar: apiUser.name.charAt(0),
      } satisfies User);
    },
  });

  // Already logged in → go to dashboard
  if (user) return <Navigate to="/" replace />;

  const submit = (data: LoginFormValues) => {
    setApiError("");

    loginMutation.mutate(
      { data },
      {
        onError: (err: any) => {
          setApiError(
            err?.response?.data?.message ||
              "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          );
        },
      },
    );
  };

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'Tajawal', sans-serif",
        background:
          "linear-gradient(135deg, #0C1A2E 0%, #0E3A5A 50%, #0C1A2E 100%)",
      }}
      className="min-h-screen flex flex-col lg:flex-row"
    >
      {/* Hero panel — hidden on small */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center items-center p-16">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-8">
            <HeartPulse size={40} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">مستشفى الرعاية</h1>
          <p className="text-white/50 text-lg mb-12">نظام إدارة متكامل وذكي</p>
          <div className="grid grid-cols-2 gap-4 max-w-xs">
            {[
              { icon: HeartPulse, l: "إدارة المرضى" },
              { icon: Calendar, l: "المواعيد" },
              { icon: FlaskConical, l: "التحاليل" },
              { icon: Package, l: "المستودع" },
            ].map(({ icon: Icon, l }) => (
              <div
                key={l}
                className="bg-white/5 rounded-2xl p-4 border border-white/10 text-right"
              >
                <Icon size={18} className="text-primary mb-2" />
                <p className="text-white text-sm font-semibold">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <HeartPulse size={28} className="text-primary" />
            </div>
            <h2 className="text-white text-2xl font-bold">مستشفى الرعاية</h2>
          </div>

          <h2 className="text-white text-2xl font-bold mb-1 text-right">
            تسجيل الدخول
          </h2>
          <p className="text-white/40 text-sm mb-7 text-right">
            أدخل بياناتك للوصول إلى النظام
          </p>

          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5 text-right">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="example@hospital.sa"
                className={`w-full px-4 py-3 bg-white/10 border ${errors.email ? "border-red-500 focus:border-red-500" : "border-white/20 focus:border-primary"} rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:bg-white/15 transition-all`}
                dir="ltr"
              />
              {errors.email && (
                <p className="text-red-400 text-xs text-right mt-1.5">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5 text-right">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  className={`w-full px-1 py-3 bg-white/10 border ${errors.password ? "border-red-500 focus:border-red-500" : "border-white/20 focus:border-primary"} rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:bg-white/15 transition-all pl-4`}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs text-right mt-1.5">
                  {errors.password.message}
                </p>
              )}
            </div>
            {apiError && (
              <p className="text-red-400 text-xs text-right">{apiError}</p>
            )}
            <button
              type="submit"
              disabled={loginMutation.isPending || !isValid}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? "جاري الدخول..." : "دخول"}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-7 p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-xs font-semibold text-white/40 mb-3 text-right">
              بيانات تجريبية — انقر للملء
            </p>
            <div className="space-y-2">
              {Object.values(DEMO_USERS).map((u) => (
                <button
                  key={u.email}
                  onClick={() => {
                    setValue("email", u.email, { shouldValidate: true });
                    setValue("password", u.password, { shouldValidate: true });
                    setApiError("");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="font-mono text-xs text-white/40" dir="ltr">
                    {u.email}
                  </span>
                  <span className="text-xs text-white/60 font-medium">
                    {ROLE_LABELS[u.role]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
