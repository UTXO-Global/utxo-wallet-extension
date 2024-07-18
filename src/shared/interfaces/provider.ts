import { Inscription } from "./inscriptions";

export interface IField {
  input: boolean;
  label: string;
  important: boolean;
  value: IFieldValue;
}

export interface IFieldValue {
  text?: string;
  inscriptions?: Inscription[];
  value?: string;
  anyonecanpay?: boolean;
}

export interface LocationValue {
  [key: string]: number;
}

interface BaseUserToSignInput {
  index: number;
  sighashTypes: number[] | undefined;
  disableTweakSigner?: boolean;
}

export interface HdPathUserToSignInput extends BaseUserToSignInput {
  hdpath: string;
}

export type UserToSignInput = HdPathUserToSignInput;

export interface SignPsbtOptions {
  autoFinalized: boolean;
  toSignInputs?: UserToSignInput[];
}

export interface ToSignInput {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
}
