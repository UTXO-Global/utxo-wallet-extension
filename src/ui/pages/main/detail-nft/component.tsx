import Loading from "react-loading";
import toast from "react-hot-toast";
import { t } from "i18next";
import { Tooltip } from "react-tooltip";

import { IcnCopy, IcnExternalLink } from "@/ui/components/icons";
import { useGetDetailNFT } from "@/ui/hooks/nft";
import { shortAddress } from "@/shared/utils/transactions";
import { browserTabsCreate } from "@/shared/utils/browser";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { formatNumber } from "@/shared/utils";
import cn from "classnames";
import { useNavigate } from "react-router-dom";

const DetailNFT = () => {
  const { isLoading, detailNFT } = useGetDetailNFT();
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();

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

  const onNextToTransfer = async () => {
    if (!detailNFT) {
      return;
    }

    try {
      navigate(
        `/pages/transfer-nft/${detailNFT.collection.sn}/${detailNFT.token_id}`,
        {
          state: {
            nft: detailNFT,
          },
        }
      );
    } catch (e) {
      console.log("Transfer: ", e);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {isLoading ? (
        <div className="flex justify-center mt-10 py-6">
          <Loading type="spin" width={50} color="#ODODOD" />
        </div>
      ) : detailNFT ? (
        <>
          <div className="h-[179px] bg-[#FAFAFA] flex justify-center items-center p-4">
            <img
              src={detailNFT.imageUrl || "/nft-default.png"}
              alt={detailNFT.name}
              className={cn("rounded mix-blend-multiply p-2", {
                "h-full": !!detailNFT.imageUrl,
              })}
            />
          </div>
          <div className="p-4 flex-auto">
            <div className="flex justify-between items-center">
              <div>
                {!!detailNFT.collection.name && (
                  <p className="text-[20px] leading-[28px] font-medium text-primary">
                    {detailNFT.collection.name}
                  </p>
                )}

                <div
                  className={cn(
                    "text-[14px] leading-[18px] text-[#787575] mt-[2px] flex items-center gap-1",
                    {
                      "!text-[20px] !leading-[28px] !font-medium !text-primary":
                        !detailNFT.collection.name,
                    }
                  )}
                >
                  <p>{shortAddress(detailNFT.type_script.args, 8)}</p>
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
                <p className="text-base font-medium text-[#787575]">
                  {t("detailNFT.type")}
                </p>
                <p className="text-base font-medium text-primary text-right">
                  DOBs
                </p>
              </div>

              {!!detailNFT.contentType && (
                <div className="flex justify-between">
                  <p className="text-base font-medium text-[#787575]">
                    {t("detailNFT.content_type")}
                  </p>
                  <p className="text-base font-medium text-primary text-right">
                    {detailNFT.contentType}
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <div className="flex gap-1 items-center">
                  <p className="text-base font-medium text-[#787575]">
                    {t("detailNFT.occupied")}
                  </p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="occupied"
                  >
                    <path
                      d="M7.99967 14.6673C11.6663 14.6673 14.6663 11.6673 14.6663 8.00065C14.6663 4.33398 11.6663 1.33398 7.99967 1.33398C4.33301 1.33398 1.33301 4.33398 1.33301 8.00065C1.33301 11.6673 4.33301 14.6673 7.99967 14.6673Z"
                      stroke="#787575"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 5.33398V8.66732"
                      stroke="#787575"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.99609 10.666H8.00208"
                      stroke="#787575"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <Tooltip
                    anchorSelect=".occupied"
                    place="top"
                    className="!text-[12px] !leading-[16px] !bg-[#0d0d0d] !text-white !px-2 !py-[6px]"
                  >
                    The amount of CKByte occupied <br /> on-chain, redeemable
                    upon melt.
                  </Tooltip>
                </div>

                <p className="text-base font-medium text-primary text-right">
                  {formatNumber(Number(detailNFT.capacity) / 10 ** 8, 0, 0)}{" "}
                  CKBytes
                </p>
              </div>

              <div className="flex justify-between">
                <p className="text-base font-medium text-[#787575]">
                  {t("detailNFT.creator")}
                </p>
                <p className="text-base font-medium text-primary text-right">
                  {shortAddress(detailNFT.collection.creator || "--", 8)}
                </p>
              </div>
            </div>
          </div>
          <button
            className={cn("btn primary mx-4 mb-4 standard:m-6 standard:mb-3")}
            onClick={onNextToTransfer}
          >
            {t("detailNFT.transfer")}
          </button>
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
