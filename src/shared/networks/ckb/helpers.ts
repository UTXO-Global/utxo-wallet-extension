import { BI, Cell } from "@ckb-lumos/lumos";
import { parseAddress } from "@ckb-lumos/lumos/helpers";
import { CKBHasher } from "@ckb-lumos/lumos/utils";
import { NetworkConfig } from "./offckb.config";

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
    keepalive: true,
  });
};
