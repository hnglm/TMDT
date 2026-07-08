import { useState } from "react";
import { X, Trash2, Check, AlertCircle, ShoppingBag } from "lucide-react";
import { CartItem, Coupon, Order } from "../types";
import { MOCK_COUPONS } from "../mockData";
import { orderApi } from "../api/api";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;

  onCheckout: (order: Order) => void;
  currentUser: { id?: number | string | null; name: string; email: string } | null;
  onOpenAuth: () => void;
}

export default function CartSidebar({
  isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onCheckout, currentUser, onOpenAuth,
}: CartSidebarProps) {
  
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [city, setCity] = useState("Thành phố Hồ Chí Minh");
  const [district, setDistrict] = useState("Quận 2");
  const [detailAddress, setDetailAddress] = useState("120 Xa Lộ Hà Nội, Thảo Điền");
  const [phone, setPhone] = useState("0948548818");
  const [paymentMethod, setPaymentMethod] = useState<Order["paymentMethod"]>("COD");
  const [validationError, setValidationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity) + (item.assembleService ? 450000 * item.quantity : 0), 0);

  const discountAmount = appliedCoupon ? (appliedCoupon.discountType === "percent" ? (subtotal * appliedCoupon.value) / 100 : appliedCoupon.value) : 0;
  const shippingFee = city === "Thành phố Hồ Chí Minh" ? 250000 : 750000;
  const totalAmount = subtotal - discountAmount + shippingFee;
  // Định nghĩa kiểu dữ liệu khớp với C# DTO
  interface CreateOrderRequest {
  userId: number;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  customerNote?: string | null;
  couponCode?: string | null;
  paymentMethod: string;
  items: { productId: number; variantId: number; quantity: number }[]; // Sửa "Items" thành "items"
}

  const handlePlaceOrderClick = async () => {
  setValidationError("");

  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  if (!token) {
    setValidationError("Vui lòng đăng nhập để đặt hàng.");
    onOpenAuth();
    return;
  }

  if (!currentUser) {
    setValidationError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
    onOpenAuth();
    return;
  }

  const userId = Number(currentUser.id);

  if (!userId || Number.isNaN(userId)) {
    setValidationError("Không tìm thấy UserId. Vui lòng đăng xuất rồi đăng nhập lại.");
    return;
  }

  if (!phone || !detailAddress) {
    setValidationError("Vui lòng điền đầy đủ số điện thoại và địa chỉ giao hàng.");
    return;
  }

  setIsLoading(true);

  try {
    const orderData: CreateOrderRequest = {
      userId,
      receiverName: currentUser?.name || "Khách vãng lai",
      receiverPhone: phone,
      shippingAddress: `${detailAddress}, ${district}, ${city}`,
      customerNote: "Đơn hàng từ giỏ hàng",
      couponCode: appliedCoupon?.code || null,
      paymentMethod: paymentMethod,
      items: cart.map((item) => ({
        productId: Number(item.product.id),
        variantId: Number(item.product.id),
        quantity: item.quantity,
      })),
    };

    console.log("Order Data:", orderData);

    if (paymentMethod === "VNPAY") {
  const response = await fetch("http://localhost:5200/api/Orders/create-payment-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId,
      receiverName: currentUser?.name || "Khách hàng",
      receiverPhone: phone,
      shippingAddress: `${detailAddress}, ${district}, ${city}`,
      customerNote: "Đơn hàng thanh toán VNPay",
      couponCode: appliedCoupon?.code || null,
      paymentMethod: "VNPAY",
      totalAmount,
      items: cart.map((item) => ({
        productId: Number(item.product.id),
        variantId: Number(item.product.id),
        quantity: item.quantity,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    setValidationError(error.message || "Không tạo được link thanh toán VNPay.");
    setIsLoading(false);
    return;
  }

  const data = await response.json();

  if (!data.paymentUrl) {
    setValidationError("Backend không trả về paymentUrl.");
    setIsLoading(false);
    return;
  }

  window.location.href = data.paymentUrl;
  return;
}

    // COD / BankTransfer / EWallet thì tạo đơn như cũ
    const response = await orderApi.createOrder(orderData as any);

    onCheckout({
      id: response.orderId,
      date: new Date().toISOString(),
      customerName: currentUser?.name || "Khách vãng lai",
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
        color: Array.isArray(item.product.colors)
          ? item.product.colors.join(", ")
          : item.product.colors || "",
        material: item.product.material || "",
        assembleService: item.assembleService,
      })),
      couponApplied: appliedCoupon?.code,
      discountAmount,
      shippingFee,
      totalAmount,
      paymentMethod,
      status: "pending",
      paymentStatus: "Chưa thanh toán",
      trackingSteps: [],
    });

    if (paymentMethod === "COD") {
      alert(
        `✅ Đặt hàng thành công!\n\n📦 Mã đơn: ${response.orderId}\n💰 Thanh toán khi nhận hàng\n📍 Địa chỉ: ${detailAddress}, ${district}, ${city}\n📞 SĐT: ${phone}`
      );
    } else {
      alert("Đặt hàng thành công! Mã đơn: " + response.orderId);
    }

    setIsLoading(false);
  } catch (err: any) {
    console.error(err);
    setValidationError(err.response?.data?.message || err.message || "Đặt hàng thất bại.");
    setIsLoading(false);
  }
};
  return (
    <>
      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col overflow-hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#EADBC8]">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Giỏ Hàng</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F4EBE1] rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-[#4A3B32]" />
          </button>
        </div>

        <div className="cart-modal-scrollbar flex-1 min-h-0 overflow-y-auto">
          {/* Content */}
          <div>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <ShoppingBag className="w-12 h-12 text-[#EADBC8] mb-4" />
                <p className="text-[#8B7E74] text-sm">Giỏ hàng của bạn trống</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 p-3 bg-[#FAF6F0] rounded-lg border border-[#EADBC8]"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-20 h-20 shrink-0 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-[#1A1A1A]">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-[#8B7E74]">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(item.product.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              item.product.id,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          className="px-2 py-1 bg-white border border-[#EADBC8] rounded text-xs"
                        >
                          -
                        </button>
                        <span className="text-sm">{item.quantity}</span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="px-2 py-1 bg-white border border-[#EADBC8] rounded text-xs"
                        >
                          +
                        </button>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="ml-auto text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Section */}
          {cart.length > 0 && (
            <div className="border-t border-[#EADBC8] p-6 space-y-4">
            {/* Shipping Address */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#4A3B32]">
                Số điện thoại
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded text-sm"
                placeholder="0948548818"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#4A3B32]">
                Địa chỉ giao hàng
              </label>
              <input
                type="text"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded text-sm"
                placeholder="Địa chỉ"
              />
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#4A3B32]">
                Phương thức thanh toán
              </label>
              <div className="space-y-2">
                {[
                  { value: "COD" as const, label: "Thanh toán khi nhận hàng (COD)" },
                  { value: "BankTransfer" as const, label: "Chuyển khoản ngân hàng" },
                  { value: "VNPAY" as const, label: "VNPAY" },
                  { value: "EWallet" as const, label: "Ví điện tử" },
                ].map((method) => (
                  <label key={method.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value as Order["paymentMethod"])}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-[#4A3B32]">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="space-y-2 py-3 border-y border-[#EADBC8] text-sm">
              <div className="flex justify-between">
                <span className="text-[#8B7E74]">Tạm tính:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(subtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá:</span>
                  <span>
                    -
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#8B7E74]">Vận chuyển:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2 font-bold text-base">
                <span>Tổng cộng:</span>
                <span className="text-[#D4AF37]">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(totalAmount)}
                </span>
              </div>
            </div>

            {validationError && (
              <div className="p-3 bg-red-100 border border-red-300 rounded text-xs text-red-700 flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {validationError}
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handlePlaceOrderClick}
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                isLoading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-[#5C4033] to-[#8B6F47] text-white hover:shadow-lg"
              }`}
            >
              <Check className="w-5 h-5" />
              {isLoading ? "Đang xử lý..." : "Ký Đơn Đặt Hàng"}
            </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}