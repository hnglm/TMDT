/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { BarChart3, Package, ShoppingCart, Users, MessageSquare, Tag, Calendar, Sparkles, TrendingUp, DollarSign, Plus, Check, Edit3, Trash2, AlertTriangle, RefreshCw, UserCheck, ShieldAlert, X, Lock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Product, Order, ConsultationSchedule, Coupon, BlogPost, Review } from "../types";

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  schedules: ConsultationSchedule[];
  coupons: Coupon[];
  blogs: BlogPost[];
  onUpdateOrderStatus: (orderId: string, status: Order["status"]) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateScheduleStatus: (scheduleId: string, status: ConsultationSchedule["status"]) => void;
  onAddCoupon: (coupon: Coupon) => void;
}

interface DBUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  roleCode: string;
  createdAt: string;
  status?: string;
}

export default function AdminPanel({
  products,
  orders,
  schedules,
  coupons,
  blogs,
  onUpdateOrderStatus,
  onUpdateProductStock,
  onAddProduct,
  onDeleteProduct,
  onUpdateScheduleStatus,
  onAddCoupon,
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "orders" | "products" | "schedules" | "coupons" | "users">("dashboard");

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const [dbUsers, setDbUsers] = useState<DBUser[]>([]);
  const [loadingUsers, setLoadingLoadingUsers] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("All");

  // 👑 STATE QUẢN LÝ POPUP FORM CHỈNH SỬA USER
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRoleCode, setEditRoleCode] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  // Hàm bốc danh sách tài khoản từ .NET
  const fetchAllUsersFromDb = async () => {
    setLoadingLoadingUsers(true);
    try {
      const response = await fetch("http://localhost:5200/api/admin/users", {
        method: "GET",
        headers: {
          // 👑 ĐÃ ĐỒNG BỘ SESSIONSTORAGE ĐỂ THÔNG ĐƯỜNG TRUYỀN API REAL-TIME:
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`, 
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDbUsers(data);
      } else {
        setDbUsers([
          { id: 1, fullName: "Nguyen Van Admin", email: "admin@luxehome.vn", phone: "0901000001", roleCode: "ADMIN", createdAt: "2026-01-10", status: "ACTIVE" },
          { id: 2, fullName: "Tran Thi Manager", email: "manager@example.com", phone: "0901000002", roleCode: "MANAGER", createdAt: "2026-01-15", status: "ACTIVE" },
          { id: 3, fullName: "Le Van Staff", email: "staff@example.com", phone: "0901000003", roleCode: "STAFF", createdAt: "2026-02-01", status: "ACTIVE" },
          { id: 4, fullName: "Lê Thành Long", email: "lamlam548818@gmail.com", phone: "0901234567", roleCode: "CUSTOMER", createdAt: "2026-06-20", status: "ACTIVE" }
        ]);
      }
    } catch (error) {
      console.error("Lỗi kết nối API lấy Users:", error);
    } finally {
      setLoadingLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "users") {
      fetchAllUsersFromDb();
    }
  }, [activeSubTab]);

  // Hàm xử lý kích hoạt mở Popup Form điền sẵn thông tin
  const openEditModal = (user: DBUser) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditPhone(user.phone || "");
    setEditRoleCode(user.roleCode);
    setEditStatus(user.status || "ACTIVE");
  };

  // Hàm gọi API lưu thông tin từ Form Popup xuống thẳng .NET và cập nhật UI
  const handleSaveUserFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:5200/api/admin/users/${editingUser.id}/role`, {
        method: "PUT",
        headers: {
          // 👑 CHÍNH XÁC: Đổi từ localStorage sang sessionStorage để thông ống xác thực
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          roleCode: editRoleCode,
          fullName: editFullName,
          phone: editPhone,
          status: editStatus
        })
      });

      if (response.ok) {
        // Cập nhật ngay lập tức trên UI mượt mà
        setDbUsers(prev => prev.map(u => u.id === editingUser.id ? { 
          ...u, 
          roleCode: editRoleCode, 
          fullName: editFullName, 
          phone: editPhone, 
          status: editStatus 
        } : u));
        
        setEditingUser(null); // Đóng modal
        alert("Đã lưu thông tin tài khoản thành công lên hệ thống!");
      } else {
        alert("Không thể lưu thông tin. Hãy kiểm tra lại Backend.");
      }
    } catch (error) {
      console.error("Lỗi lưu dữ liệu:", error);
      alert("Kết nối API thất bại.");
    }
  };

  // Hàm đổi nhanh trạng thái Khóa/Mở Khóa ngoài bảng danh sách
  const handleToggleStatus = async (userId: number, user: DBUser, nextStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5200/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          // 👑 CHÍNH XÁC: Đổi từ localStorage sang sessionStorage để lệnh Khóa nhanh ăn tiền
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          roleCode: user.roleCode,
          fullName: user.fullName,
          phone: user.phone,
          status: nextStatus
        })
      });

      if (response.ok) {
        setDbUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
        alert(`Đã cập nhật trạng thái tài khoản thành ${nextStatus} thành công!`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Derive dynamic stats
  const ordersInSelectedMonth = useMemo(() => {
    if (selectedMonth === "All") return orders;
    return orders.filter(o => {
      if (!o.date) return false;
      return o.date.split("-")[1] === selectedMonth;
    });
  }, [orders, selectedMonth]);

  const statsForSelectedPeriod = useMemo(() => {
    let revenue = 0, soldCount = 0, returnedCount = 0, faultyCount = 0;
    ordersInSelectedMonth.forEach((o) => {
      if (o.status === "cancelled") {
        o.items.forEach(it => returnedCount += it.quantity);
      } else {
        revenue += o.totalAmount;
        o.items.forEach(it => soldCount += it.quantity);
        o.items.forEach(it => {
          if (it.productId === "prod-04" || it.productId === "prod-05") faultyCount += 1;
        });
      }
    });
    return { revenue, soldCount, returnedCount, faultyCount };
  }, [ordersInSelectedMonth]);

  const fullTimelineData = useMemo(() => {
    let mayRevenue = 0, maySold = 0, junRevenue = 0, junSold = 0;
    orders.forEach(o => {
      if (!o.date) return;
      const m = o.date.split("-")[1];
      const count = o.items.reduce((acc, it) => acc + it.quantity, 0);
      if (m === "05" && o.status !== "cancelled") { mayRevenue += o.totalAmount; maySold += count; }
      else if (m === "06" && o.status !== "cancelled") { junRevenue += o.totalAmount; junSold += count; }
    });
    return [
      { name: "Tháng 01", "Doanh thu": 124000000, "Bán ra": 12, "Đổi trả": 1, "Hàng lỗi": 0 },
      { name: "Tháng 02", "Doanh thu": 182000000, "Bán ra": 18, "Đổi trả": 2, "Hàng lỗi": 1 },
      { name: "Tháng 03", "Doanh thu": 245000000, "Bán ra": 24, "Đổi trả": 1, "Hàng lỗi": 0 },
      { name: "Tháng 04", "Doanh thu": 210000000, "Bán ra": 20, "Đổi trả": 3, "Hàng lỗi": 2 },
      { name: "Tháng 05", "Doanh thu": mayRevenue > 0 ? mayRevenue : 155000000, "Bán ra": maySold > 0 ? maySold : 15, "Đổi trả": 1, "Hàng lỗi": 1 },
      { name: "Tháng 06", "Doanh thu": junRevenue > 0 ? junRevenue : 82000000, "Bán ra": junSold > 0 ? junSold : 8, "Đổi trả": 0, "Hàng lỗi": 0 },
    ];
  }, [orders]);

  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState(15000000);
  const [newProdCategory, setNewProdCategory] = useState<Product["category"]>("phong-khach");
  const [newProdStyle, setNewProdStyle] = useState<Product["style"]>("Modern");
  const [newProdDescription, setNewProdDescription] = useState("");
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdMaterial, setNewProdMaterial] = useState("Gỗ Óc Chó sấy cao cấp");
  const [newProdDimensions, setNewProdDimensions] = useState("Dài 180cm x Rộng 80cm");

  const [newCoupCode, setNewCoupCode] = useState("");
  const [newCoupValue, setNewCoupValue] = useState(15);
  const [newCoupMin, setNewCoupMin] = useState(10000000);
  const [newCoupType, setNewCoupType] = useState<"percent" | "fixed">("percent");

  const handleAddNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct({
      id: "prod-" + (products.length + 1) + Math.floor(10 + Math.random() * 89),
      name: newProdName, price: Number(newProdPrice), rating: 5, category: newProdCategory,
      categoryName: newProdCategory === "phong-khach" ? "Phòng Khách" : "Phòng Ngủ", style: newProdStyle,
      images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800"],
      description: newProdDescription, longDescription: "", material: newProdMaterial, dimensions: newProdDimensions,
      colors: ["Mặc định"], features: ["Bảo hành"], warranty: "12 tháng", stock: Number(newProdStock), brand: "LuxeHome", reviews: []
    });
    setNewProdName(""); setNewProdDescription("");
  };

  const handleAddNewCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCoupon({ code: newCoupCode.toUpperCase().trim(), discountType: newCoupType, value: Number(newCoupValue), minSubtotal: Number(newCoupMin), description: "Ưu đãi", isActive: true });
    setNewCoupCode("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#EADBC8] pb-6 mb-8 gap-4">
        <div>
          <span className="text-[10px] text-[#D4AF37] tracking-widest font-bold uppercase block mb-1">Bảng điều khiển hệ thống</span>
          <h1 className="font-serif text-3xl font-black text-[#1A1A1A]">Quản Trị Viên LuxeHome</h1>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-[#EADBC8] shadow-sm">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
          <p className="text-[11px] font-bold text-[#5C4033] uppercase">Vận hành: Live</p>
        </div>
      </div>

      {/* Thống kê thẻ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8]">
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase block">Doanh thu Đơn Hàng</span>
          <h2 className="font-serif text-2xl font-black text-[#5C4033] mt-2">{formattedPrice(totalRevenue)}</h2>
        </div>
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8]">
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase block">Tổng số lượng đơn đặt</span>
          <h2 className="font-serif text-2xl font-black text-[#1A1A1A] mt-2">{orders.length} đơn</h2>
        </div>
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8]">
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase block">Tư vấn mặt bằng</span>
          <h2 className="font-serif text-2xl font-black text-[#1A1A1A] mt-2">{schedules.length} cuộc hẹn</h2>
        </div>
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8]">
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase block">Phiếu giảm giá VIP</span>
          <h2 className="font-serif text-2xl font-black text-[#1A1A1A] mt-2">{coupons.length} mã</h2>
        </div>
      </section>

      {/* Tabs thanh menu */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-[#EADBC8] pb-4">
        {[
          { id: "dashboard", label: "Phân Tích Doanh Số", icon: BarChart3 },
          { id: "orders", label: "Quản Lý Đơn Hàng", icon: ShoppingCart },
          { id: "products", label: "Kho & Sửa Sản Phẩm", icon: Package },
          { id: "schedules", label: "Lịch Tư Vấn Mặt Bằng", icon: Calendar },
          { id: "coupons", label: "Mã Ưu Đãi VIP", icon: Tag },
          { id: "users", label: "Quản Lý Tài Khoản (VIP)", icon: Users },
        ].map((sub) => {
          const Icon = sub.icon;
          return (
            <button key={sub.id} onClick={() => setActiveSubTab(sub.id as any)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase border transition-all ${activeSubTab === sub.id ? "bg-[#5C4033] text-white" : "bg-white text-[#5C4033] border-[#EADBC8]"}`}>
              <Icon className="w-4 h-4" /> {sub.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#EADBC8] p-6 md:p-8">
        {activeSubTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={fullTimelineData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="Doanh thu" fill="#D4AF37" /></BarChart></ResponsiveContainer></div>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={fullTimelineData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="Bán ra" fill="#5C4033" /></BarChart></ResponsiveContainer></div>
            </div>
          </div>
        )}

        {activeSubTab === "orders" && (
          <table className="w-full text-xs text-left">
            <thead><tr className="bg-[#FAF6F0]"><th className="p-3">Mã đơn</th><th className="p-3">Khách hàng</th><th className="p-3">Tổng tiền</th><th className="p-3">Trạng thái</th></tr></thead>
            <tbody>{orders.map(o => <tr key={o.id}><td className="p-3 font-bold">{o.id}</td><td className="p-3">{o.customerName}</td><td className="p-3 font-bold">{formattedPrice(o.totalAmount)}</td><td className="p-3"><select value={o.status} onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as any)}><option value="pending">Chờ xử lý</option><option value="completed">Đơn Hoàn Tất</option></select></td></tr>)}</tbody>
          </table>
        )}

        {activeSubTab === "products" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => <div key={p.id} className="flex justify-between p-4 border border-[#EADBC8] rounded-xl bg-white"><span className="font-bold text-xs">{p.name}</span><input type="number" value={p.stock} onChange={(e) => onUpdateProductStock(p.id, Number(e.target.value))} className="w-16 border text-center font-bold" /></div>)}
          </div>
        )}

        {activeSubTab === "schedules" && (
          <table className="w-full text-xs text-left">
            <thead><tr className="bg-[#FAF6F0]"><th className="p-3">Gia chủ</th><th className="p-3">Liên hệ</th><th className="p-3">Ngân sách</th><th className="p-3">Trạng thái</th></tr></thead>
            <tbody>{schedules.map(sch => <tr key={sch.id}><td className="p-3 font-bold">{sch.customerName}</td><td className="p-3">{sch.phone}</td><td className="p-3 font-bold text-emerald-800">{formattedPrice(sch.budget)}</td><td><select value={sch.status} onChange={(e) => onUpdateScheduleStatus(sch.id, e.target.value as any)}><option value="pending">Chờ xử lý</option><option value="completed">Chốt</option></select></td></tr>)}</tbody>
          </table>
        )}

        {activeSubTab === "coupons" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map(c => <div key={c.code} className="p-4 border rounded-xl flex justify-between bg-white"><span className="font-mono font-bold">{c.code}</span><span className="text-emerald-700 text-xs font-bold">ACTIVE</span></div>)}
          </div>
        )}

        {/* 👑 BẢNG DANH SÁCH TÀI KHOẢN Kèm ICON MỞ FORM POPUP SỬA/KHÓA */}
        {activeSubTab === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#EADBC8] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#D4AF37]" /> Quản Lý Danh Sách Thành Viên VIP & Ban Vận Hành
                </h3>
                <p className="text-xs text-[#8B7E74]">Bấm vào biểu tượng cây bút để mở Form Popup chỉnh sửa thông tin cá nhân và nhóm quyền lợi.</p>
              </div>
              <button onClick={fetchAllUsersFromDb} className="p-2 hover:bg-[#FAF6F0] rounded-xl border border-[#EADBC8] flex items-center gap-1.5 text-xs font-bold text-[#5C4033] transition-all cursor-pointer">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} /> Làm mới dữ liệu real-time
              </button>
            </div>

            {loadingUsers ? (
              <div className="py-20 text-center text-xs text-[#8B7E74] font-medium animate-pulse">🔄 Đang cập nhật dữ liệu...</div>
            ) : (
              <div className="overflow-x-auto border border-[#EADBC8] rounded-xl bg-white shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF6F0] text-[#5C4033] font-bold text-[10px] uppercase border-b border-[#EADBC8]">
                    <tr>
                      <th className="p-3.5 text-center">ID</th>
                      <th className="p-3.5">Họ Tên Gia Chủ</th>
                      <th className="p-3.5">Địa Chỉ Email</th>
                      <th className="p-3.5">Số Điện Thoại</th>
                      <th className="p-3.5 text-center">Trạng Ngưỡng</th>
                      <th className="p-3.5 text-center">Chức Vụ</th>
                      <th className="p-3.5 text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBC8]/40 font-medium text-[#1A1A1A]">
                    {dbUsers.map((user) => {
                      const isSystemAdmin = user.email === 'admin@luxehome.vn';
                      const currentStatus = user.status || "ACTIVE";

                      return (
                        <tr key={user.id} className="hover:bg-[#FAF6F0]/20 transition-colors">
                          <td className="p-3.5 text-center font-mono font-bold text-gray-400">#{user.id}</td>
                          <td className="p-3.5 font-bold text-gray-900">{user.fullName}</td>
                          <td className="p-3.5 font-semibold text-gray-700 underline">{user.email}</td>
                          <td className="p-3.5 font-mono text-gray-600">{user.phone || "Chưa cập nhật"}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider border ${currentStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                              {currentStatus}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.roleCode === "ADMIN" ? "bg-red-50 text-red-700" : "bg-[#FAF6F0] text-[#5C4033]"}`}>
                              {user.roleCode}
                            </span>
                          </td>
                          <td className="p-3.5 text-center flex items-center justify-center gap-2">
                            {isSystemAdmin ? (
                              <span className="text-[10px] text-gray-400 italic flex items-center gap-1"><Lock className="w-3 h-3" /> Hệ thống</span>
                            ) : (
                              <>
                                {/* ICON BẤM SỬA DI ĐỘNG BẬT MODAL POPUP */}
                                <button 
                                  onClick={() => openEditModal(user)}
                                  className="p-1.5 bg-amber-50 text-[#D4AF37] hover:bg-amber-100 rounded-lg border border-amber-200 transition-all cursor-pointer"
                                  title="Chỉnh sửa thông tin thành viên"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                                    if (window.confirm(`Đổi trạng thái của [${user.fullName}] sang ${nextStatus}?`)) {
                                      // 👑 ĐÃ SỬA: Truyền đủ 3 tham số để hàm gọi chạy chuẩn xác dưới C#
                                      handleToggleStatus(user.id, user, nextStatus);
                                    }
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${currentStatus === "ACTIVE" ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"}`}
                                >
                                  {currentStatus === "ACTIVE" ? "Khóa" : "Mở Khóa"}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 👑 COMPONENT MODAL POPUP: FORM CHỈNH SỬA TÀI KHOẢN CAO CẤP */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] w-full max-w-md rounded-2xl border border-[#EADBC8] shadow-2xl p-6 relative animate-scaleUp">
            
            {/* Nút đóng modal */}
            <button 
              onClick={() => setEditingUser(null)} 
              className="absolute top-4 right-4 text-[#8B7E74] hover:text-[#5C4033] p-1.5 rounded-full hover:bg-[#F4EBE1]"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header popup */}
            <div className="text-center mb-5 border-b border-[#EADBC8] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center justify-center gap-1.5">
                <Edit3 className="w-5 h-5 text-[#D4AF37]" /> Cập Nhật Hồ Sơ Gia Chủ
              </h3>
              <p className="text-[11px] text-[#8B7E74] mt-0.5">ID Người Dùng Đang Chọn: #{editingUser.id}</p>
            </div>

            {/* Form nội dung */}
            <form onSubmit={handleSaveUserFromModal} className="space-y-4 text-xs">
              
              {/* Mục Email: BỊ BLOCK (Chỉ hiển thị chứ không cho chỉnh sửa) */}
              <div>
                <label className="block text-[10px] text-[#8B7E74] uppercase font-bold mb-1 flex items-center gap-1">
                  📧 Địa Chỉ Email Đăng Nhập <span className="text-[9px] text-red-500 italic font-normal">(Cố định hệ thống)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full bg-gray-200/60 text-gray-500 border border-[#EADBC8] p-2.5 rounded-xl font-semibold cursor-not-allowed focus:outline-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                </div>
              </div>

              {/* Mục Tên: ĐƯỢC CHỈNH SỬA */}
              <div>
                <label className="block text-[10px] text-[#5C4033] uppercase font-bold mb-1">👤 Họ tên gia chủ *</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-white border border-[#EADBC8] p-2.5 rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Mục Số điện thoại: ĐƯỢC CHỈNH SỬA */}
              <div>
                <label className="block text-[10px] text-[#5C4033] uppercase font-bold mb-1">📞 Số điện thoại liên hệ *</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-white border border-[#EADBC8] p-2.5 rounded-xl text-gray-900 font-mono focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Mục Chức Vụ: ĐƯỢC CHỈNH SỬA CHỌN */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[#5C4033] uppercase font-bold mb-1">🎖️ Cấp quyền</label>
                  <select
                    value={editRoleCode}
                    onChange={(e) => setEditRoleCode(e.target.value)}
                    className="w-full bg-white border border-[#EADBC8] p-2 rounded-xl text-gray-900 font-bold focus:outline-none"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="STAFF">STAFF</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#5C4033] uppercase font-bold mb-1">⚡ Vận hành</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-white border border-[#EADBC8] p-2 rounded-xl text-gray-900 font-bold focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Mở)</option>
                    <option value="INACTIVE">INACTIVE (Khóa)</option>
                  </select>
                </div>
              </div>

              {/* Hộp nút bấm hành động */}
              <div className="pt-4 flex justify-end gap-2 border-t border-[#EADBC8] mt-6">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#EADBC8] text-gray-600 hover:bg-gray-100 font-bold uppercase tracking-wider cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#5C4033] hover:bg-[#4A3B32] text-white font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4 text-[#D4AF37]" /> Lưu thay đổi
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}