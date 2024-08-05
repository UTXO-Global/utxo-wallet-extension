"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVaultUpdated =
  exports.updateVaultWithDetail =
  exports.updateVault =
  exports.generateSalt =
  exports.serializeBufferForStorage =
  exports.serializeBufferFromStorage =
  exports.keyFromPassword =
  exports.exportKey =
  exports.importKey =
  exports.decryptWithKey =
  exports.decryptWithDetail =
  exports.decrypt =
  exports.encryptWithKey =
  exports.encryptWithDetail =
  exports.encrypt =
  exports.isPlainObject =
  exports.hasProperty =
    void 0;

const hasProperty = (objectToCheck, name) =>
  Object.hasOwnProperty.call(objectToCheck, name);

exports.hasProperty = hasProperty;
function isPlainObject(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  try {
    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
      proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(value) === proto;
  } catch (_) {
    return false;
  }
}
exports.isPlainObject = isPlainObject;
const EXPORT_FORMAT = "jwk";
const DERIVED_KEY_FORMAT = "AES-GCM";
const STRING_ENCODING = "utf-8";
const OLD_DERIVATION_PARAMS = {
  algorithm: "PBKDF2",
  params: {
    iterations: 10000,
  },
};
const DEFAULT_DERIVATION_PARAMS = {
  algorithm: "PBKDF2",
  params: {
    iterations: 900000,
  },
};
/**
 * Encrypts a data object that can be any serializable value using
 * a provided password.
 *
 * @param password - The password to use for encryption.
 * @param dataObj - The data to encrypt.
 * @param key - The CryptoKey to encrypt with.
 * @param salt - The salt to use to encrypt.
 * @param keyDerivationOptions - The options to use for key derivation.
 * @returns The encrypted vault.
 */
async function encrypt(
  password,
  dataObj,
  key,
  salt = generateSalt(),
  keyDerivationOptions = DEFAULT_DERIVATION_PARAMS
) {
  const cryptoKey =
    key || (await keyFromPassword(password, salt, false, keyDerivationOptions));
  const payload = await encryptWithKey(cryptoKey, dataObj);
  payload.salt = salt;
  return JSON.stringify(payload);
}
exports.encrypt = encrypt;
/**
 * Encrypts a data object that can be any serializable value using
 * a provided password.
 *
 * @param password - A password to use for encryption.
 * @param dataObj - The data to encrypt.
 * @param salt - The salt used to encrypt.
 * @param keyDerivationOptions - The options to use for key derivation.
 * @returns The vault and exported key string.
 */
async function encryptWithDetail(
  password,
  dataObj,
  salt = generateSalt(),
  keyDerivationOptions = DEFAULT_DERIVATION_PARAMS
) {
  const key = await keyFromPassword(password, salt, true, keyDerivationOptions);
  const exportedKeyString = await exportKey(key);
  const vault = await encrypt(password, dataObj, key, salt);
  return {
    vault,
    exportedKeyString,
  };
}
exports.encryptWithDetail = encryptWithDetail;
/**
 * Encrypts the provided serializable javascript object using the
 * provided CryptoKey and returns an object containing the cypher text and
 * the initialization vector used.
 *
 * @param encryptionKey - The CryptoKey to encrypt with.
 * @param dataObj - A serializable JavaScript object to encrypt.
 * @returns The encrypted data.
 */
