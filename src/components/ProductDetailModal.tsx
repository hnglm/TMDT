import React, { useState } from "react";
import { X, Heart, Shield, Rotate3d, Check, Sparkles, Scale } from "lucide-react";
import { Product } from "../types";

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color: string, assemble: boolean) => void;
  onToggleCompare: (product: Product) => void;
  isCompared: boolean;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: boolean;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onToggleCompare,
  isCompared,
  onToggleWishlist,
  isWishlisted,
}: ProductDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [is360Active, setIs360Active] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "Default");
  const [quantity, setQuantity] = useState(1);
  const [assembleService, setAssembleService] = useState(false);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);

  // For 360 simulation
  const rotate360 = () => {
    let current = activeImageIndex;
    const interval = setInterval(() => {
      current = (current + 1) % product.images.length;
      setActiveImageIndex(current);
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
    }, 2000);
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity, selectedColor, assembleService);
    setIsAddedSuccess(true);
    setTimeout(() => setIsAddedSuccess(false), 2000);
  };

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="product-detail-modal">
      <div className="flex items-center justify-center min-h-screen p-4 md:p-8">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative bg-[#FAF6F0] rounded-2xl max-w-4xl w-full mx-auto shadow-2xl overflow-hidden border border-[#EADBC8] transform transition-all">
          
          {/* Header Controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => onToggleWishlist(product.id)}
              className="p-2.5 rounded-full bg-white/90 hover:bg-white text-[#5C4033] shadow-md transition-transform active:scale-95"
              id="detail-wishlist-toggle"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/90 hover:bg-white text-[#5C4033] shadow-md transition-transform active:scale-95"
              id="detail-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Visual Section */}
            <div className="p-6 bg-white flex flex-col justify-between border-r border-[#EADBC8]">
              <div>
                <span className="text-[10px] tracking-widest uppercase font-bold text-[#D4AF37] mb-1 block">
                  {product.brand} • {product.style}
                </span>
                <span className="inline-block px-2 py-0.5 bg-[#F4EBE1] text-[#5C4033] text-xs font-semibold rounded mb-3">
                  {product.categoryName}
                </span>

                {/* Main viewport */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-[#FAF6F0] border border-[#EADBC8]/60 flex items-center justify-center group mb-4">
                  <img
                    src={product.images[activeImageIndex]}
                    alt={`${product.name} perspective ${activeImageIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-700"
                    id="zoomable-preview-img"
                  />
                  
                  {is360Active && (
                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
                      <div className="px-3 py-1 bg-[#5C4033]/90 text-white text-[11px] font-semibold tracking-wider rounded-full uppercase flex items-center gap-1.5 shadow-lg">
                        <Rotate3d className="w-3.5 h-3.5 animate-spin" />
                        Chế độ 360° Đang Mô Phỏng
                      </div>
                    </div>
                  )}

                  {/* Rotate 360 Action Overlay */}
                  <button
                    onClick={() => {
                      setIs360Active(true);
                      rotate360();
                      setTimeout(() => setIs360Active(false), 2000);
                    }}
                    className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-[#5C4033] rounded-full text-xs font-semibold shadow-md border border-[#EADBC8] transition-colors"
                    id="btn-360-rotate"
                  >
                    <Rotate3d className="w-4 h-4 text-[#D4AF37]" />
                    Xem ảnh 360°
                  </button>
                </div>

                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {product.images.map((img, i) => (
                    <button
                      key={img}
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIndex === i ? "border-[#D4AF37] ring-1 ring-[#D4AF37]" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Quality Specs */}
              <div className="mt-4 pt-4 border-t border-[#EADBC8]/40 space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#5C4033] font-medium">
                  <Shield className="w-4 h-4 text-[#D4AF37]" />
                  <span>Bảo hành thượng hạng: <strong>{product.warranty}</strong></span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#8B7E74]">
                  <span>Trạng thái hàng: <strong>{product.stock > 0 ? `Còn hàng (${product.stock} bộ)` : "Đặt trước"}</strong></span>
                  <span>Chất liệu: <strong>{product.material.split(",")[0]}</strong></span>
                </div>
              </div>
            </div>

            {/* Config & Purchase Section */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                <h1 className="font-serif text-2xl font-bold text-[#1A1A1A] leading-tight mb-2">
                  {product.name}
                </h1>
                
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl font-bold text-[#D4AF37]">
                    {formattedPrice(product.price)}
                  </span>
                  {product.discountPrice && (
                    <span className="text-sm text-[#8B7E74] line-through">
                      {formattedPrice(product.discountPrice)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5C4033] leading-relaxed mb-6 font-medium bg-[#F4EBE1] p-3 rounded-lg border-l-4 border-[#D4AF37]">
                  {product.description}
                </p>

                {/* Specs list */}
                <div className="space-y-3 mb-6 bg-white p-4 rounded-xl border border-[#EADBC8]/50 text-xs">
                  <h3 className="font-semibold text-[#1A1A1A] uppercase tracking-wider text-[10px]">Thông số chi tiết</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-[#4A3B32]">
                    <div>Kích thước:</div> <div className="font-medium text-[#1A1A1A]">{product.dimensions}</div>
                    <div>Thương hiệu:</div> <div className="font-medium text-[#1A1A1A]">{product.brand}</div>
                    <div>Nhà cung cấp:</div> <div className="font-medium text-[#1A1A1A]">LuxeHome Exclusive</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#EADBC8]/40">
                    <p className="text-[#8B7E74] leading-relaxed text-[11px] italic">{product.longDescription}</p>
                  </div>
                </div>

                {/* Configuration Options */}
                <div className="space-y-4 mb-6">
                  {/* Select Color */}
                  <div>
                    <label className="block text-xs font-bold text-[#5C4033] uppercase tracking-wider mb-2">Màu sắc tinh chọn:</label>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                            selectedColor === color
                              ? "bg-[#5C4033] text-white border-[#5C4033] shadow-sm"
                              : "bg-white text-[#5C4033] border-[#EADBC8] hover:bg-[#FAF6F0]"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Installation support checkbox */}
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#EADBC8]/50">
                    <input
                      type="checkbox"
                      id="assemble-service"
                      checked={assembleService}
                      onChange={(e) => setAssembleService(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <label htmlFor="assemble-service" className="text-xs font-semibold text-[#4A3B32] cursor-pointer">
                      Yêu cầu lắp ráp chuyên nghiệp giao hàng tận nơi (+450.000đ)
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex items-center border border-[#EADBC8] rounded-xl bg-white overflow-hidden">
                  <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-3 py-2 text-[#5C4033] hover:bg-[#FAF6F0] transition-colors font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 text-sm font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-[#5C4033] hover:bg-[#FAF6F0] transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCartClick}
                    disabled={product.stock <= 0}
                    className={`flex-1 py-3 px-6 rounded-xl flex items-center justify-center gap-2 font-bold text-sm tracking-wide transition-all ${
                      isAddedSuccess
                        ? "bg-emerald-600 text-white"
                        : product.stock > 0
                        ? "bg-gradient-to-r from-[#5C4033] to-[#4A3B32] text-white hover:from-[#4A3B32] hover:to-[#3A2D25] shadow-md hover:shadow-lg"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    id="add-to-cart-action-btn"
                  >
                    {isAddedSuccess ? (
                      <>
                        <Check className="w-5 h-5 animate-bounce" />
                        Đã Thêm Vào Giỏ!
                      </>
                    ) : product.stock > 0 ? (
                      <>
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        Thêm Vào Giỏ Hàng
                      </>
                    ) : (
                      "Hết Hàng / Nhận Đặt Trước"
                    )}
                  </button>
                </div>

                <button
                  onClick={() => onToggleCompare(product)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    isCompared
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]"
                      : "bg-transparent text-[#5C4033] border-[#EADBC8] hover:bg-[#F4EBE1]"
                  }`}
                  id="add-to-compare-btn"
                >
                  <Scale className="w-4 h-4" />
                  {isCompared ? "Đang so sánh" : "So Sánh Sản Phẩm"}
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
