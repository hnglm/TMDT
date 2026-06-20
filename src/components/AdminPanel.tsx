import React, { useState, useMemo } from "react";
import { BarChart3, Package, ShoppingCart, Users, MessageSquare, Tag, Calendar, Sparkles, TrendingUp, DollarSign, Plus, Check, Edit3, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
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
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "orders" | "products" | "schedules" | "coupons">("dashboard");

  // State for Month Selection reports: "All", "01", "02", "03", "04", "05", "06"
  const [selectedMonth, setSelectedMonth] = useState<string>("All");

  const monthNames: { [key: string]: string } = {
    "All": "Tất cả các tháng (2026)",
    "01": "Tháng 01",
    "02": "Tháng 02",
    "03": "Tháng 03",
    "04": "Tháng 04",
    "05": "Tháng 05",
    "06": "Tháng 06",
  };

  // Derive dynamic stats for selected month from actual current orders list:
  const ordersInSelectedMonth = useMemo(() => {
    if (selectedMonth === "All") return orders;
    return orders.filter(o => {
      if (!o.date) return false;
      const orderMonth = o.date.split("-")[1]; // "05", "06", etc.
      return orderMonth === selectedMonth;
    });
  }, [orders, selectedMonth]);

  // Calculate stats based on actual filtered orders
  const statsForSelectedPeriod = useMemo(() => {
    let revenue = 0;
    let soldCount = 0;
    let returnedCount = 0;
    let faultyCount = 0;

    ordersInSelectedMonth.forEach((o) => {
      if (o.status === "cancelled") {
        o.items.forEach(it => {
          returnedCount += it.quantity;
        });
      } else {
        revenue += o.totalAmount;
        o.items.forEach(it => {
          soldCount += it.quantity;
        });
        
        // Count returns and faults based on order items / mock indicators for comprehensive university report
        o.items.forEach(it => {
          if (it.productId === "prod-04" || it.productId === "prod-05" || o.status === "pending" && Math.random() > 0.8) {
            faultyCount += 1;
          }
        });
      }
    });

    return { revenue, soldCount, returnedCount, faultyCount };
  }, [ordersInSelectedMonth]);

  // Generate complete Jan-Jun timeline combining historical baseline with active May & June orders
  const fullTimelineData = useMemo(() => {
    let mayRevenue = 0;
    let maySold = 0;
    let mayReturned = 0;
    let mayFaulty = 0;

    let junRevenue = 0;
    let junSold = 0;
    let junReturned = 0;
    let junFaulty = 0;

    orders.forEach(o => {
      if (!o.date) return;
      const parts = o.date.split("-");
      const m = parts[1];
      const count = o.items.reduce((acc, it) => acc + it.quantity, 0);

      if (m === "05") {
        if (o.status === "cancelled") {
          mayReturned += count;
        } else {
          mayRevenue += o.totalAmount;
          maySold += count;
          mayFaulty += o.items.some(it => it.productId === "prod-04") ? 1 : 0;
        }
      } else if (m === "06") {
        if (o.status === "cancelled") {
          junReturned += count;
        } else {
          junRevenue += o.totalAmount;
          junSold += count;
          junFaulty += o.items.some(it => it.productId === "prod-04") ? 1 : 0;
        }
      }
    });

    return [
      { name: "Tháng 01", "Doanh thu": 124000000, "Bán ra": 12, "Đổi trả": 1, "Hàng lỗi": 0 },
      { name: "Tháng 02", "Doanh thu": 182000000, "Bán ra": 18, "Đổi trả": 2, "Hàng lỗi": 1 },
      { name: "Tháng 03", "Doanh thu": 245000000, "Bán ra": 24, "Đổi trả": 1, "Hàng lỗi": 0 },
      { name: "Tháng 04", "Doanh thu": 210000000, "Bán ra": 20, "Đổi trả": 3, "Hàng lỗi": 2 },
      { name: "Tháng 05", "Doanh thu": mayRevenue > 0 ? mayRevenue : 155000000, "Bán ra": maySold > 0 ? maySold : 15, "Đổi trả": mayReturned > 0 ? mayReturned : 1, "Hàng lỗi": mayFaulty > 0 ? mayFaulty : 1 },
      { name: "Tháng 06", "Doanh thu": junRevenue > 0 ? junRevenue : 82000000, "Bán ra": junSold > 0 ? junSold : 8, "Đổi trả": junReturned > 0 ? junReturned : 0, "Hàng lỗi": junFaulty > 0 ? junFaulty : 0 },
    ];
  }, [orders]);

  // New product form states
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState(15000000);
  const [newProdCategory, setNewProdCategory] = useState<Product["category"]>("phong-khach");
  const [newProdStyle, setNewProdStyle] = useState<Product["style"]>("Modern");
  const [newProdDescription, setNewProdDescription] = useState("");
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdMaterial, setNewProdMaterial] = useState("Gỗ Óc Chó sấy cao cấp");
  const [newProdDimensions, setNewProdDimensions] = useState("Dài 180cm x Rộng 80cm");

  // New coupon form states
  const [newCoupCode, setNewCoupCode] = useState("");
  const [newCoupValue, setNewCoupValue] = useState(15);
  const [newCoupMin, setNewCoupMin] = useState(10000000);
  const [newCoupType, setNewCoupType] = useState<"percent" | "fixed">("percent");

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  // Math metrics for summary
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const bestSellingProducts = useMemo(() => {
    const counts: { [key: string]: { name: string; qty: number; revenue: number; image: string } } = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!counts[item.productId]) {
          counts[item.productId] = {
            name: item.name,
            qty: 0,
            revenue: 0,
            image: prod?.images[0] || "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=100",
          };
        }
        counts[item.productId].qty += item.quantity;
        counts[item.productId].revenue += item.price * item.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.qty - a.qty);
  }, [orders, products]);

  const handleAddNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdDescription) {
      alert("Quý khách hãy hoàn thiện tên và mô tả sản phẩm tinh mộc.");
      return;
    }

    const brandName = "LuxeHome Custom";
    const categoryNameOption = 
      newProdCategory === "phong-khach" ? "Phòng Khách" :
      newProdCategory === "phong-ngu" ? "Phòng Ngủ" :
      newProdCategory === "phong-an" ? "Phòng Ăn" : "Văn Phòng";

    const newlyCreated: Product = {
      id: "prod-" + (products.length + 1) + Math.floor(10 + Math.random() * 89),
      name: newProdName,
      price: Number(newProdPrice),
      rating: 5,
      category: newProdCategory,
      categoryName: categoryNameOption,
      style: newProdStyle,
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800"
      ],
      description: newProdDescription,
      longDescription: "Sản phẩm chế tác cao cấp bổ sung trong kho LuxeHome Showroom độc quyền.",
      material: newProdMaterial,
      dimensions: newProdDimensions,
      colors: ["Nâu Gỗ Hạt Dẻ (Hazel)", "Kem Vani", "Đen Than"],
      features: ["Khung xương gỗ dẻ dẻ dai", "Sơn bóng Rubio nguyên sinh an toàn sức khỏe"],
      warranty: "3 năm bảo mật tại nhà",
      stock: Number(newProdStock),
      brand: brandName,
      reviews: [],
    };

    onAddProduct(newlyCreated);
    setNewProdName("");
    setNewProdDescription("");
    alert("Thêm sản phẩm mới vào danh mục kho LuxeHome thành công!");
  };

  const handleAddNewCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupCode) return;

    const newlyCreatedCoupon: Coupon = {
      code: newCoupCode.toUpperCase().trim(),
      discountType: newCoupType,
      value: Number(newCoupValue),
      minSubtotal: Number(newCoupMin),
      description: `Ưu đãi mới ${newCoupCode.toUpperCase()}: giảm ${newCoupType === "percent" ? `${newCoupValue}%` : formattedPrice(newCoupValue)} cho mọi đơn từ ${formattedPrice(newCoupMin)}`,
      isActive: true,
    };

    onAddCoupon(newlyCreatedCoupon);
    setNewCoupCode("");
    alert("Khởi tạo và phân hành mã coupon giảm giá thành công!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="admin-dashboard-container">
      
      {/* Admin Title Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#EADBC8] pb-6 mb-8 gap-4">
        <div>
          <span className="text-[10px] text-[#D4AF37] tracking-widest font-bold uppercase block mb-1">
            Bảng điều khiển hệ thống Thương mại điện tử
          </span>
          <h1 className="font-serif text-3xl font-black text-[#1A1A1A] flex items-center gap-2">
            Quản Trị Viên LuxeHome
          </h1>
          <p className="text-xs text-[#8B7E74]">Thích hợp cho Đồ án môn học TMĐT chất lượng cao.</p>
        </div>

        {/* Small badge of live environment */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-[#EADBC8] shadow-sm">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
          <p className="text-[11px] font-bold text-[#5C4033] uppercase">Môi trường vận hành: Đang hoạt động</p>
        </div>
      </div>

      {/* 1. Metric summary Cards dashboard (Thống kê) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Rev */}
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8] shadow-xs relative overflow-hidden">
          <div className="absolute right-4 top-4 text-[#D4AF37] bg-white p-2.5 rounded-xl border border-[#EADBC8]">
            <DollarSign className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase tracking-wider block">Tổng doanh thu đơn hàng</span>
          <h2 className="font-serif text-2xl font-black text-[#5C4033] mt-2">{formattedPrice(totalRevenue)}</h2>
          <p className="text-[9px] text-[#8B7E74] mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Tăng 12.8% so với tuần thiết kế trước
          </p>
        </div>

        {/* Orders qty */}
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8] shadow-xs relative overflow-hidden">
          <div className="absolute right-4 top-4 text-[#5C4033] bg-white p-2.5 rounded-xl border border-[#EADBC8]">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase tracking-wider block">Tổng số lượng đơn đặt</span>
          <h2 className="font-serif text-2xl font-black text-[#1A1A1A] mt-2">{orders.length} đơn hàng</h2>
          <p className="text-[9px] text-emerald-700 mt-1.5 font-medium">✓ Tất cả dữ liệu lưu cục bộ thời gian thực</p>
        </div>

        {/* Consult Schedules */}
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8] shadow-xs relative overflow-hidden">
          <div className="absolute right-4 top-4 text-[#D4AF37] bg-white p-2.5 rounded-xl border border-[#EADBC8]">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase tracking-wider block">Yêu cầu khảo sát mặt bằng</span>
          <h2 className="font-serif text-2xl font-black text-[#1A1A1A] mt-2">{schedules.length} cuộc hẹn</h2>
          <p className="text-[9px] text-[#5C4033] mt-1.5 font-semibold">Tự động matching đồ đạc qua AI</p>
        </div>

        {/* Active promotion coupon count */}
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8] shadow-xs relative overflow-hidden">
          <div className="absolute right-4 top-4 text-emerald-700 bg-white p-2.5 rounded-xl border border-[#EADBC8]">
            <Tag className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase tracking-wider block">Phiếu giảm giá vận hành</span>
          <h2 className="font-serif text-2xl font-black text-[#1A1A1A] mt-2">{coupons.length} coupon phẩm</h2>
          <p className="text-[9px] text-[#8B7E74] mt-1.5">Giảm tối đa 20% đại hội nội thất</p>
        </div>

      </section>

      {/* 2. Subtab Menu Controller */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-[#EADBC8] pb-4" id="admin-subtab-bar">
        {[
          { id: "dashboard", label: "Phân Tích Doanh Số & Bán Chạy", icon: BarChart3 },
          { id: "orders", label: "Quản Lý Đơn Hàng" + ` (${orders.length})`, icon: ShoppingCart },
          { id: "products", label: "Kho & Sửa Sản Phẩm", icon: Package },
          { id: "schedules", label: "Lịch Tư Vấn Mặt Bằng", icon: Calendar },
          { id: "coupons", label: "Mã Ưu Đãi VIP", icon: Tag },
        ].map((sub) => {
          const Icon = sub.icon;
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase border transition-all ${
                isActive
                  ? "bg-[#5C4033] text-white border-[#5C4033] shadow"
                  : "bg-white text-[#5C4033] border-[#EADBC8] hover:bg-[#FAF6F0]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* 3. Subtab Contents rendering */}
      <div className="bg-white rounded-2xl border border-[#EADBC8] p-6 md:p-8" id="admin-subtab-contents-panel">
        
        {/* A. Subtab: Analytics / Dashboard */}
        {activeSubTab === "dashboard" && (
          <div className="space-y-8" id="admin-dashboard-subview">
            
            {/* Monthly Report Selector header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#FAF6F0] rounded-2xl border border-[#EADBC8] mb-6">
              <div>
                <h4 className="font-serif text-sm font-bold text-[#5C4033] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#D4AF37]" /> Báo Cáo Doanh Số & Sắp Xếp Theo Tháng
                </h4>
                <p className="text-[11px] text-[#8B7E74] mt-0.5">Hệ thống phân tích dòng tiền và phân loại mộc nghệ thuật sấy bán ra, trả lại và báo lỗi kỹ thuật.</p>
              </div>
              <div className="flex items-center gap-2 self-start md:self-center">
                <span className="text-xs font-bold text-[#5C4033] whitespace-nowrap">Lọc kỳ kế toán:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs font-semibold bg-white border border-[#EADBC8] p-2 rounded-xl text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
                >
                  <option value="All">Tất cả các tháng (2026)</option>
                  <option value="05">Tháng 05/2026 (Live)</option>
                  <option value="06">Tháng 06/2026 (Live)</option>
                </select>
              </div>
            </div>

            {/* Micro KPI Widgets based on Month Selector filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#5C4033]/5 p-4.5 rounded-xl border border-[#5C4033]/15">
                <span className="text-[10px] text-[#8B7E74] font-bold block uppercase tracking-wider">Doanh thu thời kỳ</span>
                <h3 className="font-serif text-xl font-black text-[#5C4033] mt-1">{formattedPrice(statsForSelectedPeriod.revenue)}</h3>
                <span className="text-[9px] text-[#8B7E74] mt-1 block">Tỷ lệ thanh toán thành công 100%</span>
              </div>
              <div className="bg-amber-500/5 p-4.5 rounded-xl border border-amber-500/15">
                <span className="text-[10px] text-[#8B7E74] font-bold block uppercase tracking-wider">Mặt hàng bán ra</span>
                <h3 className="font-serif text-xl font-black text-[#D4AF37] mt-1">{statsForSelectedPeriod.soldCount} chiếc</h3>
                <span className="text-[9px] text-[#8B7E74] mt-1 block">Rút từ kho sấy mộc nguyên chất</span>
              </div>
              <div className="bg-red-500/5 p-4.5 rounded-xl border border-red-500/15">
                <span className="text-[10px] text-[#8B7E74] font-bold block uppercase tracking-wider">Sản phẩm đổi trả</span>
                <h3 className="font-serif text-xl font-black text-red-600 mt-1">{statsForSelectedPeriod.returnedCount} đơn</h3>
                <span className="text-[9px] text-red-500 mt-1 block">Gia chủ huỷ/giao hoàn xưởng</span>
              </div>
              <div className="bg-orange-500/5 p-4.5 rounded-xl border border-orange-500/15">
                <span className="text-[10px] text-[#8B7E74] font-bold block uppercase tracking-wider">Mặt hàng báo lỗi</span>
                <h3 className="font-serif text-xl font-black text-orange-600 mt-1">{statsForSelectedPeriod.faultyCount} tác phẩm</h3>
                <span className="text-[9px] text-orange-500 mt-1 block">Nứt mộc, dãn rách nỉ da dầy</span>
              </div>
            </div>

            {/* Recharts Graphical Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Graphic 1: Revenue over time bar */}
              <div className="bg-white p-5 rounded-2xl border border-[#EADBC8] shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-xs font-extrabold text-[#5C4033] uppercase tracking-wide">Biểu đồ tăng trưởng Doanh thu (VND)</h4>
                  <p className="text-[10px] text-[#8B7E74] mt-0.5">Biểu diễn chu trình doanh thu bám đuôi các tháng năm 2026.</p>
                </div>
                <div className="h-64 mt-4 text-xs font-medium">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fullTimelineData} margin={{ top: 10, right: 10, left: -5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd5" strokeOpacity={0.6} />
                      <XAxis dataKey="name" stroke="#8B7E74" fontSize={9} />
                      <YAxis stroke="#8B7E74" fontSize={9} width={60} tickFormatter={(val) => `${val / 1000000}tr`} />
                      <Tooltip formatter={(value) => formattedPrice(Number(value))} contentStyle={{ fontSize: "11px", borderRadius: "10px", border: "1px solid #EADBC8", backgroundColor: "#FAF6F0" }} />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Bar dataKey="Doanh thu" fill="#D4AF37" name="Doanh thu (đơn hoàn tất)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Graphic 2: Lifecycle statuses (Sold, Returned, Faulty) */}
              <div className="bg-white p-5 rounded-2xl border border-[#EADBC8] shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-xs font-extrabold text-[#5C4033] uppercase tracking-wide">Thế trạng đồ mộc (Bán ra • Trả lại • Báo lỗi)</h4>
                  <p className="text-[10px] text-[#8B7E74] mt-0.5">Tỷ lệ lỗi nứt mộc sấy cùng sự cố vận chuyển phân tầng thông minh.</p>
                </div>
                <div className="h-64 mt-4 text-xs font-medium">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fullTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8dfd5" strokeOpacity={0.6} />
                      <XAxis dataKey="name" stroke="#8B7E74" fontSize={9} />
                      <YAxis stroke="#8B7E74" fontSize={9} width={25} />
                      <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px", border: "1px solid #EADBC8", backgroundColor: "#FAF6F0" }} />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Bar dataKey="Bán ra" fill="#5C4033" name="Bán ra (cái)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Đổi trả" fill="#EF4444" name="Hoàn trả (đơn)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Hàng lỗi" fill="#F59E0B" name="Kiểm lỗi (vật)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              {/* Product bestseller table */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-1.5 border-b border-[#EADBC8] pb-1.5">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" /> Sản Phẩm Đi Đầu Doanh Thu
                </h3>
                
                <div className="overflow-x-auto border border-[#EADBC8] rounded-xl bg-[#FAF6F0]/20">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF6F0] text-[#5C4033] font-bold text-[10px] uppercase border-b border-[#EADBC8]">
                      <tr>
                        <th className="p-3">Sản phẩm</th>
                        <th className="p-3 text-center">Bán ra</th>
                        <th className="p-3 text-right">Doanh thu gộp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADBC8]/50">
                      {bestSellingProducts.map((p, i) => (
                        <tr key={i} className="hover:bg-[#FAF6F0]/40">
                          <td className="p-3 flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                            <span className="font-bold text-[#1A1A1A] max-w-[150px] truncate">{p.name}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-[#5C4033]">{p.qty} cái</td>
                          <td className="p-3 text-right font-black text-emerald-800">{formattedPrice(p.revenue)}</td>
                        </tr>
                      ))}
                      {bestSellingProducts.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-[#8B7E74] italic">Chưa phát sinh lượt mua đơn hàng mới nào. Hãy đóng vai khách mua hàng trải nghiệm!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interior Blogs Quick overview info */}
              <div className="space-y-4 bg-[#FAF6F0]/40 p-6 rounded-xl border border-[#EADBC8]/70">
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Danh tuyển bài thiết kế cảm hứng</h3>
                <p className="text-xs text-[#8B7E74]">Học phần Thương mại điện tử: Quản lý bài blog tạo đà tối ưu SEO nội thất từ khóa.</p>
                
                <div className="space-y-4 pt-4 border-t border-[#EADBC8]">
                  {blogs.map((b) => (
                    <div key={b.id} className="flex gap-4">
                      <img src={b.image} alt={b.title} className="w-14 h-14 object-cover rounded shadow border border-[#EADBC8]" />
                      <div className="text-xs">
                        <h5 className="font-bold text-[#1A1A1A] leading-snug line-clamp-1">{b.title}</h5>
                        <p className="text-[10px] text-[#8B7E74] mt-0.5">Viết bởi: {b.author} • {b.date}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-50 text-amber-700 font-bold rounded text-[9px] border border-amber-200">
                          {b.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* B. Subtab: Orders Management */}
        {activeSubTab === "orders" && (
          <div className="space-y-6" id="admin-orders-subview">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Theo dõi và đổi trạng thái đơn hàng của khách</h3>
            <p className="text-xs text-[#8B7E74]">Với tư cách quản trị viên, Anh/Chị có thể thay đổi trạng thái đơn hàng từ <b>Chuẩn bị hàng</b> thành <b>Đang giao hàng</b> hoặc <b>Hoàn tất giao</b>, hệ thống sẽ tự động cập nhật sơ đồ lịch trình cho khách.</p>

            <div className="overflow-x-auto border border-[#EADBC8] rounded-xl bg-white shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF6F0] text-[#5C4033] font-bold text-[10px] uppercase border-b border-[#EADBC8]">
                  <tr>
                    <th className="p-3">Mã đơn</th>
                    <th className="p-3">Khách hàng</th>
                    <th className="p-3">Người nhận & SĐT</th>
                    <th className="p-3">Tổng số tiền</th>
                    <th className="p-3">Thanh toán</th>
                    <th className="p-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADBC8]/40">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#FAF6F0]/20">
                      <td className="p-3 font-bold text-[#5C4033]">{o.id}</td>
                      <td className="p-3 text-[#1A1A1A]">{o.customerName}</td>
                      <td className="p-3 text-[11px] text-[#8B7E74] leading-tight">
                        <p className="font-semibold text-[#1A1A1A]">{o.customerName}</p>
                        <p>{o.customerPhone}</p>
                        <p className="max-w-[150px] truncate">{o.shippingAddress.addressDetail}, {o.shippingAddress.city}</p>
                      </td>
                      <td className="p-3 font-black text-[#5C4033]">{formattedPrice(o.totalAmount)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.paymentStatus === "Đã thanh toán" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
                        }`}>
                          {o.paymentStatus}
                        </span>
                        <p className="text-[9px] text-[#8B7E74] mt-0.5">Phương thức: {o.paymentMethod}</p>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <select
                          value={o.status}
                          onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as any)}
                          className="p-1 px-2 text-xs bg-white border border-[#EADBC8] rounded focus:outline-none font-semibold text-[#1A1A1A]"
                        >
                          <option value="pending">Chờ xác nhận</option>
                          <option value="confirmed">Đã Chuẩn Bị Hàng</option>
                          <option value="shipping">Xe Đang Giao</option>
                          <option value="delivered">Đã Giao Showroom</option>
                          <option value="completed">Đơn Hoàn Tất</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* C. Subtab: Products Inventory Edit */}
        {activeSubTab === "products" && (
          <div className="space-y-8" id="admin-products-subview">
            
            {/* New Product Form */}
            <div className="bg-[#FAF6F0]/60 p-6 rounded-xl border border-[#EADBC8] shadow-sm">
              <h3 className="font-serif text-base font-black text-[#1A1A1A] flex items-center gap-1.5 mb-4">
                <Plus className="w-5 h-5 text-[#D4AF37]" /> Thêm Tác Phẩm Mộc Mới Nhập Kho
              </h3>

              <form onSubmit={handleAddNewProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Tên tác phẩm / Sofa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Ghế tựa hoàng gia hoa bách hợp"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Giá trị niêm yết (VND) *</label>
                  <input
                    type="number"
                    required
                    step="500000"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Ban Phòng Phân Loại</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg focus:outline-none"
                  >
                    <option value="phong-khach">Phòng Khách</option>
                    <option value="phong-ngu">Phòng Ngủ</option>
                    <option value="phong-an">Phòng Ăn & Bếp</option>
                    <option value="van-phong">Phòng Làm Việc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Trường phái Mỹ nghệ</label>
                  <select
                    value={newProdStyle}
                    onChange={(e) => setNewProdStyle(e.target.value as any)}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg focus:outline-none"
                  >
                    <option value="Luxury">Luxury (Sang Trọng)</option>
                    <option value="Modern">Modern (Hiện Đại)</option>
                    <option value="Minimalist">Minimalist (Tối Giản)</option>
                    <option value="Scandinavian">Scandinavian (Bắc Âu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Thớ Gỗ & Da Sợi *</label>
                  <input
                    type="text"
                    required
                    value={newProdMaterial}
                    onChange={(e) => setNewProdMaterial(e.target.value)}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Kích Thước Ước Tính *</label>
                  <input
                    type="text"
                    required
                    value={newProdDimensions}
                    onChange={(e) => setNewProdDimensions(e.target.value)}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Số lượng dự trữ trong kho</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Mô tả tóm tắt sản phẩm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Chất nét thủ công mỹ thuật cao sang quý phái..."
                    value={newProdDescription}
                    onChange={(e) => setNewProdDescription(e.target.value)}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                <div className="md:col-span-3 pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#5C4033] hover:bg-[#4A3B32] text-white rounded-lg font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Kích Hoạt Sản phẩm
                  </button>
                </div>
              </form>
            </div>

            {/* List to change Inventory stock */}
            <div className="space-y-4">
              <h4 className="font-serif text-base font-bold text-[#1A1A1A]">Cập nhật nhanh Tồn Kho</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="flex gap-4 p-4 rounded-xl border border-[#EADBC8] bg-white shadow-sm items-center justify-between">
                    <div className="flex gap-3 items-center min-w-0 flex-1">
                      <img src={p.images[0]} alt={p.name} className="w-12 h-12 rounded object-cover" />
                      <div className="min-w-0">
                        <p className="font-bold text-[#1A1A1A] text-xs truncate max-w-[200px]">{p.name}</p>
                        <p className="text-[10px] text-[#D4AF37]">{formattedPrice(p.price)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-[#8B7E74] font-bold">KHO:</label>
                      <input
                        type="number"
                        value={p.stock}
                        onChange={(e) => onUpdateProductStock(p.id, Number(e.target.value))}
                        className="w-16 bg-[#FAF6F0] p-1 border border-[#EADBC8] rounded text-xs text-center font-bold text-[#1A1A1A]"
                      />
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-200 transition-all"
                        title="Xóa ra khỏi Showcase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* D. Subtab: Schedules of Design Consultations */}
        {activeSubTab === "schedules" && (
          <div className="space-y-6" id="admin-schedules-subview">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Danh sách lịch hẹn Tư vấn thiết kế của gia chủ</h3>
            <p className="text-xs text-[#8B7E74]">Showroom tự động ghép kết cấu móng & mức đầu tư đề cử phòng khách. Anh/Chị hãy đổi trạng thái sau khi đã gọi điện kết nối thành công.</p>

            <div className="overflow-x-auto border border-[#EADBC8] rounded-xl bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF6F0] text-[#5C4033] font-bold text-[10px] uppercase border-b border-[#EADBC8]">
                  <tr>
                    <th className="p-3">Gia chủ</th>
                    <th className="p-3">Liên hệ</th>
                    <th className="p-3">Khảo sát yêu cầu</th>
                    <th className="p-3">Hẹn ngày / giờ</th>
                    <th className="p-3">Ngân sách</th>
                    <th className="p-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADBC8]/40">
                  {schedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-[#FAF6F0]/20">
                      <td className="p-3 font-bold text-[#1A1A1A]">{sch.customerName}</td>
                      <td className="p-3">
                        <p>{sch.phone}</p>
                        <p className="text-[#8B7E74] text-[10px]">{sch.email}</p>
                      </td>
                      <td className="p-3 text-[11px] leading-relaxed max-w-[200px]">
                        <p><b>Phòng:</b> {sch.roomType} • {sch.roomArea}m²</p>
                        <p><b>Style:</b> {sch.style}</p>
                        {sch.notes && <p className="text-[#8B7E74] italic">"{sch.notes}"</p>}
                      </td>
                      <td className="p-3 font-medium text-[#5C4033]">{sch.prefDate} • {sch.prefTime}</td>
                      <td className="p-3 font-black text-emerald-800">{formattedPrice(sch.budget)}</td>
                      <td className="p-3">
                        <select
                          value={sch.status}
                          onChange={(e) => onUpdateScheduleStatus(sch.id, e.target.value as any)}
                          className="p-1 text-xs bg-white border border-[#EADBC8] rounded focus:outline-none"
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="contacted">Đã Liên Hệ Gọi</option>
                          <option value="scheduled">Đã Gặp Thảo Luận</option>
                          <option value="completed">Đã Chốt Mặt Bằng</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {schedules.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#8B7E74] italic">Chưa phát sinh lượt lịch tư vấn dự án nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* E. Subtab: Promo Coupons */}
        {activeSubTab === "coupons" && (
          <div className="space-y-8" id="admin-coupons-subview">
            
            {/* New Coupon form */}
            <div className="bg-[#FAF6F0]/60 p-6 rounded-xl border border-[#EADBC8]">
              <h3 className="font-serif text-base font-bold text-[#1A1A1A] mb-4">Lập mã Coupon Khuyến mãi mới</h3>
              <form onSubmit={handleAddNewCouponSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Mã Code (Chữ in) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: SUMMERSALE"
                    value={newCoupCode}
                    onChange={(e) => setNewCoupCode(e.target.value)}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Loại giảm giá</label>
                  <select
                    value={newCoupType}
                    onChange={(e) => setNewCoupType(e.target.value as any)}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg focus:outline-none"
                  >
                    <option value="percent">Tỉ lệ phần trăm %</option>
                    <option value="fixed">Tiền mặt giảm cố định (VND)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Giá trị giảm *</label>
                  <input
                    type="number"
                    required
                    value={newCoupValue}
                    onChange={(e) => setNewCoupValue(Number(e.target.value))}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Đơn tối thiểu để áp dụng *</label>
                  <input
                    type="number"
                    required
                    value={newCoupMin}
                    onChange={(e) => setNewCoupMin(Number(e.target.value))}
                    className="w-full bg-white p-2 border border-[#EADBC8] rounded-lg focus:outline-none"
                  />
                </div>

                <div className="md:col-span-4 pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#5C4033] text-white rounded-lg font-bold uppercase transition-colors"
                  >
                    Phát hành Coupon mới
                  </button>
                </div>
              </form>
            </div>

            {/* List current coupons */}
            <div className="space-y-4">
              <h4 className="font-serif text-base font-bold text-[#1A1A1A]">Mã kích hoạt trên hệ thống:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((c) => (
                  <div key={c.code} className="p-4 rounded-xl border border-[#EADBC8] bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-[#5C4033] bg-[#FAF6F0] px-2.5 py-1 rounded text-xs border border-[#EADBC8]">
                        {c.code}
                      </span>
                      <p className="text-[11px] text-[#8B7E74] mt-2 italic leading-snug">{c.description}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded uppercase">
                      Đang kích hoạt
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
