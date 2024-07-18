export interface ITransferToken {
  p: "";
  op: "transfer";
  tick: string;
  amt: string;
}

export interface ITransfer {
  inscription_id: string;
  amount: number;
}

export interface IToken {
  tick: string;
  balance: number;
  transferable_balance: number;
  transfers: ITransfer[];
}
