/* eslint-disable @typescript-eslint/no-floating-promises */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getExtraDetailSpore, getURLFromHex } from "../utils/dob";
import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "../states/walletState";
import { isCkbNetwork } from "@/shared/networks";
import { INFT } from "@/shared/interfaces/nft";
import { ckbExplorerApi } from "../utils/helpers";

export const useGetMyNFTs = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPage, setTotalPage] = useState<number>(0);
  const [nfts, setNFTs] = useState<INFT[]>([]);

  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();

  const isNext = useMemo(() => {
    return page < totalPage;
  }, [page, totalPage]);

  const isPrev = useMemo(() => {
    return page > 1;
  }, [page]);

  const getMyNFTs = useCallback(
    async (isLoading: boolean) => {
      if (!isCkbNetwork(currentNetwork.network)) {
        setIsLoading(false);
        return;
      }
      setIsLoading(isLoading);
      try {
        const res = await fetch(
          `${ckbExplorerApi(
            currentNetwork.slug
          )}/v2/nft/items?page=${page}&owner=${
            currentAccount.accounts[0].address
          }&standard=spore`,
          {
            method: "GET",
            headers: {
              Accept: "application/vnd.api+json",
            },
          }
        );
        const data = await res.json();
        setTotalPage(data.pagination.pages);
        const _nfts = [];
        for (let index = 0; index < data.data.length; index++) {
          const { url: imageUrl } = getURLFromHex(data.data[index].cell.data);
          _nfts.push({ ...data.data[index], imageUrl });
        }
        setNFTs(_nfts);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    },
    [page]
  );

  useEffect(() => {
    getMyNFTs(true);
  }, [getMyNFTs]);

  return {
    nfts,
    isLoading,
    isNext,
    isPrev,
    setPage,
    page,
  };
};

export const useGetDetailNFT = () => {
  const { collection, nftId } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [detailNFT, setDetailNFT] = useState<INFT | undefined>(undefined);

  const currentNetwork = useGetCurrentNetwork();

  const getDetailNFT = async () => {
    try {
      const res = await fetch(
        `${ckbExplorerApi(
          currentNetwork.slug
        )}/v2/nft/collections/${collection}/items/${nftId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/vnd.api+json",
          },
        }
      );
      const data = await res.json();
      const {
        url: imageUrl,
        capacity,
        contentType,
      } = await getExtraDetailSpore(
        data.cell.tx_hash,
        data.cell.cell_index,
        currentNetwork
      );
      setDetailNFT({ ...data, imageUrl, capacity, contentType });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getDetailNFT();
  }, []);

  return {
    detailNFT,
    isLoading,
  };
};
