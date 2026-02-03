// Category helper functions

export const CATEGORY_NAMES: Record<string, string> = {
  food: "Thức ăn",
  accessories: "Phụ kiện",
  grooming: "Grooming",
  medicine: "Thuốc & Y tế"
};

// Lấy tên hiển thị của category
export function getCategoryName(category: string): string {
  return CATEGORY_NAMES[category] || category;
}
