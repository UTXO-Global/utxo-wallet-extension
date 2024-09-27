/* eslint-disable react-hooks/rules-of-hooks */
import type { ITransaction } from "@/shared/interfaces/api";
import { Inscription } from "@/shared/interfaces/inscriptions";
import { IToken } from "@/shared/interfaces/token";
import React, {
  createContext,
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDebounceCall } from "../hooks/debounce";
import { useUpdateCurrentAccountBalance } from "../hooks/wallet";
import { useControllersState } from "../states/controllerState";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "../states/walletState";
import LS from "./ls";

const NATIVE_COIN_PRICES_KEY = "utxoCoinPrices";

const useTransactionManager = (): TransactionManagerContextType | undefined => {
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();

  const [lastBlock, setLastBlock] = useState<number>(0);
  const { apiController } = useControllersState((v) => ({
    apiController: v.apiController,
  }));
  const [feeRates, setFeeRates] = useState<{
    fast: number;
    slow: number;
  }>();

  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [tokens, setTokens] = useState<IToken[]>([]);

  const [searchInscriptions, setSearchInscriptions] = useState<
    Inscription[] | undefined
  >(undefined);
  const [searchTokens, setSearchTokens] = useState<IToken[] | undefined>(
    undefined
  );

  const [currentPrice, setCurrentPrice] = useState<number | undefined>(
    undefined
  );
  const [changePercent24Hr, setChangePercent24Hr] = useState<
    number | undefined
  >();
  const updateAccountBalance = useUpdateCurrentAccountBalance();

  const [transactionTxIds, setTransactionTxIds] = useState<string[]>([]);
  const [inscriptionLocations, setInscriptionLocations] = useState<string[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const updateFn = <T,>(
    onUpdate: Dispatch<SetStateAction<T[]>>,
    retrieveFn: (address: string) => Promise<T[]>,
    currentValue: T[],
    compareKey: keyof T
  ) => {
    return useCallback(
      async (force?: boolean) => {
        const receivedItems = await retrieveFn(
          ""
          // TODO currentAccount?.address ?? ""
        );
        if (receivedItems !== undefined) {
          if (
            currentValue.length > 0 &&
            currentValue[0][compareKey] !== receivedItems[0][compareKey] &&
            !force
          ) {
            const oldIndex = receivedItems.findIndex(
              (f) => f[compareKey] === currentValue[0][compareKey]
            );
            onUpdate([...receivedItems.slice(0, oldIndex), ...currentValue]);
          } else if (currentValue.length < 50 || force)
            onUpdate(receivedItems ?? []);
        }
      },
      [onUpdate, retrieveFn, compareKey, currentValue]
    );
  };

  const updateTransactions = updateFn(
    setTransactions,
    apiController.getTransactions,
    transactions,
    "txid"
  );

  const updateInscriptions = updateFn(
    setInscriptions,
    apiController.getInscriptions,
    inscriptions,
    "rawHex"
  );

  const forceUpdateInscriptions = useCallback(async () => {
    await updateInscriptions(true);
    setCurrentPage(1);
    setInscriptionLocations([]);
  }, [updateInscriptions]);

  const updateLastBlock = useCallback(async () => {
    setLastBlock(await apiController.getLastBlock());
  }, [apiController]);

  const updateFeeRates = useCallback(async () => {
    setFeeRates(await apiController.getFees());
  }, [apiController]);

  const updateTokens = useCallback(async () => {
    if (!currentAccount?.id) return;
    const tokens = await apiController.getTokens(
      currentAccount.accounts[0].address
      // TODO: currentAccount.address
    );
    setTokens(tokens);
  }, [apiController, currentAccount?.id]);

  const updateAll = useCallback(
    async (force = false) => {
      setLoading(true);
      await Promise.allSettled([
        updateAccountBalance(),
        updateTransactions(force),
        updateFeeRates(),
      ]);
      setLoading(false);
    },
    [updateAccountBalance, updateTransactions, updateFeeRates, updateTokens]
  );

  const throttleUpdate = useDebounceCall(updateAll, 300);

  const loadMoreTransactions = useCallback(async () => {
    if (
      transactions.length < 50 ||
      transactionTxIds.includes(transactions[transactions.length - 1]?.txid)
    )
      return;
    const additionalTransactions: ITransaction[] = [];
    for (const account of currentAccount.accounts) {
      const tx = await apiController.getPaginatedTransactions(
        account.address,
        transactions[transactions.length - 1]?.txid
      );
      additionalTransactions.push(...tx);
    }
    setTransactionTxIds([
      ...transactionTxIds,
      transactions[transactions.length - 1]?.txid,
    ]);
    if (!additionalTransactions) return;
    if (additionalTransactions.length > 0) {
      setTransactions((prev) => [...prev, ...additionalTransactions]);
    }
  }, [transactions, apiController, currentAccount?.id, transactionTxIds]);

  const loadMoreInscriptions = useCallback(async () => {
    const inc = inscriptions[inscriptions.length - 1];

    if (
      inscriptions.length < 60 ||
      inscriptionLocations.includes(
        `${inc.rawHex}:${inc.outpoint}:${inc.offset}`
      )
    )
      return;

    const additionalInscriptions = await apiController.getPaginatedInscriptions(
      "",
      // TODO: currentAccount?.name,
      `${inc.rawHex}:${inc.outpoint}:${inc.offset}`
    );
    setInscriptionLocations([
      ...inscriptionLocations,
      `${inc.rawHex}:${inc.outpoint}:${inc.offset}`,
    ]);
    if (!additionalInscriptions) return;
    if (additionalInscriptions.length > 0) {
      setInscriptions((prev) => [...prev, ...additionalInscriptions]);
    }
  }, [apiController, currentAccount, inscriptions, inscriptionLocations]);

  const inscriptionIntervalUpdate = useCallback(async () => {
    if (!currentAccount?.id) return;

    const updateInscriptions = (
      receivedInscriptions: Inscription[],
      index: number
    ) => {
      const updatedInscriptions = [...inscriptions];
      updatedInscriptions.splice(
        index,
        receivedInscriptions.length,
        ...receivedInscriptions
      );
      setInscriptions(updatedInscriptions);
    };

    const fetchAndUpdateInscriptions = async (
      location: string,
      index: number
    ) => {
      const receivedInscriptions = await apiController.getPaginatedInscriptions(
        "",
        // TODO currentAccount.address,
        location
      );
      if (receivedInscriptions?.length) {
        updateInscriptions(receivedInscriptions, index);
        return true;
      }
      return false;
    };

    if (currentPage > 10) {
      const chainIndex = Math.floor(currentPage / 10) - 1;
      let isUpdated = await fetchAndUpdateInscriptions(
        inscriptionLocations[chainIndex],
        chainIndex * 10
      );
      if (!isUpdated) {
        const txIdIndex = inscriptions.findIndex(
          (f) => f.rawHex === inscriptionLocations[chainIndex]
        );
        for (let i = 1; i <= 3; i++) {
          const inc = inscriptions[txIdIndex - i];

          isUpdated = await fetchAndUpdateInscriptions(
            `${inc.rawHex}:${inc.outpoint}:${inc.offset}`,
            txIdIndex - i
          );
          if (isUpdated) {
            const updatedInscriptionTxIds = [...inscriptionLocations];
            updatedInscriptionTxIds.splice(
              chainIndex,
              updatedInscriptionTxIds.length - 1
            );
            updatedInscriptionTxIds.push(inscriptions[txIdIndex - i].rawHex);
            setInscriptionLocations(updatedInscriptionTxIds);
            return;
          }
        }
        await forceUpdateInscriptions();
      }
    } else {
      const receivedInscriptions = await apiController.getInscriptions(
        ""
        // TODO: currentAccount.address
      );
      if (!inscriptionLocations.length) {
        setInscriptions(receivedInscriptions);
      } else {
        setInscriptions([
          ...receivedInscriptions,
          ...inscriptions.slice(
            receivedInscriptions?.length,
            inscriptions.length
          ),
        ]);
      }
    }
  }, [
    inscriptionLocations,
    inscriptions,
    currentPage,
    currentAccount?.id,
    apiController,
    forceUpdateInscriptions,
  ]);

  const getNativeCoinPricesFromLS = async (symbol: string) => {
    const prices = await LS.getItem(NATIVE_COIN_PRICES_KEY);
    if (!prices || typeof prices !== "object") {
      return undefined;
    }

    if (!prices[symbol]) return undefined;

    if (!prices[symbol]["expired"]) return undefined;

    if (prices[symbol]["expired"] < new Date().getTime()) return undefined;

    return {
      usd: Number(prices[symbol]["usd"]),
      changePercent24Hr: Number(prices[symbol]["changePercent24Hr"]),
    };
  };

  const setNativeCoinPricesToLS = async (
    symbol: string,
    price: number,
    changePercent24Hr: number
  ) => {
    let prices = await LS.getItem(NATIVE_COIN_PRICES_KEY);
    if (!prices || typeof prices !== "object") {
      prices = {};
    }

    prices[symbol] = {
      expired: new Date().getTime() + 120000, // 60s or 60000ms
      usd: Number(price),
      changePercent24Hr: Number(changePercent24Hr),
    };

    await LS.setItem(NATIVE_COIN_PRICES_KEY, prices);
  };

  const getCoinPrice = async (symbol: string) => {
    try {
      const symbolLower = symbol.toLowerCase();
      let pricesFromCache = await getNativeCoinPricesFromLS(symbolLower);

      if (
        !pricesFromCache &&
        apiController &&
        apiController.getNativeCoinPrice
      ) {
        pricesFromCache = await apiController.getNativeCoinPrice(symbolLower);
        await updateLastBlock();
        await setNativeCoinPricesToLS(
          symbolLower,
          pricesFromCache.usd,
          pricesFromCache.changePercent24Hr
        );
      }

      if (pricesFromCache) {
        return {
          symbol: symbolLower,
          usd: pricesFromCache.usd,
          changePercent24Hr: pricesFromCache.changePercent24Hr,
        };
      }
    } catch (e) {
      console.log(`Load coin ${symbol} price: `, e.message);
    }

    return {
      symbol: symbol,
      usd: 0,
      changePercent24Hr: 0,
    };
  };

  const loadNativeCoinPrice = useCallback(async () => {
    try {
      const pricesFromCache = await getCoinPrice(currentNetwork.coinSymbol);
      setCurrentPrice(pricesFromCache?.usd || 0);
      setChangePercent24Hr(pricesFromCache?.changePercent24Hr || 0);
    } catch (e) {
      console.log("Load native coin price: ", e.message);
    }
  }, [apiController, updateLastBlock, currentNetwork]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadNativeCoinPrice();
  }, [currentNetwork, loadNativeCoinPrice]);

  useEffect(() => {
    if (!currentAccount?.id) return;
    const interval = setInterval(async () => {
      await Promise.allSettled([
        updateAccountBalance(),
        updateTransactions(),
        updateLastBlock(),
        // inscriptionIntervalUpdate(),
        updateFeeRates(),
        // updateTokens(),
      ]);
    }, 10000);
    return () => {
      clearInterval(interval);
    };
  }, [
    updateAccountBalance,
    updateTransactions,
    updateLastBlock,
    // inscriptionIntervalUpdate,
    updateFeeRates,
    // updateTokens,
    currentAccount?.id,
  ]);

  const inscriptionIntervalUpdateRef = useRef(inscriptionIntervalUpdate);
  inscriptionIntervalUpdateRef.current = inscriptionIntervalUpdate;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    if (!(currentPage % 10)) inscriptionIntervalUpdateRef.current();
  }, [currentPage]);

  if (!currentAccount) return undefined;

  return {
    lastBlock,
    transactions,
    inscriptions,
    currentPrice,
    changePercent24Hr,
    getCoinPrice,
    loadMoreTransactions,
    loadMoreInscriptions,
    trottledUpdate: throttleUpdate,
    feeRates,
    loading,
    resetTransactions: () => {
      setTransactions([]);
      setInscriptions([]);
    },
    setCurrentPage,
    currentPage,
    tokens,
    forceUpdateInscriptions,
    // inscriptionHandler,
    // setInscriptionHandler,
    // tokenHandler,
    // setTokenHandler,
    setSearchInscriptions,
    setSearchTokens,
    searchInscriptions,
    searchTokens,
  };
};

