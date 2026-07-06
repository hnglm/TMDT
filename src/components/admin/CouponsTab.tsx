
import React from "react";
import { Coupon } from "../../types";

interface CouponsTabProps {
  coupons: Coupon[];
}

export default function CouponsTab({ coupons }: CouponsTabProps) {
  const formattedPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {coupons.map(c => (
        <div key={c.code} className="p-5 border border-[#EADBC8] rounded-2xl flex justify-between items-center bg-white shadow-sm">
          <div>
            <span className="font-mono font-black text-lg text-[#5C4033] block">{c.code}</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold mt-1 block">
              Giảm {c.discountType === 'percent' ? `${c.value}%` : formattedPrice(c.value)}
            </span>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 rounded-full">ACTIVE</span>
        </div>
      ))}
    </div>
  );
}