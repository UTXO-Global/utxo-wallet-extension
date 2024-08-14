import { ITransaction } from "@/shared/interfaces/api";

export type CkbTransactionResponse = {
  data: CkbTransaction[];
};

export type CkbTipBlockResponse = {
  data: {
    attributes: {
      tip_block_number: number;
    };
  };
};

type CkbOutput = {
  capacity: string;
  generated_tx_hash: string;
  cell_index: string;
  address_hash: string;
};

type CkbInput = {
  generated_tx_hash: string;
  capacity: string;
  cell_index: string;
  address_hash: string;
};

type CkbTransaction = {
  attributes: {
    transaction_hash: string; // txid
    block_number: string; // version
    block_timestamp: string; // ms
    display_inputs: CkbInput[];
    display_outputs: CkbOutput[];
    income: string;
  };
};

export function toITransactions(res: CkbTransactionResponse): ITransaction[] {
  return res.data.map((d) => {
    const totalInputs = d.attributes.display_inputs.reduce(
      (acc, x) => (acc += parseFloat(x.capacity)),
      0.0
    );
    const totalOutputs = d.attributes.display_outputs.reduce(
      (acc, x) => (acc += parseFloat(x.capacity)),
      0.0
    );

    return {
      txid: d.attributes.transaction_hash,
      version: parseInt(d.attributes.block_number),
      locktime: 0,
      vin: d.attributes.display_inputs.map((x) => ({
        txid: x.generated_tx_hash,
        vout: parseFloat(x.capacity),
        sequence: parseInt(x.cell_index),
        prevout: {
          scriptpubkey: "",
          scriptpubkey_asm: "",
          scriptpubkey_type: "",
          scriptpubkey_address: x.address_hash,
          value: parseFloat(x.capacity),
        },
        scriptsig: "",
        scriptsig_asm: "",
        is_coinbase: false,
      })),
      vout: d.attributes.display_outputs.map((x) => ({
        value: parseFloat(x.capacity),
        scriptpubkey_address: x.address_hash,
        scriptpubkey: "",
        scriptpubkey_asm: "",
        scriptpubkey_type: "",
      })),
      size: 0,
      weight: 0,
      sigops: 0,
      fee: totalInputs - totalOutputs,
      status: {
        confirmed: true,
        block_height: parseInt(d.attributes.block_number),
        block_hash: d.attributes.block_number,
        block_time: parseInt(d.attributes.block_timestamp),
      },
    };
  });
}

