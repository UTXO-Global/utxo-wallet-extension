import { isCkbNetwork } from "@/shared/networks";
import cn from "classnames";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { t } from "i18next";
import { IcnApproximate } from "@/ui/components/icons";
import { Tooltip } from "react-tooltip";

export default function UTXOReviewOrder() {
  const navigate = useNavigate();
  const currentNetwork = useGetCurrentNetwork();
  const location = useLocation();
  const fields = [
    {
      id: "reviewPrice",
      title: t("components.swap.price"),
      value: (
        <>
          1 CKB <IcnApproximate className="w-[9px] h-[7px]" /> 0.51 USDC
        </>
      ),
    },
    {
      id: "reviewFees",
      title: t("components.swap.fees"),
      value: <>0.001 CKB</>,
      tooltip: t("components.swap.tooltip.fees"),
    },
    {
      id: "reviewMaxSlippage",
      title: t("components.swap.maxSlippage"),
      value: <>0.5%</>,
      tooltip: t("components.swap.tooltip.maxSlippage"),
    },
  ];

  return (
    <div className="w-full h-full top-0 relative">
      {isCkbNetwork(currentNetwork.network) ? (
        <>
          <div className="px-4 py-2">
            <div className="bg-grey-300 rounded-t-lg pt-2 pb-4 px-2 flex flex-col gap-2 relative">
              <div className="flex gap-2 items-center p-2 pb-0">
                <div className="w-10 h-10">
                  <img
                    src="/ckb.png"
                    className="w-full rounded-full object-cover object-center"
                  />
                </div>
                <div className="flex flex-col gap-0 flex-grow">
                  <div className="text-[#787575] text-base font-medium">
                    You Pay
                  </div>
                  <div className="text-[22px] leading-7 text-black font-medium">
                    <div>100,000 CKB</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 bg-grey-300 rounded-b-lg pt-2 pb-4 px-2 flex flex-col gap-2 relative">
              <div className="flex gap-2 items-center p-2 pb-0">
                <div className="w-10 h-10">
                  <img
                    src="/ckb.png"
                    className="w-full rounded-full object-cover object-center"
                  />
                </div>
                <div className="flex flex-col gap-0 flex-grow">
                  <div className="text-[#787575] text-base font-medium flex items-center justify-between">
                    <span>You Receive</span>
                    <span>$841.77</span>
                  </div>
                  <div className="text-[22px] leading-7 text-black font-medium">
                    <div>100,000 CKB</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-grey-300 rounded-lg py-3 px-4 mt-2">
              {fields.map((f, i) => (
                <div
                  className="flex items-center justify-between pt-2 pb-4 border-b border-grey-200"
                  key={`field-${f.id}-${i}`}
                >
                  <span className="text-primary text-base font-medium flex gap-1 items-center">
                    {f.title}
                    {!!f.tooltip ? (
                      <>
                        <IcnInfo className={f.id} />
                        <Tooltip
                          anchorSelect={`.${f.id}`}
                          place="top"
                          className="!text-[12px] !leading-[14px] !bg-primary !text-white !p-2 !max-w-[180px] !tracking-[0.1px] !rounded-lg"
                        >
                          {f.tooltip}
                        </Tooltip>
                      </>
                    ) : (
                      <></>
                    )}
                  </span>
                  <div className="text-[#787575] text-sm leading-[18px] font-normal rounded-lg flex items-center gap-[2px]">
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 w-full px-4 pb-4 pt-2">
            <button
              type="submit"
              className={cn(
                "btn primary standard:m-6 standard:mb-3 disabled:bg-[#D1D1D1] disabled:text-grey-100 w-full",
                {
                  "hover:bg-none hover:border-transparent": false,
                }
              )}
              disabled={false}
              onClick={() =>
                navigate("/pages/swap/swap-success", {
                  state: location.state,
                })
              }
            >
              {t("components.layout.swap")}
            </button>
          </div>
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
  );
}

const IcnInfo = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={cn(className ? className : "")}
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
  );
};
