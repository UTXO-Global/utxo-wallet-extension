import { BI, Cell } from "@ckb-lumos/lumos";
import { parseAddress } from "@ckb-lumos/lumos/helpers";
import { CKBHasher } from "@ckb-lumos/lumos/utils";
import { NetworkConfig } from "./offckb.config";
import { ckbExplorerApi } from "@/ui/utils/helpers";
import { CKBAddressInfo } from "./types";

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
