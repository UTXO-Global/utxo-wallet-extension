export declare type PlainObject = Record<number | string | symbol, unknown>;
export declare const hasProperty: <
  ObjectToCheck extends Record<string | number | symbol, unknown>,
  Property extends PropertyKey
>(
  objectToCheck: ObjectToCheck,
  name: Property
) => objectToCheck is ObjectToCheck &
  Record<
    Property,
    Property extends keyof ObjectToCheck ? ObjectToCheck[Property] : unknown
  >;
export declare function isPlainObject(value: unknown): value is PlainObject;
export declare type DetailedEncryptionResult = {
  vault: string;
  exportedKeyString: string;
};
export declare type PBKDF2Params = {
  iterations: number;
};
export declare type KeyDerivationOptions = {
  algorithm: "PBKDF2";
  params: PBKDF2Params;
};
export declare type EncryptionKey = {
  key: CryptoKey;
  derivationOptions: KeyDerivationOptions;
};
export declare type ExportedEncryptionKey = {
  key: JsonWebKey;
  derivationOptions: KeyDerivationOptions;
};
export declare type EncryptionResult = {
  data: string;
  iv: string;
  salt?: string;
  keyMetadata?: KeyDerivationOptions;
};
export declare type DetailedDecryptResult = {
  exportedKeyString: string;
  vault: unknown;
  salt: string;
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
export declare function encrypt<R>(
  password: string,
  dataObj: R,
  key?: EncryptionKey | CryptoKey,
  salt?: string,
  keyDerivationOptions?: KeyDerivationOptions
): Promise<string>;
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
export declare function encryptWithDetail<R>(
  password: string,
  dataObj: R,
  salt?: string,
  keyDerivationOptions?: KeyDerivationOptions
): Promise<DetailedEncryptionResult>;
/**
 * Encrypts the provided serializable javascript object using the
 * provided CryptoKey and returns an object containing the cypher text and
 * the initialization vector used.
 *
 * @param encryptionKey - The CryptoKey to encrypt with.
 * @param dataObj - A serializable JavaScript object to encrypt.
 * @returns The encrypted data.
 */
export declare function encryptWithKey<R>(
  encryptionKey: EncryptionKey | CryptoKey,
  dataObj: R
): Promise<EncryptionResult>;
/**
 * Given a password and a cypher text, decrypts the text and returns
 * the resulting value.
 *
 * @param password - The password to decrypt with.
 * @param text - The cypher text to decrypt.
 * @param encryptionKey - The key to decrypt with.
 * @returns The decrypted data.
 */
export declare function decrypt(
  password: string,
  text: string,
  encryptionKey?: EncryptionKey | CryptoKey
): Promise<unknown>;
/**
 * Given a password and a cypher text, decrypts the text and returns
 * the resulting value, keyString, and salt.
 *
 * @param password - The password to decrypt with.
 * @param text - The encrypted vault to decrypt.
 * @returns The decrypted vault along with the salt and exported key.
 */
export declare function decryptWithDetail(
  password: string,
  text: string
): Promise<DetailedDecryptResult>;
/**
 * Given a CryptoKey and an EncryptionResult object containing the initialization
 * vector (iv) and data to decrypt, return the resulting decrypted value.
 *
 * @param encryptionKey - The CryptoKey to decrypt with.
 * @param payload - The payload to decrypt, returned from an encryption method.
 * @returns The decrypted data.
 */
export declare function decryptWithKey<R>(
  encryptionKey: EncryptionKey | CryptoKey,
  payload: EncryptionResult
): Promise<R>;
/**
 * Receives an exported CryptoKey string and creates a key.
 *
 * This function supports both JsonWebKey's and exported EncryptionKey's.
 * It will return a CryptoKey for the former, and an EncryptionKey for the latter.
 *
 * @param keyString - The key string to import.
 * @returns An EncryptionKey or a CryptoKey.
 */
export declare function importKey(
  keyString: string
): Promise<EncryptionKey | CryptoKey>;
/**
 * Exports a key string from a CryptoKey or from an
 * EncryptionKey instance.
 *
 * @param encryptionKey - The CryptoKey or EncryptionKey to export.
 * @returns A key string.
 */
export declare function exportKey(
  encryptionKey: CryptoKey | EncryptionKey
): Promise<string>;
/**
 * Generate a CryptoKey from a password and random salt.
 *
 * @param password - The password to use to generate key.
 * @param salt - The salt string to use in key derivation.
 * @param exportable - Whether or not the key should be exportable.
 * @returns A CryptoKey for encryption and decryption.
 */
export declare function keyFromPassword(
  password: string,
  salt: string,
  exportable?: boolean
): Promise<CryptoKey>;
/**
 * Generate a CryptoKey from a password and random salt, specifying
 * key derivation options.
 *
 * @param password - The password to use to generate key.
 * @param salt - The salt string to use in key derivation.
 * @param exportable - Whether or not the key should be exportable.
 * @param opts - The options to use for key derivation.
 * @returns An EncryptionKey for encryption and decryption.
 */
export declare function keyFromPassword(
  password: string,
  salt: string,
  exportable?: boolean,
  opts?: KeyDerivationOptions
): Promise<EncryptionKey>;
/**
 * Converts a hex string into a buffer.
 *
 * @param str - Hex encoded string.
 * @returns The string ecoded as a byte array.
 */
export declare function serializeBufferFromStorage(str: string): Uint8Array;
/**
 * Converts a buffer into a hex string ready for storage.
 *
 * @param buffer - Buffer to serialize.
 * @returns A hex encoded string.
 */
export declare function serializeBufferForStorage(buffer: Uint8Array): string;
/**
 * Generates a random string for use as a salt in CryptoKey generation.
 *
 * @param byteCount - The number of bytes to generate.
 * @returns A randomly generated string.
 */
export declare function generateSalt(byteCount?: number): string;
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
export declare function updateVault(
  vault: string,
  password: string,
  targetDerivationParams?: KeyDerivationOptions
): Promise<string>;
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
export declare function updateVaultWithDetail(
  encryptionResult: DetailedEncryptionResult,
  password: string,
  targetDerivationParams?: KeyDerivationOptions
): Promise<DetailedEncryptionResult>;
/**
 * Checks if the provided vault is an updated encryption format.
 *
 * @param vault - The vault to check.
 * @param targetDerivationParams - The options to use for key derivation.
 * @returns Whether or not the vault is an updated encryption format.
 */
export declare function isVaultUpdated(
  vault: string,
  targetDerivationParams?: KeyDerivationOptions
): boolean;
