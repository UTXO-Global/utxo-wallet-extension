import type { ApiUTXO, ITransaction } from "@/shared/interfaces/api";
import { ApiOrdUTXO, Inscription } from "@/shared/interfaces/inscriptions";
import { IToken } from "@/shared/interfaces/token";
import {
  getNetworkDataBySlug,
  isBitcoinNetwork,
  isCkbNetwork,
  isDogecoinNetwork,
} from "@/shared/networks";
import { balanceOf, getCells } from "@/shared/networks/ckb/helpers";
import { NetworkConfig } from "@/shared/networks/ckb/offckb.config";
import {
  CkbTipBlockResponse,
  CkbTransactionResponse,
  rgpTxToITransactions,
  toITransactions,
} from "@/shared/networks/ckb/types";
import { fetchEsplora } from "@/shared/utils";
import { Cell } from "@ckb-lumos/lumos";
import { keyringService, storageService } from "../services";
import {
  RGBPP_ASSET_API_URL,
  RgbppAsset,
  RgbppTx,
  RgbppXudtBalance,
} from "@/shared/interfaces/rgbpp";
import { NetworkData, NetworkSlug } from "@/shared/networks/types";
import { udtDataToDecimal } from "../utils";
import { CacheResponse } from "./cache/decorate";
import { basicCache as cache } from "./cache";
import { ccc } from "@ckb-ccc/core";

export interface IApiController {
  getAccountBalance(address: string): Promise<
    | {
        cardinalBalance: number;
        ordinalBalance: number;
        rgbppBalance: number;
        coinBalances: { [key: string]: any };
      }
    | undefined
  >;
  getUtxos(address: string): Promise<ApiUTXO[] | undefined>;
  getOrdUtxos(address: string): Promise<ApiOrdUTXO[]>;
  getCells(address: string): Promise<Cell[] | undefined>;
  pushTx(rawTx: string): Promise<{ txid: string } | undefined>;
  pushCkbTx(rawTx: string): Promise<{ txid: string } | undefined>;
  pushCkbTxWithSigner(tx: string): Promise<{ txid: string } | undefined>;
  getTransactions(): Promise<ITransaction[] | undefined>;
  getCKBTransactions({
    address,
    network,
    type,
    typeHash,
  }: {
    address: string;
    network: NetworkSlug;
    type?: string;
    typeHash?: string;
  }): Promise<ITransaction[] | undefined>;
  getPaginatedTransactions(
    address: string,
    txid: string
  ): Promise<ITransaction[] | undefined>;
  getPaginatedInscriptions(
    address: string,
    location: string
  ): Promise<Inscription[] | undefined>;
  getNativeCoinPrice(): Promise<{
    [key: string]: {
      usd: number;
      changePercent24Hr: number;
    };
  }>;
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
  getRgbppXudtBalances(
    address: string,
    network?: NetworkData
  ): Promise<RgbppXudtBalance[]>;
  getRgbppTxs(typeScript: string): Promise<RgbppTx[]>;
  getRgbppTxsFromExplorer({
    typeHash,
  }: {
    typeHash?: string;
  }): Promise<ITransaction[] | undefined>;
  getRgbppAssets(typeScript: string, address: string): Promise<RgbppAsset[]>;
  getRgbppAssetOutpoints(address: string): Promise<string[]>;
}

// TODO: use interface instead
class ApiController implements IApiController {
  @CacheResponse(30000)
  async getAccountBalance(address: string) {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    if (
      isBitcoinNetwork(networkData.network) ||
      isDogecoinNetwork(networkData.network)
    ) {
      // Bitcoin using esplora API
      const data = await fetchEsplora<ApiUTXO[]>({
        path: `${networkData.esploraUrl}/address/${address}/utxo`,
      });

      const balance = data?.reduce((acc, utxo) => acc + utxo.value, 0) || 0;

      let ordinalBalance = 0;
      let rgbppBalance = 0;
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
          ordinalBalance +=
            ordUtxos?.reduce((acc, utxo) => acc + utxo.value, 0) || 0;
        }
        // Filter Rgbpp UTXO
        const outpointRgbpps = await controller.getRgbppAssetOutpoints(address);

        rgbppBalance += data
          .filter((utxo) =>
            outpointRgbpps.includes(`${utxo.txid}:${utxo.vout}`)
          )
          .reduce((acc, utxo) => acc + utxo.value, 0);
      } catch (error) {
        throw new Error(error);
      }

