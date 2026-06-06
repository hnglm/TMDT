import React, { useState } from "react";
import { User, Phone, MapPin, Heart, ShoppingBag, Eye, Star, CheckCircle, RefreshCw, Sparkles } from "lucide-react";
import { Order, Product, BlogPost } from "../types";

interface UserProfileProps {
  currentUser: { name: string; email: string } | null;
  onUpdatePersonalInfo: (name: string, email: string) => void;
  orders: Order[];
  wishlist: string[];
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onRemoveFromWishlist: (productId: string) => void;
  onAddReviewToProduct: (productId: string, rating: number, comment: string, author: string) => void;
}

export default function UserProfile({
  currentUser,
  onUpdatePersonalInfo,
  orders,
  wishlist,
  products,
  onSelectProduct,
  onRemoveFromWishlist,
  onAddReviewToProduct,
}: UserProfileProps) {
  
  // Tab within profile
  const [profileSubTab, setProfileSubTab] = useState<"info" | "orders" | "wishlist">("orders");

  // Edit user info state
  const [editedName, setEditedName] = useState(currentUser?.name || "Nguyễn Lâm Thao");
  const [editedEmail, setEditedEmail] = useState(currentUser?.email || "lamlam548818@gmail.com");
  const [phone, setPhone] = useState("0901234567");
  const [defaultCity, setDefaultCity] = useState("Thành phố Hồ Chí Minh");
  const [defaultDetailAddress, setDefaultDetailAddress] = useState("120 Lê Lợi, Bến Thành");
  const [isSavedInfo, setIsSavedInfo] = useState(false);

  // Review submission state helper
  const [reviewingProductId, setReviewingProductId] = useState<string | null>(null);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <User className="w-16 h-16 text-[#8B7E74] mx-auto opacity-50" />
        <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">Khu Vực Thành Viên LuxeHome</h2>
        <p className="text-xs text-[#8B7E74] max-w-sm mx-auto">Vui lòng bấm nút 'Đăng Nhập' ở góc phải phía trên để kích hoạt xem đơn hàng, quản lý vận trình và ghi nhận sản phẩm yêu thích.</p>
      </div>
    );
  }

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePersonalInfo(editedName, editedEmail);
    setIsSavedInfo(true);
    setTimeout(() => setIsSavedInfo(false), 2000);
  };

  // Run submitted evaluation
  const handleReviewSubmit = (productId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    onAddReviewToProduct(productId, newReviewRating, newReviewComment, currentUser.name);
    setReviewedProductIds([...reviewedProductIds, productId]);
    setReviewingProductId(null);
    setNewReviewComment("");
    setNewReviewRating(5);
    alert("Cảm ơn Quý khách đã gửi ý kiến phản hồi quý giá cho LuxeHome!");
  };

  // Convert wishlist item IDs to structural products
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="user-profile-layout">
      
      {/* 2-columns setup: Left info card, Right detail tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column sidebar overview */}
        <div className="lg:col-span-4 bg-[#FAF6F0] rounded-2xl p-6 border border-[#EADBC8] h-fit space-y-6">
          <div className="text-center pb-6 border-b border-[#EADBC8]/70">
            <div className="w-20 h-20 rounded-full bg-[#EADBC8] text-[#5C4033] flex items-center justify-center font-bold text-3xl mx-auto border-2 border-[#D4AF37] shadow mb-3">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">{currentUser.name}</h2>
            <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest bg-white border border-[#EADBC8] px-2.5 py-1 rounded-full inline-block mt-2">
              Chương trình Luxe VIP Club
            </span>
          </div>

          {/* Quick Submenu Selection */}
          <div className="space-y-1.5" id="profile-tabs-sidebar">
            {[
              { id: "orders", label: "Lịch sử đơn hàng " + `(${orders.length})`, icon: ShoppingBag },
              { id: "wishlist", label: "Sản phẩm yêu thích " + `(${wishlist.length})`, icon: Heart },
              { id: "info", label: "Cài đặt & Sổ địa chỉ", icon: MapPin },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = profileSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setProfileSubTab(tab.id as any)}
                  className={`w-full text-left text-xs px-4 py-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 ${
                    isActive
                      ? "bg-[#5C4033] text-white shadow-sm"
                      : "text-[#5C4033] bg-white border border-[#EADBC8]/50 hover:bg-[#FAF6F0]"
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#D4AF37]" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#EADBC8]/50 text-center">
            <p className="text-[10px] text-[#8B7E74] italic leading-normal">LuxeHome cam kết giữ trọn vẹn thông tin gia sản và thiết kế bản vẽ của quý khách không rò rỉ ra bên ngoài.</p>
          </div>
        </div>

        {/* Right column master workspace */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EADBC8] p-6 md:p-8 shadow-sm">
          
          {/* A. Subtab: Order History & Status steps Tracking (Theo dõi trạng thái đơn hàng) */}
          {profileSubTab === "orders" && (
            <div className="space-y-8" id="profile-orders-view">
              <div className="border-b border-[#EADBC8] pb-4">
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Hành Trình & Đơn Hàng Của Quý Khách</h3>
                <p className="text-xs text-[#8B7E74]">Xem lại thời gian chế tạo và xe giao mỡ bôi màng bảo toàn của mộc.</p>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-8" id="orders-list-profile">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="border border-[#EADBC8] rounded-2xl p-5 md:p-6 bg-[#FAF6F0]/30 space-y-4"
                    >
                      {/* Top bar info */}
                      <div className="flex flex-wrap justification-between items-center bg-white p-3 rounded-lg border border-[#EADBC8] text-xs font-semibold gap-2">
                        <div>
                          Mã đơn hàng: <span className="font-black text-[#5C4033]">{order.id}</span>
                        </div>
                        <div className="text-[#8B7E74]">
                          Đặt ngày: {order.date}
                        </div>
                        <div className="ml-auto font-black text-[#D4AF37]">
                          Giá trị: {formattedPrice(order.totalAmount)}
                        </div>
                        <div>
                          <span className="bg-[#5C4033] text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                            {order.status === "pending" ? "Chờ xác nhận" :
                             order.status === "confirmed" ? "Sẵn sàng xuất kho" :
                             order.status === "shipping" ? "Xe đang giao" :
                             order.status === "delivered" ? "Đã tới Showroom" :
                             order.status === "completed" ? "Hoàn tất" : "Đã Cancel"}
                          </span>
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-xs p-2 bg-white rounded border border-[#EADBC8]/40">
                            <div className="font-bold text-[#1A1A1A]">
                              {item.name} <span className="text-[#D4AF37]">x{item.quantity}</span>
                              <span className="block text-[10px] text-[#8B7E74] font-normal">Màu sắc: {item.color} • Thớ gỗ: {item.material}</span>
                            </div>
                            <span className="font-semibold text-[#5C4033]">{formattedPrice(item.price)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Interactive Visual Tracking Steps Flow (Theo dõi trạng thái đơn hàng) */}
                      <div className="pt-4 border-t border-[#EADBC8]/60 space-y-3">
                        <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-[#D4AF37]">Trạng thái bám vận trình thực tế:</h4>
                        
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                          {[
                            { step: "pending", label: "Tiếp Nhận" },
                            { step: "confirmed", label: "Chế Tác" },
                            { step: "shipping", label: "Vận Chuyển" },
                            { step: "completed", label: "Bàn Giao" }
                          ].map((s, i) => {
                            // Check active status
                            const statusOrder = ["pending", "confirmed", "shipping", "completed"];
                            const currentIdx = statusOrder.indexOf(order.status);
                            const thisIdx = statusOrder.indexOf(s.step);
                            const isDone = thisIdx <= currentIdx && order.status !== "cancelled";

                            return (
                              <div key={s.step} className="space-y-1">
                                <div className={`h-1.5 rounded-full ${isDone ? "bg-[#D4AF37]" : "bg-gray-200"}`} />
                                <span className={`font-bold transition-colors ${isDone ? "text-[#5C4033]" : "text-gray-400"}`}>
                                  {s.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Write evaluation after buying successfully (Đánh giá sản phẩm sau khi mua) */}
                      {order.status === "completed" && (
                        <div className="pt-4 border-t border-[#EADBC8] space-y-3">
                          <p className="text-[11px] text-[#5C4033] font-semibold">💎 Đơn hàng đã bọc giao thợ lắp đặt kỹ càng. Hãy đánh giá chân mộc của các sản phẩm để tích điểm VIP:</p>
                          <div className="flex flex-wrap gap-2">
                            {order.items.map((item) => {
                              const alreadyReviewed = reviewedProductIds.includes(item.productId);
                              return (
                                <button
                                  key={item.productId}
                                  onClick={() => !alreadyReviewed && setReviewingProductId(item.productId)}
                                  disabled={alreadyReviewed}
                                  className={`px-3 py-1.5 text-[10px] rounded border transition-all ${
                                    alreadyReviewed
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 cursor-not-allowed"
                                      : "bg-white hover:bg-amber-50 text-[#5C4033] border-[#EADBC8] font-bold"
                                  }`}
                                >
                                  {alreadyReviewed ? `✓ Đã Đánh giá (${item.name.substring(0, 10)}...)` : `Viết Đánh Giá: ${item.name.substring(0, 15)}...`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-[#FAF6F0] rounded-2xl border border-dashed border-[#EADBC8]">
                  <ShoppingBag className="w-10 h-10 text-[#8B7E74] mx-auto mb-3 opacity-50" />
                  <p className="text-xs text-[#8B7E74] italic">Anh/Chị chưa phát sinh đơn mua hàng trực tiếp nào. Kính mời trải nghiệm đặt hàng!</p>
                </div>
              )}

              {/* Form popup to write product review */}
              {reviewingProductId && (
                <div className="bg-[#FAF6F0] p-5 rounded-xl border border-[#D4AF37] space-y-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Viết Ý Kiến Đánh Giá Kiệt Tác
                  </h4>
                  <form onSubmit={(e) => handleReviewSubmit(reviewingProductId, e)} className="space-y-3">
                    <div>
                      <span className="block text-[10px] text-[#8B7E74] uppercase mb-1">Mức độ Hài Lòng:</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReviewRating(star)}
                            className="p-1"
                          >
                            <Star className={`w-5 h-5 ${star <= newReviewRating ? "fill-amber-500 text-amber-500" : "text-gray-300"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] text-[#8B7E74] uppercase mb-1">Cảm nhận chi tiết móng mộc chất liệu:</span>
                      <textarea
                        required
                        rows={2}
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="Ví dụ: Da bò Ý sờ mịn thắm đỏ, sofa êm sâu lò xo chuẩn chỉ..."
                        className="w-full text-xs bg-white border border-[#EADBC8] rounded-lg p-2 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setReviewingProductId(null)}
                        className="text-[10px] text-[#8B7E74] hover:underline"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#5C4033] hover:bg-[#4A3B32] text-white text-[10px] uppercase font-bold rounded"
                      >
                        Báo Cáo Đánh Giá
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}

          {/* B. Subtab: User Wishlist Products */}
          {profileSubTab === "wishlist" && (
            <div className="space-y-6" id="profile-wishlist-view">
              <div className="border-b border-[#EADBC8] pb-4">
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Danh tuyển yêu thích của bạn</h3>
                <p className="text-xs text-[#8B7E74]">Tuyển chọn các tác phẩm nội thất chạm trổ óc chó sẵn sàng ghép giỏ.</p>
              </div>

              {wishlistProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistProducts.map((p) => (
                    <div 
                      key={p.id}
                      className="flex gap-4 p-3 bg-[#FAF6F0]/50 rounded-xl border border-[#EADBC8] items-center justify-between"
                    >
                      <div className="flex gap-3 items-center min-w-0 flex-1">
                        <img src={p.images[0]} alt={p.name} className="w-14 h-14 object-cover rounded-lg" />
                        <div className="min-w-0">
                          <h4 className="font-serif text-xs font-bold text-[#1A1A1A] truncate max-w-[150px]">{p.name}</h4>
                          <span className="text-xs text-[#5C4033] font-bold">{formattedPrice(p.price)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectProduct(p)}
                          className="px-3 py-1 bg-[#5C4033] hover:bg-[#4A3B32] text-white text-[10px] uppercase font-bold rounded"
                        >
                          Cấu hình
                        </button>
                        <button
                          onClick={() => onRemoveFromWishlist(p.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-[#FAF6F0] rounded-2xl border border-dashed border-[#EADBC8]">
                  <Heart className="w-10 h-10 text-red-500/50 mx-auto mb-3" />
                  <p className="text-xs text-[#8B7E74] italic">Anh/Chị chưa đánh dấu yêu thích kiệt tác nào.</p>
                </div>
              )}
            </div>
          )}

          {/* C. Subtab: User details settings */}
          {profileSubTab === "info" && (
            <div className="space-y-6" id="profile-info-view">
              <div className="border-b border-[#EADBC8] pb-4">
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Hồ Sơ & Sổ Địa Chỉ Giao Hàng</h3>
                <p className="text-xs text-[#8B7E74]">Cập nhật thông tin nhận ưu đãi và thợ mộc lắp ráp trực tuyến LuxeHome.</p>
              </div>

              <form onSubmit={handleSaveInfo} className="space-y-4 max-w-md text-xs">
                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Họ tên của Anh/Chị *</label>
                  <input
                    type="text"
                    required
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full bg-[#FAF6F0] p-2.5 rounded-lg border border-[#EADBC8]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Email đăng ký VIP *</label>
                  <input
                    type="email"
                    required
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    className="w-full bg-[#FAF6F0] p-2.5 rounded-lg border border-[#EADBC8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#FAF6F0] p-2.5 rounded-lg border border-[#EADBC8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Khu vực phân phối</label>
                    <input
                      type="text"
                      required
                      value={defaultCity}
                      onChange={(e) => setDefaultCity(e.target.value)}
                      className="w-full bg-[#FAF6F0] p-2.5 rounded-lg border border-[#EADBC8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Địa chỉ chi tiết nhận hàng mặc định</label>
                  <input
                    type="text"
                    required
                    value={defaultDetailAddress}
                    onChange={(e) => setDefaultDetailAddress(e.target.value)}
                    className="w-full bg-[#FAF6F0] p-2.5 rounded-lg border border-[#EADBC8]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5C4033] hover:bg-[#4A3B32] text-white rounded-lg font-bold uppercase transition-colors flex items-center gap-2"
                >
                  {isSavedInfo ? <CheckCircle className="w-4 h-4 text-[#D4AF37]" /> : <RefreshCw className="w-4 h-4" />}
                  {isSavedInfo ? "Đã cập nhật thông tin!" : "Cập Nhật Sổ Địa Chỉ"}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
