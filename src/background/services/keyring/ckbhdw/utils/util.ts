import {
  hexToBytes as fromHex,
  bytesToHex as toHex,
} from "@noble/hashes/utils";

export function bench(time: [number, number]) {
  if (!process.hrtime) {
    const now = Date.now();

    if (time) {
      const [hi, lo] = time;
      const start = hi * 1000 + lo / 1e6;
      return now - start;
    }

    const ms = now % 1000;

    // Seconds
    const hi = (now - ms) / 1000;

    // Nanoseconds
    const lo = ms * 1e6;

    return [hi, lo];
  }

  if (time) {
    const [hi, lo] = process.hrtime(time);
    return hi * 1000 + lo / 1e6;
  }

  return process.hrtime();
}

export function now(): number {
  return Math.floor(Date.now() / 1000);
}

export function ms(): number {
  return Number(Date.now());
}

export function date(time?: number): string {
  if (time === undefined) time = now();

  return new Date(time! * 1000).toISOString().slice(0, -5) + "Z";
}

export function time(date?: string): number {
  if (date == null) return now();

  return (Number(new Date(date)) / 1000) | 0;
}

export function revHex(buf: Uint8Array): string {
  return toHex(buf.reverse());
}

export function fromRev(str: string): Uint8Array {
  if ((str.length & 1) !== 0) throw new Error("Invalid rev");

  return fromHex(str).reverse();
}

export function parsePath(path: string): number[] {
  const parts = path.split("/");
  const root = parts[0];

  if (root !== "m" && root !== "M" && root !== "m'" && root !== "M'") {
    throw new Error("Invalid path root.");
  }

  const result = [];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];

    if (part.length > 10) throw new Error("Path index too large.");

    if (!/^\d+$/.test(part)) throw new Error("Path index is non-numeric.");

    const index = parseInt(part, 10);

    if (index >>> 0 !== index) throw new Error("Path index out of range.");

    result.push(index);
  }

  return result;
}
