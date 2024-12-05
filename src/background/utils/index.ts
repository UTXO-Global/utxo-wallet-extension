import compose from "koa-compose";
import { blockchain, Script } from "@ckb-lumos/base";

export const underline2Camelcase = (str: string) => {
  return str.replace(/_(.)/g, (m, p1) => p1.toUpperCase());
};

export const wait = (fn: () => void, ms = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      fn();
      resolve(true);
    }, ms);
  });
};

export default class PromiseFlow {
  private _tasks: compose.Middleware<any>[] = [];
  _context: any = {};
  requestedApproval = false;

  use(fn: compose.Middleware<any>): PromiseFlow {
    if (typeof fn !== "function") {
      throw new Error("promise need function to handle");
    }
    this._tasks.push(fn);

    return this;
  }

  callback() {
    return compose(this._tasks);
  }
}

export const toHexString = (bytes: Uint8Array): string =>
  "0x" +
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");

export function calculateScriptPack(script: Script): Uint8Array {
  return blockchain.Script.pack(script);
}

export const fromHexString = (hexString: string) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

export const udtDataToDecimal = (hexString: string) =>
  Number(toHexString(fromHexString(hexString.replaceAll("0x", "")).reverse()));
