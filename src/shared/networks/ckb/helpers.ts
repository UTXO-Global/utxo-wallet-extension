import { BI, Cell, WitnessArgs, helpers } from "@ckb-lumos/lumos";
import { parseAddress } from "@ckb-lumos/lumos/helpers";
import { CKBHasher } from "@ckb-lumos/lumos/utils";
import { NetworkConfig } from "./offckb.config";
import { ckbExplorerApi } from "@/ui/utils/helpers";
import { CKBAddressInfo } from "./types";
import { getNetworkDataBySlug, isCkbNetwork } from "..";
import { NetworkSlug } from "../types";
import { blockchain } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";

export function publicKeyToBlake160(publicKey: string): string {
  const blake160: string = new CKBHasher()
    .update(publicKey)
    .digestHex()
    .slice(0, 42);

  return blake160;
}

export async function capacityOf(
  network: NetworkConfig,
  address: string
): Promise<BI> {
  const collector = network.indexer.collector({
    lock: parseAddress(address, { config: network.lumosConfig }),
  });

  let balance = BI.from(0);
  for await (const cell of collector.collect()) {
    balance = balance.add(cell.cellOutput.capacity);
  }

  return balance;
}

export async function getCells(
  network: NetworkConfig,
  address: string
): Promise<Cell[]> {
  const collector = network.indexer.collector({
    lock: parseAddress(address, { config: network.lumosConfig }),
  });

  const cells: Cell[] = [];
  for await (const cell of collector.collect()) {
    cells.push(cell);
  }

  return cells;
}

export const customizedFetch: typeof fetch = (
  request: string | URL | globalThis.Request,
  init?: RequestInit
) => {
  return globalThis.fetch(request, {
    ...init,
  });
};

export async function callCKBRPC(
  rpcURl: string,
  method: string,
  params: any[]
) {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  const body = JSON.stringify({
    id: 0,
    jsonrpc: "2.0",
    method: method,
    params: params,
  });

  const response = await fetch(rpcURl, {
    method: "POST",
    headers: headers,
    body: body,
  });

  const r = await response.json();

  return await r.result;
}

export async function balanceOf(
  networkSlug: string,
  address: string
): Promise<{
  balance: BI;
  balance_occupied: BI;
  udtBalances: {
    [key: string]: { balance: number; decimal: number; balanceB: string };
  };
}> {
  try {
    const res = await fetch(
      `${ckbExplorerApi(networkSlug)}/v1/addresses/${address}`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.api+json",
        },
      }
    );
    const { data } = await res.json();
    const addressInfo = data[0] as CKBAddressInfo;
    const udtBalances = {};
    addressInfo.attributes.udt_accounts.forEach((a) => {
      try {
        udtBalances[a.type_hash] = {
          balance: Number(a.amount) / 10 ** Number(a.decimal),
          decimal: Number(a.decimal),
          balanceB: a.amount,
        };
      } catch (e) {
        console.log(e);
      }
    });

    return {
      balance: BI.from(addressInfo.attributes.balance),
      balance_occupied: BI.from(addressInfo.attributes.balance_occupied),
      udtBalances: udtBalances,
    };
  } catch (e) {
    console.log(e);
  }
  return {
    balance: BI.from(0),
    balance_occupied: BI.from(0),
    udtBalances: {},
  };
}

