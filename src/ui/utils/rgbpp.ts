import {
  BtcApiBalance,
  BtcApiBalanceParams,
  BtcApiBlock,
  BtcApiBlockchainInfo,
  BtcApiBlockHash,
  BtcApiBlockHeader,
  BtcApiBlockTransactionIds,
  BtcApiRecommendedFeeRates,
  BtcApis,
  BtcApiSentTransaction,
  BtcApiTransaction,
  BtcApiTransactionParams,
  BtcApiUtxo,
  BtcApiUtxoParams,
  BtcAssetsApiBase,
  RgbppApiAssetsByAddressParams,
  RgbppApiBalance,
  RgbppApiBalanceByAddressParams,
  RgbppApiCkbTransactionHash,
  RgbppApiPaymasterInfo,
  RgbppApiRetryCkbTransactionPayload,
  RgbppApis,
  RgbppApiSendCkbTransactionPayload,
  RgbppApiSpvProof,
  RgbppApiTransactionRetry,
  RgbppApiTransactionState,
  RgbppApiTransactionStateParams,
  RgbppCell,
} from "@rgbpp-sdk/service";

export class BtcAssetsApi
  extends BtcAssetsApiBase
  implements BtcApis, RgbppApis
{
  /**
   * Base
   */

  private networkSlug: string;

  constructor(url: string, networkSlug: string) {
    super({ url, token: "utxo.global" });
    this.networkSlug = networkSlug;
  }

  /**
   * Bitcoin APIs, under the /bitcoin/v1 prefix.
   */

  getBtcBlockchainInfo() {
    return this.request<BtcApiBlockchainInfo>("/bitcoin/v1/info", {
      headers: { "x-network": this.networkSlug },
    });
  }

  getBtcBlockByHash(blockHash: string) {
    return this.request<BtcApiBlock>(`/bitcoin/v1/block/${blockHash}`, {
      headers: { "x-network": this.networkSlug },
    });
  }

  getBtcBlockHeaderByHash(blockHash: string) {
    return this.request<BtcApiBlockHeader>(
      `/bitcoin/v1/block/${blockHash}/header`,
      {
        headers: { "x-network": this.networkSlug },
      }
    );
  }

  getBtcBlockHashByHeight(height: number) {
    return this.request<BtcApiBlockHash>(`/bitcoin/v1/block/height/${height}`, {
      headers: { "x-network": this.networkSlug },
    });
  }

  getBtcBlockTransactionIdsByHash(blockHash: number) {
    return this.request<BtcApiBlockTransactionIds>(
      `/bitcoin/v1/block/${blockHash}/txids`,
      {
        headers: { "x-network": this.networkSlug },
      }
    );
  }

  getBtcRecommendedFeeRates() {
    return this.request<BtcApiRecommendedFeeRates>(
      `/bitcoin/v1/fees/recommended`,
      {
        headers: { "x-network": this.networkSlug },
      }
    );
  }

  getBtcBalance(address: string, params?: BtcApiBalanceParams) {
    return this.request<BtcApiBalance>(
      `/bitcoin/v1/address/${address}/balance`,
      {
        params,
        headers: { "x-network": this.networkSlug },
      }
    );
  }

  getBtcUtxos(address: string, params?: BtcApiUtxoParams) {
    return this.request<BtcApiUtxo[]>(
      `/bitcoin/v1/address/${address}/unspent`,
      {
        params,
        headers: { "x-network": this.networkSlug },
      }
    );
  }

  getBtcTransactions(address: string, params?: BtcApiTransactionParams) {
    return this.request<BtcApiTransaction[]>(
      `/bitcoin/v1/address/${address}/txs`,
      {
        params,
        headers: { "x-network": this.networkSlug },
      }
    );
  }

  getBtcTransaction(txId: string) {
    return this.request<BtcApiTransaction>(`/bitcoin/v1/transaction/${txId}`, {
      headers: { "x-network": this.networkSlug },
    });
  }

  sendBtcTransaction(txHex: string) {
    return this.post<BtcApiSentTransaction>("/bitcoin/v1/transaction", {
      body: JSON.stringify({
        txhex: txHex,
      }),
      headers: { "x-network": this.networkSlug },
    });
  }

  /**
   * RGBPP APIs, under the /rgbpp/v1 prefix.
   */

  getRgbppPaymasterInfo() {
    return this.request<RgbppApiPaymasterInfo>("/rgbpp/v1/paymaster/info", {
      headers: { "x-network": this.networkSlug },
    });
  }

  getRgbppTransactionHash(btcTxId: string) {
    return this.request<RgbppApiCkbTransactionHash>(
      `/rgbpp/v1/transaction/${btcTxId}`,
      { headers: { "x-network": this.networkSlug } }
    );
  }

  getRgbppTransactionState(
    btcTxId: string,
    params?: RgbppApiTransactionStateParams
  ) {
    return this.request<RgbppApiTransactionState>(
      `/rgbpp/v1/transaction/${btcTxId}/job`,
      {
        params,
        headers: { "x-network": this.networkSlug },
      }
    );
  }

  getRgbppAssetsByBtcTxId(btcTxId: string) {
    return this.request<RgbppCell[]>(`/rgbpp/v1/assets/${btcTxId}`, {
      headers: { "x-network": this.networkSlug },
    });
  }

  getRgbppAssetsByBtcUtxo(btcTxId: string, vout: number) {
    return this.request<RgbppCell[]>(`/rgbpp/v1/assets/${btcTxId}/${vout}`, {
      headers: { "x-network": this.networkSlug },
    });
  }

  getRgbppAssetsByBtcAddress(
    btcAddress: string,
    params?: RgbppApiAssetsByAddressParams
  ) {
    return this.request<RgbppCell[]>(`/rgbpp/v1/address/${btcAddress}/assets`, {
      params,
      headers: { "x-network": this.networkSlug },
    });
  }

  getRgbppBalanceByBtcAddress(
    btcAddress: string,
    params?: RgbppApiBalanceByAddressParams
  ) {
    return this.request<RgbppApiBalance>(
      `/rgbpp/v1/address/${btcAddress}/balance`,
      {
        params,
        headers: { "x-network": this.networkSlug },
      }
    );
  }

  getRgbppSpvProof(btcTxId: string, confirmations: number) {
    return this.request<RgbppApiSpvProof>("/rgbpp/v1/btc-spv/proof", {
      params: {
        btc_txid: btcTxId,
        confirmations,
      },
    });
  }

  sendRgbppCkbTransaction(payload: RgbppApiSendCkbTransactionPayload) {
    return this.post<RgbppApiTransactionState>("/rgbpp/v1/transaction/ckb-tx", {
      body: JSON.stringify(payload),
      headers: { "x-network": this.networkSlug },
    });
  }

  retryRgbppCkbTransaction(payload: RgbppApiRetryCkbTransactionPayload) {
    return this.post<RgbppApiTransactionRetry>("/rgbpp/v1/transaction/retry", {
      body: JSON.stringify(payload),
      headers: { "x-network": this.networkSlug },
    });
  }
}
