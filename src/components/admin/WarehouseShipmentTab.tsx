import React, { useState, useEffect } from "react";
import { Warehouse, Send, AlertCircle, RefreshCw } from "lucide-react";
import { shipmentApi } from "../../api/api";

// Component dành cho vai trò "Nhân viên kho" trong sơ đồ AD_Tạo yêu cầu giao hàng.
// Xử lý các bước: Xem danh sách đơn cần giao -> Chọn đơn cần giao
// -> Tạo yêu cầu giao hàng -> Bàn giao đơn hàng cho đơn vị vận chuyển

interface OrderToDeliver {
  id: number;
  orderCode: string;
  customerName: string;
  receiverPhone: string;
  shippingAddress: string;
  orderStatus: string;
  shippingStatus: string;
  staffNote: string | null;
}

export default function WarehouseShipmentTab() {
  const [orders, setOrders] = useState<OrderToDeliver[]>([]);
  const [selected, setSelected] = useState<OrderToDeliver | null>(null);
  const [carrierName, setCarrierName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await shipmentApi.getOrdersToDeliver();
      setOrders(data);
      if (selected) {
        const updated = data.find((o: OrderToDeliver) => o.id === selected.id);
        setSelected(updated || null);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách đơn cần giao:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // "Tạo yêu cầu giao hàng" + "Bàn giao đơn hàng cho đơn vị vận chuyển"
  const handleCreateShipment = async () => {
    if (!selected || !carrierName.trim()) return;
    try {
      await shipmentApi.createShipment(selected.id, carrierName.trim());
      setCarrierName("");
      setSelected(null);
      await fetchOrders();
      alert("Đã tạo yêu cầu giao hàng và bàn giao cho đơn vị vận chuyển!");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi khi tạo yêu cầu giao hàng.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#EADBC8] pb-4">
        <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-[#D4AF37]" /> Đơn Cần Giao (Kho)
        </h3>
        <button
          onClick={fetchOrders}
          className="text-xs flex items-center gap-1 text-[#5C4033] hover:text-[#D4AF37] font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* DANH SÁCH ĐƠN CẦN GIAO */}
        <div className="lg:col-span-2 overflow-x-auto">
          <table className="w-full text-xs text-left border border-[#EADBC8] rounded-xl overflow-hidden shadow-sm">
            <thead className="bg-[#FAF6F0] text-[#5C4033]">
              <tr className="border-b border-[#EADBC8]">
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADBC8]/40 bg-white">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-400">
                    Không có đơn nào đang chờ giao.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => {
                      setSelected(o);
                      setCarrierName("");
                    }}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      selected?.id === o.id ? "bg-[#FAF6F0]/50" : ""
                    }`}
                  >
                    <td className="p-4 font-bold text-[#5C4033]">{o.orderCode}</td>
                    <td className="p-4">{o.customerName}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          o.orderStatus === "DELIVERY_FAILED"
                            ? "bg-red-100 text-red-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {o.orderStatus === "DELIVERY_FAILED" ? "Giao Thất Bại - Cần Tạo Lại" : "Chờ Tạo Yêu Cầu"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CHI TIẾT & TẠO YÊU CẦU */}
        <div className="bg-white border border-[#EADBC8] rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="font-bold text-[#5C4033] text-sm border-b pb-2">Tạo Yêu Cầu Giao Hàng</h3>

          {!selected ? (
            <div className="text-center py-12 text-gray-400">Chọn một đơn để xử lý.</div>
          ) : (
            <div className="space-y-3 text-xs text-gray-700">
              <div><span className="font-bold text-gray-500">Mã đơn:</span> {selected.orderCode}</div>
              <div><span className="font-bold text-gray-500">Khách nhận:</span> {selected.customerName}</div>
              <div><span className="font-bold text-gray-500">SĐT:</span> {selected.receiverPhone}</div>
              <div><span className="font-bold text-gray-500">Địa chỉ:</span> {selected.shippingAddress}</div>

              {/* Xem lý do thất bại (nếu đang retry) */}
              {selected.orderStatus === "DELIVERY_FAILED" && selected.staffNote && (
                <div className="bg-red-50 p-2.5 rounded-lg border border-red-200 flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-700">Lý do giao thất bại lần trước:</div>
                    <div className="text-red-600">{selected.staffNote}</div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Đơn Vị Vận Chuyển:
                </label>
                <input
                  type="text"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  placeholder="VD: Giao Hàng Nhanh, Viettel Post..."
                  className="w-full p-2 border border-[#EADBC8] rounded-lg outline-none text-xs"
                />
                <button
                  onClick={handleCreateShipment}
                  disabled={!carrierName.trim()}
                  className="w-full bg-[#5C4033] text-white p-2.5 rounded-lg font-bold hover:bg-[#4a3329] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Tạo Yêu Cầu & Bàn Giao
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}