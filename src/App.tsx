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
import { useEffect } from "react";
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

interface UserSession {
  id?: number | string | null;
  name: string;
  fullName?: string;
  email: string;
  role?: "user" | "admin";
  roleCode?: string;
  phone?: string;
  avatarUrl?: string;
  status?: string;
}
export default function App() {
  // Navigation States
  const [activeTab, setActiveTab] = useState<string>("home");
  const [catalogFilters, setCatalogFilters] = useState<{ category?: string; style?: string }>({});

  // Core App State (With reactive local data syncs)
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>(MOCK_COMBOS);
  const [blogs, setBlogs] = useState(MOCK_BLOGS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [schedules, setSchedules] = useState<ConsultationSchedule[]>(INITIAL_SCHEDULES);
  const [coupons, setCoupons] = useState<Coupon[]>(MOCK_COUPONS);
  
  // Shopping Cart & Wishlist States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>(["prod-01", "prod-03"]);

  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
  const savedUser =
    sessionStorage.getItem("user") || localStorage.getItem("user");

  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);

      return {
        id: parsed.id || parsed.Id || null,
        name:
          parsed.name ||
          parsed.fullName ||
          parsed.FullName ||
          parsed.email ||
          "Thành viên VIP",
        fullName:
          parsed.fullName ||
          parsed.FullName ||
          parsed.name ||
          "Thành viên VIP",
        email: parsed.email || parsed.Email || "",
        phone: parsed.phone || parsed.Phone || "",
        avatarUrl: parsed.avatarUrl || parsed.AvatarUrl || "",
        role: parsed.role === "admin" ? "admin" : "user",
        roleCode: parsed.roleCode || parsed.RoleCode || "CUSTOMER",
        status: parsed.status || parsed.Status || "Active",
      };
    } catch (err) {
      console.error("Lỗi đọc user từ storage:", err);
    }
  }

  const savedToken =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const savedRole =
    sessionStorage.getItem("user_role") || localStorage.getItem("user_role");

  if (savedToken && savedRole) {
    const isAdmin =
      savedRole.toLowerCase() === "admin" ||
      savedRole.toLowerCase() === "manager";

    return {
      name: isAdmin ? "Nguyen Van Admin" : "Thành viên VIP",
      email: "",
      role: isAdmin ? "admin" : "user",
      roleCode: savedRole,
    };
  }

  return null;
});

  useEffect(() => {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  if (!token || !currentUser) return;

  if (
  token === "FACEBOOK_LOGIN_TEMP_TOKEN" ||
  token === "GOOGLE_LOGIN_TEMP_TOKEN"
) {
  return;
}

  import("./api/api").then(({ authApi }) => {
    authApi
      .getProfile()
      .then((profileData) => {
        if (profileData) {
          const roleCode = profileData.roleCode || profileData.RoleCode || "CUSTOMER";

          const syncedUser: UserSession = {
            id: profileData.id || profileData.Id || currentUser.id,
            name:
              profileData.fullName ||
              profileData.FullName ||
              currentUser.name ||
              "Thành viên VIP",
            fullName:
              profileData.fullName ||
              profileData.FullName ||
              currentUser.fullName,
            email: profileData.email || profileData.Email || currentUser.email,
            role:
              roleCode.toLowerCase() === "admin" ||
              roleCode.toLowerCase() === "manager"
                ? "admin"
                : "user",
            roleCode,
            phone: profileData.phone || profileData.Phone || "",
            avatarUrl:
              profileData.avatarUrl ||
              profileData.AvatarUrl ||
              currentUser.avatarUrl ||
              "",
            status: profileData.status || profileData.Status || "Active",
          };

          setCurrentUser(syncedUser);
          sessionStorage.setItem("user", JSON.stringify(syncedUser));
          localStorage.setItem("user", JSON.stringify(syncedUser));
        }
      })
      .catch((err) => {
        console.error("Lỗi đồng bộ hồ sơ từ PostgreSQL:", err);
      });
  });
}, []);

  useEffect(() => {
    fetch('/api/promotions')
    .then(res => {
      if (!res.ok) throw new Error("Lỗi mạng khi lấy Coupons");
      return res.json();
    })
    .then(data => {
      if (data && data.length > 0) {
        setCoupons(data);
      }
    })
    .catch(err => console.error("Lỗi đồng bộ Coupons:", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5200/api/products?page=1&pageSize=100") // Lấy tạm 100 SP cho Storefront
      .then(res => {
        if (!res.ok) throw new Error("Cổng API Backend từ chối kết nối");
        return res.json();
      })
      .then(data => {
        const productList = data.items || data.Items || data; 
        
        if (productList && productList.length > 0) {
          // Bước 1: Map dữ liệu thô từ Backend sang cấu trúc Frontend
          const mappedProducts = productList.map((item: any) => {
            const mappedImages = item.productImages && item.productImages.length > 0 
              ? item.productImages.map((img: any) => img.imageUrl) 
              : ["https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800"];

            const currentPrice = item.productVariants && item.productVariants.length > 0 
              ? item.productVariants[0].currentPrice 
              : 15000000;

            return {
              id: item.id.toString(),
              name: item.productName || "Sản phẩm chưa cập nhật",
              price: currentPrice,
              rating: item.averageRating || 5,
              category: item.category?.slug || "phong-khach",
              categoryName: item.category?.categoryName || "Phòng Khách",
              style: item.style || "Modern",
              images: mappedImages,
              description: item.shortDescription || "",
              longDescription: item.description || "",
              material: item.material || "Gỗ tự nhiên cao cấp",
              dimensions: "Kích thước tiêu chuẩn",
              colors: item.productVariants?.map((v:any) => v.color).filter(Boolean) || ["Mặc định"],
              features: ["Bảo hành LuxeHome"],
              warranty: `${item.warrantyMonths || 12} tháng`,
              stock: 10,
              brand: "LuxeHome",
              status: item.status || "ACTIVE", // Cần gán thuộc tính status
              reviews: []
            };
          });

          // Bước 2: Lọc sản phẩm (Chỉ giữ lại những sản phẩm ĐANG BÁN)
          const activeProducts = mappedProducts.filter((p: any) => p.status !== "INACTIVE");
          
          // Bước 3: Đưa dữ liệu đã lọc vào state
          setProducts(activeProducts);
        }
      })
      .catch(err => console.error("❌ Lỗi API:", err));
  }, []);


  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [placedOrderForEmail, setPlacedOrderForEmail] = useState<Order | null>(null);
  const [comparedProductIds, setComparedProductIds] = useState<string[]>([]);

  const handleNavigateToCatalogWithFilters = (filters: { category?: string; style?: string }) => {
    setCatalogFilters(filters);
    setActiveTab("catalog");
  };

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    if (user.role === "admin") {
      setActiveTab("admin");
      alert(`Xin kính chào Quản Trị Viên: ${user.name}. Đã chuyển hướng vào Ban quản trị!`);
    } else {
      setActiveTab("home");
    }
  };

  const handleLogout = () => {
  setCurrentUser(null);
  setCart([]);

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user_role");
  sessionStorage.removeItem("user");

  localStorage.removeItem("token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user");

  setActiveTab("home");
};

  const handleAddToCart = (product: Product, quantity: number, color: string, assemble: boolean) => {
    setCart((prevCart) => {
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
    setCart((prevCart) => prevCart.map((item) => (item.product.id === productId ? { ...item, quantity } : item)));
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleAddComboToCart = (combo: Combo, comboProducts: Product[]) => {
    comboProducts.forEach((p) => { handleAddToCart(p, 1, p.colors[0], false); });
    setIsCartOpen(true);
    alert(`Đã thêm trọn bộ ${combo.name} vào giỏ hàng thành công!`);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]);
  };

  const handleCheckoutSubmit = (newCreatedOrder: Order) => {
    setOrders((prev) => [newCreatedOrder, ...prev]);
    setCart([]);
    setIsCartOpen(false);
    setActiveTab("profile");
    setPlacedOrderForEmail(newCreatedOrder);
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
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

  const handleAddProductToInventory = async (newProd: Product) => {
    try {
      const generateSlug = (text: string) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const payload = {
        productName: newProd.name,
        slug: generateSlug(newProd.name),
        categorySlug: newProd.category,
        shortDescription: newProd.description,
        description: newProd.longDescription,
        material: newProd.material,
        style: newProd.style,
        warrantyMonths: parseInt(newProd.warranty) || 12,
        brand: newProd.brand,
        status: "Active",
        images: newProd.images.map((imgUrl, index) => ({ imageUrl: imgUrl, isMain: index === 0, sortOrder: index })),
        variants: newProd.colors.map(color => ({ color: color, currentPrice: newProd.price, status: "Active" })),
        initialStock: newProd.stock
      };
  
      const response = await fetch("http://localhost:5200/api/products", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) throw new Error(`Lỗi Server: ${response.statusText}`);
      const createdProductFromDb = await response.json();
  
      const mappedNewProduct: Product = {
        id: createdProductFromDb.id.toString(),
        name: createdProductFromDb.productName,
        price: createdProductFromDb.productVariants?.[0]?.currentPrice || newProd.price,
        rating: 5,
        category: newProd.category,
        categoryName: newProd.categoryName,
        style: createdProductFromDb.style || newProd.style,
        images: createdProductFromDb.productImages?.map((img: any) => img.imageUrl) || newProd.images,
        description: createdProductFromDb.shortDescription || newProd.description,
        longDescription: createdProductFromDb.description || newProd.longDescription,
        material: createdProductFromDb.material || newProd.material,
        dimensions: newProd.dimensions,
        colors: createdProductFromDb.productVariants?.map((v: any) => v.color) || newProd.colors,
        features: newProd.features,
        warranty: `${createdProductFromDb.warrantyMonths} tháng`,
        stock: newProd.stock,
        brand: newProd.brand,
        reviews: []
      };
  
      setProducts((prev) => [mappedNewProduct, ...prev]);
      alert("Thêm sản phẩm mới vào danh mục kho LuxeHome thành công!");
    } catch (error) {
      console.error(error);
      alert("Thêm sản phẩm thất bại.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const isConfirmed = window.confirm("Anh/Chị có chắc chắn muốn ngừng kinh doanh sản phẩm này?");
    if (!isConfirmed) return;
    try {
      const response = await fetch(`http://localhost:5200/api/products/${productId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Xóa sản phẩm thất bại.");
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      alert("Đã gỡ sản phẩm khỏi Showcase!");
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    try {
      // Gọi API gửi dữ liệu xuống Backend (Đã thêm Status, MetaTitle, MetaDescription, ImageUrl)
      const payload: any = {
        productName: updatedProduct.name,
        categorySlug: updatedProduct.category,
        currentPrice: updatedProduct.price,
        stock: updatedProduct.stock,
        style: updatedProduct.style,
        material: updatedProduct.material,
        status: (updatedProduct as any).status || "ACTIVE",
        metaTitle: (updatedProduct as any).metaTitle || "",
        metaDescription: (updatedProduct as any).metaDescription || ""
      };

      // Gửi mảng ảnh nếu có thay đổi ảnh chính
      if (updatedProduct.images && updatedProduct.images.length > 0) {
        payload.imageUrl = updatedProduct.images[0];
      }

      const response = await fetch(`http://localhost:5200/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Cập nhật sản phẩm thất bại trên Server.");

      // Cập nhật mượt mà UI không cần reload trang
      setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
      alert("Đã lưu thay đổi thông tin sản phẩm thành công!");
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi lưu chỉnh sửa.");
    }
  };

  const handleUpdateProductStock = async (productId: string, newStock: number) => {
    try {
      const response = await fetch(`http://localhost:5200/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStock),
      });
      if (!response.ok) throw new Error("Lỗi đồng bộ tồn kho.");
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)));
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateScheduleStatus = (scheduleId: string, status: ConsultationSchedule["status"]) => {
    setSchedules((prev) => prev.map((sch) => (sch.id === scheduleId ? { ...sch, status } : sch)));
  };

  const handleAddNewCoupon = (newCoupon: Coupon) => { setCoupons((prev) => [newCoupon, ...prev]); };
  const handleAddConsultationSchedule = (newSch: ConsultationSchedule) => { setSchedules((prev) => [newSch, ...prev]); };

  const handleAddReviewToProduct = (productId: string, rating: number, comment: string, author: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newReviewList = [
            { id: "rev-new-" + Math.random(), author, rating, comment, date: new Date().toISOString().substring(0, 10) },
            ...p.reviews,
          ];
          const sum = newReviewList.reduce((acc, r) => acc + r.rating, 0);
          const avg = Number((sum / newReviewList.length).toFixed(1));
          return { ...p, reviews: newReviewList, rating: avg };
        }
        return p;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between text-[#1A1A1A] font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
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

      <main className="flex-1 pb-16">
        {activeTab === "home" && (
          <HomeView
            products={products}
            combos={combos}
            blogs={blogs}
            onSelectProduct={(p) => setSelectedProductForDetail(p)}
            onSelectCombo={(c) => {
              const matchedItems = c.productIds.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);
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
          <ComboView combos={combos} products={products} onAddComboToCart={handleAddComboToCart} onSelectProduct={(p) => setSelectedProductForDetail(p)} />
        )}

        {activeTab === "design" && (
          <DesignConsultation products={products} combos={combos} onAddSchedule={handleAddConsultationSchedule} onSelectProduct={(p) => setSelectedProductForDetail(p)} />
        )}

        {(activeTab === "profile" || activeTab === "profile-wishlist") && (
          <UserProfile
            currentUser={currentUser}
            onUpdatePersonalInfo={(name, email, phone) => {
              if (currentUser) {
                setCurrentUser({ ...currentUser, name, email, phone: phone ?? currentUser.phone });
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

        {activeTab === "admin" && (
          currentUser && currentUser.role === "admin" ? (
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
              onEditProduct={handleEditProduct}
              onUpdateScheduleStatus={handleUpdateScheduleStatus}
              onAddCoupon={handleAddNewCoupon}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border-2 border-red-200">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">Truy Cập Bị Giới Hạn</h2>
              <p className="text-xs text-[#8B7E74] max-w-md mx-auto">Khu vực Quản trị dành riêng cho Ban quản lý LuxeHome.</p>
              <button onClick={() => setIsAuthOpen(true)} className="bg-[#5C4033] hover:bg-[#4A3B32] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase transition-colors">Đăng Nhập Admin</button>
            </div>
          )
        )}
      </main>

      <footer className="bg-[#1A1A1A] text-[#FAF6F0] border-t border-[#EADBC8]/25 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="font-serif text-xl font-bold block">Luxe<span className="text-[#D4AF37] font-sans font-light">Home</span></span>
            <p className="text-[11px] text-[#8B7E74] leading-relaxed max-w-xs">Thương hiệu đồ mộc cao cấp Thượng Lưu.</p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-[#D4AF37]">Thời Gian Showroom</h4>
            <ul className="text-[11px] text-[#8B7E74] space-y-1"><li>Thứ 2 - Chủ Nhật: 08:00 - 21:00</li></ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-[#D4AF37]">Uy Tín</h4>
            <ul className="text-[11px] text-[#8B7E74] space-y-1"><li>✓ Bảo hành khung mộc 10 năm</li></ul>
          </div>
          <div className="space-y-3">
            <span className="text-[10px] text-[#D4AF37] font-semibold block">® LuxeHome TMĐT All rights reserved.</span>
          </div>
        </div>
      </footer>

      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
          onAddToCart={handleAddToCart}
          onToggleCompare={(prod) => {
            if (comparedProductIds.includes(prod.id)) {
              setComparedProductIds(comparedProductIds.filter((id) => id !== prod.id));
            } else {
              if (comparedProductIds.length >= 3) { alert("Tối đa 3 sản phẩm."); return; }
              setComparedProductIds([...comparedProductIds, prod.id]);
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
          onOpenAuth={() => { setIsCartOpen(false); setIsAuthOpen(true); }}
        />
      )}

      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onLogin={handleLogin} />}
      <ChatbotWidget products={products} onSelectProduct={(p) => setSelectedProductForDetail(p)} />

      {placedOrderForEmail && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-55 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-[#FAF6F0] w-full max-w-2xl rounded-2xl border-2 border-[#D4AF37] p-6 text-left">
            <h3 className="font-serif text-lg font-black text-[#1A1A1A] uppercase text-center">Xác Nhận Đơn Hàng Thành Công</h3>
            <p className="text-xs text-center text-[#8B7E74] mt-1">Mã đơn: {placedOrderForEmail.id}</p>
            <div className="mt-4 flex justify-end"><button onClick={() => setPlacedOrderForEmail(null)} className="px-6 py-2 bg-[#5C4033] text-white rounded-xl text-xs font-bold uppercase">Quay Lại Showroom</button></div>
          </div>
        </div>
      )}
    </div>
  );
}