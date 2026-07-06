
import React, { useState } from "react";
import { Layers, Edit3, Trash2, Check, X } from "lucide-react";
import { Category } from "../AdminPanel";

interface CategoriesTabProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

export default function CategoriesTab({ categories, setCategories }: CategoriesTabProps) {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatSlug, setEditCatSlug] = useState("");

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = newCatName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const res = await fetch("http://localhost:5200/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 0, parentId: null, categoryName: newCatName, slug: slug, thumbnailUrl: "", sortOrder: 0 })
      });
      if (res.ok) {
        alert("Đã thêm danh mục!");
        setNewCatName("");
        setIsAddingCategory(false);
        // Có thể cần fetch lại từ cha, hoặc append thủ công
      }
    } catch(e) { console.error(e); }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm("Cảnh báo: Bạn có chắc chắn muốn ngừng hiển thị danh mục này?")) return;
    try {
      const res = await fetch(`http://localhost:5200/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id));
        alert("Đã xóa danh mục thành công!");
      } else {
        alert("Lỗi khi xóa danh mục. Hãy kiểm tra server.");
      }
    } catch(e) { console.error(e); }
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.categoryName);
    setEditCatSlug(cat.slug);
  };

  const handleSaveCategoryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const finalSlug = editCatSlug.trim() === "" ? editCatName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : editCatSlug;
    try {
      const res = await fetch(`http://localhost:5200/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCategory.id, parentId: null, categoryName: editCatName, slug: finalSlug, thumbnailUrl: "", sortOrder: 0 })
      });
      if (res.ok) {
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, categoryName: editCatName, slug: finalSlug } : c));
        setEditingCategory(null);
        alert("Cập nhật danh mục thành công!");
      } else {
        alert("Có lỗi xảy ra khi lưu trên server.");
      }
    } catch(e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-[#EADBC8] pb-4">
        <h3 className="font-serif text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#D4AF37]" /> Quản Lý Danh Mục Sản Phẩm
        </h3>
        <button onClick={() => setIsAddingCategory(!isAddingCategory)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer ${isAddingCategory ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-[#5C4033] text-white hover:bg-[#4A3B32]"}`}>
          {isAddingCategory ? "Hủy Thêm" : "+ Thêm Danh Mục"}
        </button>
      </div>

      {isAddingCategory && (
        <form onSubmit={handleAddCategory} className="bg-gray-50 p-4 border border-gray-200 rounded-xl flex items-end gap-4 shadow-sm">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-600 mb-1">Tên Danh Mục Mới *</label>
            <input type="text" required value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="VD: Đồ Gỗ Trẻ Em..." className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]" />
          </div>
          <button type="submit" className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-lg font-bold uppercase text-xs hover:bg-[#B8962E] cursor-pointer">Lưu</button>
        </form>
      )}

      <div className="border border-[#EADBC8] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#FAF6F0] text-[#5C4033] font-bold uppercase border-b border-[#EADBC8]">
            <tr>
              <th className="p-4 w-16 text-center">ID</th>
              <th className="p-4">Tên Danh Mục</th>
              <th className="p-4">Slug (Đường dẫn gốc)</th>
              <th className="p-4 text-center">Trạng Thái</th>
              <th className="p-4 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EADBC8]/40">
            {categories.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Chưa có danh mục nào.</td></tr>
            ) : (
              categories.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 group">
                  <td className="p-4 text-center font-mono text-gray-400">#{c.id}</td>
                  <td className="p-4 font-bold text-[#1A1A1A] text-sm">{c.categoryName}</td>
                  <td className="p-4 text-gray-500 font-mono bg-gray-50 rounded italic">/{c.slug}</td>
                  <td className="p-4 text-center"><span className="px-2 py-1 bg-emerald-50 text-emerald-600 font-bold text-[9px] rounded uppercase border border-emerald-200">Hiển thị</span></td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditCategoryModal(c)} className="text-amber-600 hover:bg-amber-50 p-1.5 rounded cursor-pointer" title="Sửa danh mục"><Edit3 className="w-4 h-4"/></button>
                      <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded cursor-pointer" title="Ẩn/Xóa danh mục"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] w-full max-w-md rounded-2xl border border-[#EADBC8] shadow-2xl p-6 relative">
            <button onClick={() => setEditingCategory(null)} className="absolute top-4 right-4 text-[#8B7E74] hover:text-gray-800 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A] mb-4 border-b border-[#EADBC8] pb-2">Chỉnh sửa Danh Mục</h3>
            <form onSubmit={handleSaveCategoryEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#5C4033] font-bold mb-1">Tên danh mục *</label>
                <input type="text" required value={editCatName} onChange={(e) => setEditCatName(e.target.value)} className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]" />
              </div>
              <div>
                <label className="block text-[#5C4033] font-bold mb-1">Đường dẫn tĩnh (Slug)</label>
                <input type="text" value={editCatSlug} onChange={(e) => setEditCatSlug(e.target.value)} placeholder="De trong se tu dong tao" className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37]" />
                <span className="text-[10px] text-gray-500 mt-1 block">Để trống sẽ tự động được tạo ra dựa trên tên danh mục.</span>
              </div>
              <div className="flex justify-end pt-4 border-t border-[#EADBC8] mt-6 gap-2">
                <button type="button" onClick={() => setEditingCategory(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold uppercase transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-[#5C4033] hover:bg-[#4A3B32] text-white rounded-lg font-bold uppercase transition-colors cursor-pointer flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Lưu Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}