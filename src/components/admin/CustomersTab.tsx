import React, { useState, useEffect } from "react";
import { Users, Search, RefreshCw, X, MessageSquarePlus, Clock, CheckCircle2, CalendarClock } from "lucide-react";
import { customerApi } from "../../api/api";

// Component CSKH cho Nhân viên bán hàng / Admin — đúng theo sơ đồ AD_Xem chi tiết khách hàng
// Style bám theo OrdersTab.tsx hiện có (bảng màu #5C4033 / #D4AF37 / #EADBC8 / #FAF6F0)

interface CustomerListItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

interface CareLog {
  id: number;
  customerId: number;
  staffId: number;
  staffName: string | null;
  needNote: string | null;
  careType: string;
  careMessage: string | null;
  status: "WAITING" | "RESPONDED" | "SCHEDULED";
  responseResult: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
}

const CARE_TYPE_LABEL: Record<string, string> = {
  PROMOTION: "Khuyến mãi",
  ORDER_REMINDER: "Nhắc đơn",
  GREETING: "Hỏi thăm",
  OTHER: "Khác",
};

const CARE_STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  WAITING: { label: "Đang Theo Dõi", badgeClass: "bg-amber-100 text-amber-800" },
  RESPONDED: { label: "Đã Phản Hồi", badgeClass: "bg-emerald-100 text-emerald-700" },
  SCHEDULED: { label: "Chờ Chăm Sóc Lại", badgeClass: "bg-blue-100 text-blue-800" },
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

