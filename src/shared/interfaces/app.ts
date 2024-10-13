export interface IAppStateBase {
  isReady: boolean;
  isUnlocked: boolean;
  vault: string[];
  password?: string;
  addressBook: string[];
  pendingWallet?: string;
  language: string;
  swapSetting: { slippage: number; isSlippageAuto: boolean };
}

export interface IAppState extends IAppStateBase {
  updateAppState: (
    app: Partial<IAppState>,
    updateBack?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
}
