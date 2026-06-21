
const API_URL = 'https://localhost:5200/api/categories'; 
export interface Category {
  id: number;
  parentId: number | null;
  categoryName: string;
  slug: string;
  thumbnailUrl: string;
}

export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
};