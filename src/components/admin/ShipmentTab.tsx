import React, { useState, useEffect } from "react";
import { Truck, PackageCheck, PackageX, RefreshCw } from "lucide-react";
import { shipmentApi } from "../../api/api";

// Component dành cho vai trò "Đơn vị vận chuyển" trong sơ đồ AD_Tạo yêu cầu giao hàng.
// Style bám theo OrdersTab.tsx hiện có của bạn (bảng màu #5C4033 / #D4AF37 / #EADBC8).

interface PendingShipment {
  id: number;
  orderId: number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  carrierName: string;
  trackingCode: string | null;
  shippingStatus: "WAITING_CARRIER" | "RECEIVED" | "IN_TRANSIT";
}

const SHIPMENT_STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  WAITING_CARRIER: { label: "Chờ Tiếp Nhận", badgeClass: "bg-amber-100 text-amber-800" },
  RECEIVED: { label: "Đã Tiếp Nhận", badgeClass: "bg-blue-100 text-blue-800" },
  IN_TRANSIT: { label: "Đang Giao", badgeClass: "bg-cyan-100 text-cyan-800" },
};

export default function ShipmentTab() {
  const [shipments, setShipments] = useState<PendingShipment[]>([]);
  const [selected, setSelected] = useState<PendingShipment | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [showFailBox, setShowFailBox] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await shipmentApi.getPendingShipments();
      setShipments(data);
      if (selected) {
        const updated = data.find((s: PendingShipment) => s.id === selected.id);
        setSelected(updated || null);
      }
    } catch (err: any) {
      console.error("Lỗi lấy danh sách yêu cầu giao hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // "Tiếp nhận yêu cầu giao hàng"
  const handleReceive = async (shipmentId: number) => {
    try {
      await shipmentApi.receiveShipment(shipmentId);
      await fetchPending();
    } catch (err: any) {
      console.error("Lỗi tiếp nhận yêu cầu giao hàng:", err);
      alert(`Lỗi khi tiếp nhận yêu cầu giao hàng: ${err?.response?.data?.message || err?.message || ""}`);
    }
  };

  // "Cập nhật mã vận đơn" -> hệ thống lưu mã vận đơn + chuyển trạng thái "Đang giao"
  const handleUpdateTracking = async () => {
    if (!selected || !trackingCode.trim()) return;
    try {
      await shipmentApi.updateTrackingCode(selected.id, trackingCode.trim());
      setTrackingCode("");
      await fetchPending();
    } catch (err: any) {
      console.error("Lỗi cập nhật mã vận đơn:", err);
      alert(`Lỗi khi cập nhật mã vận đơn: ${err?.response?.data?.message || err?.message || ""}`);
    }
  };

  // Nhánh "Thành công": Ghi nhận giao hàng thành công -> Xác nhận khách đã nhận hàng
  const handleDeliverySuccess = async () => {
    if (!selected) return;
    try {
      await shipmentApi.recordDeliveryResult(selected.id, true);
      setSelected(null);
      await fetchPending();
    } catch (err: any) {
      console.error("Lỗi ghi nhận giao hàng thành công:", err);
      const detail = err?.response?.data?.message || err?.message || "Không rõ nguyên nhân.";
      alert(`Lỗi khi ghi nhận kết quả giao hàng: ${detail}`);
    }
  };

  // Nhánh "Thất bại": Ghi nhận giao hàng thất bại -> Nhập lí do giao thất bại
  const handleDeliveryFail = async () => {
    if (!selected || !failReason.trim()) return;
    try {
      await shipmentApi.recordDeliveryResult(selected.id, false, failReason.trim());
      setShowFailBox(false);
      setFailReason("");
      setSelected(null);
      await fetchPending();
    } catch (err: any) {
      console.error("Lỗi ghi nhận giao hàng thất bại:", err);
      alert(`Lỗi khi ghi nhận kết quả giao hàng: ${err?.response?.data?.message || err?.message || ""}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#EADBC8] pb-4">
        <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#D4AF37]" /> Yêu Cầu Giao Hàng
        </h3>
        <button
          onClick={fetchPending}
          className="text-xs flex items-center gap-1 text-[#5C4033] hover:text-[#D4AF37] font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* DANH SÁCH YÊU CẦU GIAO HÀNG */}
        <div className="lg:col-span-2 overflow-x-auto">
          <table className="w-full text-xs text-left border border-[#EADBC8] rounded-xl overflow-hidden shadow-sm">
            <thead className="bg-[#FAF6F0] text-[#5C4033]">
              <tr className="border-b border-[#EADBC8]">
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Mã vận đơn</th>
                <th className="p-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADBC8]/40 bg-white">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    Không có yêu cầu giao hàng nào đang chờ xử lý.
                  </td>
                </tr>
              ) : (
                shipments.map((s) => {
                  const meta = SHIPMENT_STATUS_META[s.shippingStatus];
                  return (
                    <tr
                      key={s.id}
                      onClick={() => {
                        setSelected(s);
                        setShowFailBox(false);
                        setTrackingCode(s.trackingCode || "");
                      }}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        selected?.id === s.id ? "bg-[#FAF6F0]/50" : ""
                      }`}
                    >
                      <td className="p-4 font-bold text-[#5C4033]">{s.orderCode}</td>
                      <td className="p-4">{s.customerName}</td>
                      <td className="p-4 font-mono">{s.trackingCode || "-"}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* CHI TIẾT & THAO TÁC */}
        <div className="bg-white border border-[#EADBC8] rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="font-bold text-[#5C4033] text-sm border-b pb-2">Xử Lý Giao Hàng</h3>

          {!selected ? (
            <div className="text-center py-12 text-gray-400">Chọn một yêu cầu để xử lý.</div>
          ) : (
            <div className="space-y-3 text-xs text-gray-700">
              <div><span className="font-bold text-gray-500">Mã đơn:</span> {selected.orderCode}</div>
              <div><span className="font-bold text-gray-500">Khách nhận:</span> {selected.customerName}</div>
              <div><span className="font-bold text-gray-500">SĐT:</span> {selected.customerPhone}</div>
              <div><span className="font-bold text-gray-500">Địa chỉ:</span> {selected.shippingAddress}</div>

              {/* Tiếp nhận yêu cầu giao hàng */}
              {selected.shippingStatus === "WAITING_CARRIER" && (
                <button
                  onClick={() => handleReceive(selected.id)}
                  className="w-full bg-[#5C4033] text-white p-2.5 rounded-lg font-bold hover:bg-[#4a3329] transition-colors"
                >
                  Tiếp Nhận Yêu Cầu Giao Hàng
                </button>
              )}

              {/* Cập nhật mã vận đơn */}
              {selected.shippingStatus === "RECEIVED" && (
                <div className="space-y-2 pt-2 border-t">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã Vận Đơn:</label>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="VD: LH2026070001"
                    className="w-full p-2 border border-[#EADBC8] rounded-lg outline-none text-xs"
                  />
                  <button
                    onClick={handleUpdateTracking}
                    className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Cập Nhật Mã Vận Đơn
                  </button>
                </div>
              )}

              {/* Ghi nhận kết quả giao hàng: Thành công / Thất bại */}
              {selected.shippingStatus === "IN_TRANSIT" && !showFailBox && (
                <div className="pt-2 border-t space-y-2">
                  <span className="block font-bold text-[#5C4033] text-[11px] uppercase">Kết Quả Giao Hàng:</span>
                  <button
                    onClick={handleDeliverySuccess}
                    className="w-full bg-emerald-600 text-white p-2.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <PackageCheck className="w-4 h-4" /> Giao Hàng Thành Công
                  </button>
                  <button
                    onClick={() => setShowFailBox(true)}
                    className="w-full bg-red-100 text-red-700 p-2.5 rounded-lg font-bold hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <PackageX className="w-4 h-4" /> Giao Hàng Thất Bại
                  </button>
                </div>
              )}

              {showFailBox && (
                <div className="space-y-2 p-3 bg-red-50 rounded-xl border border-red-200">
                  <label className="font-bold text-red-800 block text-[11px] uppercase">Lý Do Giao Thất Bại:</label>
                  <textarea
                    value={failReason}
                    onChange={(e) => setFailReason(e.target.value)}
                    placeholder="VD: Khách không nghe máy, sai địa chỉ..."
                    className="w-full border border-red-300 p-2 rounded text-xs outline-none focus:border-red-600 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeliveryFail}
                      className="bg-red-600 text-white px-3 py-1.5 rounded font-bold w-full text-center"
                    >
                      Xác Nhận Thất Bại
                    </button>
                    <button
                      onClick={() => setShowFailBox(false)}
                      className="bg-gray-400 text-white px-3 py-1.5 rounded w-full"
                    >
                      Quay lại
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}