export const isNotification = (): boolean => {
  return window.location.pathname.includes("notification.html");
};

export const normalizeAmount = (value: string, decimal: number = 8) => {
  if (!value.length) return "";
  if (value.includes(".")) {
    if (value.split(".")[1].length > 8) {
      return value.split(".")[0] + `.${value.split(".")[1].slice(0, decimal)}`;
    }
  }
  return value;
};
