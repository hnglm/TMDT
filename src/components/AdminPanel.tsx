import React, { useState, useMemo, useEffect } from "react";
import { BarChart3, Package, ShoppingCart, Users, MessageSquare, Tag, Calendar, Sparkles, TrendingUp, DollarSign, Plus, Check, Edit3, Trash2, AlertTriangle, RefreshCw, UserCheck, ShieldAlert, X, Lock, Save } from "lucide-react";
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
  onEditProduct: (product: Product) => void; // 👑 MỚI: Prop xử lý lưu sản phẩm sau khi sửa
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
  onEditProduct,
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

  const [editingUser, setEditingUser] = useState<DBUser | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRoleCode, setEditRoleCode] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // State quản lý việc hiển thị Form thêm sản phẩm
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  // States cho Form Thêm
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState(15000000);
  const [newProdCategory, setNewProdCategory] = useState<Product["category"]>("phong-khach");
  const [newProdStyle, setNewProdStyle] = useState<Product["style"]>("Modern");
  const [newProdDescription, setNewProdDescription] = useState("");
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdMaterial, setNewProdMaterial] = useState("Gỗ Óc Chó sấy cao cấp");
  const [newProdDimensions, setNewProdDimensions] = useState("Dài 180cm x Rộng 80cm");

  // State quản lý Popup Sửa sản phẩm
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdPrice, setEditProdPrice] = useState(0);
  const [editProdCategory, setEditProdCategory] = useState<string>("phong-khach");
  const [editProdStyle, setEditProdStyle] = useState<string>("Modern");
  const [editProdMaterial, setEditProdMaterial] = useState("");
  const [editProdStock, setEditProdStock] = useState(0);


  const [newCoupCode, setNewCoupCode] = useState("");
  const [newCoupValue, setNewCoupValue] = useState(15);
  const [newCoupMin, setNewCoupMin] = useState(10000000);
  const [newCoupType, setNewCoupType] = useState<"percent" | "fixed">("percent");

  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

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


  const fetchAllUsersFromDb = async () => {
    setLoadingLoadingUsers(true);
    try {
      const response = await fetch("http://localhost:5200/api/admin/users", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`, 
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDbUsers(data);
      } else {
        console.warn("Không lấy được danh sách User từ Server");
        // Không dùng hardcode, set về rỗng hoặc xử lý lỗi
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

  const openEditModal = (user: DBUser) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditPhone(user.phone || "");
    setEditRoleCode(user.roleCode);
    setEditStatus(user.status || "ACTIVE");
  };

  const handleSaveUserFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:5200/api/admin/users/${editingUser.id}/role`, {
        method: "PUT",
        headers: {
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
        setDbUsers(prev => prev.map(u => u.id === editingUser.id ? { 
          ...u, 
          roleCode: editRoleCode, 
          fullName: editFullName, 
          phone: editPhone, 
          status: editStatus 
        } : u));
        
        setEditingUser(null);
        alert("Đã lưu thông tin tài khoản thành công lên hệ thống!");
      } else {
        alert("Không thể lưu thông tin. Hãy kiểm tra lại Backend.");
      }
    } catch (error) {
      console.error("Lỗi lưu dữ liệu:", error);
      alert("Kết nối API thất bại.");
    }
  };

  const handleToggleStatus = async (userId: number, user: DBUser, nextStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5200/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
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

  const handleAddNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct({
      id: "", // Sẽ được DB gán lại
      name: newProdName, 
      price: Number(newProdPrice), 
      rating: 5, 
      category: newProdCategory,
      categoryName: newProdCategory === "phong-khach" ? "Phòng Khách" : (newProdCategory === "phong-ngu" ? "Phòng Ngủ" : "Nhà Bếp"), 
      style: newProdStyle,
      images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800"], // Tạm thời
      description: newProdDescription, 
      longDescription: "", 
      material: newProdMaterial, 
      dimensions: newProdDimensions,
      colors: ["Mặc định"], 
      features: ["Bảo hành"], 
      warranty: "12 tháng", 
      stock: Number(newProdStock), 
      brand: "LuxeHome", 
      reviews: []
    });
    // Reset Form
    setNewProdName(""); 
    setNewProdDescription("");
    setNewProdPrice(15000000);
    setNewProdStock(10);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setEditProdName(product.name);
    setEditProdPrice(product.price);
    setEditProdCategory(product.category);
    setEditProdStyle(product.style || "Modern");
    setEditProdMaterial(product.material);
    setEditProdStock(product.stock || 0);
  };

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Build the updated product object
    const updatedProduct = {
      ...editingProduct,
      name: editProdName,
      price: Number(editProdPrice),
      category: editProdCategory as Product["category"],
      categoryName: editProdCategory === "phong-khach" ? "Phòng Khách" : (editProdCategory === "phong-ngu" ? "Phòng Ngủ" : "Nhà Bếp"),
      style: editProdStyle as Product["style"],
      material: editProdMaterial,
      stock: Number(editProdStock)
    } as Product;

    onEditProduct(updatedProduct);
    setEditingProduct(null); // Đóng modal
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

      <div className="flex flex-wrap gap-2 mb-8 border-b border-[#EADBC8] pb-4">
        {[
          { id: "dashboard", label: "Phân Tích Doanh Số", icon: BarChart3 },
          { id: "orders", label: "Quản Lý Đơn Hàng", icon: ShoppingCart },
          { id: "products", label: "Kho & Sản Phẩm", icon: Package },
          { id: "schedules", label: "Lịch Tư Vấn Mặt Bằng", icon: Calendar },
          { id: "coupons", label: "Mã Ưu Đãi VIP", icon: Tag },
          { id: "users", label: "Quản Lý Tài Khoản (VIP)", icon: Users },
        ].map((sub) => {
          const Icon = sub.icon;
          return (
            <button key={sub.id} onClick={() => setActiveSubTab(sub.id as any)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase border transition-all ${activeSubTab === sub.id ? "bg-[#5C4033] text-white" : "bg-white text-[#5C4033] border-[#EADBC8] hover:bg-[#FAF6F0]"}`}>
              <Icon className="w-4 h-4" /> {sub.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#EADBC8] p-6 md:p-8">
        
        {}
        {activeSubTab === "products" && (
          <div className="space-y-6">
            {/* TIÊU ĐỀ & NÚT BẬT FORM THÊM MỚI */}
            <div className="flex justify-between items-center border-b border-[#EADBC8] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#D4AF37]" /> Quản Lý Kho & Sản Phẩm
              </h3>
              <button 
                onClick={() => setIsAddingProduct(!isAddingProduct)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer ${isAddingProduct ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-[#5C4033] text-white hover:bg-[#4A3B32]"}`}
              >
                {isAddingProduct ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isAddingProduct ? "Hủy Thêm" : "Thêm Sản Phẩm Mới"}
              </button>
            </div>

            {/* FORM THÊM SẢN PHẨM MỚI */}
            {isAddingProduct && (
              <form onSubmit={handleAddNewProductSubmit} className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8] shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300">
                <h4 className="font-bold text-[#5C4033] text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Thông tin sản phẩm mới
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[#8B7E74] font-bold mb-1">Tên Sản Phẩm *</label>
                    <input type="text" required value={newProdName} onChange={(e) => setNewProdName(e.target.value)} className="w-full bg-white border border-[#EADBC8] p-2.5 rounded-xl focus:ring-1 focus:ring-[#D4AF37] focus:outline-none" placeholder="VD: Sofa Da Cao Cấp" />
                  </div>
                  <div>
                    <label className="block text-[#8B7E74] font-bold mb-1">Giá Bán (VNĐ) *</label>
                    <input type="number" required min="0" value={newProdPrice} onChange={(e) => setNewProdPrice(Number(e.target.value))} className="w-full bg-white border border-[#EADBC8] p-2.5 rounded-xl focus:ring-1 focus:ring-[#D4AF37] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[#8B7E74] font-bold mb-1">Số Lượng Nhập Kho *</label>
                    <input type="number" required min="0" value={newProdStock} onChange={(e) => setNewProdStock(Number(e.target.value))} className="w-full bg-white border border-[#EADBC8] p-2.5 rounded-xl focus:ring-1 focus:ring-[#D4AF37] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[#8B7E74] font-bold mb-1">Danh Mục</label>
                    <select value={newProdCategory} onChange={(e) => setNewProdCategory(e.target.value as any)} className="w-full bg-white border border-[#EADBC8] p-2.5 rounded-xl focus:ring-1 focus:ring-[#D4AF37] focus:outline-none">
                      <option value="phong-khach">Phòng Khách</option>
                      <option value="phong-ngu">Phòng Ngủ</option>
                      <option value="nha-bep">Nhà Bếp</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#8B7E74] font-bold mb-1">Trường Phái (Phong cách)</label>
                    <select value={newProdStyle} onChange={(e) => setNewProdStyle(e.target.value as any)} className="w-full bg-white border border-[#EADBC8] p-2.5 rounded-xl focus:ring-1 focus:ring-[#D4AF37] focus:outline-none">
                      <option value="Modern">Hiện Đại (Modern)</option>
                      <option value="Classic">Cổ Điển (Classic)</option>
                      <option value="Indochine">Đông Dương (Indochine)</option>
                      <option value="Rustic">Mộc mạc (Rustic)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#8B7E74] font-bold mb-1">Chất Liệu</label>
                    <input type="text" value={newProdMaterial} onChange={(e) => setNewProdMaterial(e.target.value)} className="w-full bg-white border border-[#EADBC8] p-2.5 rounded-xl focus:ring-1 focus:ring-[#D4AF37] focus:outline-none" placeholder="VD: Gỗ Sồi Nga" />
                  </div>
                </div>
                
                <div className="pt-2 flex justify-end">
                  <button type="submit" className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#B8962E] text-white font-bold rounded-xl text-xs uppercase shadow-md transition-colors flex items-center gap-1 cursor-pointer">
                    <Check className="w-4 h-4" /> Đăng Sản Phẩm Lên Database
                  </button>
                </div>
              </form>
            )}

            {/* DANH SÁCH SẢN PHẨM HIỆN TẠI (Lấy từ props products) */}
            {products.length === 0 ? (
              <div className="py-20 text-center text-xs text-[#8B7E74] font-medium border border-dashed border-[#EADBC8] rounded-2xl">
                Kho hàng đang trống. Vui lòng thêm sản phẩm mới.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(p => (
                  <div key={p.id} className="flex flex-col p-4 border border-[#EADBC8] rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 relative group hover:-translate-y-1">
                    {/* Cụm Tên và Nút chức năng */}
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-[#1A1A1A] pr-12 line-clamp-2 leading-tight">{p.name}</span>
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditProductModal(p)} 
                          className="p-1.5 bg-amber-50 text-[#D4AF37] hover:bg-amber-100 hover:text-amber-600 rounded-lg border border-amber-200 cursor-pointer transition-colors shadow-sm"
                          title="Sửa thông tin sản phẩm"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(p.id)} 
                          className="p-1.5 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-lg border border-red-200 cursor-pointer transition-colors shadow-sm"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Cụm Thông tin & Thẻ tag */}
                    <div className="flex flex-wrap gap-1 mb-2">
                       <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#FAF6F0] text-[#5C4033] rounded border border-[#EADBC8] uppercase">{p.categoryName}</span>
                       <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-50 text-gray-500 rounded border border-gray-200 uppercase">{p.style || "Khác"}</span>
                    </div>

                    {/* Cụm Giá & Tồn Kho */}
                    <div className="flex items-end justify-between mt-auto pt-3 border-t border-gray-100">
                      <div className="text-[10px] text-[#8B7E74] space-y-0.5">
                        <p>Mã Hàng: <span className="font-mono font-bold text-gray-400">#{p.id}</span></p>
                        <p className="font-bold text-sm text-[#5C4033]">{formattedPrice(p.price)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] uppercase font-bold text-[#8B7E74]">Tồn kho</span>
                        <input 
                          type="number" 
                          value={p.stock} 
                          onChange={(e) => onUpdateProductStock(p.id, Number(e.target.value))} 
                          className={`w-16 border text-center font-bold text-xs p-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37] ${p.stock && p.stock <= 3 ? 'border-red-300 text-red-600 bg-red-50' : 'border-[#EADBC8] bg-gray-50 text-gray-700'}`} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {}
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

        {/* BẢNG DANH SÁCH TÀI KHOẢN */}
        {activeSubTab === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#EADBC8] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#D4AF37]" /> Quản Lý Danh Sách Thành Viên
                </h3>
              </div>
              <button onClick={fetchAllUsersFromDb} className="p-2 hover:bg-[#FAF6F0] rounded-xl border border-[#EADBC8] flex items-center gap-1.5 text-xs font-bold text-[#5C4033] transition-all cursor-pointer">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} /> Lấy dữ liệu mới nhất
              </button>
            </div>

            {loadingUsers ? (
              <div className="py-20 text-center text-xs text-[#8B7E74] font-medium animate-pulse">🔄 Đang tải từ CSDL...</div>
            ) : (
              <div className="overflow-x-auto border border-[#EADBC8] rounded-xl bg-white shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF6F0] text-[#5C4033] font-bold text-[10px] uppercase border-b border-[#EADBC8]">
                    <tr><th className="p-3.5 text-center">ID</th><th className="p-3.5">Họ Tên</th><th className="p-3.5">Email</th><th className="p-3.5 text-center">Trạng Thái</th><th className="p-3.5 text-center">Hành Động</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBC8]/40">
                    {dbUsers.map((user) => {
                      const isSystemAdmin = user.email === 'admin@luxehome.vn';
                      return (
                        <tr key={user.id} className="hover:bg-[#FAF6F0]/20">
                          <td className="p-3.5 text-center font-mono text-gray-400">#{user.id}</td>
                          <td className="p-3.5 font-bold">{user.fullName}</td>
                          <td className="p-3.5 text-gray-600">{user.email}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${user.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                              {user.status || "ACTIVE"}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            {isSystemAdmin ? <span className="text-[10px] text-gray-400">Hệ thống</span> : (
                              <button onClick={() => openEditModal(user)} className="p-1.5 text-amber-600 border border-amber-200 rounded">Sửa</button>
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

      {}
      {/* MODAL POPUP: FORM CHỈNH SỬA SẢN PHẨM */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] w-full max-w-2xl rounded-2xl border border-[#D4AF37] shadow-2xl p-6 md:p-8 relative animate-in zoom-in-95 duration-200">
            
            <button onClick={() => setEditingProduct(null)} className="absolute top-4 right-4 text-[#8B7E74] hover:text-[#1A1A1A] p-1.5 rounded-full hover:bg-gray-200 transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6 border-b border-[#EADBC8] pb-4">
              <h3 className="font-serif text-xl font-bold text-[#1A1A1A] flex items-center justify-center gap-2">
                <Edit3 className="w-5 h-5 text-[#D4AF37]" /> Cập Nhật Thông Tin Sản Phẩm
              </h3>
              <p className="text-xs text-[#8B7E74] mt-1 font-mono">ID: #{editingProduct.id}</p>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs text-[#5C4033] uppercase font-bold mb-1">Tên Sản Phẩm *</label>
                  <input type="text" required value={editProdName} onChange={(e) => setEditProdName(e.target.value)} className="w-full border border-[#EADBC8] p-3 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs text-[#5C4033] uppercase font-bold mb-1">Giá Bán Cập Nhật *</label>
                  <div className="relative">
                    <input type="number" required min="0" value={editProdPrice} onChange={(e) => setEditProdPrice(Number(e.target.value))} className="w-full border border-[#EADBC8] p-3 rounded-xl focus:ring-2 focus:ring-[#D4AF37] pl-8 font-bold" />
                    <DollarSign className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#5C4033] uppercase font-bold mb-1">Số Lượng Tồn Kho Thực *</label>
                  <div className="relative">
                    <input type="number" required min="0" value={editProdStock} onChange={(e) => setEditProdStock(Number(e.target.value))} className="w-full border border-[#EADBC8] p-3 rounded-xl focus:ring-2 focus:ring-[#D4AF37] pl-8 font-bold" />
                    <Package className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#5C4033] uppercase font-bold mb-1">Thuộc Danh Mục</label>
                  <select value={editProdCategory} onChange={(e) => setEditProdCategory(e.target.value)} className="w-full border border-[#EADBC8] p-3 rounded-xl focus:ring-2 focus:ring-[#D4AF37]">
                    <option value="phong-khach">Phòng Khách</option>
                    <option value="phong-ngu">Phòng Ngủ</option>
                    <option value="nha-bep">Nhà Bếp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#5C4033] uppercase font-bold mb-1">Chất Liệu Chính</label>
                  <input type="text" value={editProdMaterial} onChange={(e) => setEditProdMaterial(e.target.value)} className="w-full border border-[#EADBC8] p-3 rounded-xl focus:ring-2 focus:ring-[#D4AF37]" />
                </div>
              </div>

              <div className="pt-6 mt-6 flex justify-end gap-3 border-t border-[#EADBC8]">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-5 py-2.5 rounded-xl border border-[#EADBC8] text-gray-700 font-bold uppercase text-xs hover:bg-gray-100 transition-colors">
                  Hủy Bỏ
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#5C4033] hover:bg-[#4A3B32] text-white font-bold uppercase text-xs flex items-center gap-2 shadow-lg transition-all transform hover:scale-105">
                  <Save className="w-4 h-4 text-[#D4AF37]" /> Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] w-full max-w-md rounded-2xl border border-[#EADBC8] shadow-2xl p-6 relative">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-[#8B7E74]"><X className="w-5 h-5" /></button>
            <form onSubmit={handleSaveUserFromModal} className="space-y-4 text-xs mt-6">
              <div>
                <label className="block text-[#5C4033] font-bold">Họ tên *</label>
                <input type="text" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div className="flex justify-end pt-4"><button type="submit" className="px-4 py-2 bg-[#5C4033] text-white rounded font-bold">Lưu thay đổi</button></div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}