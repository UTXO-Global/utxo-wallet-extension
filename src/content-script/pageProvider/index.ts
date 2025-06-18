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
    console.log('[UTXO Global] Starting initialization...');
    const origin = window.top?.location.origin;
    const icon =
      ($('head > link[rel~="icon"]') as HTMLLinkElement)?.href ||
      ($('head > meta[itemprop="image"]') as HTMLMetaElement)?.content;

    const name =
      document.title ||
      ($('head > meta[name="title"]') as HTMLMetaElement)?.content ||
      origin;

    console.log('[UTXO Global] Origin:', origin);
    console.log('[UTXO Global] Icon:', icon);
    console.log('[UTXO Global] Name:', name);

    const sanitizedIcon = DOMPurify.sanitize(icon);
    const sanitizedName = DOMPurify.sanitize(name);
    const sanitizedOrigin = DOMPurify.sanitize(origin);
    
    console.log('[UTXO Global] Sanitized values:', {
      icon: sanitizedIcon,
      name: sanitizedName,
      origin: sanitizedOrigin
    });

    if (!this._isValidURL(sanitizedOrigin)) {
      console.error('[UTXO Global] Invalid URL detected:', sanitizedOrigin);
      throw Error(
        "Invalid URL. Only URL starting with 'https://' or 'http://' are allowed. Please check and try again."
      );
    }

    if (!this.#_bcm) {
      console.log('[UTXO Global] Initializing BroadcastChannelMessage');
      this.#_bcm = new BroadcastChannelMessage(channelName);
    }
    this.#_pushEventHandlers = new PushEventHandlers(this);

    document.addEventListener(
      "visibilitychange",
      this._requestPromiseCheckVisibility
    );

    console.log('[UTXO Global] Setting up message handler');
    this.#_bcm.connect().on("message", this._handleBackgroundMessage);
    
    domReadyCall(async () => {
      try {
        console.log('[UTXO Global] Performing tab checkin');
        await this.#_bcm.request({
          method: "tabCheckin",
          params: {
            icon: sanitizedIcon,
            name: sanitizedName,
            origin: sanitizedOrigin,
          },
        });
        console.log('[UTXO Global] Tab checkin successful');
      } catch (e) {
        console.error('[UTXO Global] Tab checkin failed:', e);
      }
    });

    this.on("broadcastDisconnect", (error) => {
      console.log('[UTXO Global] Broadcast disconnect event received:', error);
      this._isConnected = false;
      this._state.isConnected = false;
      this.emit("disconnect", error);
    });

    try {
      console.log('[UTXO Global] Getting initial provider state');
      const { network, accounts, isUnlocked, isConnected }: any =
        await this._request({
          method: "getProviderState",
        });
      console.log('[UTXO Global] Initial state:', { network, accounts, isUnlocked, isConnected });
      
      if (isUnlocked) {
        this._isUnlocked = true;
        this._state.isUnlocked = true;
      }
      this._isConnected = isConnected;
      this._state.isConnected = isConnected;
      if (isConnected) {
        console.log('[UTXO Global] Emitting connect event');
        this.emit("connect", {});
      }
      this.#_pushEventHandlers.networkChanged({
        network,
      });
      this.#_pushEventHandlers.accountsChanged(accounts);
    } catch (error) {
      console.error('[UTXO Global] Error getting initial state:', error);
    } finally {
      this._initialized = true;
      this._state.initialized = true;
      console.log('[UTXO Global] Initialization complete');
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
    console.log('[UTXO Global] Received background message:', { event, data });
    
    if (event === "disconnect") {
      console.log('[UTXO Global] Processing disconnect event');
      this._isConnected = false;
      this._state.isConnected = false;
      this._state.accounts = null;
      this._selectedAddress = null;
      this.emit("accountsChanged", []);
      this.emit("networkChanged", "");
      this.emit("disconnect", data);
      this.emit("close", data);
      return;
    }

    if (!this.#_pushEventHandlers[event]) {
      console.warn('[UTXO Global] Unexpected event received:', event);
      return;
    }

    console.log('[UTXO Global] Processing event:', event);
    this.#_pushEventHandlers[event](data);
    this.emit(event, data);
  };

  _request = async (data: any) => {
    console.log('[UTXO Global] Making request:', data);
    const origin = window.top?.location.origin;
    const sanitizedOrigin = DOMPurify.sanitize(origin);
    
    if (!this._isValidURL(sanitizedOrigin)) {
      console.error('[UTXO Global] Invalid URL in request:', sanitizedOrigin);
      throw Error(
        "Invalid URL. Only URL starting with 'https://' or 'http://' are allowed. Please check and try again."
      );
    }

    if (!data) {
      console.error('[UTXO Global] Invalid request data');
      throw ethErrors.rpc.invalidRequest();
    }

    this._requestPromiseCheckVisibility();

    const params = { provider: this._providerReq, ...data };
    console.log('[UTXO Global] Request params:', params);
    
    return this._requestPromise.call(() => {
      return this.#_bcm
        .request(params)
        .then((res) => {
          console.log('[UTXO Global] Request successful:', res);
          return res;
        })
        .catch((err) => {
          console.error('[UTXO Global] Request failed:', err);
          throw serializeError(err);
        });
    });
  };

  // public methods
  connect = async () => {
    try {
      console.log('[UTXO Global] Starting connection process...');
      const state: any = await this._request({
        method: "getProviderState",
      });
      console.log('[UTXO Global] Current state:', state);

      if (state.isConnected) {
        console.log('[UTXO Global] Already connected, returning accounts');
        return state.accounts;
      }

      console.log('[UTXO Global] Attempting to connect...');
      const result = await this._request({
        method: "connect",
      });
      console.log('[UTXO Global] Connection result:', result);

      this._isConnected = true;
      this._state.isConnected = true;
      this.emit("connect", {});

      return result;
    } catch (error) {
      console.error('[UTXO Global] Connection error:', error);
      this.disconnect();
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
    try {
      const result = await this._request({
        method: "switchNetwork",
        params: {
          network,
        },
      });
      return result;
    } catch (error) {
      this.disconnect();
      throw error;
    }
  };

  switchChain = async (chain: string) => {
    try {
      const result = await this._request({
        method: "switchChain",
        params: {
          chain,
        },
      });
      return result;
    } catch (error) {
      this.disconnect();
      throw error;
    }
  };

  disconnect = () => {
    console.log('[UTXO Global] Disconnecting...');
    this._isConnected = false;
    this._state.isConnected = false;
    this._state.accounts = null;
    this._selectedAddress = null;
    const disconnectError = ethErrors.provider.disconnected();

    this.emit("accountsChanged", []);
    this.emit("networkChanged", "");
    this.emit("disconnect", disconnectError);
    this.emit("close", disconnectError);
    console.log('[UTXO Global] Disconnected');
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