async function encryptWithKey(encryptionKey, dataObj) {
  const data = JSON.stringify(dataObj);
  const dataBuffer = Buffer.from(data, STRING_ENCODING);
  const vector = global.crypto.getRandomValues(new Uint8Array(16));
  const key = unwrapKey(encryptionKey);
  const buf = await global.crypto.subtle.encrypt(
    {
      name: DERIVED_KEY_FORMAT,
      iv: vector,
    },
    key,
    dataBuffer
  );
  const buffer = new Uint8Array(buf);
  const vectorStr = Buffer.from(vector).toString("base64");
  const vaultStr = Buffer.from(buffer).toString("base64");
  const encryptionResult = {
    data: vaultStr,
    iv: vectorStr,
  };
  if (isEncryptionKey(encryptionKey)) {
    encryptionResult.keyMetadata = encryptionKey.derivationOptions;
  }
  return encryptionResult;
}
exports.encryptWithKey = encryptWithKey;
/**
 * Given a password and a cypher text, decrypts the text and returns
 * the resulting value.
 *
 * @param password - The password to decrypt with.
 * @param text - The cypher text to decrypt.
 * @param encryptionKey - The key to decrypt with.
 * @returns The decrypted data.
 */
async function decrypt(password, text, encryptionKey) {
  const payload = JSON.parse(text);
  const { salt, keyMetadata } = payload;
  const cryptoKey = unwrapKey(
    encryptionKey || (await keyFromPassword(password, salt, false, keyMetadata))
  );
  const result = await decryptWithKey(cryptoKey, payload);
  return result;
}
exports.decrypt = decrypt;
/**
 * Given a password and a cypher text, decrypts the text and returns
 * the resulting value, keyString, and salt.
 *
 * @param password - The password to decrypt with.
 * @param text - The encrypted vault to decrypt.
 * @returns The decrypted vault along with the salt and exported key.
 */
async function decryptWithDetail(password, text) {
  const payload = JSON.parse(text);
  const { salt, keyMetadata } = payload;
  const key = await keyFromPassword(password, salt, true, keyMetadata);
  const exportedKeyString = await exportKey(key);
  const vault = await decrypt(password, text, key);
  return {
    exportedKeyString,
    vault,
    salt,
  };
}
exports.decryptWithDetail = decryptWithDetail;
/**
 * Given a CryptoKey and an EncryptionResult object containing the initialization
 * vector (iv) and data to decrypt, return the resulting decrypted value.
 *
 * @param encryptionKey - The CryptoKey to decrypt with.
 * @param payload - The payload to decrypt, returned from an encryption method.
 * @returns The decrypted data.
 */
async function decryptWithKey(encryptionKey, payload) {
  const encryptedData = Buffer.from(payload.data, "base64");
  const vector = Buffer.from(payload.iv, "base64");
  const key = unwrapKey(encryptionKey);
  let decryptedObj;
  try {
    const result = await crypto.subtle.decrypt(
      { name: DERIVED_KEY_FORMAT, iv: vector },
      key,
      encryptedData
    );
    const decryptedData = new Uint8Array(result);
    const decryptedStr = Buffer.from(decryptedData).toString(STRING_ENCODING);
    decryptedObj = JSON.parse(decryptedStr);
  } catch (e) {
    throw new Error("Incorrect password");
  }
  return decryptedObj;
}
exports.decryptWithKey = decryptWithKey;
/**
 * Receives an exported CryptoKey string and creates a key.
 *
 * This function supports both JsonWebKey's and exported EncryptionKey's.
 * It will return a CryptoKey for the former, and an EncryptionKey for the latter.
 *
 * @param keyString - The key string to import.
 * @returns An EncryptionKey or a CryptoKey.
 */
async function importKey(keyString) {
  const exportedEncryptionKey = JSON.parse(keyString);
  if (isExportedEncryptionKey(exportedEncryptionKey)) {
    return {
      key: await window.crypto.subtle.importKey(
        EXPORT_FORMAT,
        exportedEncryptionKey.key,
        DERIVED_KEY_FORMAT,
        true,
        ["encrypt", "decrypt"]
      ),
      derivationOptions: exportedEncryptionKey.derivationOptions,
    };
  }
  return await window.crypto.subtle.importKey(
    EXPORT_FORMAT,
    exportedEncryptionKey,
    DERIVED_KEY_FORMAT,
    true,
    ["encrypt", "decrypt"]
  );
}
exports.importKey = importKey;
/**
 * Exports a key string from a CryptoKey or from an
 * EncryptionKey instance.
 *
 * @param encryptionKey - The CryptoKey or EncryptionKey to export.
 * @returns A key string.
 */
