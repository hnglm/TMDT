import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Order, ConsultationSchedule, Coupon } from "../../types";

interface DashboardTabProps {
  orders: Order[];
  schedules: ConsultationSchedule[];
  coupons: Coupon[];
}

export default function DashboardTab({ orders, schedules, coupons }: DashboardTabProps) {
  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const totalRevenue = useMemo(() => {
    return orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const fullTimelineData = useMemo(() => {
    let mayRevenue = 0, maySold = 0, junRevenue = 0, junSold = 0;
    orders.forEach(o => {
      if (!o.date) return;
      const m = o.date.split("-")[1];
      const count = o.items.reduce((acc, it) => acc + it.quantity, 0);
      if (m === "05" && o.status !== "cancelled") { mayRevenue += o.totalAmount; maySold += count; }
      else if (m === "06" && o.status !== "cancelled") { junRevenue += o.totalAmount; junSold += count; }
    });
    return [
      { name: "Tháng 01", "Doanh thu": 124000000, "Bán ra": 12 },
      { name: "Tháng 02", "Doanh thu": 182000000, "Bán ra": 18 },
      { name: "Tháng 03", "Doanh thu": 245000000, "Bán ra": 24 },
      { name: "Tháng 04", "Doanh thu": 210000000, "Bán ra": 20 },
      { name: "Tháng 05", "Doanh thu": mayRevenue > 0 ? mayRevenue : 155000000, "Bán ra": maySold > 0 ? maySold : 15 },
      { name: "Tháng 06", "Doanh thu": junRevenue > 0 ? junRevenue : 82000000, "Bán ra": junSold > 0 ? junSold : 8 },
    ];
  }, [orders]);

  return (
    <div className="space-y-8">
      {/* Thẻ Thống Kê */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8]">
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase block">Doanh thu Đơn Hàng</span>
          <h2 className="font-serif text-2xl font-black text-[#5C4033] mt-2">{formattedPrice(totalRevenue)}</h2>
        </div>
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8]">
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase block">Tổng số lượng đơn đặt</span>
          <h2 className="font-serif text-2xl font-black text-[#1A1A1A] mt-2">{orders.length} đơn</h2>
        </div>
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8]">
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase block">Tư vấn mặt bằng</span>
          <h2 className="font-serif text-2xl font-black text-[#1A1A1A] mt-2">{schedules.length} cuộc hẹn</h2>
        </div>
        <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EADBC8]">
          <span className="text-[10px] text-[#8B7E74] font-bold uppercase block">Phiếu giảm giá VIP</span>
          <h2 className="font-serif text-2xl font-black text-[#1A1A1A] mt-2">{coupons.length} mã</h2>
        </div>
      </section>

      {/* Biểu Đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={fullTimelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Doanh thu" fill="#D4AF37" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={fullTimelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Bán ra" fill="#5C4033" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}