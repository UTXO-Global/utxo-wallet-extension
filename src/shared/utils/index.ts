import browser from "./browser";

export const t = (name: string) => browser.i18n.getMessage(name);

export const format = (str: string, ...args: any[]) => {
  return args.reduce((m, n) => m.replace("_s_", n), str);
};

interface fetchProps extends RequestInit {
  method?: "POST" | "GET" | "PUT" | "DELETE";
  headers?: HeadersInit;
  path: string;
  params?: Record<string, string>;
  error?: boolean;
  json?: boolean;
}

export const fetchEsplora = async <T>({
  path,
  json = true,
  ...props
}: fetchProps): Promise<T | undefined> => {
  const res = await fetch(path.toString(), { ...props });

  if (!json) return (await res.text()) as T;

  return await res.json();
};

export const excludeKeysFromObj = <
  T extends Record<string, any>,
  K extends keyof T
>(
  obj: T,
  keysToExtract: K[]
): Omit<T, K> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keysToExtract.includes(k as K))
  ) as Omit<T, K>;
};

export const pickKeysFromObj = <
  T extends Record<string, any>,
  K extends keyof T
>(
  obj: T,
  keysToPick: K[]
): Pick<T, K> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => keysToPick.includes(k as K))
  ) as Pick<T, K>;
};

export const formatNumber = (
  number: number,
  minPrecision = 2,
  maxPrecision = 2
) => {
  const options = {
    minimumFractionDigits: minPrecision,
    maximumFractionDigits: maxPrecision,
  };
  return number.toLocaleString(undefined, options);
};

export const analyzeSmallNumber = (num: number, zeroCount: number) => {
  const numberString = num.toLocaleString("fullwide", {
    useGrouping: false,
    maximumFractionDigits: 100,
  });
  const [integerPart, decimalPart] = numberString.split(".");
  if (Number(integerPart) > 0) {
    return {
      first: `${integerPart}`,
      last: decimalPart?.slice(0, 4),
      zeroes: 0,
    };
  }

  if (!decimalPart) {
    return {
      first: `${integerPart}`,
      last: "",
      zeroes: 0,
    };
  }

  let zeroes = 0;
  for (let i = 0; i < decimalPart.length; i++) {
    if (decimalPart[i] !== "0") break;
    zeroes++;
  }

  if (zeroes <= zeroCount) {
    return {
      first: `${integerPart}`,
      last: decimalPart.slice(0, zeroes + 2),
      zeroes: 0,
    };
  }

  return {
    first: `0.00`,
    last: decimalPart.slice(zeroes, zeroes + 3),
    zeroes: zeroes - 2,
  };
};
