import * as bitcoin from "bitcoinjs-lib";

// Import dependency
/**
 * Class that implement address-related utility functions.
 */
class Address {
  /**
   * Check if a given Bitcoin address is a pay-to-public-key-hash (p2pkh) address.
   * @param address Bitcoin address to be checked
   * @returns True if the provided address correspond to a valid P2PKH address, false if otherwise
   */
  public static isP2PKH(address: string) {
    // BTC address only supported P2PKH for now
    if (address[0] === "B") {
      return true; // P2PKH address
    }

    // Check if the provided address is a P2PKH address
    if (address[0] === "1" || address[0] === "m" || address[0] === "n") {
      return true; // P2PKH address
    } else {
      return false;
    }
  }

  /**
   * Check if a given Bitcoin address is a pay-to-script-hash (P2SH) address.
   * @param address Bitcoin address to be checked
   * @returns True if the provided address correspond to a valid P2SH address, false if otherwise
   */
  public static isP2SH(address: string) {
    // BTC address only supported P2PKH for now
    if (address[0] === "B") {
      return false; // P2PKH address
    }

    // Check if the provided address is a P2SH address
    if (address[0] === "3" || address[0] === "2") {
      return true; // P2SH address
    } else {
      return false;
    }
  }

  /**
   * Check if a given Bitcoin address is a pay-to-witness-public-key-hash (P2WPKH) address.
   * @param address Bitcoin address to be checked
   * @returns True if the provided address correspond to a valid P2WPKH address, false if otherwise
   */
  public static isP2WPKH(address: string, network: bitcoin.networks.Network) {
    // BTC address only supported P2PKH for now
    if (address[0] === "B") {
      return false; // P2PKH address
    }

    // Check if the provided address is a P2WPKH/P2WSH address
    if (address.slice(0, 4) === "bc1q" || address.slice(0, 4) === "tb1q") {
      // Either a P2WPKH / P2WSH address
      // Convert the address into a scriptPubKey
      const scriptPubKey = this.convertAdressToScriptPubkey(address, network);
      // Check if the scriptPubKey is exactly 22 bytes since P2WPKH scriptPubKey should be 0014<20-BYTE-PUBKEY-HASH>
      if (scriptPubKey.byteLength === 22) {
        return true; // P2WPKH
      } else {
        return false; // Not P2WPKH, probably P2WSH
      }
    } else {
      return false;
    }
  }

  /**
   * Check if a given Bitcoin address is a taproot address.
   * @param address Bitcoin address to be checked
   * @returns True if the provided address is a taproot address, false if otherwise
   */
  public static isP2TR(address: string) {
    // BTC address only supported P2PKH for now
    if (address[0] === "B") {
      return false; // P2PKH address
    }

    if (address.slice(0, 4) === "bc1p" || address.slice(0, 4) === "tb1p") {
      return true; // P2TR address
    } else {
      return false;
    }
  }

  /**
   * Convert a given Bitcoin address into its corresponding script public key.
   * Reference: https://github.com/buidl-bitcoin/buidl-python/blob/d79e9808e8ca60975d315be41293cb40d968626d/buidl/script.py#L607
   * @param address Bitcoin address
   * @returns Script public key of the given Bitcoin address
   * @throws Error when the provided address is not a valid Bitcoin address
   */
  public static convertAdressToScriptPubkey(
    address: string,
    network: bitcoin.networks.Network
  ) {
    if (
      address[0] === "1" ||
      address[0] === "m" ||
      address[0] === "n" ||
      address[0] === "B"
    ) {
      // P2PKH address
      return bitcoin.payments.p2pkh({
        address,
        network,
      }).output as Buffer;
    } else if (address[0] === "3" || address[0] === "2") {
      // P2SH address
      return bitcoin.payments.p2sh({
        address,
        network,
      }).output as Buffer;
    } else if (
      address.slice(0, 4) === "bc1q" ||
      address.slice(0, 4) === "tb1q"
    ) {
      // P2WPKH or P2WSH address
      if (address.length === 42) {
        // P2WPKH address
        return bitcoin.payments.p2wpkh({
          address,
          network,
        }).output as Buffer;
      } else if (address.length === 62) {
        // P2WSH address
        return bitcoin.payments.p2wsh({
          address: address,
          network:
            address.slice(0, 4) === "bc1q"
              ? bitcoin.networks.bitcoin
              : bitcoin.networks.testnet,
        }).output as Buffer;
      }
    } else if (
      address.slice(0, 4) === "bc1p" ||
      address.slice(0, 4) === "tb1p"
    ) {
      if (address.length === 62) {
        // P2TR address
        return bitcoin.payments.p2tr({
          address,
          network,
        }).output as Buffer;
      }
    }
    throw new Error("Unknown address type");
  }
}

export default Address;
