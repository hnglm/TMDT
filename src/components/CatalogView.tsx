import React, { useState, useMemo } from "react";
import { Search, Filter, SlidersHorizontal, Trash2, ArrowUpDown, Star, Heart, FileText, Check, AlertCircle, Scale, Eye } from "lucide-react";
import { Product } from "../types";

interface CatalogViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  wishlist: string[];
  initialCategory?: string;
  initialStyle?: string;
}

export default function CatalogView({
  products,
  onSelectProduct,
  onToggleWishlist,
  wishlist,
  initialCategory = "",
  initialStyle = "",
}: CatalogViewProps) {
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedStyle, setSelectedStyle] = useState(initialStyle);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [maxPrice, setMaxPrice] = useState<number>(75000000);
  const [sortBy, setSortBy] = useState<string>("rating"); // rating, price-asc, price-desc, name

  // Comparison State
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [isCompareViewActive, setIsCompareViewActive] = useState(false);

  // Extract master lists for options
  const colorOptions = useMemo(() => {
    const colors = new Set<string>();
    products.forEach((p) => p.colors.forEach((c) => colors.add(c)));
    return Array.from(colors);
  }, [products]);

  const brandOptions = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand)));
  }, [products]);

  // Handle filter logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
        const matchesStyle = selectedStyle ? p.style === selectedStyle : true;
        const matchesBrand = selectedBrand ? p.brand === selectedBrand : true;
        
        const matchesColor = selectedColor
          ? p.colors.some((c) => c.toLowerCase().includes(selectedColor.toLowerCase()))
          : true;

        const matchesPrice = p.price <= maxPrice;

        return matchesSearch && matchesCategory && matchesStyle && matchesBrand && matchesColor && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, searchQuery, selectedCategory, selectedStyle, selectedBrand, selectedColor, maxPrice, sortBy]);

  // Manage comparative lists
  const toggleCompare = (prod: Product) => {
    if (comparedProducts.some((p) => p.id === prod.id)) {
      setComparedProducts(comparedProducts.filter((p) => p.id !== prod.id));
    } else {
      if (comparedProducts.length >= 3) {
        alert("Quý khách chỉ có thể so sánh tối đa 3 sản phẩm nội thất cùng lúc!");
        return;
      }
      setComparedProducts([...comparedProducts, prod]);
    }
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedStyle("");
    setSelectedColor("");
    setSelectedBrand("");
    setMaxPrice(75000000);
    setSortBy("rating");
  };

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="catalog-view-section">
      
      {/* 1. Header & Quick stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-[10px] text-[#D4AF37] tracking-widest font-bold uppercase block mb-1">
            Chất Tác Đỉnh Phong
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">
            Trưng Bày Tác Phẩm LuxeHome
          </h1>
          <p className="text-xs text-[#8B7E74]">Hiển thị {filteredProducts.length} trên tổng số {products.length} tác phẩm</p>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-3 text-[#8B7E74]">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm Sofa, Bàn làm việc, Nhung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-[#FAF6F0] text-[#1A1A1A] border border-[#EADBC8] pl-9 pr-4 py-2.5 rounded-full focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder-[#8B7E74]/70"
            id="catalog-search-textbox"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 2. Interactive Sidebar Filters */}
        <aside className="lg:col-span-3 bg-[#FAF6F0] rounded-2xl p-6 border border-[#EADBC8] h-fit space-y-6" id="catalog-sidebar">
          
          <div className="flex items-center justify-between pb-3 border-b border-[#EADBC8]">
            <span className="text-xs font-bold text-[#5C4033] uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
              Bộ Lọc Tìm Kiếm
            </span>
            <button
              onClick={handleClearAllFilters}
              className="text-[10px] text-red-600 hover:underline flex items-center gap-1 font-bold tracking-wider uppercase"
              id="clear-all-filter-btn"
            >
              Xóa lọc
            </button>
          </div>

          {/* Categories select checklist */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#5C4033] uppercase tracking-wider mb-2">Gian Phòng</h3>
            {[
              { id: "", label: "Tất cả gian phòng" },
              { id: "phong-khach", label: "Phòng Khách" },
              { id: "phong-ngu", label: "Phòng Ngủ" },
              { id: "phong-an", label: "Phòng Ăn & Bếp" },
              { id: "van-phong", label: "Phòng Làm Việc" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between font-medium ${
                  selectedCategory === cat.id
                    ? "bg-[#5C4033] text-white shadow-sm"
                    : "text-[#4A3B32] hover:bg-[#EADBC8]/40"
                }`}
              >
                <span>{cat.label}</span>
                {selectedCategory === cat.id && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
              </button>
            ))}
          </div>

          {/* Style select options */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#5C4033] uppercase tracking-wider mb-2">Trường phái Mỹ nghệ</h3>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-[#EADBC8] rounded-lg text-[#1A1A1A] focus:outline-none"
            >
              <option value="">Tất cả phong cách</option>
              <option value="Luxury">Luxury (Sang Trọng)</option>
              <option value="Modern">Modern (Hiện Đại)</option>
              <option value="Minimalist">Minimalist (Tối Giản)</option>
              <option value="Scandinavian">Scandinavian (Bắc Âu)</option>
            </select>
          </div>

          {/* Price Range Filter slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-[#5C4033] uppercase tracking-wider">Mức giá tối đa:</h3>
              <span className="text-xs font-bold text-[#D4AF37]">{formattedPrice(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="5000000"
              max="75000000"
              step="5000000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#5C4033]"
            />
            <div className="flex justify-between text-[9px] text-[#8B7E74] font-semibold">
              <span>5.000.000đ</span>
              <span>75.000.000đ</span>
            </div>
          </div>

          {/* Brand select list */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#5C4033] uppercase tracking-wider mb-2">Xưởng Thương Hiệu</h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedBrand("")}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                  selectedBrand === ""
                    ? "bg-[#5C4033] text-white border-[#5C4033]"
                    : "bg-white text-[#5C4033] border-[#EADBC8] hover:bg-[#FAF6F0]"
                }`}
              >
                Tài phiệt chung
              </button>
              {brandOptions.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                    selectedBrand === brand
                      ? "bg-[#5C4033] text-white border-[#5C4033]"
                      : "bg-white text-[#5C4033] border-[#EADBC8] hover:bg-[#FAF6F0]"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Colors palette criteria */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#5C4033] uppercase tracking-wider mb-2">Sắc diện mộc màu:</h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedColor("")}
                className={`text-[10px] px-2 py-0.5 rounded border ${
                  selectedColor === ""
                    ? "border-[#D4AF37] bg-[#D4AF37]/10 font-bold"
                    : "border-[#EADBC8] bg-white text-[#5C4033]"
                }`}
              >
                Mọi tông màu
              </button>
              {colorOptions.map((col) => (
                <button
                  key={col}
                  onClick={() => setSelectedColor(col)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    selectedColor === col
                      ? "border-[#5C4033] bg-[#5C4033] text-white font-semibold"
                      : "border-[#EADBC8] bg-white text-[#4A3B32] hover:bg-amber-50"
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>

        </aside>

        {/* 3. Catalog Products Grid & Sorters */}
        <main className="lg:col-span-9 space-y-6">
          
          {/* Sorter Selector Menu */}
          <div className="flex justify-between items-center bg-[#FAF6F0] p-3 rounded-xl border border-[#EADBC8]" id="grid-sorters-header">
            <span className="text-xs font-semibold text-[#5C4033]">
              Sắp xếp tác phẩm nghệ thuật:
            </span>

            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-white border border-[#EADBC8] p-1.5 rounded focus:outline-none"
              >
                <option value="rating">Được đánh giá cao</option>
                <option value="price-asc">Giá: Thấp tới Cao</option>
                <option value="price-desc">Giá: Cao xuống Thấp</option>
                <option value="name">Ký tự chữ cái (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Products List Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="catalog-products-list-grid">
              {filteredProducts.map((p) => {
                const isCompared = comparedProducts.some((cp) => cp.id === p.id);
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-[#EADBC8] overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="relative aspect-square bg-[#FAF6F0] overflow-hidden group">
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      
                      {/* Similar hovering button triggers detail */}
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                        <button
                          onClick={() => onSelectProduct(p)}
                          className="p-2.5 rounded-full bg-white text-[#5C4033] hover:bg-[#D4AF37] hover:text-white transition-colors shadow"
                          title="Xem ảnh & cấu hình 360°"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => onToggleWishlist(p.id)}
                          className="p-2.5 rounded-full bg-white text-[#5C4033] hover:bg-red-500 hover:text-white transition-colors shadow"
                        >
                          <Heart className={`w-4 h-4 ${wishlist.includes(p.id) ? "fill-red-500 text-red-500" : ""}`} />
                        </button>

                        <button
                          onClick={() => toggleCompare(p)}
                          className={`p-2.5 rounded-full shadow transition-colors ${
                            isCompared 
                              ? "bg-[#D4AF37] text-white" 
                              : "bg-white text-[#5C4033] hover:bg-[#D4AF37] hover:text-white"
                          }`}
                          title="Thêm so sánh"
                        >
                          <Scale className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">{p.brand} • {p.style}</span>
                        <h3 
                          onClick={() => onSelectProduct(p)}
                          className="font-serif text-sm font-bold text-[#1A1A1A] mt-1 line-clamp-2 cursor-pointer hover:text-[#5C4033] transition-colors"
                        >
                          {p.name}
                        </h3>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#EADBC8]/40 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[#5C4033]">{formattedPrice(p.price)}</span>
                          <span className="block text-[9px] text-[#8B7E74]">{p.categoryName}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-xs text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="font-bold text-[#1A1A1A]">{p.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#FAF6F0] rounded-2xl border border-dashed border-[#EADBC8]">
              <AlertCircle className="w-10 h-10 text-[#D4AF37] mx-auto mb-3" />
              <h3 className="font-serif text-base font-bold text-[#1A1A1A]">Không có sản phẩm nào khớp bộ lọc</h3>
              <p className="text-xs text-[#8B7E74] mt-2">Xưởng đồ mộc LuxeHome của chúng tôi liên tục biến hóa. Bạn vui lòng ấn "Xóa lọc" để xem bộ sưu tập cơ bản!</p>
            </div>
          )}

        </main>
      </div>

      {/* 4. Comparing Tray popup overlay (Chức năng so sánh sản phẩm) */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#D4AF37] p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] animate-slide-up" id="comparison-tray">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            
            <div className="flex items-center gap-3">
              <span className="bg-[#D4AF37]/25 text-[#D4AF37] p-2 rounded">
                <Scale className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-serif text-xs font-extrabold text-[#1A1A1A]">Kênh So Sánh Độc Bản Đồ Gỗ</h4>
                <p className="text-[10px] text-[#8B7E74] font-medium">Bấm so sánh để đối lập vân da bò Ý vương giả vs đá mây Carrara</p>
              </div>
            </div>

            {/* List of matched options in compare bar */}
            <div className="flex gap-4">
              {comparedProducts.map((p) => (
                <div key={p.id} className="relative flex items-center gap-2.5 bg-[#FAF6F0] p-2.5 rounded-lg border border-[#EADBC8]">
                  <img src={p.images[0]} alt="comp-img" className="w-8 h-8 rounded object-cover" />
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-[#1A1A1A] max-w-[100px] truncate">{p.name}</p>
                    <span className="text-[9px] text-[#5C4033] font-semibold">{formattedPrice(p.price)}</span>
                  </div>
                  <button
                    onClick={() => toggleCompare(p)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setIsCompareViewActive(true)}
                className="bg-[#5C4033] hover:bg-[#4A3B32] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
                id="btn-open-compare-modal-view"
              >
                Tiến Hành Đối Chiếu ({comparedProducts.length})
              </button>
              <button
                onClick={() => setComparedProducts([])}
                className="text-xs text-red-600 hover:underline"
              >
                Xóa tất cả
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Comparison Modal details view */}
      {isCompareViewActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm" id="detail-comparison-matrix-modal">
          <div className="bg-[#FAF6F0] w-full max-w-5xl rounded-2xl border border-[#EADBC8] p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCompareViewActive(false)}
              className="absolute top-4 right-4 text-[#8B7E74] hover:text-[#5C4033] p-1 rounded-full bg-white"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>

            <h2 className="font-serif text-xl font-bold text-[#1A1A1A] pb-4 mb-4 border-b border-[#EADBC8] text-center">
              Ma Trận Đo Lường & So Sánh Tác Phẩm LuxeHome
            </h2>

            <div className="grid grid-cols-4 gap-4 text-xs font-semibold" id="compare-matrix">
              {/* Properties row headers */}
              <div className="space-y-4 font-bold text-[#8B7E74] text-right pr-4 border-r border-[#EADBC8] pt-32">
                <div className="h-10">Mức đầu tư</div>
                <div className="h-10">Dòng Phân Loại</div>
                <div className="h-12">Thớ Nguyên Liệu</div>
                <div className="h-10">Kích Thước Khung</div>
                <div className="h-10">Trường phái Mỹ nghệ</div>
                <div className="h-10">Chế Độ Bảo Hành</div>
              </div>

              {/* Items columns */}
              {comparedProducts.map((p) => (
                <div key={p.id} className="text-center space-y-4">
                  <div className="flex flex-col items-center">
                    <img src={p.images[0]} alt={p.name} className="w-20 h-20 object-cover rounded-xl shadow mb-2 border border-[#EADBC8]" />
                    <h3 className="font-serif text-xs font-black text-[#1A1A1A] line-clamp-1">{p.name}</h3>
                    <p className="text-[10px] text-[#D4AF37]">{p.brand}</p>
                  </div>

                  <div className="h-10 font-black text-[#5C4033] text-sm pt-2">{formattedPrice(p.price)}</div>
                  <div className="h-10 pt-2"><span className="bg-[#EADBC8]/40 px-2 py-0.5 rounded text-[10px] text-[#4A3B32]">{p.categoryName}</span></div>
                  <div className="h-12 text-[10px] text-[#4A3B32] max-w-[150px] mx-auto leading-normal">{p.material}</div>
                  <div className="h-10 text-[10px] text-[#1A1A1A]">{p.dimensions}</div>
                  <div className="h-10 text-[10px] text-[#D4AF37]">{p.style}</div>
                  <div className="h-10 text-[10px] font-bold text-emerald-800">{p.warranty}</div>
                </div>
              ))}

              {/* Add dummy columns to keep layout aligned */}
              {Array.from({ length: 3 - comparedProducts.length }).map((_, i) => (
                <div key={i} className="border-2 border-dashed border-[#EADBC8]/60 rounded-xl flex items-center justify-center h-full bg-[#EADBC8]/10 text-[#8B7E74]">
                  Trống
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsCompareViewActive(false)}
                className="px-6 py-2 bg-[#5C4033] hover:bg-[#4A3B32] text-white text-xs font-bold rounded-lg transition-colors"
              >
                Đóng ma trận đối chiếu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
