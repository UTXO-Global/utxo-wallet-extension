import { ethErrors, serializeError } from "eth-rpc-errors";
import { EventEmitter } from "events";
import { ccc } from "@ckb-ccc/core";
import DOMPurify from "dompurify";
import BroadcastChannelMessage from "@/shared/utils/message/broadcastChannelMessage";

import type {
  SendCoin,
  SignPsbtOptions,
} from "@/background/services/keyring/types";
import PushEventHandlers from "./pushEventHandlers";
import ReadyPromise from "./readyPromise";
import { $, domReadyCall } from "./utils";

const script = document.currentScript;
const channelName = script?.getAttribute("channel") || "UTXOGLOBALWALLET";

export interface Interceptor {
  onRequest?: (data: any) => any;
  onResponse?: (res: any, data: any) => any;
}

interface StateProvider {
  accounts: string[] | null;
  isConnected: boolean;
  isUnlocked: boolean;
  initialized: boolean;
  isPermanentlyDisconnected: boolean;
}

export class UtxoGlobalProvider extends EventEmitter {
  _selectedAddress: string | null = null;
  _network: string | null = null;
  _isConnected = false;
  _initialized = false;
  _isUnlocked = false;

  _state: StateProvider = {
    accounts: null,
    isConnected: false,
    isUnlocked: false,
    initialized: false,
    isPermanentlyDisconnected: false,
  };

  _providerReq: string;

  #_pushEventHandlers: PushEventHandlers;
  private _requestPromise = new ReadyPromise(0);

  #_bcm: BroadcastChannelMessage;

  constructor({ maxListeners = 100 } = {}) {
    super();
    this.setMaxListeners(maxListeners);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.initialize();
  }

  initialize = async () => {
    const origin = window.top?.location.origin;
    const icon =
      ($('head > link[rel~="icon"]') as HTMLLinkElement)?.href ||
      ($('head > meta[itemprop="image"]') as HTMLMetaElement)?.content;

    const name =
      document.title ||
      ($('head > meta[name="title"]') as HTMLMetaElement)?.content ||
      origin;

    const sanitizedIcon = DOMPurify.sanitize(icon);
    const sanitizedName = DOMPurify.sanitize(name);
    const sanitizedOrigin = DOMPurify.sanitize(origin);
    if (!this._isValidURL(sanitizedOrigin)) {
      throw Error(
        "Invalid URL. Only URL starting with 'https://' or 'http://' are allowed. Please check and try again."
      );
    }

    if (!this.#_bcm) {
      this.#_bcm = new BroadcastChannelMessage(channelName);
    }
    this.#_pushEventHandlers = new PushEventHandlers(this);

    document.addEventListener(
      "visibilitychange",
      this._requestPromiseCheckVisibility
    );

    this.#_bcm.connect().on("message", this._handleBackgroundMessage);
    domReadyCall(async () => {
      try {
        await this.#_bcm.request({
          method: "tabCheckin",
          params: {
            icon: sanitizedIcon,
            name: sanitizedName,
            origin: sanitizedOrigin,
          },
        });
      } catch (e) {
        console.log(e);
      }
    });

    this.on("broadcastDisconnect", (error) => {
      this._isConnected = false;
      this._state.isConnected = false;
      this.emit("disconnect", error);
    });

    try {
      const { network, accounts, isUnlocked, isConnected }: any = await this._request({
        method: "getProviderState",
      });
      if (isUnlocked) {
        this._isUnlocked = true;
        this._state.isUnlocked = true;
      }
      this._isConnected = isConnected;
      this._state.isConnected = isConnected;
      if (isConnected) {
        this.emit("connect", {});
      }
      this.#_pushEventHandlers.networkChanged({
        network,
      });
      this.#_pushEventHandlers.accountsChanged(accounts);
    } catch {
      //
    } finally {
      this._initialized = true;
      this._state.initialized = true;
      this.emit("_initialized");
    }
  };

  private _isValidURL = (url: string): boolean => {
    try {
      const newUrl = new URL(url);
      return ["http:", "https:"].includes(newUrl.protocol);
    } catch (err) {
      return false;
    }
  };

  private _requestPromiseCheckVisibility = () => {
    if (document.visibilityState === "visible") {
      this._requestPromise.check(1);
    } else {
      this._requestPromise.uncheck(1);
    }
  };

  private _handleBackgroundMessage = ({ event, data }) => {
    if (!this.#_pushEventHandlers[event]) {
      return; // Ignore unexpected events
    }

    this.#_pushEventHandlers[event](data);
    this.emit(event, data);
  };

  _request = async (data: any) => {
    const origin = window.top?.location.origin;
    const sanitizedOrigin = DOMPurify.sanitize(origin);
    if (!this._isValidURL(sanitizedOrigin)) {
      throw Error(
        "Invalid URL. Only URL starting with 'https://' or 'http://' are allowed. Please check and try again."
      );
    }

    if (!data) {
      throw ethErrors.rpc.invalidRequest();
    }

    this._requestPromiseCheckVisibility();

    const params = { provider: this._providerReq, ...data };
    return this._requestPromise.call(() => {
      return this.#_bcm
        .request(params)
        .then((res) => {
          return res;
        })
        .catch((err) => {
          throw serializeError(err);
        });
    });
  };

  // public methods
  connect = async () => {
    try {
      const result = await this._request({
        method: "connect",
      });
      return result;
    } catch (error) {
      // Khi user reject connect, đảm bảo trạng thái là disconnected
      this._isConnected = false;
      this._state.isConnected = false;
      
      // Broadcast message đến tất cả các tab
      this.#_bcm.send("message", {
        event: "disconnect",
        data: error
      });

      this.emit("disconnect", error);
      throw error;
    }
  };

  getBalance = async () => {
    return this._request({
      method: "getBalance",
    });
  };

  getAccountName = async () => {
    return this._request({
      method: "getAccountName",
    });
  };

  isConnected = async () => {
    return this._request({
      method: "isConnected",
    });
  };

  getAccount = async () => {
    return this._request({
      method: "getAccount",
    });
  };

  getPublicKey = async () => {
    return this._request({
      method: "getPublicKey",
    });
  };

  createTx = async (data: SendCoin) => {
    return this._request({
      method: "createTx",
      params: {
        ...data,
      },
    });
  };

  signMessage = async (text: string, address: string) => {
    return this._request({
      method: "signMessage",
      params: {
        text,
        address,
      },
    });
  };

  calculateFee = async (hex: string, feeRate: number) => {
    return this._request({
      method: "calculateFee",
      params: {
        hex,
        feeRate,
      },
    });
  };

  signLNInvoice = async (invoice: string, address: string) => {
    return this._request({
      method: "signLNInvoice",
      params: {
        invoice,
        address,
      },
    });
  };

  getNetwork = async () => {
    return this._request({
      method: "getNetwork",
    });
  };

  switchNetwork = async (network: string) => {
    return this._request({
      method: "switchNetwork",
      params: {
        network,
      },
    });
  };

  switchChain = async (chain: string) => {
    return this._request({
      method: "switchChain",
      params: {
        chain,
      },
    });
  };

  disconnect = () => {
    this._isConnected = false;
    this._state.isConnected = false;
    this._state.accounts = null;
    this._selectedAddress = null;
    const disconnectError = ethErrors.provider.disconnected();

    this.#_bcm.send("message", {
      event: "disconnect",
      data: disconnectError
    });

    this.emit("accountsChanged", []);
    this.emit("networkChanged", "");
    this.emit("disconnect", disconnectError);
    this.emit("close", disconnectError);
  };
}