export default function CustomersTab() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CustomerListItem | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [detailTab, setDetailTab] = useState<"orders" | "care">("orders");

  // Form "Ghi chú nhu cầu" + "Gửi thông báo chăm sóc"
  const [showCareForm, setShowCareForm] = useState(false);
  const [needNote, setNeedNote] = useState("");
  const [careType, setCareType] = useState("PROMOTION");
  const [careMessage, setCareMessage] = useState("");

  // Form phản hồi / lên lịch cho từng care log
  const [respondingLogId, setRespondingLogId] = useState<number | null>(null);
  const [responseResult, setResponseResult] = useState("");
  const [schedulingLogId, setSchedulingLogId] = useState<number | null>(null);
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerApi.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Lỗi lấy danh sách khách hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const loadCustomerDetail = async (customer: CustomerListItem) => {
    setSelected(customer);
    setShowCareForm(false);
    setDetailTab("orders");
    try {
      const [ordersData, careLogsData] = await Promise.all([
        customerApi.getCustomerOrders(customer.id),
        customerApi.getCareLogs(customer.id),
      ]);
      setOrders(ordersData);
      setCareLogs(careLogsData);
    } catch (err) {
      console.error("Lỗi tải chi tiết khách hàng:", err);
    }
  };

  const refreshCareLogs = async () => {
    if (!selected) return;
    try {
      const data = await customerApi.getCareLogs(selected.id);
      setCareLogs(data);
    } catch (err) {
      console.error("Lỗi tải lịch sử chăm sóc:", err);
    }
  };

  // "Ghi chú nhu cầu khách hàng" + "Gửi thông báo chăm sóc khách hàng"
  const handleCreateCareLog = async () => {
    if (!selected || !careMessage.trim()) return;
    try {
      await customerApi.createCareLog(selected.id, {
        needNote: needNote.trim() || undefined,
        careType,
        careMessage: careMessage.trim(),
      });
      setNeedNote("");
      setCareMessage("");
      setShowCareForm(false);
      setDetailTab("care");
      await refreshCareLogs();
    } catch (err: any) {
      console.error("Lỗi tạo nhật ký chăm sóc:", err);
      alert(`Lỗi khi gửi thông báo chăm sóc: ${err?.response?.data?.message || err?.message || ""}`);
    }
  };

  // Nhánh "Có phản hồi" -> "Cập nhật kết quả chăm sóc"
  const handleUpdateResponse = async (logId: number) => {
    if (!responseResult.trim()) return;
    try {
      await customerApi.updateCareResponse(logId, responseResult.trim());
      setResponseResult("");
      setRespondingLogId(null);
      await refreshCareLogs();
    } catch (err: any) {
      console.error("Lỗi cập nhật kết quả chăm sóc:", err);
      alert(`Lỗi khi cập nhật kết quả: ${err?.response?.data?.message || err?.message || ""}`);
    }
  };

  // Nhánh "Không phản hồi" -> "Đánh dấu chờ phản hồi / lên lịch chăm sóc lại"
  const handleScheduleFollowUp = async (logId: number) => {
    try {
      await customerApi.scheduleFollowUp(logId, nextFollowUpAt || null);
      setNextFollowUpAt("");
      setSchedulingLogId(null);
      await refreshCareLogs();
    } catch (err: any) {
      console.error("Lỗi lên lịch chăm sóc lại:", err);
      alert(`Lỗi khi lên lịch: ${err?.response?.data?.message || err?.message || ""}`);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#EADBC8] pb-4">
        <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
          <Users className="w-5 h-5 text-[#D4AF37]" /> Chăm Sóc Khách Hàng
        </h3>
        <button
          onClick={fetchCustomers}
          className="text-xs flex items-center gap-1 text-[#5C4033] hover:text-[#D4AF37] font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
        </button>
      </div>

      <div className="flex items-center gap-2 bg-[#FAF6F0] p-3 rounded-xl border border-[#EADBC8]">
        <Search className="w-4 h-4 text-[#8B7E74]" />
        <input
          type="text"
          placeholder="Tìm theo tên, email, số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-xs bg-white border border-[#EADBC8] p-2 rounded-lg outline-none w-full focus:border-[#5C4033]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* DANH SÁCH KHÁCH HÀNG */}
        <div className="lg:col-span-2 overflow-x-auto">
          <table className="w-full text-xs text-left border border-[#EADBC8] rounded-xl overflow-hidden shadow-sm">
            <thead className="bg-[#FAF6F0] text-[#5C4033]">
              <tr className="border-b border-[#EADBC8]">
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Liên hệ</th>
                <th className="p-4 text-center">Số đơn</th>
                <th className="p-4 text-right">Tổng chi tiêu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADBC8]/40 bg-white">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Đang tải...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Không tìm thấy khách hàng nào.</td></tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => loadCustomerDetail(c)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      selected?.id === c.id ? "bg-[#FAF6F0]/50" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="font-bold text-[#5C4033]">{c.fullName}</div>
                      <div className="text-[10px] text-gray-400">Tham gia {c.createdAt}</div>
                    </td>
                    <td className="p-4">
                      <div>{c.email}</div>
                      <div className="text-[10px] text-gray-500">{c.phone}</div>
                    </td>
                    <td className="p-4 text-center font-bold">{c.totalOrders}</td>
                    <td className="p-4 text-right font-bold text-emerald-700">{formatMoney(c.totalSpent)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CHI TIẾT KHÁCH HÀNG */}
        <div className="bg-white border border-[#EADBC8] rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="font-bold text-[#5C4033] text-sm border-b pb-2">Chi Tiết Khách Hàng</h3>

          {!selected ? (
            <div className="text-center py-12 text-gray-400">Chọn một khách hàng để xem chi tiết.</div>
          ) : (
            <div className="space-y-3 text-xs text-gray-700">
              <div><span className="font-bold text-gray-500">Họ tên:</span> {selected.fullName}</div>
              <div><span className="font-bold text-gray-500">Email:</span> {selected.email}</div>
              <div><span className="font-bold text-gray-500">SĐT:</span> {selected.phone}</div>
              <div>
                <span className="font-bold text-gray-500">Đơn gần nhất:</span>{" "}
                {selected.lastOrderDate || "Chưa có đơn hàng"}
              </div>

              {/* Toggle Lịch sử mua hàng / Lịch sử chăm sóc */}
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => setDetailTab("orders")}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase ${
                    detailTab === "orders" ? "bg-[#5C4033] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Lịch Sử Mua Hàng
                </button>
                <button
                  onClick={() => setDetailTab("care")}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase ${
                    detailTab === "care" ? "bg-[#5C4033] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Chăm Sóc ({careLogs.length})
                </button>
              </div>

              {/* TAB: Lịch sử mua hàng */}
              {detailTab === "orders" && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orders.length === 0 ? (
                    <div className="text-center text-gray-400 py-6">Khách chưa có đơn hàng nào.</div>
                  ) : (
                    orders.map((o: any) => (
                      <div key={o.id} className="p-2 bg-[#FAF6F0] rounded-lg border border-[#EADBC8]">
                        <div className="flex justify-between">
                          <span className="font-bold text-[#5C4033]">{o.orderCode}</span>
                          <span className="text-emerald-700 font-bold">{formatMoney(o.finalAmount)}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {o.orderStatus} — {o.itemCount} sản phẩm
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: Chăm sóc khách hàng */}
              {detailTab === "care" && (
                <div className="space-y-3">
                  {!showCareForm ? (
                    <button
                      onClick={() => setShowCareForm(true)}
                      className="w-full bg-[#5C4033] text-white p-2.5 rounded-lg font-bold hover:bg-[#4a3329] transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquarePlus className="w-4 h-4" /> Ghi Nhận Vấn Đề & Chăm Sóc
                    </button>
                  ) : (
                    <div className="space-y-2 p-3 bg-[#FAF6F0] rounded-xl border border-[#EADBC8]">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block">Ghi Chú Nhu Cầu Khách Hàng:</label>
                      <textarea
                        value={needNote}
                        onChange={(e) => setNeedNote(e.target.value)}
                        placeholder="VD: Khách hỏi về sản phẩm sofa da, phàn nàn giao hàng chậm..."
                        className="w-full border border-[#EADBC8] p-2 rounded-lg text-xs outline-none bg-white"
                      />

                      <label className="text-[10px] font-bold text-gray-500 uppercase block">Loại Chăm Sóc:</label>
                      <select
                        value={careType}
                        onChange={(e) => setCareType(e.target.value)}
                        className="w-full border border-[#EADBC8] p-2 rounded-lg text-xs outline-none bg-white"
                      >
                        <option value="PROMOTION">Khuyến mãi</option>
                        <option value="ORDER_REMINDER">Nhắc đơn</option>
                        <option value="GREETING">Hỏi thăm</option>
                        <option value="OTHER">Khác</option>
                      </select>

                      <label className="text-[10px] font-bold text-gray-500 uppercase block">Nội Dung Gửi Khách:</label>
                      <textarea
                        value={careMessage}
                        onChange={(e) => setCareMessage(e.target.value)}
                        placeholder="Nội dung thông báo/tin nhắn gửi cho khách hàng..."
                        className="w-full border border-[#EADBC8] p-2 rounded-lg text-xs outline-none bg-white"
                      />

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleCreateCareLog}
                          className="flex-1 bg-[#5C4033] text-white py-2 rounded-lg font-bold text-xs"
                        >
                          Gửi & Ghi Nhận
                        </button>
                        <button
                          onClick={() => setShowCareForm(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-bold text-xs"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {careLogs.length === 0 ? (
                      <div className="text-center text-gray-400 py-6">Chưa có lịch sử chăm sóc nào.</div>
                    ) : (
                      careLogs.map((log) => {
                        const meta = CARE_STATUS_META[log.status];
                        return (
                          <div key={log.id} className="p-3 bg-white rounded-lg border border-[#EADBC8] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-[#5C4033] uppercase">
                                {CARE_TYPE_LABEL[log.careType] || log.careType}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${meta.badgeClass}`}>
                                {meta.label}
                              </span>
                            </div>

                            {log.needNote && (
                              <div className="text-[11px] text-gray-600">
                                <span className="font-bold">Nhu cầu:</span> {log.needNote}
                              </div>
                            )}

                            {log.careMessage && (
                              <div className="text-[11px] text-gray-600">
                                <span className="font-bold">Đã gửi:</span> {log.careMessage}
                              </div>
                            )}

                            {log.responseResult && (
                              <div className="text-[11px] text-emerald-700 flex items-start gap-1">
                                <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                                <span><span className="font-bold">Kết quả:</span> {log.responseResult}</span>
                              </div>
                            )}

                            {log.nextFollowUpAt && (
                              <div className="text-[11px] text-blue-700 flex items-center gap-1">
                                <CalendarClock className="w-3 h-3" />
                                Chăm sóc lại: {new Date(log.nextFollowUpAt).toLocaleDateString("vi-VN")}
                              </div>
                            )}

                            <div className="text-[9px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(log.createdAt).toLocaleString("vi-VN")} — {log.staffName || "Nhân viên"}
                            </div>

                            {/* Chỉ hiện nút xử lý khi log đang WAITING (chưa có kết quả) */}
                            {log.status === "WAITING" && (
                              <div className="pt-1 space-y-1.5">
                                {respondingLogId === log.id ? (
                                  <div className="space-y-1.5">
                                    <textarea
                                      value={responseResult}
                                      onChange={(e) => setResponseResult(e.target.value)}
                                      placeholder="Kết quả chăm sóc (khách nói gì, quyết định ra sao...)"
                                      className="w-full border border-emerald-200 p-2 rounded-lg text-[11px] outline-none"
                                    />
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => handleUpdateResponse(log.id)}
                                        className="flex-1 bg-emerald-600 text-white py-1.5 rounded text-[10px] font-bold"
                                      >
                                        Lưu Kết Quả
                                      </button>
                                      <button
                                        onClick={() => setRespondingLogId(null)}
                                        className="flex-1 bg-gray-300 text-gray-700 py-1.5 rounded text-[10px] font-bold"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  </div>
                                ) : schedulingLogId === log.id ? (
                                  <div className="space-y-1.5">
                                    <input
                                      type="date"
                                      value={nextFollowUpAt}
                                      onChange={(e) => setNextFollowUpAt(e.target.value)}
                                      className="w-full border border-blue-200 p-1.5 rounded-lg text-[11px] outline-none"
                                    />
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => handleScheduleFollowUp(log.id)}
                                        className="flex-1 bg-blue-600 text-white py-1.5 rounded text-[10px] font-bold"
                                      >
                                        Lên Lịch
                                      </button>
                                      <button
                                        onClick={() => setSchedulingLogId(null)}
                                        className="flex-1 bg-gray-300 text-gray-700 py-1.5 rounded text-[10px] font-bold"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => setRespondingLogId(log.id)}
                                      className="flex-1 bg-emerald-50 text-emerald-700 border border-emerald-200 py-1.5 rounded text-[10px] font-bold"
                                    >
                                      Có Phản Hồi
                                    </button>
                                    <button
                                      onClick={() => setSchedulingLogId(log.id)}
                                      className="flex-1 bg-blue-50 text-blue-700 border border-blue-200 py-1.5 rounded text-[10px] font-bold"
                                    >
                                      Chưa Phản Hồi
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
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