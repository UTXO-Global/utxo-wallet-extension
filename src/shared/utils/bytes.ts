import { Buffer } from "buffer/";

export type BytesFromEncoding =
  | "utf8" // UTF-8 encoding
  | "utf16le" // UTF-16 Little Endian encoding
  | "latin1" // Latin-1 (ISO-8859-1) encoding
  | "base64" // Base64 encoding
  | "base64url" // Base64 URL encoding
  | "hex" // Hexadecimal encoding
  | "ascii" // ASCII encoding
  | "binary" // Binary encoding
  | "ucs2"; // UCS-2 (alias of UTF-16LE) encoding


export type Bytes = Uint8Array;
export type BytesLike = string | Uint8Array | ArrayBuffer | number[];

/**
 * Concatenates multiple byte-like arrays into a single byte array.
 *
 * @param args - The byte-like arrays to concatenate.
 * @returns A Uint8Array containing the concatenated bytes.
 *
 * @example
 * ```typescript
 * const concatenatedBytes = bytesConcat(
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4]),
 *   "hello",
 *   [5, 6, 7]
 * );
 * console.log(concatenatedBytes); // Outputs Uint8Array [1, 2, 3, 4, /* bytes of "hello" *\/, 5, 6, 7]
 * ```
 */

export function bytesConcat(...args: BytesLike[]): Bytes {
  return new Uint8Array(
    args.reduce((acc: number[], v) => {
      acc.push(...bytesFrom(v));
      return acc;
    }, []),
  );
}

/**
 * Converts a byte-like value to a string using the specified encoding.
 *
 * @param val - The byte-like value to convert.
 * @param encoding - The encoding to use for the conversion, as defined by the BytesFromEncoding type.
 * @returns A string representing the encoded bytes.
 *
 * @example
 * ```typescript
 * const encodedString = bytesTo(new Uint8Array([104, 101, 108, 108, 111]), "utf8");
 * console.log(encodedString); // Outputs "hello"
 *
 * const base64String = bytesTo(new Uint8Array([104, 101, 108, 108, 111]), "base64");
 * console.log(base64String); // Outputs "aGVsbG8="
 * ```
 */

export function bytesTo(val: BytesLike, encoding: BytesFromEncoding): string {
  return Buffer.from(bytesFrom(val)).toString(encoding);
}

/**
 * Converts various types of byte-like values to a Uint8Array.
 *
 * @param bytes - The byte-like value to convert. It can be a string, Uint8Array, ArrayBuffer, or number array.
 * @param encoding - Optional encoding to use if the input is a string. Defaults to hexadecimal if not specified.
 * @returns A Uint8Array representing the input bytes.
 *
 * @throws Will throw an error if the input bytes are invalid or out of range.
 *
 * @example
 * ```typescript
 * const bytes1 = bytesFrom(new Uint8Array([1, 2, 3]));
 * console.log(bytes1); // Outputs Uint8Array [1, 2, 3]
 *
 * const bytes2 = bytesFrom("68656c6c6f", "hex");
 * console.log(bytes2); // Outputs Uint8Array [104, 101, 108, 108, 111]
 *
 * const bytes3 = bytesFrom("hello", "utf8");
 * console.log(bytes3); // Outputs Uint8Array [104, 101, 108, 108, 111]
 *
 * const bytes4 = bytesFrom([1, 2, 255]);
 * console.log(bytes4); // Outputs Uint8Array [1, 2, 255]
 * ```
 */

export function bytesFrom(
  bytes: BytesLike,
  encoding?: BytesFromEncoding,
): Bytes {
  if (bytes instanceof Uint8Array) {
    return bytes;
  }

  if (bytes instanceof ArrayBuffer) {
    return new Uint8Array(bytes);
  }

  if (Array.isArray(bytes)) {
    if (bytes.some((v) => v < 0 || 0xff < v)) {
      throw new Error(`Invalid bytes ${JSON.stringify(bytes)}`);
    }
    return new Uint8Array(bytes);
  }

  if (encoding !== undefined) {
    return Buffer.from(bytes, encoding);
  }

  const str = bytes.startsWith("0x") ? bytes.slice(2) : bytes;
  const paddedStr = str.length % 2 === 0 ? str : `0${str}`;
  const data = Buffer.from(paddedStr, "hex");
  if (data.length * 2 !== paddedStr.length) {
    throw new Error(`Invalid bytes ${bytes}`);
  }
  return data;
}
