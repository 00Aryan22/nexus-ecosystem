const asyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    void key;
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    void key;
    void value;
  },
  removeItem: async (key: string): Promise<void> => {
    void key;
  },
  clear: async (): Promise<void> => {},
  getAllKeys: async (): Promise<string[]> => [],
};

export default asyncStorage;
