import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Loading from "react-loading";
import { useNavigate } from "react-router-dom";
import { useGetMyNFTs } from "@/ui/hooks/nft";
import cn from "classnames";

import WalletPanel from "../wallet/wallet-panel/component";
import BottomPanel from "../wallet/bottom-panel";
import NftCard from "@/ui/components/nft-card";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { isCkbNetwork } from "@/shared/networks";

const ListNFTs = () => {
  const { isLoading, nfts, setPage, isNext, isPrev, page } = useGetMyNFTs();
  const navigate = useNavigate();

  const currentNetwork = useGetCurrentNetwork();

  return (
    <div className="w-full h-full top-0 relative">
      <div className="!h-100vh-72px standard:!h-100vh-100px overflow-auto">
        <WalletPanel />
        {isCkbNetwork(currentNetwork.network) ? (
          <>
            <div className="flex justify-between items-center sticky top-[65px] px-4 bg-white pt-[14px] pb-[12px] z-10">
              <div className="px-4 py-1 rounded-[100px] bg-[#F5F5F5] text-[14px] leading-[20px] text-[#787575] font-medium">
                DOBs
              </div>
              <div className="flex gap-2">
                <button
                  className={cn(
                    `border-none outline-none w-[25px] h-[25px] bg-[#F5F5F5] flex justify-center items-center rounded-[3px] cursor-pointer transition-colors hover:enabled:bg-[#EBECEC]`,
                    {
                      "!cursor-not-allowed": !isPrev,
                    }
                  )}
                  disabled={!isPrev}
                  onClick={() => {
                    console.log(isPrev);
                    if (!isPrev) return;
                    setPage(page - 1);
                  }}
                >
                  <ChevronLeftIcon className="w-[13px] text-[#ABA8A1]" />
                </button>
                <button
                  className={cn(
                    `border-none outline-none w-[25px] h-[25px] bg-[#F5F5F5] flex justify-center items-center rounded-[3px] cursor-pointer transition-colors hover:enabled:bg-[#EBECEC]`,
                    {
                      "!cursor-not-allowed": !isNext,
                    }
                  )}
                  disabled={!isNext}
                  onClick={() => {
                    if (!isNext) return;
                    setPage(page + 1);
                  }}
                >
                  <ChevronRightIcon className="w-[13px] text-[#ABA8A1]" />
                </button>
              </div>
            </div>
            {isLoading ? (
              <div className="flex justify-center mt-10 py-6">
                <Loading type="spin" width={50} color="#ODODOD" />
              </div>
            ) : nfts.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-10">
                <img src="/no-nfts.png" alt="no nfts" className="w-[140px]" />
                <p className="text-base font-normal text-center text-[#ABA8A1] mt-4">
                  {`You don't have any NFT yet!`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 standard:grid-cols-3 gap-2 px-4 mt-[2px] pb-[14px]">
                {nfts.map((z, i) => (
                  <div
                    key={i}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/pages/detail-nft/${z.collection.sn}/${z.token_id}`
                      )
                    }
                  >
                    <NftCard nft={z} />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center">
            <img src="/feature.png" alt="feature" className="w-[180px]" />
            <p className="text-base font-normal text-center text-[#ABA8A1] mt-4">
              {`The feature is not supported yet!`}
            </p>
          </div>
        )}
      </div>
      <div className="absolute w-full bottom-0">
        <BottomPanel />
      </div>
    </div>
  );
};

export default ListNFTs;
