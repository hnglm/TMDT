/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import CatalogView from "./components/CatalogView";
import ComboView from "./components/ComboView";
import DesignConsultation from "./components/DesignConsultation";
import UserProfile from "./components/UserProfile";
import AdminPanel from "./components/AdminPanel";
import ProductDetailModal from "./components/ProductDetailModal";
import CartSidebar from "./components/CartSidebar";
import AuthModal from "./components/AuthModal";
import ChatbotWidget from "./components/ChatbotWidget";

// Types
import { Product, Combo, CartItem, Order, ConsultationSchedule, Coupon } from "./types";

// Data
import {
  MOCK_PRODUCTS,
  MOCK_COMBOS,
  MOCK_BLOGS,
  MOCK_COUPONS,
  INITIAL_ORDERS,
  INITIAL_SCHEDULES,
} from "./mockData";

export default function App() {
  // Navigation States
  const [activeTab, setActiveTab] = useState<string>("home");
  const [catalogFilters, setCatalogFilters] = useState<{ category?: string; style?: string }>({});

  // Core App State (With reactive local data syncs)
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [combos, setCombos] = useState<Combo[]>(MOCK_COMBOS);
  const [blogs, setBlogs] = useState(MOCK_BLOGS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [schedules, setSchedules] = useState<ConsultationSchedule[]>(INITIAL_SCHEDULES);
  const [coupons, setCoupons] = useState<Coupon[]>(MOCK_COUPONS);
  
  // Shopping Cart & Wishlist States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>(["prod-01", "prod-03"]); // Initial pre-liked items for demo aesthetic

  // Authenticated User Session
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>({
    name: "Nguyễn Lâm Thao",
    email: "lamlam548818@gmail.com",
  });

  // Modal display toggles
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [placedOrderForEmail, setPlacedOrderForEmail] = useState<Order | null>(null);

  // Compare helper to pass info backwards & forwards
  const [comparedProductIds, setComparedProductIds] = useState<string[]>([]);

  // 1. Navigation handlers
  const handleNavigateToCatalogWithFilters = (filters: { category?: string; style?: string }) => {
    setCatalogFilters(filters);
    setActiveTab("catalog");
  };

  // 2. Authentication handlers
  const handleLogin = (user: { name: string; email: string }) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCart([]); // Clear cart on logout
  };

  // 3. Cart handlers
  const handleAddToCart = (product: Product, quantity: number, color: string, assemble: boolean) => {
    setCart((prevCart) => {
      // Check if product with EXACT same attributes already exists
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedColor === color
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        updated[existingIndex].assembleService = updated[existingIndex].assembleService || assemble;
        return updated;
      }

      return [
        ...prevCart,
        {
          product,
          quantity,
          selectedColor: color,
          selectedMaterial: product.material.split(",")[0],
          assembleService: assemble,
        },
      ];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Add all products of a combo to shopping cart with savings
  const handleAddComboToCart = (combo: Combo, comboProducts: Product[]) => {
    comboProducts.forEach((p) => {
      // Add each item with selected defaults, assemble deactivated by default
      handleAddToCart(p, 1, p.colors[0], false);
    });

    setIsCartOpen(true);
    alert(`Đã thêm trọn bộ ${combo.name} vào giỏ hàng thành công!`);
  };

  // 4. Wishlist handlers
  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // 5. Checkout / Process order
  const handleCheckoutSubmit = (newCreatedOrder: Order) => {
    setOrders((prev) => [newCreatedOrder, ...prev]);
    setCart([]); // Reset Cart
    setIsCartOpen(false);
    setActiveTab("profile"); // Navigate to User profile order logs instantly!
    setPlacedOrderForEmail(newCreatedOrder); // Set state to pop up the email confirmation contract!
  };

  // 6. Admin Panel interaction functions
  const handleUpdateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          // Construct updated tracking steps
          const steps = [...ord.trackingSteps];
          let stepTitle = "Thay đổi trạng thái";
          let stepDesc = "Cập nhật tiến trình bởi LuxeHome Admin.";

          if (status === "confirmed") {
            stepTitle = "Mộc sấy đóng bọc hoàn chỉnh";
            stepDesc = "Đơn hàng đã qua kiểm duyệt xốp dầy PVD mạ vàng.";
          } else if (status === "shipping") {
            stepTitle = "Xe chuyên dùng đang lăn bánh";
            stepDesc = "LuxeHome điều phối tài xế chuyên nghiệp thợ mộc giao hàng.";
          } else if (status === "completed") {
            stepTitle = "Hoàn tất bàn giao & Lắp ráp";
            stepDesc = "Gia chủ hài lòng nghiệm thu gỗ mộc đẹp 100%.";
          }

          steps.push({
            status,
            title: stepTitle,
            description: stepDesc,
            time: new Date().toLocaleTimeString("vi-VN").substring(0, 5) + " Hôm nay",
          });

          return {
            ...ord,
            status,
            trackingSteps: steps,
            paymentStatus: status === "completed" ? "Đã thanh toán" as const : ord.paymentStatus,
          };
        }
        return ord;
      })
    );
  };

  const handleUpdateProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  const handleAddProductToInventory = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleUpdateScheduleStatus = (scheduleId: string, status: ConsultationSchedule["status"]) => {
    setSchedules((prev) =>
      prev.map((sch) => (sch.id === scheduleId ? { ...sch, status } : sch))
    );
  };

  const handleAddNewCoupon = (newCoupon: Coupon) => {
    setCoupons((prev) => [newCoupon, ...prev]);
  };

  const handleAddConsultationSchedule = (newSch: ConsultationSchedule) => {
    setSchedules((prev) => [newSch, ...prev]);
  };

  // Adding user reviews post purchase
  const handleAddReviewToProduct = (productId: string, rating: number, comment: string, author: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newReviewList = [
            {
              id: "rev-new-" + Math.random(),
              author,
              rating,
              comment,
              date: new Date().toISOString().substring(0, 10),
            },
            ...p.reviews,
          ];
          
          // Re-calculate average rating for product
          const sum = newReviewList.reduce((acc, r) => acc + r.rating, 0);
          const avg = Number((sum / newReviewList.length).toFixed(1));

          return {
            ...p,
            reviews: newReviewList,
            rating: avg,
          };
        }
        return p;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between text-[#1A1A1A] font-sans">
      
      {/* Navbar segment */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          // Clear sub filters on direct catalog navigation
          if (tab === "catalog") setCatalogFilters({});
          setActiveTab(tab);
        }}
        cart={cart}
        wishlist={wishlist}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Router Workspace */}
      <main className="flex-1 pb-16">
        {activeTab === "home" && (
          <HomeView
            products={products}
            combos={combos}
            blogs={blogs}
            onSelectProduct={(p) => setSelectedProductForDetail(p)}
            onSelectCombo={(c) => {
              // Find and add combo products
              const matchedItems = c.productIds
                .map((id) => products.find((p) => p.id === id))
                .filter((p): p is Product => !!p);
              handleAddComboToCart(c, matchedItems);
            }}
            onNavigateToCatalog={handleNavigateToCatalogWithFilters}
            onNavigateToDesign={() => setActiveTab("design")}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
          />
        )}

        {activeTab === "catalog" && (
          <CatalogView
            products={products}
            onSelectProduct={(p) => setSelectedProductForDetail(p)}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
            initialCategory={catalogFilters.category}
            initialStyle={catalogFilters.style}
          />
        )}

        {activeTab === "combos" && (
          <ComboView
            combos={combos}
            products={products}
            onAddComboToCart={handleAddComboToCart}
            onSelectProduct={(p) => setSelectedProductForDetail(p)}
          />
        )}

        {activeTab === "design" && (
          <DesignConsultation
            products={products}
            combos={combos}
            onAddSchedule={handleAddConsultationSchedule}
            onSelectProduct={(p) => setSelectedProductForDetail(p)}
          />
        )}

        {activeTab === "profile" && (
          <UserProfile
            currentUser={currentUser}
            onUpdatePersonalInfo={(name, email) => {
              if (currentUser) {
                setCurrentUser({ name, email });
              }
            }}
            orders={orders}
            wishlist={wishlist}
            products={products}
            onSelectProduct={(p) => setSelectedProductForDetail(p)}
            onRemoveFromWishlist={handleToggleWishlist}
            onAddReviewToProduct={handleAddReviewToProduct}
          />
        )}

        {activeTab === "profile-wishlist" && (
          <UserProfile
            currentUser={currentUser}
            onUpdatePersonalInfo={(name, email) => {
              if (currentUser) {
                setCurrentUser({ name, email });
              }
            }}
            orders={orders}
            wishlist={wishlist}
            products={products}
            onSelectProduct={(p) => {
              setSelectedProductForDetail(p);
            }}
            onRemoveFromWishlist={handleToggleWishlist}
            onAddReviewToProduct={handleAddReviewToProduct}
          />
        )}

        {activeTab === "admin" && (
          currentUser && (currentUser as any).role === "admin" ? (
            <AdminPanel
              products={products}
              orders={orders}
              schedules={schedules}
              coupons={coupons}
              blogs={blogs}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdateProductStock={handleUpdateProductStock}
              onAddProduct={handleAddProductToInventory}
              onDeleteProduct={handleDeleteProduct}
              onUpdateScheduleStatus={handleUpdateScheduleStatus}
              onAddCoupon={handleAddNewCoupon}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border-2 border-red-200">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">Truy Cập Bị Giới Hạn</h2>
              <p className="text-xs text-[#8B7E74] max-w-md mx-auto">
                Khu vực Quản trị sấy sấy gỗ mộc cao cấp chỉ dành riêng cho Ban quản lý LuxeHome. Quý khách vui lòng đăng nhập bằng tài khoản Quản trị viên để vận hành.
              </p>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="bg-[#5C4033] hover:bg-[#4A3B32] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-colors"
              >
                Đăng Nhập Admin (Cấp quyền)
              </button>
            </div>
          )
        )}
      </main>

      {/* FOOTER: Elegant, Luxurious, Minimalist */}
      <footer className="bg-[#1A1A1A] text-[#FAF6F0] border-t border-[#EADBC8]/25 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <span className="font-serif text-xl font-bold tracking-tight text-white block">
              Luxe<span className="text-[#D4AF37] font-sans font-light">Home</span>
            </span>
            <p className="text-[11px] text-[#8B7E74] leading-relaxed max-w-xs">
              Thương hiệu đồ mộc cao cấp, chuyên phục vụ giới đại gia Việt và cung ứng nội thất cho penthouse Vinhomes/Sài Gòn/Hà Nội sang quý.
            </p>
            <p className="text-[10px] text-[#8B7E74]">Showrooms: 120 Đồng Khởi, Quận 1, TPHCM.</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Thời Gian Showroom Gia Đình</h4>
            <ul className="text-[11px] text-[#8B7E74] space-y-1">
              <li>Thứ 2 - Thứ 6: 08:00 - 21:00</li>
              <li>Thứ 7 - Chủ Nhật: 09:00 - 22:00</li>
              <li>Xưởng gỗ: Hoạt động 24/7</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Chính Sách & Uy Tín</h4>
            <ul className="text-[11px] text-[#8B7E74] space-y-1">
              <li>✓ Bảo hành khung mộc 10 năm</li>
              <li>✓ Miễn phí vệ sinh da bò lanh Ý 1 năm</li>
              <li>✓ Đổi trả cam kết 30 ngày không tì vết</li>
              <li>✓ Lắp đặt thợ mộc gọt đẽo tận nhà</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Đồ Án Môn Học</h4>
            <p className="text-[11px] text-[#8B7E74] leading-relaxed">
              Website hoàn thành xuất sắc các chỉ tiêu Thương mại điện tử: giỏ hàng, đặt hàng thanh toán, lọc tác phẩm, quản lý kho admin, chatbot tư vấn AI thông minh.
            </p>
            <span className="text-[10px] text-[#D4AF37] font-semibold block">® LuxeHome TMĐT All rights reserved.</span>
          </div>

        </div>
      </footer>

      {/* 4. Overlay Widgets and Modals */}
      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
          onAddToCart={handleAddToCart}
          onToggleCompare={(prod) => {
            if (comparedProductIds.includes(prod.id)) {
              setComparedProductIds(comparedProductIds.filter((id) => id !== prod.id));
              alert(`Đã xóa ${prod.name} khỏi danh sách so sánh.`);
            } else {
              if (comparedProductIds.length >= 3) {
                alert("Quý khách chỉ so sánh tối đa 3 sản phẩm.");
                return;
              }
              setComparedProductIds([...comparedProductIds, prod.id]);
              alert(`Đã thêm ${prod.name} vào khay so sánh.`);
            }
          }}
          isCompared={comparedProductIds.includes(selectedProductForDetail.id)}
          onToggleWishlist={handleToggleWishlist}
          isWishlisted={wishlist.includes(selectedProductForDetail.id)}
        />
      )}

      {isCartOpen && (
        <CartSidebar
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onCheckout={handleCheckoutSubmit}
          currentUser={currentUser}
          onOpenAuth={() => {
            setIsCartOpen(false);
            setIsAuthOpen(true);
          }}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onLogin={handleLogin}
        />
      )}

      {/* Floating Chatbot bubble widget (Tư vấn chatbot AI) */}
      <ChatbotWidget
        products={products}
        onSelectProduct={(p) => {
          setSelectedProductForDetail(p);
        }}
      />

      {/* Simulated Royal Email Confirmation Modal */}
      {placedOrderForEmail && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-55 flex items-center justify-center p-4 overflow-y-auto" id="email-confirmation-modal">
          <div className="relative bg-[#FAF6F0] w-full max-w-2xl rounded-2xl border-2 border-[#D4AF37] shadow-2xl overflow-hidden flex flex-col transform transition-all cursor-default" onClick={(e) => e.stopPropagation()}>
            
            {/* Header stylized like a premium desktop email app client */}
            <div className="bg-[#1A1A1A] text-white px-5 py-4 border-b border-[#D4AF37]/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                <span className="text-[11px] font-mono text-gray-400 tracking-wider ml-2 bg-gray-800/80 px-2.5 py-1 rounded">
                  ✉️ THƯ ĐIỆN TỬ VIP DISPATCHED - SUCCESS
                </span>
              </div>
              <button 
                onClick={() => setPlacedOrderForEmail(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Email Sender Metadata Info Frame */}
            <div className="px-6 py-3.5 bg-[#FAF6F0] border-b border-[#EADBC8] text-[11px] text-[#5C4033] space-y-1">
              <div>
                <span className="font-semibold text-gray-500 inline-block w-16">Từ:</span>
                <span className="font-bold text-[#1A1A1A]">LuxeHome Royal Club</span> &lt;vip-membership@luxehome.vn&gt;
              </div>
              <div>
                <span className="font-semibold text-gray-500 inline-block w-16">Tới:</span>
                <span className="font-bold text-emerald-700 underline text-left">lamlam548818@gmail.com</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 inline-block w-16">Vấn đề:</span>
                <span className="font-bold text-[#D4AF37] uppercase text-left">[XÁC NHẬN] CHỮ KÝ SỐ KHỞI KHỞI ĐƠN HỢP ĐỒNG GIAO TỔ CHẾ TÁC {placedOrderForEmail.id}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Đã bảo mật và chuyển tiếp tự động tới hộp thư quý khách thành công!
              </div>
            </div>

            {/* Email Frame Canvas */}
            <div className="p-6 md:p-8 bg-white overflow-y-auto max-h-[50vh] text-left">
              <div className="border border-double border-[#D4AF37]/50 rounded-xl p-6 bg-[#FAF6F0]/20 space-y-6 relative overflow-hidden">
                
                {/* Background watermarked crest */}
                <div className="absolute right-4 bottom-4 opacity-[0.03] pointer-events-none select-none">
                  <span className="font-serif font-black text-9xl">L</span>
                </div>

                {/* Luxury Letter Content */}
                <div className="text-center pb-4 border-b border-[#EADBC8]/70">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1A1A1A] to-[#D4AF37] text-[#FAF6F0] font-serif font-black flex items-center justify-center text-2xl mx-auto shadow mb-2">
                    L
                  </div>
                  <h3 className="font-serif text-lg font-black text-[#1A1A1A] tracking-wider uppercase">
                    Hợp Đồng Chế Tác Nội Thất Mỹ Nghệ
                  </h3>
                  <p className="text-[10px] text-[#8B7E74] tracking-widest font-mono">LUXEHOME DIGITAL VERIFIED - NO. {placedOrderForEmail.id}</p>
                </div>

                <div className="space-y-3.5 text-xs text-gray-800 leading-relaxed font-sans">
                  <p>Kính gửi quý khách <strong className="text-[#1A1A1A] text-sm underline">{currentUser?.name || "Nguyễn Lâm Thao"}</strong>,</p>
                  
                  <p>LuxeHome xin trân trọng thông báo: Chữ ký số thượng lưu của quý khách đã được đóng cứng và xác thực thành công cho đơn đặt hàng mã số <b className="text-[#5C4033] font-black">{placedOrderForEmail.id}</b>.</p>

                  <p>Toàn bộ danh mục tác phẩm dưới đây đã được phòng thiết kế và tổ thợ thủ công lành nghề tiếp nhận chuẩn bị gỗ mộc, đóng dầy khung chống nứt mọt để bàn giao vẹn tròn:</p>

                  {/* Products table */}
                  <div className="bg-white rounded-lg border border-[#EADBC8] overflow-hidden">
                    <div className="bg-[#FAF6F0] px-3 py-2 text-[10px] font-bold text-[#5C4033] grid grid-cols-12 gap-1 border-b border-[#EADBC8] text-left">
                      <span className="col-span-6">Tác phẩm</span>
                      <span className="col-span-2 text-center">Số lượng</span>
                      <span className="col-span-4 text-right">Đơn giá đầu tư</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {placedOrderForEmail.items.map((item, idx) => (
                        <div key={idx} className="px-3 py-2 text-[11px] grid grid-cols-12 gap-1 items-center">
                          <div className="col-span-6 [text-align:left] text-left">
                            <p className="font-bold text-[#1A1A1A]">{item.name}</p>
                            <p className="text-[9px] text-[#8B7E74]">Màu: {item.color} | Thép/Da: {item.material}</p>
                            {item.assembleService && <span className="text-[8px] text-[#D4AF37] border border-[#D4AF37]/40 px-1 py-0.2 rounded font-bold bg-amber-50">✓ Lắp ráp tại dinh cơ</span>}
                          </div>
                          <span className="col-span-2 text-center font-bold text-gray-600">x{item.quantity}</span>
                          <span className="col-span-4 text-right font-black text-[#5C4033]">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-amber-50/40 p-3 pr-6 text-[11px] border-t border-[#EADBC8] space-y-1 text-right">
                      <div className="text-gray-500">Giảm trừ VIP Code: -{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(placedOrderForEmail.discountAmount)}</div>
                      <div className="text-gray-500">Vận chuyển xe chuyên dụng: +{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(placedOrderForEmail.shippingFee)}</div>
                      <div className="font-black text-[13px] text-[#D4AF37] pt-1">
                        Tổng đầu tư thực tế: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(placedOrderForEmail.totalAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Payment Details info (Vietcombank 1040224710) */}
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 text-[11px] text-left">
                    <h4 className="font-bold text-emerald-800 flex items-center gap-1">🏦 NGUỒN TIỀN THANH TOÁN ỦY THÁC:</h4>
                    <p className="leading-relaxed">
                      Để hoàn tất thủ tục bàn giao dán tem bảo hành dầy 10 năm, kính mời Anh/Chị rà soát chuyển khoản về tài khoản thanh toán LuxeHome sau đây:
                    </p>
                    <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-emerald-100 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block mb-0.5">Số tài khoản VIP:</span>
                        <code className="text-sm tracking-wider font-extrabold text-emerald-700 select-all">1040224710</code>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block mb-0.5">Họ tên thụ hưởng:</span>
                        <strong className="font-bold text-gray-900 select-all">LAM HONG LAM</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-gray-500 uppercase block mb-0.5">Ngân hàng phát hành:</span>
                        <span className="font-semibold text-gray-800">Vietcombank (VCB) - Chi nhánh TP. Hồ Chí Minh</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping info summary */}
                  <div className="border-l-4 border-[#D4AF37] pl-3 py-1 space-y-1 bg-amber-50/30 rounded-r text-left">
                    <p className="font-bold text-[#1A1A1A]">📍 Địa danh giao hàng:</p>
                    <p className="text-[11px] text-gray-600">
                      Giao nhận tại: {placedOrderForEmail.shippingAddress.addressDetail}, {placedOrderForEmail.shippingAddress.district}, {placedOrderForEmail.shippingAddress.city}<br/>
                      Đường dây liên lạc: <strong className="text-[#1A1A1A]">{placedOrderForEmail.customerPhone}</strong>
                    </p>
                  </div>

                  <p className="text-[11px] text-[#8B7E74] italic leading-relaxed pt-2 text-left">
                    * Lưu ý: Thư điện tử (Email) xác nhận này được ký tên tự động bởi hệ thống mã hoá LuxeHome Blockchain Security, bảo toàn tuyệt mật các quyền lợi đổi trả 30 ngày và gói tặng phủ sáp da định kỳ.
                  </p>
                </div>

                {/* Simulated signature stamp */}
                <div className="pt-4 flex justify-between items-center border-t border-[#EADBC8]/70 text-[10px] text-[#8B7E74] text-left">
                  <div>
                    <p className="font-bold text-[#1A1A1A]">LuxeHome Concierge</p>
                    <p className="text-[9px]">Trợ lý Nội Thất Hoàng Gia</p>
                  </div>
                  
                  {/* Circular visual seal */}
                  <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37] bg-amber-50/20 text-[#D4AF37] flex flex-col items-center justify-center font-bold text-[8px] rotate-12 scale-105 shadow-inner select-none">
                    <span className="tracking-widest">DIGITAL</span>
                    <span className="font-black text-[9px] text-[#5C4033]">SIGNED</span>
                    <span>LUXEHOME</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-white border-t border-[#EADBC8] flex items-center justify-between text-xs font-semibold px-6">
              <span className="text-[#8B7E74] flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 
                Đã gửi thông báo xác nhận tới lamlam548818@gmail.com
              </span>
              <button
                onClick={() => setPlacedOrderForEmail(null)}
                className="px-6 py-2.5 rounded-xl bg-[#5C4033] text-white hover:bg-[#4A3B32] transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
              >
                Đóng & Quay Lại Showroom
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