async function exportKey(encryptionKey) {
  if (isEncryptionKey(encryptionKey)) {
    return JSON.stringify({
      key: await window.crypto.subtle.exportKey(
        EXPORT_FORMAT,
        encryptionKey.key
      ),
      derivationOptions: encryptionKey.derivationOptions,
    });
  }
  return JSON.stringify(
    await window.crypto.subtle.exportKey(EXPORT_FORMAT, encryptionKey)
  );
}
exports.exportKey = exportKey;
// The overloads are already documented.
async function keyFromPassword(
  password,
  salt,
  exportable = false,
  opts = OLD_DERIVATION_PARAMS
) {
  const passBuffer = Buffer.from(password, STRING_ENCODING);
  const saltBuffer = Buffer.from(salt, "base64");
  const key = await global.crypto.subtle.importKey(
    "raw",
    passBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const derivedKey = await global.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: opts.params.iterations,
      hash: "SHA-256",
    },
    key,
    { name: DERIVED_KEY_FORMAT, length: 256 },
    exportable,
    ["encrypt", "decrypt"]
  );
  return opts
    ? {
        key: derivedKey,
        derivationOptions: opts,
      }
    : derivedKey;
}
exports.keyFromPassword = keyFromPassword;
/**
 * Converts a hex string into a buffer.
 *
 * @param str - Hex encoded string.
 * @returns The string ecoded as a byte array.
 */
function serializeBufferFromStorage(str) {
  const stripStr = str.slice(0, 2) === "0x" ? str.slice(2) : str;
  const buf = new Uint8Array(stripStr.length / 2);
  for (let i = 0; i < stripStr.length; i += 2) {
    const seg = stripStr.substr(i, 2);
    buf[i / 2] = parseInt(seg, 16);
  }
  return buf;
}
exports.serializeBufferFromStorage = serializeBufferFromStorage;
/**
 * Converts a buffer into a hex string ready for storage.
 *
 * @param buffer - Buffer to serialize.
 * @returns A hex encoded string.
 */
function serializeBufferForStorage(buffer) {
  let result = "0x";
  buffer.forEach((value) => {
    result += unprefixedHex(value);
  });
  return result;
}
exports.serializeBufferForStorage = serializeBufferForStorage;
/**
 * Converts a number into hex value, and ensures proper leading 0
 * for single characters strings.
 *
 * @param num - The number to convert to string.
 * @returns An unprefixed hex string.
 */
function unprefixedHex(num) {
  let hex = num.toString(16);
  while (hex.length < 2) {
    hex = `0${hex}`;
  }
  return hex;
}
/**
 * Generates a random string for use as a salt in CryptoKey generation.
 *
 * @param byteCount - The number of bytes to generate.
 * @returns A randomly generated string.
 */
function generateSalt(byteCount = 32) {
  const view = new Uint8Array(byteCount);
  global.crypto.getRandomValues(view);
  // Uint8Array is a fixed length array and thus does not have methods like pop, etc
  // so TypeScript complains about casting it to an array. Array.from() works here for
  // getting the proper type, but it results in a functional difference. In order to
  // cast, you have to first cast view to unknown then cast the unknown value to number[]
  // TypeScript ftw: double opt in to write potentially type-mismatched code.
  const b64encoded = btoa(String.fromCharCode.apply(null, view));
  return b64encoded;
}
exports.generateSalt = generateSalt;
/**
 * Updates the provided vault, re-encrypting
 * data with a safer algorithm if one is available.
 *
 * If the provided vault is already using the latest available encryption method,
 * it is returned as is.
 *
 * @param vault - The vault to update.
 * @param password - The password to use for encryption.
 * @param targetDerivationParams - The options to use for key derivation.
 * @returns A promise resolving to the updated vault.
 */