      return {
        cardinalBalance: balance - ordinalBalance - rgbppBalance,
        ordinalBalance,
        rgbppBalance,
        coinBalances: {},
      };
    } else if (isCkbNetwork(networkData.network)) {
      const balances = await balanceOf(networkData.slug, address);
      return {
        cardinalBalance: balances.balance.toNumber(),
        ordinalBalance: balances.balance_occupied.toNumber(),
        rgbppBalance: 0,
        coinBalances: balances.udtBalances,
      };
    }
  }

  @CacheResponse(30000)
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

  @CacheResponse(30000)
  async getOrdUtxos(address: string) {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    const data = await fetchEsplora<ApiOrdUTXO[]>({
      path: `${networkData.ordUrl}/address/${address}/ords`,
      headers: {
        accept: "application/json",
      },
    });
    return data;
  }

  @CacheResponse(30000)
  async getCells(address: string) {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    const data = await getCells(networkData.network as NetworkConfig, address);
    return data;
  }

  @CacheResponse(30000)
  async getFees() {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    if (
      isBitcoinNetwork(networkData.network) ||
      isDogecoinNetwork(networkData.network)
    ) {
      const data = await fetchEsplora({
        path: `${networkData.esploraUrl}/fee-estimates`,
      });
      return {
        slow: Math.ceil(Number(data["6"] as number)),
        fast: Math.ceil(Number(data["2"] as number)),
      };
    }

    return {
      slow: 1000,
      fast: 2000,
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

    // Clear all cache
    cache.clearAll();

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

    // Clear all cache
    cache.clearAll();

    return { txid: hash };
  }

  async pushCkbTxWithSigner(rawTx: string) {
    const tx = JSON.parse(rawTx) as ccc.Transaction;
    const signer = keyringService.getSigner();
    if (signer) {
      const txHash = await signer.client.sendTransaction(tx);
      return { txid: txHash };
    }
    return { txid: "" };
  }

  @CacheResponse(30000)
  async getTransactions(): Promise<ITransaction[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    const accounts = storageService.currentAccount.accounts;
    if (!accounts || !accounts[0].address)
      throw new Error("Error when trying to get the current account");
    if (
      isBitcoinNetwork(networkData.network) ||
      isDogecoinNetwork(networkData.network)
    ) {
      const data = await Promise.all(
        accounts.map(async (z) => {
          const txs = await fetchEsplora<ITransaction[]>({
            path: `${networkData.esploraUrl}/address/${z.address}/txs`,
          });
          return txs.map((j) => ({ ...j, address: z.address }));
        })
      );
      return data.flat();
    }
  }

  @CacheResponse(30000)
  async getCKBTransactions({
    address,
    network,
    type,
    typeHash,
  }: {
    address: string;
    network: NetworkSlug;
    type?: string;
    typeHash?: string;
  }): Promise<ITransaction[] | undefined> {
    const networkData = getNetworkDataBySlug(network);

    let apiURL = `${networkData.esploraUrl}/address_transactions/${address}?page=1&page_size=25`;
    if (!!type && !!typeHash) {
      apiURL = `${networkData.esploraUrl}/udt_transactions/${typeHash}?page=1&page_size=25&address_hash=${address}`;
    }

    const res = await fetchEsplora<CkbTransactionResponse>({
      path: apiURL,
      headers: {
        "content-type": "application/vnd.api+json",
        accept: "application/vnd.api+json",
      },
    });
    return toITransactions(res).map((z) => ({
      ...z,
      address,
    }));
  }

  @CacheResponse(30000)
  async getInscriptions(address: string): Promise<Inscription[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    return await fetchEsplora<Inscription[]>({
      path: `${networkData.esploraUrl}/address/${address}/ords`,
    });
  }

  @CacheResponse(30000)
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

  @CacheResponse(30000)
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

  @CacheResponse(30000)
  async getLastBlock(): Promise<number> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    if (isBitcoinNetwork(networkData.network)) {
      return Number(
        await fetchEsplora<string>({
          path: `${networkData.esploraUrl}/blocks/tip/height`,
        })
      );
    } else if (isDogecoinNetwork(networkData.network)) {
      const res = await fetchEsplora<any>({
        path: `${networkData.esploraUrl}/v1/doge/main`,
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
      });
      return res.height;
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

  @CacheResponse(30000)
  async getNativeCoinPriceFromCoincap(coinSymbol: string): Promise<{
    usd: number;
    changePercent24Hr: number;
  }> {
    let apiFetchPrice = "";
    if (coinSymbol.toLowerCase() === "btc") {
      apiFetchPrice = `https://rest.coincap.io/v3/assets?apiKey=45b9a7b205f0d0e994b771cb6ab10dca7ef718227bb129bf30c41a8d5f815691&ids=bitcoin`;
    } else if (coinSymbol === "ckb") {
      apiFetchPrice = `https://rest.coincap.io/v3/assets?apiKey=45b9a7b205f0d0e994b771cb6ab10dca7ef718227bb129bf30c41a8d5f815691&ids=nervos-network`;
    } else if (coinSymbol === "doge") {
      apiFetchPrice = `https://rest.coincap.io/v3/assets?apiKey=45b9a7b205f0d0e994b771cb6ab10dca7ef718227bb129bf30c41a8d5f815691&ids=dogecoin`;
    }

    if (!apiFetchPrice) {
      return {
        usd: 0,
        changePercent24Hr: 0,
      };
    }

    const { data } = await fetchEsplora<any>({
      path: apiFetchPrice,
    });

    return {
      usd: data.priceUsd || 0,
      changePercent24Hr: data.changePercent24Hr || 0,
    };
  }

  @CacheResponse(30000)
  async getNativeCoinPrice(): Promise<{
    [key: string]: {
      usd: number;
      changePercent24Hr: number;
    };
  }> {
    const apiFetchPrice =
      "https://api.coingecko.com/api/v3/simple/price?ids=nervos-network,bitcoin,doge&vs_currencies=usd&include_24hr_change=true";

    const data = await fetchEsplora<any>({
      path: apiFetchPrice,
    });

    return {
      btc: {
        usd: Number(data["bitcoin"]?.usd || 0),
        changePercent24Hr: Number(data["bitcoin"]?.usd_24h_change || 0),
      },
      doge: {
        usd: Number(data["doge"]?.usd || 0),
        changePercent24Hr: Number(data["doge"]?.usd_24h_change || 0),
      },
      ckb: {
        usd: Number(data["nervos-network"]?.usd || 0),
        changePercent24Hr: Number(data["nervos-network"]?.usd_24h_change || 0),
      },
    };
  }

  @CacheResponse(30000)
  async getDiscovery(): Promise<Inscription[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    return await fetchEsplora<Inscription[]>({
      path: `${networkData.esploraUrl}/discovery"`,
    });
  }

  @CacheResponse(30000)
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

  @CacheResponse(30000)
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

  @CacheResponse(30000)
  async getTokens(address: string): Promise<IToken[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    return await fetchEsplora<IToken[]>({
      path: `${networkData.esploraUrl}/address/${address}/tokens`,
    });
  }

  @CacheResponse(30000)
  async getTransactionHex(txid: string): Promise<string> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    return await fetchEsplora<string>({
      path: `${networkData.esploraUrl}/tx/"` + txid + "/hex",
      json: false,
    });
  }

  @CacheResponse(30000)
  async getUtxoValues(outpoints: string[]): Promise<number[] | undefined> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    let values: number[] = [];
    await Promise.all(
      outpoints.map(async (op: string) => {
        const ops = op.split(":");
        try {
          const response = await fetch(
            `${networkData.esploraUrl}/tx/${ops[0]}`
          );
          if (!response.ok) {
            throw new Error(
              `Network response was not ok: ${response.statusText}`
            );
          }
          const tx = await response.json();
          const value = Number(tx.vout[Number(ops[1])].value);
          values = [...values, value];
        } catch (error) {
          console.error(
            `Error fetching previous output values for ${ops[0]}:${ops[1]}`,
            error
          );
          values = [...values, 0];
        }
      })
    );

    return values;
  }

  @CacheResponse(30000)
  async getRgbppXudtBalances(
    address: string,
    network?: NetworkData
  ): Promise<RgbppXudtBalance[]> {
    const networkData =
      network ?? getNetworkDataBySlug(storageService.currentNetwork);
    const response = await fetchEsplora<{
      address: string;
      xudt: RgbppXudtBalance[];
    }>({
      path: `${RGBPP_ASSET_API_URL}/rgbpp/v1/address/${address}/balance?no_cache=false`,
      headers: {
        "x-network": networkData.slug,
      },
    });

    return response.xudt;
  }

  @CacheResponse(30000)
  async getRgbppTxs(typeScript: string): Promise<RgbppTx[]> {
    const txs: RgbppTx[] = [];
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);

    const accounts = storageService.currentAccount.accounts;
    for (const account of accounts) {
      const response = await fetchEsplora<{
        address: string;
        txs: RgbppTx[];
      }>({
        path: `${RGBPP_ASSET_API_URL}/rgbpp/v1/address/${account.address}/activity?rgbpp_only=true&type_script=${typeScript}`,
        headers: {
          "x-network": networkData.slug,
        },
      });
      txs.push(...response.txs);
    }
    return txs;
  }

  @CacheResponse(30000)
  async getRgbppTxsFromExplorer({
    typeHash,
  }: {
    typeHash?: string;
  }): Promise<ITransaction[] | undefined> {
    const txs: ITransaction[] = [];
    const ckbNetworkSlug: NetworkSlug =
      storageService.currentNetwork === "btc" ? "nervos" : "nervos_testnet";
    const networkData = getNetworkDataBySlug(ckbNetworkSlug);

    const accounts = storageService.currentAccount.accounts;
    for (const account of accounts) {
      let apiURL = `${networkData.esploraUrl}/address_transactions/${account.address}?page=1&page_size=25`;
      if (!!typeHash) {
        apiURL = `${networkData.esploraUrl}/udt_transactions/${typeHash}?page=1&page_size=25&address_hash=${account.address}`;
      }

      const res = await fetchEsplora<CkbTransactionResponse>({
        path: apiURL,
        headers: {
          "content-type": "application/vnd.api+json",
          accept: "application/vnd.api+json",
        },
      });
      txs.push(
        ...rgpTxToITransactions(res).map((z) => ({
          ...z,
          address: account.address,
        }))
      );
    }
    return txs;
  }

  @CacheResponse(30000)
  async getRgbppAssets(
    typeScript: string,
    address: string
  ): Promise<RgbppAsset[]> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    const rgbAssets = await fetchEsplora<RgbppAsset[]>({
      path: `${RGBPP_ASSET_API_URL}/rgbpp/v1/address/${address}/assets?no_cache=false&type_script=${typeScript}`,
      headers: {
        "x-network": networkData.slug,
      },
    });
    return rgbAssets.map(
      (asset) => ({
        ...asset,
        balance: udtDataToDecimal(asset.data),
      }),
      0
    );
  }

  @CacheResponse(30000)
  async getRgbppAssetOutpoints(address: string): Promise<string[]> {
    const networkData = getNetworkDataBySlug(storageService.currentNetwork);
    const rgbAssets = await fetchEsplora<RgbppAsset[]>({
      path: `${RGBPP_ASSET_API_URL}/rgbpp/v1/address/${address}/assets?no_cache=false`,
      headers: {
        "x-network": networkData.slug,
      },
    });
    return rgbAssets.map((asset) => {
      const txId = Buffer.from(asset.cellOutput.lock.args.slice(-64), "hex")
        .reverse()
        .toString("hex");
      const index = Number(
        "0x" +
          Buffer.from(asset.cellOutput.lock.args.slice(2, 10), "hex")
            .reverse()
            .toString("hex")
      );

      return `${txId}:${index}`;
    });
  }
}

const controller = new ApiController();
export default controller;
