import Loading from "react-loading";
import toast from "react-hot-toast";
import { t } from "i18next";

import { IcnCopy, IcnExternalLink } from "@/ui/components/icons";
import { useGetDetailNFT } from "@/ui/hooks/nft";
import { shortAddress } from "@/shared/utils/transactions";
import { browserTabsCreate } from "@/shared/utils/browser";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { formatNumber } from "@/shared/utils";

const DetailNFT = () => {
  const { isLoading, detailNFT } = useGetDetailNFT();
  const currentNetwork = useGetCurrentNetwork();

  const onCopy = async () => {
    await navigator.clipboard.writeText(detailNFT.type_script.args);
    toast.success(t("transaction_info.copied"));
  };

  const onViewExplorer = async () => {
    await browserTabsCreate({
      active: true,
      url: `${currentNetwork.explorerUrl}/nft-info/${detailNFT.collection.sn}/${detailNFT.type_script.args}`,
    });
  };

  return (
    <div className="w-full h-full">
      {isLoading ? (
        <div className="flex justify-center mt-10 py-6">
          <Loading type="spin" width={50} color="#ODODOD" />
        </div>
      ) : detailNFT ? (
        <>
          <div className="h-[179px] bg-[#FAFAFA] flex justify-center items-center">
            <img
              src={detailNFT.imageUrl}
              alt={detailNFT.name}
              className="h-full"
            />
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[20px] leading-[28px] font-medium text-primary">
                  {detailNFT.collection.name || "<No Cluster>"}
                </p>
                <div className="text-[14px] leading-[18px] text-[#787575] mt-[2px] flex items-center gap-2">
                  <p>{shortAddress(detailNFT.type_script.args, 14)}</p>
                  <IcnCopy
                    className="stroke-[#787575] transition-colors cursor-pointer w-4 h-4"
                    onClick={onCopy}
                  />
                </div>
              </div>
              <IcnExternalLink
                className="w-[18px] transition-colors hover:stroke-[#787575] cursor-pointer"
                onClick={onViewExplorer}
              />
            </div>
            <div className="mt-4 rounded-lg bg-[#FAFAFA] p-4 grid gap-4">
              <div className="flex justify-between">
                <p className="text-base font-medium text-[#787575]">Cluster</p>
                <p className="text-base font-medium text-primary text-right">
                  {detailNFT.collection.name || "<No Cluster>"}
                </p>
              </div>

              <div className="flex justify-between">
                <p className="text-base font-medium text-[#787575]">{t("detailNFT.type")}</p>
                <p className="text-base font-medium text-primary text-right">
                  DOBs
                </p>
              </div>

              <div className="flex justify-between">
                <p className="text-base font-medium text-[#787575]">{t("detailNFT.occupied")}</p>
                <p className="text-base font-medium text-primary text-right">
                  {formatNumber(Number(detailNFT.capacity) / 10 ** 8, 0, 0)}{" "}
                  CKBytes
                </p>
              </div>

              <div className="flex justify-between">
                <p className="text-base font-medium text-[#787575]">{t("detailNFT.creator")}</p>
                <p className="text-base font-medium text-primary text-right">
                  {detailNFT.collection.creator || "--"}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center mt-10">
          <img src="/no-nfts.png" alt="no nfts" className="w-[140px]" />
          <p className="text-base font-normal text-center text-[#ABA8A1] mt-4">
            {`NFT not found!`}
          </p>
        </div>
      )}
    </div>
  );
};

export default DetailNFT;
