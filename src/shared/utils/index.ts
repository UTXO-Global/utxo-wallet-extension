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

export const analyzeSmallNumber = (num: number, zeroCount: number = 2) => {
  const numberString = num.toLocaleString("fullwide", {
    useGrouping: false,
    maximumFractionDigits: 100,
  });
  let [integerPart, decimalPart] = numberString.split(".");
  decimalPart = decimalPart || "";
  if (decimalPart.length <= zeroCount) {
    return {
      first: integerPart,
      last: decimalPart,
      zeroes: 0,
    };
  }

  let zeroes = 0;
  for (let i = 0; i < decimalPart.length; i++) {
    console.log(decimalPart[i]);
    if (decimalPart[i] !== "0") break;
    zeroes++;
  }

  return {
    first: `0.${"0".repeat(zeroCount)}`,
    last: decimalPart.slice(zeroes, zeroes + 2),
    zeroes: zeroes - zeroCount,
  };
};
