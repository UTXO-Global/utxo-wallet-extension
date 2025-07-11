import type { IPrivateWallet } from "@/shared/interfaces";
import { ApiOrdUTXO } from "@/shared/interfaces/inscriptions";
import { NetworkSlug } from "@/shared/networks/types";
import { Psbt } from "bitcoinjs-lib";
import { keyringService } from "../services";
import type {
  SendCkbToken,
  SendCoin,
  SendOrd,
  TransferNFT,
  UserToSignInput,
} from "../services/keyring/types";
import { ApiUTXO } from "@/shared/interfaces/api";
import { Transaction } from "@ckb-lumos/lumos";
import { convertCKBTransactionToSkeleton } from "@/shared/networks/ckb/helpers";
import { ccc } from "@ckb-ccc/core";

export interface IKeyringController {
  init(password: string): Promise<IPrivateWallet[]>;
  newKeyring(
    type: "simple" | "root",
    payload: string
  ): Promise<string | undefined>;
  exportAccount(hdPath: string, networkSlug: NetworkSlug): Promise<string>;
  signTransaction(txHex: string): Promise<string>;
  signMessage(msgParams: { hdPath: string; data: string }): Promise<string>;
  signPersonalMessage(msgParams: {
    hdPath: string;
    data: string;
  }): Promise<string>;
  signCkbTransaction(
    fromAddress: string,
    networkSlug: NetworkSlug,
    tx: any,
    hdPath: string
  ): Promise<Transaction>;
  ckbSignSwapTransaction(
    fromAddress: string,
    networkSlug: NetworkSlug,
    tx: any,
    hdPath: string
  ): Promise<Transaction>;
  sendCoin(data: SendCoin): Promise<string>;
  sendToken(data: SendCkbToken): Promise<{ tx: string; fee: string }>;
  createTransferNFT(data: TransferNFT): Promise<{ tx: string; fee: string }>;
  sendOrd(data: Omit<SendOrd, "amount">): Promise<string>;
  exportPublicKey(address: string): Promise<string>;
  serializeKeyringById(index: number): Promise<any>;
  signAllInputs(
    txHex: string
  ): Promise<{ psbtHex: string; signatures: (string | undefined)[] }>;
  createSendMultiOrd(
    toAddress: string,
    feeRate: number,
    ordUtxos: ApiOrdUTXO[],
    utxos: ApiUTXO[]
  ): Promise<string>;
  sendRgbpp(btcPsbtHex: string, inputs?: UserToSignInput[]): Promise<string>;
  getSigner(): ccc.Signer;
}

class KeyringController implements IKeyringController {
  /**
   * Method should be called after user typed a password
   * @param {string} password Password that used on creating account
   * @returns {Promise<IPrivateWallet[]>} List of imported accounts that was initialized
   */
  async init(password: string): Promise<IPrivateWallet[]> {
    return await keyringService.init(password);
  }

  getSigner(): ccc.Signer {
    return keyringService.getSigner();
  }

  /**
   * Method should be called to create a new wallet from mnemonic
   * @param {"simple" | "root"} type Type of wallet that should be created
   * @param {string} payload Phrases string words separated by space that generated for wallet or private key hex format
   * @returns {Promise<undefined>}
   */
  async newKeyring(
    walletType: "simple" | "root",
    payload: string
  ): Promise<undefined> {
    await keyringService.newKeyring({ walletType, payload });
  }

  /**
   * Method exports private key of selected account
   * @param {string} hdPath
   * @returns {Promise<string>} WIF representation of private key
   */
  async exportAccount(
    hdPath: string,
    networkSlug: NetworkSlug
  ): Promise<string> {
    return keyringService.exportAccount(hdPath, networkSlug);
  }

  /**
   * Method should be used to sign a new transaction before broadcasting it
   * @param {string} txHex Psbt builded transaction with inputs that should be signed and hexed
   * @returns {Promise<string>} Method mutate input transaction and with that returns nothing
   */
  async signTransaction(txHex: string): Promise<string> {
    const psbt = Psbt.fromHex(txHex);
    (psbt as any).__CACHE.__UNSAFE_SIGN_NONSEGWIT = true;
    keyringService.signPsbt(psbt);
    (psbt as any).__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
    return psbt.toHex();
  }

  async signAllInputs(txHex: string) {
    const psbt = Psbt.fromHex(txHex);
    const signatures = keyringService.signAllPsbtInputs(psbt);
    return { psbtHex: psbt.toHex(), signatures };
  }

  async signMessage(msgParams: { hdPath: string; data: string }) {
    return keyringService.signMessage(msgParams);
  }

  async signPersonalMessage(msgParams: { hdPath: string; data: string }) {
    return keyringService.signPersonalMessage(msgParams);
  }

  /**
   * Method should be used to create hex of transaction and sigs all inputs
   * @param {SendCoin} data Input data for the transaction
   * @returns {Promise<string>} Hex of transaction to push transaction to the blockchain with
   */
  async sendCoin(data: SendCoin): Promise<string> {
    return await keyringService.sendCoin(data);
  }

  async sendToken(data: SendCkbToken): Promise<{ tx: string; fee: string }> {
    return await keyringService.sendToken(data);
  }

  async createTransferNFT(
    data: TransferNFT
  ): Promise<{ tx: string; fee: string }> {
    return await keyringService.createTransferNFT(data);
  }

  async sendOrd(data: Omit<SendOrd, "amount">): Promise<string> {
    return await keyringService.sendOrd(data);
  }

  async exportPublicKey(address: string): Promise<string> {
    return keyringService.exportPublicKey(address);
  }

  async serializeKeyringById(index: number) {
    return keyringService.serializeById(index);
  }

  async createSendMultiOrd(
    toAddress: string,
    feeRate: number,
    ordUtxos: ApiOrdUTXO[],
    utxos: ApiUTXO[]
  ): Promise<string> {
    return keyringService.sendMultiOrd(toAddress, feeRate, ordUtxos, utxos);
  }

  async signCkbTransaction(
    fromAddress: string,
    networkSlug: NetworkSlug,
    tx: any,
    hdPath: string
  ): Promise<Transaction> {
    return await keyringService.signCkbTransaction({ tx, hdPath });
  }

  async ckbSignSwapTransaction(
    fromAddress: string,
    networkSlug: NetworkSlug,
    tx: any,
    hdPath: string
  ): Promise<Transaction> {
    const txSkeleton = await convertCKBTransactionToSkeleton(
      fromAddress,
      networkSlug,
      tx
    );

    return await keyringService.ckbSignSwapTransaction({
      tx: txSkeleton,
      hdPath,
    });
  }

  async sendRgbpp(
    btcPsbtHex: string,
    inputs?: UserToSignInput[]
  ): Promise<string> {
    return keyringService.sendRgbppAsset(btcPsbtHex, inputs);
  }
}

export default new KeyringController();
