import type { ApiUTXO, ITransaction } from "@/shared/interfaces/api";
import { ApiOrdUTXO, Inscription } from "@/shared/interfaces/inscriptions";
import { IToken } from "@/shared/interfaces/token";
import {
  getNetworkDataBySlug,
  isBitcoinNetwork,
  isCkbNetwork,
} from "@/shared/networks";
import { capacityOf, getCells } from "@/shared/networks/ckb/helpers";
import { NetworkConfig } from "@/shared/networks/ckb/offckb.config";
import {
  CkbTipBlockResponse,
  CkbTransactionResponse,
  toITransactions,
} from "@/shared/networks/ckb/types";
import { fetchEsplora } from "@/shared/utils";
import { Cell } from "@ckb-lumos/lumos";
import { storageService } from "../services";

export interface IApiController {
  getAccountBalance(address: string): Promise<
    | {
        cardinalBalance: number;
        ordinalBalance: number;
      }
    | undefined
  >;
  getUtxos(address: string): Promise<ApiUTXO[] | undefined>;
  getOrdUtxos(address: string): Promise<ApiOrdUTXO[]>;
  getCells(address: string): Promise<Cell[] | undefined>;
  pushTx(rawTx: string): Promise<{ txid: string } | undefined>;
  pushCkbTx(rawTx: string): Promise<{ txid: string } | undefined>;
  getTransactions(): Promise<ITransaction[] | undefined>;
  getPaginatedTransactions(
    address: string,
    txid: string
  ): Promise<ITransaction[] | undefined>;
  getPaginatedInscriptions(
    address: string,
    location: string
  ): Promise<Inscription[] | undefined>;
  getNativeCoinPrice(): Promise<{ usd: number }>;
  getLastBlock(): Promise<number>;
  getFees(): Promise<{ fast: number; slow: number }>;
  getInscriptions(address: string): Promise<Inscription[] | undefined>;
  getDiscovery(): Promise<Inscription[] | undefined>;
  getInscriptionCounter(
    address: string
  ): Promise<{ amount: number; count: number }>;
  getInscription({
    inscriptionNumber,
    inscriptionId,
    address,
  }: {
    inscriptionNumber?: number;
    inscriptionId?: string;
    address: string;
  }): Promise<Inscription[] | undefined>;
  getTokens(address: string): Promise<IToken[] | undefined>;
  getTransactionHex(txid: string): Promise<string | undefined>;
  getUtxoValues(outpoints: string[]): Promise<number[] | undefined>;
}

// TODO: use interface instead
class ApiController implements IApiController {
  async getAccountBalance(address: string) {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    if (isBitcoinNetwork(networkData.network)) {
      // Bitcoin using esplora API
      const path = "utxo";
      const data = await fetchEsplora<ApiUTXO[]>({
        path: `${networkData.esploraUrl}/address/${address}/${path}`,
      });

      const balance = data.reduce((acc, utxo) => acc + utxo.value, 0);

      let ordinalBalance = 0;
      try {
        // Filter Ord UTXO
        const networkData = getNetworkDataBySlug(storageService.currentNetwork);
        if (networkData.ordUrl) {
          const ordUtxos = await fetchEsplora<ApiOrdUTXO[]>({
            path: `${networkData.ordUrl}/address/${address}/ords`,
            headers: {
              accept: "application/json",
            },
          });
          ordinalBalance += ordUtxos.reduce((acc, utxo) => acc + utxo.value, 0);
        }
      } catch (error) {}

      return {
        cardinalBalance: balance - ordinalBalance,
        ordinalBalance,
      };
    } else if (isCkbNetwork(networkData.network)) {
      const balance = await capacityOf(networkData.network, address);
      return {
        cardinalBalance: balance.toNumber(),
        ordinalBalance: 0,
      };
    }
  }

  async getUtxos(address: string): Promise<ApiUTXO[]> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    // Bitcoin + using esplora API

