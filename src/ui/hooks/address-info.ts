import { useEffect, useMemo, useState } from "react";
import { fetchExplorerAPI } from "../utils/helpers";
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

  const getAddressInfo = async () => {
    if (isLoading) return;

    if (isLoaded && !addressInfo) return;

    setIsLoading(true);

    try {
      const res = await fetchExplorerAPI(
        currentNetwork.slug,
        `/v1/addresses/${currentAccount.accounts[0].address}`
      );
      const { data } = await res.json();
      if (data && data.length > 0) {
        setAddressInfo(data[0] as CKBAddressInfo);
      } else {
        setAddressInfo(undefined);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
    setIsLoaded(addressInfo !== undefined);
  };

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
  }, [currentNetwork, currentAccount, currentNetwork]);

  return { isLoading, addressInfo };
};