export class CKBProvider extends UtxoGlobalProvider {
  constructor() {
    super();
    this._providerReq = "ckb";
  }

  signTransaction = async (tx: ccc.TransactionLike) => {
    const rawTx = JSON.stringify(tx, (key, value) =>
      typeof value === "bigint" ? `0x${value.toString(16)}` : value
    );
    return this._request({
      method: "signTransaction",
      params: {
        tx: JSON.parse(rawTx),
      },
    });
  };
}

export class BTCProvider extends UtxoGlobalProvider {
  constructor() {
    super();
    this._providerReq = "btc";
  }

  signTransaction = async (psbtBase64: string, options?: SignPsbtOptions) => {
    return this._request({
      method: "signTransaction",
      params: {
        psbtBase64,
        options,
      },
    });
  };
}

export class DogeProvider extends BTCProvider {
  constructor() {
    super();
    this._providerReq = "dogecoin";
  }
}

declare global {
  interface Window {
    utxoGlobal: {
      bitcoinSigner: UtxoGlobalProvider;
      ckbSigner: UtxoGlobalProvider;
      dogeSigner: UtxoGlobalProvider;
    };
  }
}

const provider = new UtxoGlobalProvider();
const btcProvider = new BTCProvider();
const ckbProvider = new CKBProvider();
const dogeProvider = new DogeProvider();

Object.defineProperty(window, "utxoGlobal", {
  value: {
    ...new Proxy(provider, {
      deleteProperty: () => true,
    }),
    bitcoinSigner: new Proxy(btcProvider, {
      deleteProperty: () => true,
    }),
    ckbSigner: new Proxy(ckbProvider, {
      deleteProperty: () => true,
    }),
    dogeSigner: new Proxy(dogeProvider, {
      deleteProperty: () => true,
    }),
  },
  writable: false,
});

window.dispatchEvent(new Event("utxoGlobal#initialized"));
window.dispatchEvent(new Event("utxoGlobal.bitcoinSigner#initialized"));
window.dispatchEvent(new Event("utxoGlobal.ckbSigner#initialized"));
window.dispatchEvent(new Event("utxoGlobal.dogeSigner#initialized"));