async function updateVault(
  vault,
  password,
  targetDerivationParams = DEFAULT_DERIVATION_PARAMS
) {
  if (isVaultUpdated(vault, targetDerivationParams)) {
    return vault;
  }
  return encrypt(
    password,
    await decrypt(password, vault),
    undefined,
    undefined,
    targetDerivationParams
  );
}
exports.updateVault = updateVault;
/**
 * Updates the provided vault and exported key, re-encrypting
 * data with a safer algorithm if one is available.
 *
 * If the provided vault is already using the latest available encryption method,
 * it is returned as is.
 *
 * @param encryptionResult - The encrypted data to update.
 * @param password - The password to use for encryption.
 * @param targetDerivationParams - The options to use for key derivation.
 * @returns A promise resolving to the updated encrypted data and exported key.
 */
async function updateVaultWithDetail(
  encryptionResult,
  password,
  targetDerivationParams = DEFAULT_DERIVATION_PARAMS
) {
  if (isVaultUpdated(encryptionResult.vault, targetDerivationParams)) {
    return encryptionResult;
  }
  return encryptWithDetail(
    password,
    await decrypt(password, encryptionResult.vault),
    undefined,
    targetDerivationParams
  );
}
exports.updateVaultWithDetail = updateVaultWithDetail;
/**
 * Checks if the provided key is an `EncryptionKey`.
 *
 * @param encryptionKey - The object to check.
 * @returns Whether or not the key is an `EncryptionKey`.
 */
function isEncryptionKey(encryptionKey) {
  return (
    isPlainObject(encryptionKey) &&
    (0, exports.hasProperty)(encryptionKey, "key") &&
    (0, exports.hasProperty)(encryptionKey, "derivationOptions") &&
    encryptionKey.key instanceof CryptoKey &&
    isKeyDerivationOptions(encryptionKey.derivationOptions)
  );
}
/**
 * Checks if the provided object is a `KeyDerivationOptions`.
 *
 * @param derivationOptions - The object to check.
 * @returns Whether or not the object is a `KeyDerivationOptions`.
 */
function isKeyDerivationOptions(derivationOptions) {
  return (
    isPlainObject(derivationOptions) &&
    (0, exports.hasProperty)(derivationOptions, "algorithm") &&
    (0, exports.hasProperty)(derivationOptions, "params")
  );
}
/**
 * Checks if the provided key is an `ExportedEncryptionKey`.
 *
 * @param exportedKey - The object to check.
 * @returns Whether or not the object is an `ExportedEncryptionKey`.
 */
function isExportedEncryptionKey(exportedKey) {
  return (
    isPlainObject(exportedKey) &&
    (0, exports.hasProperty)(exportedKey, "key") &&
    (0, exports.hasProperty)(exportedKey, "derivationOptions") &&
    isKeyDerivationOptions(exportedKey.derivationOptions)
  );
}
/**
 * Returns the `CryptoKey` from the provided encryption key.
 * If the provided key is a `CryptoKey`, it is returned as is.
 *
 * @param encryptionKey - The key to unwrap.
 * @returns The `CryptoKey` from the provided encryption key.
 */
function unwrapKey(encryptionKey) {
  return isEncryptionKey(encryptionKey) ? encryptionKey.key : encryptionKey;
}
/**
 * Checks if the provided vault is an updated encryption format.
 *
 * @param vault - The vault to check.
 * @param targetDerivationParams - The options to use for key derivation.
 * @returns Whether or not the vault is an updated encryption format.
 */
function isVaultUpdated(
  vault,
  targetDerivationParams = DEFAULT_DERIVATION_PARAMS
) {
  const { keyMetadata } = JSON.parse(vault);
  return (
    isKeyDerivationOptions(keyMetadata) &&
    keyMetadata.algorithm === targetDerivationParams.algorithm &&
    keyMetadata.params.iterations === targetDerivationParams.params.iterations
  );
}
exports.isVaultUpdated = isVaultUpdated;
//# sourceMappingURL=index.js.map
