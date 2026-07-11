import { useEffect, useState } from "react";
import { Ticket, Save, CheckCircle, AlertCircle } from "lucide-react";
import { promotionApi } from "../api/api";

interface PromotionsPageProps {
  currentUser: { id?: number | string | null; name: string; email: string } | null;
  onOpenAuth: () => void;
}

export default function PromotionsPage({ currentUser, onOpenAuth }: PromotionsPageProps) {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await promotionApi.getAvailablePromotions();
      console.log("AVAILABLE PROMOTIONS:", data);
      setPromotions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải mã giảm giá:", err);
      setMessage("Không tải được danh sách mã giảm giá.");
    } finally {
      setLoading(false);
    }
  };

  const loadMySavedPromotions = async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token) {
      setSavedCodes([]);
      return;
    }

    try {
      const data = await promotionApi.getMyPromotions();
      console.log("MY SAVED PROMOTIONS:", data);

      const codes = Array.isArray(data)
        ? data
            .map((item: any) => item.couponCode ?? item.CouponCode)
            .filter(Boolean)
            .map((code: string) => code.toUpperCase())
        : [];

      setSavedCodes(codes);
    } catch (err) {
      console.error("Lỗi tải ví mã giảm giá:", err);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  useEffect(() => {
    loadMySavedPromotions();
  }, [currentUser]);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const getPromotionTitle = (promo: any) => {
    const type = String(promo.promotionType ?? promo.PromotionType ?? "").toUpperCase();
    const value = Number(promo.discountValue ?? promo.DiscountValue ?? 0);

    if (type === "PERCENT" || type === "PERCENTAGE") {
      return `Giảm ${value}%`;
    }

    if (type === "FIXED" || type === "AMOUNT") {
      return `Giảm ${formatMoney(value)}`;
    }

    if (type === "FREESHIP" || type === "FREE_SHIP") {
      return "Miễn phí vận chuyển";
    }

    if (type === "INSTALLATION") {
      return "Hỗ trợ phí lắp ráp";
    }

    return "Ưu đãi LuxeHome";
  };

  const handleSavePromotion = async (couponCode: string) => {
    console.log("CLICK SAVE PROMOTION:", couponCode);

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token || !currentUser) {
      setMessage("Vui lòng đăng nhập để lưu mã giảm giá.");
      onOpenAuth();
      return;
    }

    if (!couponCode) {
      setMessage("Không tìm thấy mã ưu đãi để lưu.");
      return;
    }

    try {
      setSavingCode(couponCode);
      setMessage("");

      const result = await promotionApi.savePromotion({
        couponCode,
      });

      console.log("SAVE PROMOTION RESULT:", result);

      setMessage(result.message || `Đã lưu mã ${couponCode}.`);

      setSavedCodes((prev) => {
        const upperCode = couponCode.toUpperCase();
        if (prev.includes(upperCode)) return prev;
        return [...prev, upperCode];
      });
    } catch (err: any) {
      console.error("Lỗi lưu mã:", err);
      setMessage(err.response?.data?.message || "Không lưu được mã giảm giá.");
    } finally {
      setSavingCode(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-bold">
          LuxeHome Privilege
        </p>

        <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mt-2">
          Trung tâm mã giảm giá
        </h1>

        <p className="text-sm text-[#8B7E74] mt-2">
          Lưu những ưu đãi tinh tế dành riêng cho đơn hàng nội thất của bạn.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-[#EADBC8] bg-[#FAF6F0] px-4 py-3 text-sm text-[#5C4033] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#D4AF37]" />
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-[#8B7E74]">Đang tải mã giảm giá...</div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#EADBC8] bg-[#FAF6F0] p-10 text-center">
          <Ticket className="w-12 h-12 mx-auto text-[#D4AF37] mb-3" />
          <p className="text-sm text-[#8B7E74]">Hiện chưa có mã giảm giá khả dụng.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {promotions.map((promo) => {
            const couponCode = String(promo.couponCode ?? promo.CouponCode ?? "").toUpperCase();
            const promotionName = promo.promotionName ?? promo.PromotionName;
            const minOrderAmount = Number(promo.minOrderAmount ?? promo.MinOrderAmount ?? 0);
            const maxDiscountAmount = promo.maxDiscountAmount ?? promo.MaxDiscountAmount;
            const isSaved = savedCodes.includes(couponCode);

            return (
              <div
                key={couponCode}
                className="relative overflow-hidden rounded-2xl border border-[#EADBC8] bg-white shadow-sm"
              >
                <div className="absolute top-0 left-0 h-full w-1.5 bg-[#D4AF37]" />

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#8B7E74] font-bold">
                        Mã ưu đãi
                      </p>

                      <h3 className="font-serif text-xl font-bold text-[#5C4033]">
                        {couponCode}
                      </h3>
                    </div>

                    <div className="rounded-full bg-[#FAF6F0] border border-[#EADBC8] p-2">
                      <Ticket className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                  </div>

                  <div>
                    <p className="text-lg font-black text-[#1A1A1A]">
                      {getPromotionTitle(promo)}
                    </p>

                    <p className="text-xs text-[#8B7E74] mt-1">
                      {promotionName}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-[#5C4033]">
                    {minOrderAmount > 0 && (
                      <p>
                        Đơn tối thiểu:{" "}
                        <span className="font-bold">{formatMoney(minOrderAmount)}</span>
                      </p>
                    )}

                    {maxDiscountAmount && (
                      <p>
                        Giảm tối đa:{" "}
                        <span className="font-bold">
                          {formatMoney(Number(maxDiscountAmount))}
                        </span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!couponCode || isSaved || savingCode === couponCode}
                    onClick={() => handleSavePromotion(couponCode)}
                    className={`w-full rounded-xl py-2.5 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${
                      isSaved
                        ? "bg-emerald-600 text-white cursor-default"
                        : "bg-[#5C4033] hover:bg-[#4A3B32] text-white"
                    }`}
                  >
                    {savingCode === couponCode ? (
                      "Đang lưu..."
                    ) : isSaved ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Đã lưu
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-[#D4AF37]" />
                        Lưu mã
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}