export const convertCKBTransactionToSkeleton = async (
  address: string,
  networkSlug: NetworkSlug,
  rawTx: any
) => {
  console.log(rawTx);
  const network = getNetworkDataBySlug(networkSlug);
  if (!isCkbNetwork(network.network)) {
    throw new Error("Error when trying to get the current account");
  }

  const fromScript = helpers.parseAddress(address, {
    config: network.network.lumosConfig,
  });

  const networkConfig = network.network as NetworkConfig;
  let txSkeleton = helpers.TransactionSkeleton();
  if (rawTx.cellDeps && rawTx.cellDeps.length > 0) {
    rawTx.cellDeps?.forEach((cellDep: any) => {
      txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
        cellDeps.push(cellDep)
      );
    });
  }

  if (!rawTx.inputs) {
    throw new Error("Error when trying to get inputs");
  }

  await Promise.all(
    rawTx.inputs.map(async (input: any) => {
      if (!input.previousOutput) {
        throw new Error("Error when trying to get the previous output");
      }

      const txInput = await callCKBRPC(
        networkConfig.rpc_url,
        "get_transaction",
        [input.previousOutput.txHash]
      );
      const cellOutput =
        txInput?.transaction?.outputs[Number(input.previousOutput.index)];

      if (!cellOutput) {
        throw new Error(
          `Error when trying to get the cell output ${input.previousOutput.txHash}`
        );
      }

      console.log(cellOutput);
      if (
        cellOutput.type &&
        networkConfig.RUSD.script.codeHash === cellOutput.type.code_hash &&
        networkConfig.RUSD.script.args === cellOutput.type.args &&
        networkConfig.RUSD.script.hashType === cellOutput.type.hash_type
      ) {
        if (
          txSkeleton.cellDeps.findIndex(
            (cell) =>
              cell.outPoint.txHash ===
              networkConfig.RUSD.cellDep.outPoint.txHash
          ) === -1
        ) {
          txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
            cellDeps.push({ ...networkConfig.RUSD.cellDep })
          );
        }
      }

      const outputData =
        txInput?.transaction?.outputs_data[
          Number(input.previousOutput.index)
        ] || "0x";

      txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push({
          outPoint: {
            txHash: input.previousOutput.txHash,
            index: input.previousOutput.index,
          },
          data: outputData,
          cellOutput: {
            capacity: cellOutput.capacity,
            lock: {
              codeHash: cellOutput.lock?.code_hash,
              hashType: cellOutput.lock?.hash_type,
              args: cellOutput.lock?.args,
            },
            type: cellOutput.type,
          },
        })
      );
    })
  );

  const outputsData = rawTx.outputsData || [];
  rawTx.outputs?.forEach((output: any, index: number) => {
    txSkeleton = txSkeleton.update("outputs", (outputs) =>
      outputs.push({
        cellOutput: {
          capacity: output.capacity,
          lock: output.lock,
          type: output.type || null,
        },
        data: outputsData[index] || "0x",
      })
    );
  });

  rawTx.headerDeps?.forEach((headerDep: any) => {
    txSkeleton = txSkeleton.update("headerDeps", (headerDeps) =>
      headerDeps.push(headerDep)
    );
  });

  rawTx.witnesses?.forEach((witness: any) => {
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.push(witness)
    );
  });

  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex(
      (input) =>
        input.cellOutput.lock.codeHash === fromScript.codeHash &&
        input.cellOutput.lock.hashType === fromScript.hashType &&
        input.cellOutput.lock.args === fromScript.args
    );

  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
    }
    let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
    const newWitnessArgs: WitnessArgs = {
      lock: `0x${"00".repeat(65)}`,
    };

    if (witness !== "0x") {
      const witnessArgs = blockchain.WitnessArgs.unpack(bytes.bytify(witness));
      const lock = witnessArgs.lock;
      if (
        !!lock &&
        !!newWitnessArgs.lock &&
        !bytes.equal(lock, newWitnessArgs.lock)
      ) {
        throw new Error(
          "Lock field in first witness is set aside for signature!"
        );
      }
      const inputType = witnessArgs.inputType;
      if (inputType) {
        newWitnessArgs.inputType = inputType;
      }
      const outputType = witnessArgs.outputType;
      if (outputType) {
        newWitnessArgs.outputType = outputType;
      }
    }
    witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.set(firstIndex, witness)
    );
  }

  console.log(txSkeleton);

  return txSkeleton;
};
