
import React from "react";
import { ConsultationSchedule } from "../../types";

interface SchedulesTabProps {
  schedules: ConsultationSchedule[];
  onUpdateScheduleStatus: (scheduleId: string, status: ConsultationSchedule["status"]) => void;
}

export default function SchedulesTab({ schedules, onUpdateScheduleStatus }: SchedulesTabProps) {
  const formattedPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <table className="w-full text-xs text-left border border-[#EADBC8] rounded-xl overflow-hidden shadow-sm">
      <thead className="bg-[#FAF6F0] text-[#5C4033]">
        <tr className="border-b border-[#EADBC8]">
          <th className="p-4">Gia chủ</th>
          <th className="p-4">Liên hệ</th>
          <th className="p-4 text-right">Ngân sách</th>
          <th className="p-4 text-center">Trạng thái</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#EADBC8]/40">
        {schedules.map(sch => (
          <tr key={sch.id} className="hover:bg-gray-50">
            <td className="p-4 font-bold">{sch.customerName}</td>
            <td className="p-4">{sch.phone}</td>
            <td className="p-4 font-bold text-emerald-700 text-right">{formattedPrice(sch.budget)}</td>
            <td className="p-4 text-center">
              <select value={sch.status} onChange={(e) => onUpdateScheduleStatus(sch.id, e.target.value as any)} className="border border-gray-300 rounded p-1.5 outline-none focus:border-[#D4AF37]">
                <option value="pending">Chờ xử lý</option>
                <option value="completed">Chốt</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}