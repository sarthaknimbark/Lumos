export const storage = {
  getItem: (key: string) => (typeof window !== "undefined" ? localStorage.getItem(key) : null),
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  },
  deleteItem: (key: string) => {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  },
  getItemAsync: async (key: string) => (typeof window !== "undefined" ? localStorage.getItem(key) : null),
  setItemAsync: async (key: string, value: string) => {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  },
  deleteItemAsync: async (key: string) => {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  },
};
