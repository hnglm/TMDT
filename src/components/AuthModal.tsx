import React, { useState } from "react";
import { X, User, Mail, Lock, Sparkles, AlertCircle, Phone, Facebook, Globe } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: { name: string; email: string; role?: "user" | "admin"; phone?: string }) => void;
}

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("lamlam548818@gmail.com"); // Prepopulate with metadata user
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Nguyễn Lâm Thao");
  const [phone, setPhone] = useState("0901234567");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    // Role-based authorization check: "mk: admin123" for admin access
    const lowerEmail = email.toLowerCase().trim();
    if (!isRegister && (lowerEmail === "admin" || lowerEmail === "admin@luxehome.vn")) {
      if (password === "admin123") {
        onLogin({
          name: "Quản trị viên LuxeHome",
          email: "admin@luxehome.vn",
          role: "admin",
          phone: "0900000123"
        });
        onClose();
        return;
      } else {
        setError("Mật khẩu Quản trị viên không chính xác. Hãy dùng: admin123");
        return;
      }
    }

    // Success simulation
    onLogin({
      name: isRegister ? name : "Nguyễn Lâm Thao",
      email,
      role: "user",
      phone: isRegister ? phone : "0901234567"
    });
    onClose();
  };

  // Social linking simulation
  const handleSocialLogin = (platform: "Google" | "Facebook") => {
    onLogin({
      name: `Gia chủ ${platform} User`,
      email: `${platform.toLowerCase()}-member@luxehome.vn`,
      role: "user",
      phone: "0909999888"
    });
    alert(`Liên kết tài khoản ${platform} thành công! Chào mừng Quý khách đến với LuxeHome.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="auth-overlay-modal">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-[#FAF6F0] w-full max-w-md rounded-2xl p-8 border border-[#EADBC8] shadow-2xl transform transition-all">
        
        {/* Close */}
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
                  required
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
              {isRegister ? "Địa chỉ Email *" : "Tên đăng nhập hoặc Email *"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#8B7E74]">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vip-member@luxehome.vn hoặc admin"
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
            className="w-full py-3 rounded-xl bg-[#5C4033] hover:bg-[#4A3B32] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md mt-6 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            {isRegister ? "Khởi Tạo VIP Account" : "Tiến Vào Phòng Trưng Bày"}
          </button>
        </form>

        {/* Social Linkages binding */}
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
              className="flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-gray-50 text-gray-700 hover:text-black border border-[#EADBC8] rounded-xl text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              Google
            </button>
            <button
              onClick={() => handleSocialLogin("Facebook")}
              type="button"
              className="flex items-center justify-center gap-2 py-2 px-3 bg-[#1877F2] hover:bg-[#166FE5] text-white border border-transparent rounded-xl text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
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
            {isRegister 
              ? "Đã có tài khoản? Đăng nhập tại đây" 
              : "Chưa có tài khoản LuxeHome? Đăng ký VIP miễn phí"}
          </button>
        </div>

        {/* Demo hints */}
        <div className="mt-4 p-3 bg-[#EADBC8]/20 rounded-lg border border-dashed border-[#EADBC8] text-[9.5px] text-[#5C4033] leading-relaxed">
          💡 <strong>Ủy quyền Quản Trị Viên (Admin):</strong><br/>
          Tài khoản: <code className="bg-white/80 px-1 rounded font-bold">admin</code> | Mật khẩu: <code className="bg-white/80 px-1 rounded font-bold">admin123</code>
        </div>
      </div>
    </div>
  );
}
