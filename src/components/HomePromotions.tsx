import { useEffect, useState } from "react";
import { Ticket, ArrowRight } from "lucide-react";
import { promotionApi } from "../api/api";

interface HomePromotionsProps {
  onOpenPromotionsPage: () => void;
}

export default function HomePromotions({ onOpenPromotionsPage }: HomePromotionsProps) {
  const [promotions, setPromotions] = useState<any[]>([]);

  useEffect(() => {
    promotionApi
      .getAvailablePromotions()
      .then((data) => {
        setPromotions(Array.isArray(data) ? data.slice(0, 3) : []);
      })
      .catch((err) => {
        console.error("Lỗi tải mã ưu đãi trang chủ:", err);
      });
  }, []);

  if (promotions.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="rounded-3xl border border-[#EADBC8] bg-[#FAF6F0] p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-bold">
              LuxeHome Offers
            </p>
            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mt-1">
              Ưu đãi tinh chọn hôm nay
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenPromotionsPage}
            className="hidden sm:flex items-center gap-2 rounded-full bg-white border border-[#EADBC8] px-4 py-2 text-xs font-bold text-[#5C4033] hover:bg-[#F4EBE1]"
          >
            Xem tất cả
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promotions.map((promo) => {
            const couponCode = promo.couponCode ?? promo.CouponCode;
            const promotionName = promo.promotionName ?? promo.PromotionName;
            const minOrderAmount = Number(promo.minOrderAmount ?? promo.MinOrderAmount ?? 0);

            return (
              <div
                key={couponCode}
                className="rounded-2xl bg-white border border-[#EADBC8] p-4 flex gap-3 items-start"
              >
                <div className="rounded-full bg-[#FAF6F0] p-2 border border-[#EADBC8]">
                  <Ticket className="w-5 h-5 text-[#D4AF37]" />
                </div>

                <div className="min-w-0">
                  <p className="font-black text-[#5C4033]">{couponCode}</p>
                  <p className="text-xs text-[#8B7E74] line-clamp-2 mt-1">
                    {promotionName}
                  </p>

                  {minOrderAmount > 0 && (
                    <p className="text-[10px] text-[#1A1A1A] font-bold mt-2">
                      Đơn từ {new Intl.NumberFormat("vi-VN").format(minOrderAmount)}đ
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenPromotionsPage}
          className="sm:hidden mt-5 w-full rounded-xl bg-[#5C4033] text-white py-2.5 text-xs font-bold uppercase"
        >
          Xem tất cả mã giảm giá
        </button>
      </div>
    </section>
  );
}