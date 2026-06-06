import React from "react";
import { Sparkles, ShoppingCart, Percent, Layers, ShieldCheck, ArrowRight, UserCheck } from "lucide-react";
import { Combo, Product } from "../types";

interface ComboViewProps {
  combos: Combo[];
  products: Product[];
  onAddComboToCart: (combo: Combo, products: Product[]) => void;
  onSelectProduct: (product: Product) => void;
}

export default function ComboView({
  combos,
  products,
  onAddComboToCart,
  onSelectProduct,
}: ComboViewProps) {
  
  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const calculateSavings = (combo: Combo) => {
    return combo.price - combo.discountPrice;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="combo-catalog-view">
      
      {/* Header Introduction */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-[10px] tracking-widest font-extrabold text-[#D4AF37] uppercase bg-[#FAF6F0] border border-[#EADBC8] px-3.5 py-1.5 rounded-full">
          Mua Trọn Gói - Lắp Trọn Đóng
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1A1A1A] mt-3">
          Combo Thiết Kế Không Gian Nguyên Khối
        </h1>
        <p className="text-xs text-[#8B7E74] mt-2">
          Hưởng ưu đãi đặc biệt lên tới 8.000.000đ khi lựa chọn đặt trọn căn phòng đồng điệu. LuxeHome hỗ trợ lắp đặt, sơn dầu bảo dưỡng, và tinh chỉnh theo chiều dài mặt bằng chi tiết của Quý khách.
        </p>
      </div>

      {/* Grid listing combos */}
      <div className="space-y-16" id="combo-list-container">
        {combos.map((combo, index) => {
          // Find actual product items inside this combo
          const comboItems = combo.productIds
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is Product => !!p);

          const savings = calculateSavings(combo);

          return (
            <div 
              key={combo.id}
              className={`bg-white rounded-2xl border border-[#EADBC8] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0 ${
                index % 2 === 1 ? "md:direction-rtl" : ""
              }`}
            >
              
              {/* Photo representation section */}
              <div className="lg:col-span-5 relative h-80 lg:h-auto min-h-[320px]">
                <img src={combo.image} alt={combo.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#D4AF37] mb-1">
                    Gói nội thất thương gia
                  </span>
                  <h2 className="font-serif text-xl md:text-2xl font-black text-white leading-tight">
                    {combo.name}
                  </h2>
                  <p className="text-xs text-[#FAF6F0]/80 mt-1.5 font-sans leading-relaxed">
                    Được các kiến trúc sư sắp đặt cho căn hộ diện tích {combo.roomSize}.
                  </p>
                </div>
              </div>

              {/* Combo configuration & constituent items lists */}
              <div className="lg:col-span-7 p-8 flex flex-col justify-between space-y-6">
                
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#F4EBE1] text-[#5C4033]">
                      Phân loại: {combo.roomType}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded flex items-center gap-1 border border-emerald-200">
                      <Percent className="w-3.5 h-3.5" />
                      Tiết kiệm {formattedPrice(savings)} khi đặt combo!
                    </span>
                  </div>

                  <p className="text-xs text-[#5C4033] leading-relaxed mb-6 italic">
                    "{combo.description}"
                  </p>

                  {/* Individual products comprising */}
                  <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-[#D4AF37] mb-3">Sản phẩm bao gồm trong trọn bộ:</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {comboItems.map((prod) => (
                      <div 
                        key={prod.id}
                        onClick={() => onSelectProduct(prod)}
                        className="p-3 bg-[#FAF6F0] rounded-xl border border-[#EADBC8] hover:bg-[#EADBC8]/30 transition-colors cursor-pointer flex items-center gap-3"
                      >
                        <img src={prod.images[0]} alt={prod.name} className="w-12 h-12 object-cover rounded-lg border border-[#EADBC8]" />
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-[#1A1A1A] truncate">{prod.name}</h5>
                          <span className="text-[10px] text-[#8B7E74]">Giá lẻ: {formattedPrice(prod.price)}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                      </div>
                    ))}
                  </div>

                </div>

                {/* Pricing summary & Quick checkout added to Cart */}
                <div className="pt-6 border-t border-[#EADBC8]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50/40 p-4 rounded-xl border border-[#D4AF37]/30">
                  <div>
                    <span className="text-[10px] text-[#8B7E74] line-through block">Tổng cộng giá mua rời: {formattedPrice(combo.price)}</span>
                    <span className="text-xl font-serif font-black text-[#5C4033]">Trọn bộ chỉ: {formattedPrice(combo.discountPrice)}</span>
                  </div>

                  <button
                    onClick={() => onAddComboToCart(combo, comboItems)}
                    className="w-full sm:w-auto px-6 py-3 bg-[#5C4033] hover:bg-[#4A3B32] text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-colors shadow-md hover:shadow-lg"
                    id={`btn-add-combo-${combo.id}`}
                  >
                    <ShoppingCart className="w-4 h-4 text-[#D4AF37]" />
                    Sở Hữu Nguyên Combo
                  </button>
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
