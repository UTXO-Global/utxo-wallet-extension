import type { ApiUTXO } from "@/shared/interfaces/api";
import { ApiOrdUTXO } from "@/shared/interfaces/inscriptions";
import { CKBTokenInfo } from "@/shared/networks/ckb/types";
import { Cell } from "@ckb-lumos/lumos";

export type Json = any;
export type Hex = string;

export type Eip1024EncryptedData = {
  version: string;
  nonce: string;
  ephemPublicKey: string;
  ciphertext: string;
};

interface SendBase {
  to: string;
  amount: number;
  receiverToPayFee: boolean;
  feeRate: number;
}

export type SendCoin = SendBtcCoin | SendCkbCoin;

export interface SendBtcCoin extends SendBase {
  utxos: ApiUTXO[];
}

export interface SendCkbCoin extends SendBase {
  cells: Cell[];
}

export interface SendCkbToken extends SendBase {
  token: CKBTokenInfo;
}

export interface SendOrd extends SendBase {
  utxos: ((ApiOrdUTXO & { isOrd?: boolean }) | ApiUTXO)[];
}

export interface TransferNFT {
  toAddress: string;
  feeRate: number;
  outPoint: {
    txHash: string;
    index: string;
  };
}

interface BaseUserToSignInput {
  index: number;
  sighashTypes: number[] | undefined;
  disableTweakSigner?: boolean;
}

export interface HdPathUserToSignInput extends BaseUserToSignInput {
  hdpath: string;
}

export interface AddressUserToSignInput extends BaseUserToSignInput {
  address: string;
}

export interface PublicKeyUserToSignInput extends BaseUserToSignInput {
  publicKey: string;
}

export type UserToSignInput =
  | HdPathUserToSignInput
  | AddressUserToSignInput
  | PublicKeyUserToSignInput;

export interface SignPsbtOptions {
  autoFinalized: boolean;
  toSignInputs?: UserToSignInput[];
}

export interface SignLNInvoiceOptions {
  toSignInputs?: UserToSignInput[];
}

export interface ToSignInput {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
}
