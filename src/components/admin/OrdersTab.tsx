
import React from "react";
import { Order } from "../../types";

interface OrdersTabProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order["status"]) => void;
}

export default function OrdersTab({ orders, onUpdateOrderStatus }: OrdersTabProps) {
  const formattedPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <table className="w-full text-xs text-left border border-[#EADBC8] rounded-xl overflow-hidden shadow-sm">
      <thead className="bg-[#FAF6F0] text-[#5C4033]">
        <tr className="border-b border-[#EADBC8]">
          <th className="p-4">Mã đơn</th>
          <th className="p-4">Khách hàng</th>
          <th className="p-4 text-right">Tổng tiền</th>
          <th className="p-4 text-center">Trạng thái</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#EADBC8]/40">
        {orders.map(o => (
          <tr key={o.id} className="hover:bg-gray-50">
            <td className="p-4 font-bold text-[#5C4033]">{o.id}</td>
            <td className="p-4">{o.customerName}</td>
            <td className="p-4 font-bold text-emerald-700 text-right">{formattedPrice(o.totalAmount)}</td>
            <td className="p-4 text-center">
              <select value={o.status} onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as any)} className="border border-gray-300 rounded p-1.5 outline-none focus:border-[#D4AF37]">
                <option value="pending">Chờ xử lý</option>
                <option value="completed">Đơn Hoàn Tất</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}