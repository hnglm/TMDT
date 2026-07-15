import React, { useState, useEffect, useRef } from "react";
import { Users, Search, RefreshCw, Send } from "lucide-react";
import { customerApi, customerChatApi } from "../../api/api";

// Đã thay hẳn phần "Ghi chú nhu cầu / Nhật ký chăm sóc" (CustomerCareLog) cũ
// bằng Chat 1-1 THẬT giữa Sales/Admin và khách hàng (CustomerChatMessage).

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

interface ChatMessage {
  id: number;
  senderId: number;
  senderRole: "CUSTOMER" | "STAFF";
  senderName: string | null;
  content: string;
  createdAt: string;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

export default function CustomersTab() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CustomerListItem | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [detailTab, setDetailTab] = useState<"orders" | "chat">("chat");

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [unreadMap, setUnreadMap] = useState<Record<number, number>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

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

  // Lấy số tin chưa đọc cho từng khách (hiện badge trên danh sách)
  const fetchUnreadCounts = async () => {
    try {
      const conversations = await customerChatApi.getConversations();
      const map: Record<number, number> = {};
      conversations.forEach((c: any) => {
        map[c.customerId] = c.unreadCount;
      });
      setUnreadMap(map);
    } catch (err) {
      console.error("Lỗi lấy số tin chưa đọc:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadCustomerDetail = async (customer: CustomerListItem) => {
    setSelected(customer);
    setDetailTab("chat");
    try {
      const ordersData = await customerApi.getCustomerOrders(customer.id);
      setOrders(ordersData);
    } catch (err) {
      console.error("Lỗi tải chi tiết khách hàng:", err);
    }
    await loadChatMessages(customer.id);
  };

  const loadChatMessages = async (customerId: number) => {
    try {
      const data = await customerChatApi.getConversationMessages(customerId);
      setChatMessages(data);
      // Đã xem xong -> cập nhật lại badge chưa đọc
      setUnreadMap((prev) => ({ ...prev, [customerId]: 0 }));
    } catch (err) {
      console.error("Lỗi tải tin nhắn:", err);
    }
  };

  // Poll tin nhắn mỗi 4s khi đang mở 1 cuộc hội thoại
  useEffect(() => {
    if (!selected || detailTab !== "chat") return;
    const interval = setInterval(() => loadChatMessages(selected.id), 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, detailTab]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChat = async () => {
    if (!selected || !chatInput.trim()) return;
    setIsSendingChat(true);
    try {
      await customerChatApi.sendAsStaff(selected.id, chatInput.trim());
      setChatInput("");
      await loadChatMessages(selected.id);
    } catch (err: any) {
      console.error("Lỗi gửi tin nhắn:", err);
      alert(`Lỗi khi gửi tin nhắn: ${err?.response?.data?.message || err?.message || ""}`);
    } finally {
      setIsSendingChat(false);
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
          <Users className="w-5 h-5 text-[#D4AF37]" /> Khách Hàng & Chat Hỗ Trợ
        </h3>
        <button
          onClick={() => { fetchCustomers(); fetchUnreadCounts(); }}
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
        <div className="lg:col-span-1 overflow-x-auto">
          <table className="w-full text-xs text-left border border-[#EADBC8] rounded-xl overflow-hidden shadow-sm">
            <thead className="bg-[#FAF6F0] text-[#5C4033]">
              <tr className="border-b border-[#EADBC8]">
                <th className="p-3">Khách hàng</th>
                <th className="p-3 text-center">Đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADBC8]/40 bg-white">
              {loading ? (
                <tr><td colSpan={2} className="p-8 text-center text-gray-400">Đang tải...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={2} className="p-8 text-center text-gray-400">Không tìm thấy khách hàng nào.</td></tr>
              ) : (
                filteredCustomers.map((c) => {
                  const unread = unreadMap[c.id] || 0;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => loadCustomerDetail(c)}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        selected?.id === c.id ? "bg-[#FAF6F0]/50" : ""
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#5C4033]">{c.fullName}</span>
                          {unread > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500">{c.email}</div>
                      </td>
                      <td className="p-3 text-center font-bold">{c.totalOrders}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* CHI TIẾT + CHAT */}
        <div className="lg:col-span-2 bg-white border border-[#EADBC8] rounded-xl shadow-sm flex flex-col h-[560px]">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Chọn một khách hàng để xem chi tiết hoặc trò chuyện.
            </div>
          ) : (
            <>
              {/* Header + toggle */}
              <div className="p-4 border-b border-[#EADBC8] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#5C4033]">{selected.fullName}</p>
                    <p className="text-[10px] text-gray-500">{selected.email} — {selected.phone}</p>
                  </div>
                  <p className="text-xs font-bold text-emerald-700">{formatMoney(selected.totalSpent)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDetailTab("chat")}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase ${
                      detailTab === "chat" ? "bg-[#5C4033] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setDetailTab("orders")}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase ${
                      detailTab === "orders" ? "bg-[#5C4033] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Lịch Sử Mua Hàng
                  </button>
                </div>
              </div>

              {/* TAB: Chat */}
              {detailTab === "chat" && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-xs text-gray-400 py-10">
                        Chưa có tin nhắn nào với khách hàng này.
                      </div>
                    ) : (
                      chatMessages.map((m) => {
                        const isStaff = m.senderRole === "STAFF";
                        return (
                          <div key={m.id} className={`flex ${isStaff ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                                isStaff
                                  ? "bg-[#5C4033] text-white rounded-br-sm"
                                  : "bg-[#FAF6F0] text-[#1A1A1A] border border-[#EADBC8] rounded-bl-sm"
                              }`}
                            >
                              {!isStaff && (
                                <p className="text-[10px] font-bold text-[#D4AF37] mb-0.5">
                                  {m.senderName || selected.fullName}
                                </p>
                              )}
                              <p>{m.content}</p>
                              <p className={`text-[9px] mt-1 ${isStaff ? "text-white/60" : "text-gray-400"}`}>
                                {new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>

                  <div className="p-3 border-t border-[#EADBC8] flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      placeholder="Trả lời khách hàng..."
                      className="flex-1 px-3 py-2 border border-[#EADBC8] rounded-xl text-sm outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={isSendingChat || !chatInput.trim()}
                      className="p-2.5 bg-[#5C4033] text-white rounded-xl hover:bg-[#4A3B32] disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {/* TAB: Lịch sử mua hàng */}
              {detailTab === "orders" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {orders.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">Khách chưa có đơn hàng nào.</div>
                  ) : (
                    orders.map((o: any) => (
                      <div key={o.id} className="p-2 bg-[#FAF6F0] rounded-lg border border-[#EADBC8] text-xs">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}