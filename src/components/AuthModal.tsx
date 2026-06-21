import React, { useState } from "react";
import { X, User, Mail, Lock, Sparkles, AlertCircle, Phone, Facebook, Globe } from "lucide-react";
import { authApi } from "../api/api"; // Import cụm hàm gọi API đã viết ở file api.ts

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: { name: string; email: string; role?: "user" | "admin"; phone?: string }) => void;
}

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Quý khách hãy nhập đầy đủ thông tin tài khoản.");
      return;
    }
    if (isRegister && !name) {
      setError("Hãy cho LuxeHome biết quý danh để tiện việc xưng hô.");
      return;
    }
    if (isRegister && !phone) {
      setError("Quý khách hãy bổ sung Số điện thoại để hoàn tất đăng ký.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        // --- 1. XỬ LÝ ĐĂNG KÝ THẬT ---
        await authApi.register({
          email: email.trim(),
          password: password,
          fullName: name.trim(),
          phone: phone.trim()
        });
        alert("Khởi tạo tài khoản thành công! Xin mời quý khách đăng nhập.");
        setIsRegister(false);
        setPassword("");
      } else {
        // --- 2. XỬ LÝ ĐĂNG NHẬP THẬT ---
        const data = await authApi.login({
          email: email.trim(),
          password: password
        });

        // Đảm bảo bốc chuẩn Token và RoleCode viết thường/viết hoa từ API .NET trả về
        const token = data.token || data.Token;
        const userObj = data.user || data.User;
        const roleCode = userObj?.roleCode || userObj?.RoleCode || "CUSTOMER";

        // 👑 CHUYỂN ĐỔI SANG SESSIONSTORAGE: Lưu JWT Token và RoleCode để tự động xóa sạch khi tắt trình duyệt
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user_role", roleCode);

        // Chuẩn hóa role về dạng "admin" hoặc "user" để khớp với Interface Component App.tsx hiện tại
        const calculatedRole = (roleCode.toLowerCase() === "admin" || roleCode.toLowerCase() === "manager") 
          ? "admin" 
          : "user";

        // Báo trạng thái đăng nhập thành công cho hệ thống React nhận diện điều hướng
        onLogin({
          name: userObj?.fullName || userObj?.FullName || "Thành viên VIP",
          email: userObj?.email || userObj?.Email || email.trim(),
          role: calculatedRole,
          phone: userObj?.phone || userObj?.Phone || ""
        });

        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Kết nối hệ thống thất bại hoặc Sai tài khoản/mật khẩu!");
    } finally {
      loading && setLoading(false);
    }
  };

  const handleSocialLogin = (platform: "Google" | "Facebook") => {
    alert(`Tính năng liên kết ${platform} đang được bảo trì nâng cấp.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="auth-overlay-modal">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-[#FAF6F0] w-full max-w-md rounded-2xl p-8 border border-[#EADBC8] shadow-2xl transform transition-all">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8B7E74] hover:text-[#5C4033] p-1.5 rounded-full hover:bg-[#F4EBE1]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#5C4033] to-[#D4AF37] text-white font-serif font-black flex items-center justify-center text-2xl mx-auto shadow-md mb-2">
            L
          </div>
          <h2 className="font-serif text-2.5xl font-bold text-[#1A1A1A]">
            {isRegister ? "Đăng Ký Thành Viên LuxeHome" : "Chào Đón Trở Lại Showroom"}
          </h2>
          <p className="text-xs text-[#8B7E74] mt-1">Hệ thống thành viên LuxeHome VIP Club</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold text-[#5C4033] uppercase tracking-wider mb-1.5">Họ tên gia chủ *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#8B7E74]">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Minh Hoàng"
                  className="w-full text-xs bg-white border border-[#EADBC8] rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold text-[#5C4033] uppercase tracking-wider mb-1.5">Số điện thoại liên hệ *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#8B7E74]">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  className="w-full text-xs bg-white border border-[#EADBC8] rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#5C4033] uppercase tracking-wider mb-1.5">
              {isRegister ? "Địa chỉ Email *" : "Địa chỉ Email đăng nhập *"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#8B7E74]">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vip-member@luxehome.vn"
                className="w-full text-xs bg-white border border-[#EADBC8] rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#5C4033] uppercase tracking-wider mb-1.5">Mật khẩu bảo an *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#8B7E74]">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs bg-white border border-[#EADBC8] rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#5C4033] hover:bg-[#4A3B32] disabled:bg-gray-400 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md mt-6 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            {loading ? "Đang xử lý..." : isRegister ? "Khởi Tạo VIP Account" : "Tiến Vào Phòng Trưng Bày"}
          </button>
        </form>

        <div className="mt-5 space-y-2.5">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#EADBC8]"></div>
            <span className="flex-shrink mx-3 text-[10px] text-[#8B7E74] uppercase tracking-wider font-bold">Hoặc đăng nhập nhanh bằng</span>
            <div className="flex-grow border-t border-[#EADBC8]"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin("Google")}
              type="button"
              className="flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-[#EADBC8] rounded-xl text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              Google
            </button>
            <button
              onClick={() => handleSocialLogin("Facebook")}
              type="button"
              className="flex items-center justify-center gap-2 py-2 px-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Facebook className="w-3.5 h-3.5 text-white fill-current" />
              Facebook
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#EADBC8] text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-xs text-[#5C4033] hover:underline font-medium cursor-pointer"
          >
            {isRegister ? "Đã có tài khoản? Đăng nhập tại đây" : "Chưa có tài khoản LuxeHome? Đăng ký VIP miễn phí"}
          </button>
        </div>
      </div>
    </div>
  );
}