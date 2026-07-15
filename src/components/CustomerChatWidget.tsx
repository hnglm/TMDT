import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X, Send } from "lucide-react";
import { customerChatApi } from "../api/api";

const parseBackendUtcDate = (rawValue: string): Date => {
  const hasTimezone = /(?:Z|[+\-]\d{2}:\d{2})$/i.test(rawValue);
  const looksLikeIso = /^\d{4}-\d{2}-\d{2}T/.test(rawValue);
  return new Date(looksLikeIso && !hasTimezone ? `${rawValue}Z` : rawValue);
};

interface CustomerChatWidgetProps {
  currentUser: { id?: number | string | null } | null;
}

interface ChatMessage {
  id: number;
  senderId: number;
  senderRole: "CUSTOMER" | "STAFF";
  senderName: string | null;
  content: string;
  createdAt: string;
}

export default function CustomerChatWidget({
  currentUser,
}: CustomerChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const data = await customerChatApi.getMyMessages();
      setMessages(data);
    } catch (err) {
      console.error("Lỗi tải tin nhắn:", err);
    }
  };

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    loadMessages();

    const interval = setInterval(loadMessages, 4000);

    return () => clearInterval(interval);
  }, [isOpen, currentUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    setIsSending(true);

    try {
      await customerChatApi.sendAsCustomer(inputText.trim());

      setInputText("");

      await loadMessages();
    } catch (err) {
      console.error(err);
      alert("Gửi tin nhắn thất bại.");
    } finally {
      setIsSending(false);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-sm text-[#4A3B32] hover:text-[#D4AF37] transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        Chat
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 z-[80] flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6">
            <div className="bg-white w-full sm:w-96 h-[80vh] sm:h-[600px] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#EADBC8]">

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#EADBC8] bg-[#FAF6F0]">
                <h3 className="font-serif font-bold text-[#1A1A1A]">
                  Hỗ Trợ LuxeHome
                </h3>

                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#8B7E74] hover:text-[#1A1A1A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-[#8B7E74] py-10">
                    Chưa có tin nhắn nào. Hãy đặt câu hỏi, đội ngũ
                    LuxeHome sẽ phản hồi sớm nhất!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine =
                      m.senderRole === "CUSTOMER";

                    return (
                      <div
                        key={m.id}
                        className={`flex ${
                          isMine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                            isMine
                              ? "bg-[#5C4033] text-white rounded-br-sm"
                              : "bg-[#FAF6F0] text-[#1A1A1A] border border-[#EADBC8] rounded-bl-sm"
                          }`}
                        >
                          {!isMine && (
                            <p className="text-[10px] font-bold text-[#D4AF37] mb-0.5">
                              {m.senderName || "LuxeHome"}
                            </p>
                          )}

                          <p>{m.content}</p>

                          <p
                            className={`text-[9px] mt-1 ${
                              isMine
                                ? "text-white/60"
                                : "text-gray-400"
                            }`}
                          >
                            <p className={`text-[9px] mt-1 ${isMine ? "text-white/60" : "text-gray-400"}`}>
                            {parseBackendUtcDate(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-[#EADBC8] flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) =>
                    setInputText(e.target.value)
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    handleSend()
                  }
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 border border-[#EADBC8] rounded-xl text-sm outline-none focus:border-[#D4AF37]"
                />

                <button
                  onClick={handleSend}
                  disabled={
                    isSending ||
                    !inputText.trim()
                  }
                  className="p-2.5 bg-[#5C4033] text-white rounded-xl hover:bg-[#4A3B32] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}