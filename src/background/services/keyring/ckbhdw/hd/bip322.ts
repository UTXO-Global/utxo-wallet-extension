import { getNetworkDataBySlug } from "@/shared/networks";
import { NetworkSlug } from "@/shared/networks/types";
import * as tinysecp from "@bitcoinerlab/secp256k1";
import { ECPairInterface } from "@/packages/pair";
import * as bitcoin from "bitcoinjs-lib";
import { crypto, payments, Psbt, Transaction } from "bitcoinjs-lib";
import { Hash } from "fast-sha256";
import Address from "./address";
import { encodeSignature, magicHashMessage } from "./utils";

/**
 * Class that handles BIP-322 related operations.
 * Reference: https://github.com/LegReq/bip0322-signatures/blob/master/BIP0322_signing.ipynb
 */
class BIP322 {
  // BIP322 message tag
  static TAG = Buffer.from("BIP0322-signed-message");

  /**
   * Compute the message hash as specified in the BIP-322.
   * The standard is specified in BIP-340 as:
   *      The function hashtag(x) where tag is a UTF-8 encoded tag name and x is a byte array returns the 32-byte hash SHA256(SHA256(tag) || SHA256(tag) || x).
   * @param message Message to be hashed
   * @returns Hashed message
   */
  public static hashMessage(message: string) {
    // Compute the message hash - SHA256(SHA256(tag) || SHA256(tag) || message)
    const tagHasher = new Hash();
    tagHasher.update(this.TAG);
    const tagHash = tagHasher.digest();
    const messageHasher = new Hash();
    messageHasher.update(tagHash);
    messageHasher.update(tagHash);
    messageHasher.update(Buffer.from(message));
    const messageHash = messageHasher.digest();
    return messageHash;
  }

  /**
   * Build a to_spend transaction using simple signature in accordance to the BIP-322.
   * @param message Message to be signed using BIP-322
   * @param scriptPublicKey The script public key for the signing wallet
   * @returns Bitcoin transaction that correspond to the to_spend transaction
   */
  public static buildToSpendTx(message: string, scriptPublicKey: Buffer) {
    // Create PSBT object for constructing the transaction
    const psbt = new bitcoin.Psbt();
    // Set default value for nVersion and nLockTime
    psbt.setVersion(0); // nVersion = 0
    psbt.setLocktime(0); // nLockTime = 0
    // Compute the message hash - SHA256(SHA256(tag) || SHA256(tag) || message)
    const messageHash = this.hashMessage(message);
    // Construct the scriptSig - OP_0 PUSH32[ message_hash ]
    const scriptSigPartOne = new Uint8Array([0x00, 0x20]); // OP_0 PUSH32
    const scriptSig = new Uint8Array(
      scriptSigPartOne.length + messageHash.length
    );
    scriptSig.set(scriptSigPartOne);
    scriptSig.set(messageHash, scriptSigPartOne.length);
    // Set the input
    psbt.addInput({
      hash: "0".repeat(64), // vin[0].prevout.hash = 0000...000
      index: 0xffffffff, // vin[0].prevout.n = 0xFFFFFFFF
      sequence: 0, // vin[0].nSequence = 0
      finalScriptSig: Buffer.from(scriptSig), // vin[0].scriptSig = OP_0 PUSH32[ message_hash ]
      witnessScript: Buffer.from([]), // vin[0].scriptWitness = []
    });
    // Set the output
    psbt.addOutput({
      value: 0, // vout[0].nValue = 0
      script: scriptPublicKey, // vout[0].scriptPubKey = message_challenge
    });
    // Return transaction
    return psbt.extractTransaction();
  }

