import BN from "bn.js";

const SATS_PER_BTC = new BN(1e8, 10);

type BitcoinDivisor = "m" | "u" | "n" | "p";

const DIVISORS: Record<BitcoinDivisor, BN> = {
  m: new BN(1e3, 10),
  u: new BN(1e6, 10),
  n: new BN(1e9, 10),
  p: new BN(1e12, 10),
};

export const hrpToSatoshi = (hrp: string): string => {
  let divisor: any, value: any;
  if (hrp.slice(-1).match(/^[munp]$/)) {
    divisor = hrp.slice(-1);
    value = hrp.slice(0, -1);
  } else if (hrp.slice(-1).match(/^[^munp0-9]$/)) {
    throw Error("invalid amount");
  } else {
    value = hrp;
  }

  if (!value.match(/^\d+$/)) {
    throw Error("invalid amount");
  }

  const valueBN = new BN(value, 10);
  const satoshisBN = divisor
    ? valueBN.mul(SATS_PER_BTC).div(DIVISORS[divisor as BitcoinDivisor])
    : valueBN.mul(SATS_PER_BTC);

  return satoshisBN.toString();
};

export const formatTime = (sec: number) => {
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (hours <= 0 && minutes <= 0) {
    return "Expired";
  }
  return `${hours}H ${minutes}M`;
};

const getBoltField = (invoice: Record<string, any>, key: string) =>
  invoice.find((item: any) => item.name === key);

const formatInvoice = (invoice: string) => {
  const decodedInvoice = require("light-bolt11-decoder").decode(
    invoice
  ).sections;
  const expireDatetime =
    getBoltField(decodedInvoice, "timestamp").value +
    getBoltField(decodedInvoice, "expiry").value;
  return {
    amount: hrpToSatoshi(getBoltField(decodedInvoice, "amount").letters),
    expireTime: expireDatetime - Math.floor(new Date().getTime() / 1000),
    description: getBoltField(decodedInvoice, "description").value,
  };
};

export type InvoiceContent = {
  amount: string;
  expiredIn: string;
  description: string;
};

export const transferInvoiceContent = (invoice: string): InvoiceContent => {
  const formattedInvoice = formatInvoice(invoice);
  return {
    amount: formattedInvoice.amount + " sats",
    expiredIn: formatTime(formattedInvoice.expireTime),
    description: formattedInvoice.description,
  };
};
