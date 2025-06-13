import { ethErrors } from "eth-rpc-errors";

import type { UtxoGlobalProvider } from "./index";

class PushEventHandlers {
  provider: UtxoGlobalProvider;

  constructor(provider) {
    this.provider = provider;
  }

  _emit(event, data) {
    if (this.provider._initialized) {
      this.provider.emit(event, data);
    }
  }

  connect = (data) => {
    if (!this.provider._isConnected) {
      this.provider._isConnected = true;
      this.provider._state.isConnected = true;
      this._emit("connect", data);
    }
  };

  unlock = () => {
    this.provider._isUnlocked = true;
    this.provider._state.isUnlocked = true;
  };

  lock = () => {
    this.provider._isUnlocked = false;
  };

  disconnect = () => {
    this.provider.disconnect();
  };

  broadcastDisconnect = (error) => {
    this.provider.emit("broadcastDisconnect", error);
  };

  accountsChanged = (accounts: string[]) => {
    if (accounts?.[0] === this.provider._selectedAddress) {
      return;
    }
    this.connect({});
    this.provider._selectedAddress = accounts?.[0];
    this.provider._state.accounts = accounts;
    this._emit("accountsChanged", accounts);
  };

  networkChanged = ({ network }) => {
    this.connect({});
    if (network !== this.provider._network) {
      this.provider._network = network;
      this._emit("networkChanged", network);
    }
  };
}

export default PushEventHandlers;
