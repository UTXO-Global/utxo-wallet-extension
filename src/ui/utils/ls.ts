const LS = {
  getItem: async (key: string) => {
    return (await chrome.storage.local.get(key))[key];
  },
  setItem: async (key: string, val: string) => {
    return await chrome.storage.local.set({ [key]: val });
  },
  removeItems: async (key: string) => {
    return await chrome.storage.local.remove([key]);
  },
};

export default LS;