interface TransactionManagerContextType {
  lastBlock: number;
  transactions: ITransaction[];
  inscriptions: Inscription[];
  currentPrice: number | undefined;
  changePercent24Hr: number | undefined;
  getCoinPrice: (symbol: string) => Promise<{
    symbol: string;
    usd: number;
    changePercent24Hr: number;
  }>;
  loadMoreTransactions: () => Promise<void>;
  loadMoreInscriptions: () => Promise<void>;
  trottledUpdate: (force?: boolean) => void;
  loading: boolean;
  feeRates?: {
    fast: number;
    slow: number;
  };
  resetTransactions: () => void;
  setCurrentPage: (page: number) => void;
  currentPage: number;
  tokens: IToken[];
  forceUpdateInscriptions: () => Promise<void>;
  setSearchInscriptions: (v: Inscription[] | undefined) => void;
  setSearchTokens: (v: IToken[] | undefined) => void;
  searchInscriptions: Inscription[] | undefined;
  searchTokens: IToken[] | undefined;
}

const TransactionManagerContext = createContext<
  TransactionManagerContextType | undefined
>(undefined);

export const TransactionManagerProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const transactionManager = useTransactionManager();

  return (
    <TransactionManagerContext.Provider value={transactionManager}>
      {children}
    </TransactionManagerContext.Provider>
  );
};

export const useTransactionManagerContext = () => {
  const context = useContext(TransactionManagerContext);
  if (!context) {
    return {
      lastBlock: undefined,
      transactions: [],
      inscriptions: [],
      currentPrice: undefined,
      changePercent24Hr: undefined,
      getCoinPrice: async (symbol: string) => {
        return {
          symbol: "",
          usd: 0,
          changePercent24Hr: 0,
        };
      },
      loadMoreTransactions: () => {},
      loadMoreInscriptions: () => {},
      trottledUpdate: () => {},
      loading: false,
      feeRates: {
        slow: 0,
        fast: 0,
      },
      resetTransactions: () => {},
      setCurrentPage: () => {},
      currentPage: 1,
      tokens: [],
      forceUpdateInscriptions: () => {},
      setSearchInscriptions: () => {},
      setSearchTokens: () => {},
      searchInscriptions: undefined,
      searchTokens: undefined,
    };
  }
  return context;
};
