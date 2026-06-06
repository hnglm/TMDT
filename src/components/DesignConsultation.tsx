import React, { useState } from "react";
import { Sparkles, Calendar, Clock, DollarSign, RefreshCw, Layout, Smile, CheckCircle } from "lucide-react";
import { Product, Combo, ConsultationSchedule } from "../types";

interface DesignConsultationProps {
  products: Product[];
  combos: Combo[];
  onAddSchedule: (schedule: ConsultationSchedule) => void;
  onSelectProduct: (product: Product) => void;
}

export default function DesignConsultation({
  products,
  combos,
  onAddSchedule,
  onSelectProduct,
}: DesignConsultationProps) {
  // Form values
  const [roomArea, setRoomArea] = useState<number>(30);
  const [roomType, setRoomType] = useState<string>("Phòng Khách");
  const [stylePreference, setStylePreference] = useState<string>("Luxury");
  const [budget, setBudget] = useState<number>(100000000); // 100 million default

  // Customer contact detail
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [prefDate, setPrefDate] = useState("2026-06-10");
  const [prefTime, setPrefTime] = useState("14:00");
  const [notes, setNotes] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Dynamic products / combos matcher based on inputs
  const getMatches = () => {
    // Math logic based on style, budget, and roomType
    const matchedProducts = products.filter((prod) => {
      // Style match or belongs to category
      const belongsToCategory = 
        (roomType === "Phòng Khách" && prod.category === "phong-khach") ||
        (roomType === "Phòng Ngủ" && prod.category === "phong-ngu") ||
        (roomType === "Phòng Ăn" && prod.category === "phong-an") ||
        (roomType === "Văn Phòng" && prod.category === "van-phong");
      
      const styleMatch = prod.style.toLowerCase() === stylePreference.toLowerCase();
      const budgetMatch = prod.price <= budget;
      
      return (belongsToCategory || styleMatch) && budgetMatch;
    });

    const matchedCombos = combos.filter((comb) => {
      const typeMatch = comb.roomType.toLowerCase().includes(roomType.toLowerCase()) || 
                        roomType.toLowerCase().includes(comb.roomType.toLowerCase());
      const budgetMatch = comb.discountPrice <= budget;
      return typeMatch && budgetMatch;
    });

    return {
      products: matchedProducts.slice(0, 3),
      combos: matchedCombos.slice(0, 2),
    };
  };

  const { products: recommendedProducts, combos: recommendedCombos } = getMatches();

  const handleBookConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) {
      alert("Quý khách vui lòng điền đầy đủ Họ tên, Điện thoại và Email liên hệ.");
      return;
    }

    const newSchedule: ConsultationSchedule = {
      id: "SCH-" + Math.floor(1000 + Math.random() * 9000),
      customerName: name,
      phone,
      email,
      roomArea,
      roomType,
      style: stylePreference,
      budget,
      prefDate,
      prefTime,
      notes,
      status: "pending",
    };

    onAddSchedule(newSchedule);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setIsSubmitted(false);
  };

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="design-consultation-page">
      
      {/* Intro Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest bg-[#5C4033]/5 px-3 py-1 rounded-full">
          Dịch vụ Kiến tạo Không gian Độc bản
        </span>
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#1A1A1A] mt-3 leading-tight">
          Tư Vấn Thiết Kế LuxeHome
        </h1>
        <p className="text-[#8B7E74] text-xs md:text-sm mt-3 leading-relaxed">
          Gõ nhẹ vào mong muốn của Quý khách dưới đây. Hệ thống AI & chuyên viên LuxeHome sẽ tự động lọc, đề xuất đồ đạc chuẩn phong thủy, diện tích phòng độc bản và ngân sách định lượng tức thì.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Step 1: Mood & Dimension inputs */}
        <div className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#EADBC8] shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#EADBC8]">
            <div className="bg-[#5C4033] text-white p-2 rounded-lg">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#1A1A1A] text-lg">1. Ý Tưởng Không Gian</h3>
              <p className="text-[10px] text-[#8B7E74]">Khai báo kích thước ước định</p>
            </div>
          </div>

          {/* Area Input */}
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] uppercase tracking-wider mb-2">
              Diện tích phòng ước lượng (m²): <span className="text-[#D4AF37]">{roomArea} m²</span>
            </label>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={roomArea}
              onChange={(e) => setRoomArea(Number(e.target.value))}
              className="w-full accent-[#5C4033]"
            />
            <div className="flex justify-between text-[10px] text-[#8B7E74] mt-1 font-semibold">
              <span>Đơn lập (10 m²)</span>
              <span>Biệt thự (120 m²)</span>
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] uppercase tracking-wider mb-2">
              Bố cục phòng:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Phòng Khách", "Phòng Ngủ", "Phòng Ăn", "Văn Phòng"].map((type) => (
                <button
                  key={type}
                  onClick={() => setRoomType(type)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors ${
                    roomType === type
                      ? "bg-[#5C4033] text-white border-[#5C4033]"
                      : "bg-white text-[#5C4033] border-[#EADBC8] hover:bg-[#FAF6F0]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Style selects */}
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] uppercase tracking-wider mb-2">
              Phong cách mỹ nghệ:
            </label>
            <select
              value={stylePreference}
              onChange={(e) => setStylePreference(e.target.value)}
              className="w-full bg-white border border-[#EADBC8] rounded-lg p-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            >
              <option value="Luxury">Luxury (Hoàng Gia, Sang Trọng)</option>
              <option value="Modern">Modern (Hiện Đại, Khối Phối Tinh Tế)</option>
              <option value="Minimalist">Minimalist (Tối Giản, Cực Khớp Lưng)</option>
              <option value="Scandinavian">Scandinavian (Mộc Mạc Bắc Âu)</option>
            </select>
          </div>

          {/* Budget control */}
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] uppercase tracking-wider mb-2">
              Ngân sách dự tính: <span className="text-emerald-700 font-bold">{formattedPrice(budget)}</span>
            </label>
            <input
              type="range"
              min="10000000"
              max="600000000"
              step="10000000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-[#D4AF37]"
            />
            <div className="flex justify-between text-[10px] text-[#8B7E74] mt-1 font-semibold">
              <span>Căn hộ nhỏ (10tr)</span>
              <span>Penthouse (600tr)</span>
            </div>
          </div>

          <p className="text-[11px] text-[#8B7E74] bg-amber-50 p-3 rounded-lg border border-[#D4AF37]/30 leading-normal italic">
            **Thuật toán sàng lọc LuxeHome** đang liên tục đối sánh các thớ da bò Ý, sồi mọc, kính cường lực Hafele tương hợp với mức ngân quỹ bạn gõ.
          </p>
        </div>

        {/* Step 2: Intelligent Suggestions */}
        <div className="bg-white rounded-2xl p-6 border border-[#EADBC8] shadow-sm space-y-6 lg:col-span-1">
          <div className="flex items-center gap-2 pb-4 border-b border-[#EADBC8]">
            <div className="bg-[#D4AF37] text-white p-2 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#1A1A1A] text-lg">2. Đề Xuất Tự Động</h3>
              <p className="text-[10px] text-[#8B7E74]">Độ khớp: {recommendedCombos.length > 0 ? "98%" : "85%"}</p>
            </div>
          </div>

          {/* Combos recommendations */}
          {recommendedCombos.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">Combo Phòng Thích Hợp Nhất:</h4>
              {recommendedCombos.map((combo) => (
                <div key={combo.id} className="group border border-[#EADBC8] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-32 relative">
                    <img src={combo.image} alt={combo.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 text-white text-[10px] rounded font-semibold">
                      Diện tích: {combo.roomSize}
                    </span>
                  </div>
                  <div className="p-3 bg-[#FAF6F0]">
                    <h5 className="font-serif text-xs font-bold text-[#1A1A1A] line-clamp-1">{combo.name}</h5>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-[#8B7E74] line-through">{formattedPrice(combo.price)}</span>
                      <span className="text-xs font-bold text-[#D4AF37]">{formattedPrice(combo.discountPrice)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-[#8B7E74] italic">
              Không có combo phòng nguyên khối nào trong mức ngân sách dự trữ này. Hãy xem đề xuất sản phẩm rời bên dưới!
            </div>
          )}

          {/* Products discrete matched items */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-[#5C4033] uppercase tracking-wider">Đồ gia dụng gợi ý riêng lẻ:</h4>
            
            {recommendedProducts.map((p) => (
              <div 
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAF6F0] cursor-pointer border border-dashed border-[#EADBC8] transition-colors"
              >
                <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <h6 className="text-[11px] font-bold text-[#1A1A1A] truncate">{p.name}</h6>
                  <span className="text-[10px] text-[#D4AF37] font-semibold">{formattedPrice(p.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Book Appointment Schedule form */}
        <div className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#EADBC8] shadow-sm lg:col-span-1">
          {isSubmitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                <Smile className="w-10 h-10" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">Đặt Lịch Ưu Đại Thành Công!</h3>
              <p className="text-xs text-[#5C4033] leading-relaxed max-w-sm mx-auto">
                LuxeHome đã ghi nhận thông tin đặt lịch của **{name}**. Kiến trúc sư giàu kinh nghiệm của chúng tôi sẽ liên lạc qua điện thoại **{phone}** trong 30 phút để xác thực kích thước bản vẽ.
              </p>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-[#5C4033] hover:bg-[#4A3B32] text-white text-xs font-semibold rounded-lg transition-colors shadow"
              >
                Đăng ký phòng khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleBookConsultation} className="space-y-4">
              <div className="flex items-center gap-2 pb-4 border-b border-[#EADBC8]">
                <div className="bg-[#5C4033] text-white p-2 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#1A1A1A] text-lg">3. Đặt Lịch Hẹn Gặp</h3>
                  <p className="text-[10px] text-[#8B7E74]">Showroom trực tiếp hoặc Video Call</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8B7E74] uppercase mb-1">Họ tên của Quý khách *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Minh Hoàng"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs text-[#1A1A1A] p-2.5 rounded-lg border border-[#EADBC8] bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#8B7E74] uppercase mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="09..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs text-[#1A1A1A] p-2.5 rounded-lg border border-[#EADBC8] bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8B7E74] uppercase mb-1">Thư điện tử *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs text-[#1A1A1A] p-2.5 rounded-lg border border-[#EADBC8] bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#8B7E74] uppercase mb-1">Ngày mong muốn hẹn</label>
                  <input
                    type="date"
                    value={prefDate}
                    onChange={(e) => setPrefDate(e.target.value)}
                    className="w-full text-xs text-[#1A1A1A] p-2.5 rounded-lg border border-[#EADBC8] bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8B7E74] uppercase mb-1">Khung giờ rảnh</label>
                  <input
                    type="time"
                    value={prefTime}
                    onChange={(e) => setPrefTime(e.target.value)}
                    className="w-full text-xs text-[#1A1A1A] p-2.5 rounded-lg border border-[#EADBC8] bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8B7E74] uppercase mb-1">Ý tưởng hoặc Ghi chú dự án</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Các loại gỗ ưa chuộng, mặt bằng chung cư căn số mấy..."
                  className="w-full text-xs text-[#1A1A1A] p-2.5 rounded-lg border border-[#EADBC8] bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#5C4033] to-[#4A3B32] hover:from-[#4A3B32] hover:to-[#3A2D25] tracking-widest uppercase shadow transition-all duration-300"
              >
                Đặt Lịch Khảo Sát Miễn Phí
              </button>

              <div className="text-center">
                <span className="text-[10px] text-[#8B7E74]">Cam kết bảo mật thông tin gia chủ 100%.</span>
              </div>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
