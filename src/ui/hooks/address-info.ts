import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchExploreAPI } from "../utils/helpers";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "../states/walletState";
import { CKBAddressInfo } from "@/shared/networks/ckb/types";
import { isCkbNetwork as IsCKBNetwork } from "@/shared/networks";

export const useGetCKBAddressInfo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentNetwork = useGetCurrentNetwork();
  const currentAccount = useGetCurrentAccount();
  const [addressInfo, setAddressInfo] = useState<CKBAddressInfo | undefined>(
    undefined
  );

  const isCKBNetwork = useMemo(() => {
    return IsCKBNetwork(currentNetwork.network);
  }, [currentNetwork.network]);

  const getAddressInfo = useCallback(async () => {
    if (addressInfo !== undefined) return;

    if (isLoading) return;

    if (isLoaded && !addressInfo) return;

    setIsLoading(true);

    try {
      const res = await fetchExploreAPI(
        currentNetwork.slug,
        `/v1/addresses/${currentAccount.accounts[0].address}`
      );
      const { data } = await res.json();
      if (data && data.length > 0) {
        setAddressInfo(data[0] as CKBAddressInfo);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
    setIsLoaded(addressInfo !== undefined);
  }, [isLoading, currentAccount, isLoaded]);

  useEffect(() => {
    if (currentAccount.accounts.length > 0 && currentNetwork && isCKBNetwork) {
      getAddressInfo()
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [currentNetwork, currentAccount, isCKBNetwork]);

  return { isLoading, addressInfo };
};
