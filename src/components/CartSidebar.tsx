import React, { useState } from "react";
import { X, Trash2, Percent, Check, AlertCircle, Sparkles, MapPin, CreditCard, ShoppingBag } from "lucide-react";
import { CartItem, Coupon, Order } from "../types";
import { MOCK_COUPONS } from "../mockData";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (order: Order) => void;
  currentUser: { name: string; email: string } | null;
  onOpenAuth: () => void;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  currentUser,
  onOpenAuth,
}: CartSidebarProps) {
  
  // Coupon applied state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);

  // Address & Contacts state
  const [city, setCity] = useState("Thành phố Hồ Chí Minh");
  const [district, setDistrict] = useState("Quận 2");
  const [detailAddress, setDetailAddress] = useState("120 Xa Lộ Hà Nội, Thảo Điền");
  const [phone, setPhone] = useState("0948548818");
  const [paymentMethod, setPaymentMethod] = useState<Order["paymentMethod"]>("BankTransfer");
  const [validationError, setValidationError] = useState("");

  if (!isOpen) return null;

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  // Subtotal calculations
  const subtotal = cart.reduce((sum, item) => {
    let itemBase = item.product.price * item.quantity;
    if (item.assembleService) {
      itemBase += 450000 * item.quantity; // Assembly premium service fee
    }
    return sum + itemBase;
  }, 0);

  // Apply discount coupon
  const handleApplyCoupon = () => {
    setCouponError("");
    setCouponSuccess(false);
    
    const coup = MOCK_COUPONS.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive
    );

    if (!coup) {
      setCouponError("Mã khuyến mãi không chính hiệu / đã hết hạn.");
      setAppliedCoupon(null);
      return;
    }

    if (subtotal < coup.minSubtotal) {
      setCouponError(`Đơn hàng tối thiểu để dùng mã này là ${formattedPrice(coup.minSubtotal)}.`);
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(coup);
    setCouponSuccess(true);
  };

  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === "percent"
      ? (subtotal * appliedCoupon.value) / 100
      : appliedCoupon.value
    : 0;

  // Dynamic shipping fee based on city selection
  const shippingFee = city === "Thành phố Hồ Chí Minh" ? 250000 : 750000;
  const totalAmount = subtotal - discountAmount + shippingFee;

  const handlePlaceOrderClick = () => {
    setValidationError("");
    if (cart.length === 0) return;

    if (!currentUser) {
      setValidationError("Quý khách vui lòng Đăng nhập tài khoản để Ký nhận đơn đặt hàng VIP.");
      onOpenAuth();
      return;
    }

    if (!phone) {
      setValidationError("Hãy điền số điện thoại liên lạc chuẩn xác để chuyên viên LuxeHome xếp lịch gỗ mộc.");
      return;
    }

    if (!detailAddress) {
      setValidationError("Hãy nhập địa chỉ giao hàng cụ thể để thợ mộc LuxeHome vận chuyển tối ưu.");
      return;
    }

    // Submit Order Object
    const newOrder: Order = {
      id: "LH-" + Math.floor(10000 + Math.random() * 90000),
      date: new Date().toISOString().substring(0, 10),
      customerName: currentUser.name,
      customerPhone: phone,
      shippingAddress: {
        city,
        district,
        addressDetail: detailAddress,
      },
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        color: item.selectedColor,
        material: item.product.material.split(",")[0],
        assembleService: item.assembleService,
      })),
      couponApplied: appliedCoupon?.code,
      discountAmount,
      shippingFee,
      totalAmount,
      paymentMethod,
      status: "pending",
      paymentStatus: paymentMethod === "COD" ? "Chưa thanh toán" : "Đã thanh toán",
      trackingSteps: [
        {
          status: "pending",
          title: "Đơn hàng tiếp nhận",
          description: "LuxeHome đặt chế tạo hoàn hảo dán tem bảo hành vàng.",
          time: new Date().toLocaleTimeString("vi-VN").substring(0, 5) + " Hôm nay",
        },
      ],
    };

    onCheckout(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-sidebar-overlay">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
        <div className="w-screen max-w-md bg-[#FAF6F0] border-l border-[#EADBC8] shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 bg-white border-b border-[#EADBC8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="font-serif text-lg font-black text-[#1A1A1A]">
                Giỏ Hàng Sang Trọng
              </h2>
            </div>
            
            <button
              onClick={onClose}
              className="text-[#8B7E74] hover:text-[#5C4033] p-1.5 rounded-full hover:bg-[#FAF6F0]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart item listing or Empty banner */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length > 0 ? (
              <div className="space-y-4" id="cart-items-list-container">
                {cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedColor}`}
                    className="flex gap-4 p-3 bg-white rounded-xl border border-[#EADBC8] shadow-sm relative group"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg border border-[#EADBC8]"
                    />
                    
                    <div className="flex-1 min-w-0 text-left text-xs">
                      <h4 className="font-serif font-bold text-[#1A1A1A] line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] text-[#8B7E74] mt-0.5">Màu: {item.selectedColor}</p>
                      
                      {item.assembleService && (
                        <p className="text-[10px] text-[#D4AF37] font-semibold mt-0.5">✓ Kèm thợ gỗ lắp ráp (+450.000đ)</p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-[#5C4033]">
                          {formattedPrice(item.product.price)}
                        </span>

                        {/* Qty edit buttons */}
                        <div className="flex items-center border border-[#EADBC8] rounded bg-[#FAF6F0]">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="px-1.5 py-0.5 text-[#5C4033] font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 text-[11px] font-bold">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="px-1.5 py-0.5 text-[#5C4033] font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#EADBC8]/30 flex items-center justify-center mx-auto text-[#8B7E74]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">Danh sách giỏ hàng trống</h3>
                <p className="text-xs text-[#8B7E74] max-w-xs mx-auto">Anh/Chị chưa chọn sản phẩm nào vào giỏ. Showroom của LuxeHome có rất nhiều gợi ý phòng đẹp.</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#5C4033] text-white text-xs font-bold uppercase rounded-lg shadow"
                >
                  Quay lại xem Showroom
                </button>
              </div>
            )}

            {/* Config Shipment & Coupons only if items exist */}
            {cart.length > 0 && (
              <div className="pt-6 border-t border-[#EADBC8] space-y-6">
                
                {/* Coupon Entry section */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[#5C4033] uppercase">Mã Khuyến Mãi Luxe VIP:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mã: LUXE10, CHMPG5M..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 text-xs bg-white border border-[#EADBC8] rounded-lg px-3 py-2 text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-[#5C4033] text-white text-xs rounded-lg font-bold hover:bg-[#4A3B32] transition-colors"
                    >
                      Kiểm nghiệm
                    </button>
                  </div>

                  {couponError && (
                    <p className="text-[10px] text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {couponError}
                    </p>
                  )}
                  {couponSuccess && appliedCoupon && (
                    <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3" /> Áp dụng thành công: {appliedCoupon.description}
                    </p>
                  )}
                </div>

                {/* Delivery Address fields */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-[#EADBC8]">
                  <h4 className="text-xs font-bold text-[#1A1A1A] uppercase flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" /> Địa Chỉ Giao Hàng Xa Xỉ
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Tỉnh/Thành phố:</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-[#FAF6F0] p-1.5 rounded border border-[#EADBC8]"
                      >
                        <option value="Thành phố Hồ Chí Minh">Sài Gòn - HCM</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Quận/Huyện:</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="Ví dụ: Quận 1, Quận 3"
                        className="w-full bg-[#FAF6F0] p-1.5 rounded border border-[#EADBC8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Địa chỉ cụ thể *</label>
                    <input
                      type="text"
                      required
                      value={detailAddress}
                      onChange={(e) => setDetailAddress(e.target.value)}
                      placeholder="Số căn, Toà nhà, tên đường phố..."
                      className="w-full bg-[#FAF6F0] p-2 rounded border border-[#EADBC8] text-xs text-[#1A1A1A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#8B7E74] uppercase mb-1">Số điện thoại người nhận *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Số di động liên lạc"
                      className="w-full bg-[#FAF6F0] p-2 rounded border border-[#EADBC8] text-xs text-[#1A1A1A]"
                    />
                  </div>
                </div>

                {/* Secure Payment selector methods */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#5C4033] uppercase flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#D4AF37]" /> Phương thức thanh toán
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      { id: "COD", label: "Tiền mặt COD ", desc: "Giao lắp xong thu tiền" },
                      { id: "BankTransfer", label: "Chuyển Khoản ", desc: "Ngân hàng VIP QR code" },
                      { id: "VNPAY", label: "VNPay ", desc: "Cổng thanh toán" },
                      { id: "EWallet", label: "Momo E-Wallet", desc: "Ví điện tử" }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as Order["paymentMethod"])}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          paymentMethod === method.id
                            ? "bg-[#5C4033] text-white border-[#5C4033] shadow-inner"
                            : "bg-white text-[#5C4033] border-[#EADBC8] hover:bg-amber-50"
                        }`}
                      >
                        <p className="font-bold">{method.label}</p>
                        <span className="opacity-80 block text-[9px] font-medium leading-none">{method.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Bank transfer instruction fallback */}
                  {paymentMethod === "BankTransfer" && (
                    <div className="p-3 bg-emerald-50/60 rounded-lg text-[10.5px] text-[#004D40] leading-relaxed border border-emerald-200 space-y-1 text-left">
                      <div className="font-bold flex items-center gap-1.5 text-xs text-[#004D40]">
                        🏦 <span>TÀI KHOẢN LUXEHOME THANH TOÁN CHÍNH THỨC</span>
                      </div>
                      <p>• Số tài khoản: <strong className="text-sm tracking-wider font-extrabold text-[#00796B] select-all">1040224710</strong></p>
                      <p>• Chủ tài khoản: <strong className="font-bold text-gray-900 select-all">LAM HONG LAM</strong></p>
                      <p>• Ngân hàng: <span className="font-semibold text-gray-800">Vietcombank (VCB)</span></p>
                      <p>• Nội dung: <b className="bg-emerald-100/80 px-1 rounded select-all">Thanh toán LuxeHome {phone}</b></p>
                      <div className="mt-1.5 pt-1.5 border-t border-dashed border-emerald-200 text-[9px] text-[#004D40]/80 italic">
                        * Hệ thống tích hợp chữ ký số và xác nhận bill tức thì gửi mail ngay về lamlam548818@gmail.com.
                      </div>
                    </div>
                  )}

                  {/* VNPAY instruction fallback */}
                  {paymentMethod === "VNPAY" && (
                    <div className="p-3 bg-[#EEFAFF] rounded-lg text-[10px] text-[#005BAA] leading-relaxed border border-[#BDE4FF] space-y-1">
                      <div className="flex items-center gap-1.5 border-b border-[#BDE4FF] pb-1 font-bold text-xs">
                        <span className="px-1.5 py-0.5 bg-[#005BAA] text-white text-[9px] rounded font-black">VN</span>
                        <span>Cổng Thanh Toán Quốc Tế VNPAY QR</span>
                      </div>
                      <p>• Mã thanh toán tích hợp dán mác bảo mật quốc tế 3D Secure bảo vệ tuyệt mật.</p>
                      <p>• Kính mời quý khách khởi tạo QR code bên dưới, quét bằng mã Mobile Banking từ mọi Ngân hàng Việt Nam:</p>
                      <div className="mt-2.5 flex justify-center p-2 bg-white rounded border border-[#BDE4FF]">
                        <div className="text-center space-y-1">
                          <div className="w-24 h-24 bg-[#EBF7FF] flex flex-col items-center justify-center mx-auto border-2 border-dashed border-[#005BAA]">
                            <div className="w-14 h-14 border border-blue-400 bg-white rounded flex items-center justify-center text-[10px] font-black">QR VNPAY</div>
                          </div>
                          <span className="text-[8px] text-[#8B7E74] block mt-1">Hỗ trợ chiết khấu bớt 50.000đ khi quẹt qua VNPAY-QR</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MoMo E-Wallet instruction fallback */}
                  {paymentMethod === "EWallet" && (
                    <div className="p-3 bg-[#FFF0F6] rounded-lg text-[10px] text-[#A50567] leading-relaxed border border-[#FFD3E5] space-y-1">
                      <div className="flex items-center gap-1.5 border-b border-[#FFD3E5] pb-1 font-bold text-xs">
                        <span className="w-4.5 h-4.5 bg-[#A50567] text-white text-[8px] rounded flex items-center justify-center font-black">MoMo</span>
                        <span>Ví Điện Tử Quốc Dân MoMo E-Wallet</span>
                      </div>
                      <p>• Nhanh chóng, tức khắc, liên kết nguồn tiền ví MoMo Pay, Ngân hàng liên kết hoặc Ví Trả Sau.</p>
                      <p>• Hỗ trợ tích điểm sành điệu gấp 3 lần tậu mộc tại LuxeHome.</p>
                      <div className="mt-2.5 flex justify-center p-2 bg-white rounded border border-[#FFD3E5]">
                        <div className="text-center space-y-1">
                          <div className="w-24 h-24 bg-[#FFF5FA] flex flex-col items-center justify-center mx-auto border-2 border-dashed border-[#A50567]">
                            <div className="w-14 h-14 border border-pink-400 bg-white rounded flex items-center justify-center text-[9px] font-bold">MOMO PAY</div>
                          </div>
                          <span className="text-[8px] text-[#8B7E74] block mt-1">Quét tức khắc, miễn phí chiết khấu giao vận</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Checkout Totals & Button execution */}
          {cart.length > 0 && (
            <div className="p-6 bg-white border-t border-[#EADBC8] space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#8B7E74]">
                  <span>Giá trị đơn hàng gốc:</span>
                  <span>{formattedPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Mã giảm giá áp dụng:</span>
                    <span>-{formattedPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#8B7E74]">
                  <span>Vận chuyển (Xe tải đi đầu chuyên dụng):</span>
                  <span>{formattedPrice(shippingFee)}</span>
                </div>
                
                <div className="pt-2 border-t border-dashed border-[#EADBC8] flex justify-between text-sm font-bold text-[#1A1A1A]">
                  <span className="font-serif">Thành tiền đầu tư:</span>
                  <span className="text-[#D4AF37] text-lg font-black">{formattedPrice(totalAmount)}</span>
                </div>
              </div>

              {validationError && (
                <div className="p-3 bg-red-50 text-red-705 text-[11px] rounded-xl border border-red-100 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 animate-bounce" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Direct Purchase Button */}
              <button
                onClick={handlePlaceOrderClick}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5C4033] to-[#4A3B32] hover:from-[#4A3B32] hover:to-[#3A2D25] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                id="btn-place-order-confirmed"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Ký Đơn Đặt Hàng Thượng VIP
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
