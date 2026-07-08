import React, { lazy, memo, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
  Phone,
} from "lucide-react";
import { authApi } from "../api/api";

const AuthSocialLogins = lazy(() => import("./AuthSocialLogins"));

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: {
    name: string;
    email: string;
    role?: "user" | "admin";
    phone?: string;
    avatarUrl?: string;
  }) => void;
}

function AuthModalContent({ onClose, onLogin }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSocialLogins, setShowSocialLogins] = useState(false);

  useEffect(() => {
    const idleId =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(() => setShowSocialLogins(true))
        : undefined;
    const timerId = idleId === undefined ? window.setTimeout(() => setShowSocialLogins(true), 400) : undefined;

    return () => {
      if (idleId !== undefined && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    };
  }, []);

  const handleAuthSuccess = (
    data: any,
    defaultName: string = "Thành viên VIP",
    fallbackEmail: string = "",
    fallbackPhone: string = ""
  ) => {
    const token = data?.token || data?.Token || "";
    const userObj = data?.user || data?.User || {};

    const roleCode =
      userObj?.roleCode ||
      userObj?.RoleCode ||
      userObj?.role ||
      userObj?.Role ||
      "CUSTOMER";

    const calculatedRole: "user" | "admin" =
      roleCode.toString().toLowerCase() === "admin" ||
      roleCode.toString().toLowerCase() === "manager"
        ? "admin"
        : "user";

    const normalizedUser = {
      id: userObj?.id || userObj?.Id || null,
      name:
        userObj?.fullName ||
        userObj?.FullName ||
        userObj?.name ||
        userObj?.Name ||
        defaultName,
      fullName:
        userObj?.fullName ||
        userObj?.FullName ||
        userObj?.name ||
        userObj?.Name ||
        defaultName,
      email: userObj?.email || userObj?.Email || fallbackEmail,
      phone: userObj?.phone || userObj?.Phone || fallbackPhone || "",
      avatarUrl: userObj?.avatarUrl || userObj?.AvatarUrl || "",
      role: calculatedRole,
      roleCode: roleCode,
      status: userObj?.status || userObj?.Status || "Active",
    };

    if (token) {
      sessionStorage.setItem("token", token);
      localStorage.setItem("token", token);
    }

    sessionStorage.setItem("user_role", roleCode);
    localStorage.setItem("user_role", roleCode);
    sessionStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    onLogin({
      name: normalizedUser.name,
      email: normalizedUser.email,
      role: normalizedUser.role,
      phone: normalizedUser.phone,
      avatarUrl: normalizedUser.avatarUrl,
    });

    window.location.href = "/";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!email || !password) {
      setError("Quý khách hãy nhập đầy đủ thông tin.");
      return;
    }

    if (isRegister && (!fullName || !phone)) {
      setError("Hãy điền đầy đủ thông tin cá nhân.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await authApi.register({
          email,
          password,
          fullName,
          phone,
        });

        alert("Khởi tạo tài khoản thành công! Đang tiến vào phòng trưng bày...");
      }

      const data = await authApi.login({
        email,
        password,
      });

      handleAuthSuccess(data, fullName, email, phone);
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      id="auth-overlay-modal"
    >
      <div
        className="fixed inset-0 bg-black/60"
        onClick={onClose}
      />

      <div className="relative bg-[#FAF6F0] w-full max-w-md rounded-2xl p-8 border border-[#EADBC8] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8B7E74] hover:text-[#5C4033] p-1.5 rounded-full hover:bg-[#F4EBE1]"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#5C4033] to-[#D4AF37] text-white font-serif font-black flex items-center justify-center text-2xl mx-auto shadow-md mb-2">
            L
          </div>

          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
            {isRegister
              ? "Đăng Ký Thành Viên LuxeHome"
              : "Chào Đón Trở Lại Showroom"}
          </h2>

          <p className="text-xs text-[#8B7E74] mt-1">
            Hệ thống thành viên LuxeHome VIP Club
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-[#5C4033] uppercase tracking-wider mb-1.5">
                  Họ tên gia chủ *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#8B7E74]">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Ví dụ: Nguyễn Minh Hoàng"
                    autoComplete="name"
                    className="w-full text-xs bg-white border border-[#EADBC8] rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C4033] uppercase tracking-wider mb-1.5">
                  Số điện thoại liên hệ *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#8B7E74]">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Ví dụ: 0901234567"
                    autoComplete="tel"
                    className="w-full text-xs bg-white border border-[#EADBC8] rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#5C4033] uppercase tracking-wider mb-1.5">
              Địa chỉ Email *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#8B7E74]">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                name="email"
                required
                placeholder="vip-member@luxehome.vn"
                autoComplete="email"
                className="w-full text-xs bg-white border border-[#EADBC8] rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#5C4033] uppercase tracking-wider mb-1.5">
              Mật khẩu bảo an *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#8B7E74]">
                <Lock className="w-4 h-4" />
              </span>
              <input
                key={isRegister ? "register-password" : "login-password"}
                type="password"
                name="password"
                required
                placeholder="••••••••"
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="w-full text-xs bg-white border border-[#EADBC8] rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#5C4033] hover:bg-[#4A3B32] disabled:bg-gray-400 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md mt-6 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            {loading
              ? "Đang xử lý..."
              : isRegister
              ? "Khởi Tạo VIP Account"
              : "Tiến Vào Phòng Trưng Bày"}
          </button>
        </form>

        <div className="mt-5 space-y-2.5">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#EADBC8]"></div>
            <span className="flex-shrink mx-3 text-[10px] text-[#8B7E74] uppercase tracking-wider font-bold">
              Hoặc đăng nhập nhanh
            </span>
            <div className="flex-grow border-t border-[#EADBC8]"></div>
          </div>

          {showSocialLogins ? (
            <Suspense fallback={<div className="h-9 text-center text-[10px] text-[#8B7E74]">Đang tải đăng nhập nhanh...</div>}>
              <AuthSocialLogins
                loading={loading}
                setLoading={setLoading}
                setError={setError}
                onAuthSuccess={handleAuthSuccess}
              />
            </Suspense>
          ) : (
            <div className="h-9" />
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[#EADBC8] text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            type="button"
            className="text-xs text-[#5C4033] hover:underline font-medium"
          >
            {isRegister
              ? "Đã có tài khoản? Đăng nhập"
              : "Chưa có tài khoản? Đăng ký VIP miễn phí"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AuthModal(props: AuthModalProps) {
  return <AuthModalContent {...props} />;
}

export default memo(AuthModal);