  /**
   * Build a to_sign transaction using simple signature in accordance to the BIP-322.
   * @param toSpendTxId Transaction ID of the to_spend transaction as constructed by buildToSpendTx
   * @param witnessScript The script public key for the signing wallet, or the redeemScript for P2SH-P2WPKH address
   * @param isRedeemScript Set to true if the provided witnessScript is a redeemScript for P2SH-P2WPKH address, default to false
   * @param tapInternalKey Used to set the taproot internal public key of a taproot signing address when provided, default to undefined
   * @returns Ready-to-be-signed bitcoinjs.Psbt transaction
   */
  public static buildToSignTx(
    toSpendTxId: string,
    witnessScript: Buffer,
    isRedeemScript: boolean = false,
    tapInternalKey: Buffer = undefined
  ) {
    // Create PSBT object for constructing the transaction
    const psbt = new bitcoin.Psbt();
    // Set default value for nVersion and nLockTime
    psbt.setVersion(0); // nVersion = 0
    psbt.setLocktime(0); // nLockTime = 0
    // Set the input
    psbt.addInput({
      hash: toSpendTxId, // vin[0].prevout.hash = to_spend.txid
      index: 0, // vin[0].prevout.n = 0
      sequence: 0, // vin[0].nSequence = 0
      witnessUtxo: {
        script: witnessScript,
        value: 0,
      },
    });
    // Set redeemScript as witnessScript if isRedeemScript
    if (isRedeemScript) {
      psbt.updateInput(0, {
        redeemScript: witnessScript,
      });
    }
    // Set tapInternalKey if provided
    if (tapInternalKey) {
      psbt.updateInput(0, {
        tapInternalKey: tapInternalKey,
      });
    }
    // Set the output
    psbt.addOutput({
      value: 0, // vout[0].nValue = 0
      script: Buffer.from([0x6a]), // vout[0].scriptPubKey = OP_RETURN
    });
    return psbt;
  }

  /**
   * Encode witness stack in a signed BIP-322 PSBT into its base-64 encoded format.
   * @param signedPsbt Signed PSBT
   * @returns Base-64 encoded witness data
   */
  public static encodeWitness(signedPsbt: bitcoin.Psbt) {
    // Obtain the signed witness data
    const witness = signedPsbt.data.inputs[0].finalScriptWitness;
    // Check if the witness data is present
    if (witness) {
      // Return the base-64 encoded witness stack
      return witness.toString("base64");
    } else {
      throw new Error("Cannot encode empty witness stack.");
    }
  }
}

export function signMessage(
  text: string,
  key: ECPairInterface,
  networkSlug: NetworkSlug
) {
  const network = getNetworkDataBySlug(networkSlug).network;
  const encodedMsg = magicHashMessage(network.messagePrefix, text);
  const { signature, recoveryId } = tinysecp.signRecoverable(
    encodedMsg,
    key.privateKey
  );
  const encodedSig = encodeSignature(
    Buffer.from(signature),
    recoveryId,
    key.compressed
  );
  return encodedSig.toString("base64");
}

export function signBip322(
  address: string,
  text: string,
  key: ECPairInterface,
  networkSlug: NetworkSlug
) {
  const network = getNetworkDataBySlug(networkSlug).network;

  // Legacy sign messsage
  if (Address.isP2PKH(address)) {
    return signMessage(text, key, networkSlug);
  }

  // BIP322
  const scriptPubKey = Address.convertAdressToScriptPubkey(address, network);
  // Draft corresponding toSpend using the message and script pubkey
  const toSpendTx = BIP322.buildToSpendTx(text, scriptPubKey);
  // Draft corresponding toSign transaction based on the address type
  let toSignTx: Psbt;
  if (Address.isP2SH(address)) {
    // P2SH-P2WPKH signing path
    // Derive the P2SH-P2WPKH redeemScript from the corresponding hashed public key
    const redeemScript = payments.p2wpkh({
      hash: crypto.hash160(key.publicKey),
      network: network,
    }).output as Buffer;
    toSignTx = BIP322.buildToSignTx(toSpendTx.getId(), redeemScript, true);
  } else if (Address.isP2WPKH(address, network)) {
    // P2WPKH signing path
    toSignTx = BIP322.buildToSignTx(toSpendTx.getId(), scriptPubKey);
  } else {
    // P2TR signing path
    // Extract the taproot internal public key
    const internalPublicKey = key.publicKey.subarray(1, 33);
    // Tweak the private key for signing, since the output and address uses tweaked key
    // Reference: https://github.com/bitcoinjs/bitcoinjs-lib/blob/1a9119b53bcea4b83a6aa8b948f0e6370209b1b4/test/integration/taproot.spec.ts#L55
    key = key.tweak(
      crypto.taggedHash("TapTweak", key.publicKey.subarray(1, 33))
    );
    // Draft a toSign transaction that spends toSpend transaction
    toSignTx = BIP322.buildToSignTx(
      toSpendTx.getId(),
      scriptPubKey,
      false,
      internalPublicKey
    );
    // Set the sighashType to bitcoin.Transaction.SIGHASH_ALL since it defaults to SIGHASH_DEFAULT
    toSignTx.updateInput(0, {
      sighashType: Transaction.SIGHASH_ALL,
    });
  }
  // Sign the toSign transaction
  const toSignTxSigned = toSignTx
    .signAllInputs(key, [Transaction.SIGHASH_ALL])
    .finalizeAllInputs();
  // Extract and return the signature
  return BIP322.encodeWitness(toSignTxSigned);
}