    const data = await fetchEsplora<ApiUTXO[]>({
      path: `${networkData.esploraUrl}/address/${address}/utxo`,
    });
    return data.map((a) => ({
      ...a,
      address,
    }));
  }

  async getOrdUtxos(address: string) {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    if (
      networkData.slug === "btc_testnet_4" ||
      networkData.slug === "btc_testnet"
    )
      return [];
    const data = await fetchEsplora<ApiOrdUTXO[]>({
      path: `${networkData.ordUrl}/address/${address}/ords`,
      headers: {
        accept: "application/json",
      },
    });
    return data;
  }

  async getCells(address: string) {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    const data = await getCells(networkData.network as NetworkConfig, address);
    return data;
  }

  async getFees() {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    const data = await fetchEsplora({
      path: `${networkData.esploraUrl}/fee-estimates`,
    });
    return {
      slow: Number((data["6"] as number)?.toFixed(0)),
      fast: Number((data["2"] as number)?.toFixed(0)) + 1,
    };
  }

  async pushTx(rawTx: string) {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    const data = await fetchEsplora<string>({
      path: `${networkData.esploraUrl}/tx`,
      method: "POST",
      headers: {
        "content-type": "text/plain",
      },
      json: false,
      body: rawTx,
    });
    return {
      txid: data,
    };
  }

  async pushCkbTx(rawTx: string) {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    const tx = JSON.parse(rawTx);
    const hash = await (
      networkData.network as NetworkConfig
    ).rpc.sendTransaction(tx, "passthrough");
    return {
      txid: hash,
    };
  }

  async getTransactions(): Promise<ITransaction[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    const accounts = storageService.currentAccount.accounts;
    if (isBitcoinNetwork(networkData.network)) {
      const data = await Promise.all(
        accounts.map(async (z) => {
          const txs = await fetchEsplora<ITransaction[]>({
            path: `${networkData.esploraUrl}/address/${z.address}/txs`,
          });
          return txs.map((j) => ({ ...j, address: z.address }));
        })
      );
      return data.flat();
    } else if (isCkbNetwork(networkData.network)) {
      // TODO: add pagination
      const res = await fetchEsplora<CkbTransactionResponse>({
        path: `${networkData.esploraUrl}/address_transactions/${accounts[0].address}?page=1&page_size=25`,
        headers: {
          "content-type": "application/vnd.api+json",
          accept: "application/vnd.api+json",
        },
      });

      return toITransactions(res).map((z) => ({
        ...z,
        address: accounts[0].address,
      }));
    }
  }

  async getInscriptions(address: string): Promise<Inscription[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    return await fetchEsplora<Inscription[]>({
      path: `${networkData.esploraUrl}/address/${address}/ords`,
    });
  }

  async getPaginatedTransactions(
    address: string,
    txid: string
  ): Promise<ITransaction[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    try {
      return await fetchEsplora<ITransaction[]>({
        path: `${networkData.esploraUrl}/address/${address}/txs/chain/${txid}`,
      });
    } catch (e) {
      return undefined;
    }
  }

  async getPaginatedInscriptions(
    address: string,
    location: string
  ): Promise<Inscription[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    try {
      return await fetchEsplora<Inscription[]>({
        path: `${networkData.esploraUrl}/address/${address}/ords/chain/${location}`,
      });
    } catch (e) {
      return undefined;
    }
  }

  async getLastBlock(): Promise<number> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    if (isBitcoinNetwork(networkData.network)) {
      return Number(
        await fetchEsplora<string>({
          path: `${networkData.esploraUrl}/blocks/tip/height`,
        })
      );
    } else if (isCkbNetwork(networkData.network)) {
      const res = await fetchEsplora<CkbTipBlockResponse>({
        path: `${networkData.esploraUrl}/statistics/tip_block_number`,
        headers: {
          "content-type": "application/vnd.api+json",
          accept: "application/vnd.api+json",
        },
      });

      return res.data.attributes.tip_block_number;
    }
  }

  async getNativeCoinPrice(): Promise<{ usd: number }> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    switch (networkData.slug) {
      case "btc":
        return {
          usd: (
            await fetchEsplora<any>({
              path: `https://api.coincap.io/v2/assets/bitcoin`,
            })
          ).data.priceUsd,
        };
      case "nervos":
        return {
          usd: (
            await fetchEsplora<any>({
              path: `https://api.coincap.io/v2/assets/nervos-network`,
            })
          ).data.priceUsd,
        };
      default:
        return {
          usd: 0,
        };
    }
  }

  async getDiscovery(): Promise<Inscription[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    return await fetchEsplora<Inscription[]>({
      path: `${networkData.esploraUrl}/discovery"`,
    });
  }

  async getInscriptionCounter(
    address: string
  ): Promise<{ amount: number; count: number }> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    try {
      const result = await fetchEsplora<
        { amount: number; count: number } | undefined
      >({
        path: `${networkData.esploraUrl}/address/${address}/stats`,
      });
      return result;
    } catch {
      return { amount: 0, count: 0 };
    }
  }

  async getInscription({
    inscriptionNumber,
    inscriptionId,
    address,
  }: {
    inscriptionNumber?: number;
    inscriptionId?: string;
    address: string;
  }): Promise<Inscription[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    return await fetchEsplora<Inscription[]>({
      path: `${networkData.esploraUrl}/address/${address}/ords?search=${
        inscriptionId ?? inscriptionNumber
      }`,
    });
  }

  async getTokens(address: string): Promise<IToken[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    return await fetchEsplora<IToken[]>({
      path: `${networkData.esploraUrl}/address/${address}/tokens`,
    });
  }

  async getTransactionHex(txid: string): Promise<string> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    return await fetchEsplora<string>({
      path: `${networkData.esploraUrl}/tx/"` + txid + "/hex",
      json: false,
    });
  }

  async getUtxoValues(outpoints: string[]): Promise<number[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    const result = await fetchEsplora<{ values: number[] }>({
      path: `${networkData.esploraUrl}/prev`,
      body: JSON.stringify({ locations: outpoints }),
      method: "POST",
    });
    return result.values;
  }
}

export default new ApiController();
