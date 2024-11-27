import { NETWORK_ICON } from "@/shared/networks";
import { browserTabsCreate } from "@/shared/utils/browser";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import { t } from "i18next";
import QRCode from "qr-code-styling";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

const Receive = () => {
  const { address: selectedAddress } = useParams();
  const ref = useRef(null);
  const currentNetwork = useGetCurrentNetwork();
  const navigate = useNavigate();

  const qrCode = useMemo(() => {
    return new QRCode({
      width: 183,
      height: 183,
      type: "svg",
      margin: 3,
      image: NETWORK_ICON[currentNetwork.slug],
      dotsOptions: {
        type: "classy-rounded",
        gradient: {
          type: "linear",
          rotation: 45,
          colorStops: [
            {
              color: "#0D0D0D",
              offset: 0,
            },
            {
              color: "#0D0D0D",
              offset: 5,
            },
          ],
        },
      },
      qrOptions: {
        errorCorrectionLevel: "M",
      },
      backgroundOptions: {
        color: "#ffffff00",
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 5,
      },
    });
  }, [currentNetwork.slug]);

  useEffect(() => {
    qrCode.append(ref.current);
  }, []);

  useEffect(() => {
    qrCode.update({
      data: selectedAddress,
    });
  }, [selectedAddress]);

  const onCopy = async () => {
    const newQr = new QRCode({
      ...qrCode._options,
      backgroundOptions: {
        color: "#0D0D0D",
      },
    });
    const blob = await newQr.getRawData();
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    toast.success("Copied");
  };

  return (
    <div className="h-full px-4 pb-4 flex flex-col justify-start">
      {/* <div>
        <Select
          label={"Address"}
          values={currentAccount.accounts.map((account) => ({
            name: shortAddress(account.address, 12),
            value: account.address,
          }))}
          selected={{
            name: shortAddress(selectedAddress, 12),
            value: selectedAddress,
          }}
          setSelected={(address) => {
            setSelectedAddress(address.value);
          }}
        />
      </div> */}
      <div className="flex items-center flex-col gap-6 justify-center mt-[48px]">
        <div
          title={t("receive.click_to_copy")}
          onClick={onCopy}
          ref={ref}
          className="cursor-pointer"
        />
        <div className="rounded-[16px] border border-[#F5F5F5] p-4 break-all text-center text-[14px] leading-[18px] text-primary">
          {selectedAddress}
        </div>

        <div
          className="py-1 w-[80px] flex justify-center rounded-full bg-[#F5F5F5] text-[14px] leading-[24px] text-[#787575] cursor-pointer"
          onClick={async () => {
            await navigator.clipboard.writeText(selectedAddress);
            toast.success(t("transaction_info.copied"));
          }}
        >
          Copy
        </div>

        <div
          className="py-1 w-[80px] flex justify-center rounded-full bg-[#F5F5F5] text-[14px] leading-[24px] text-[#787575] cursor-pointer"
          onClick={async () => {
            await browserTabsCreate({
              url: "/index.html#/alchemypay",
            });
          }}
        >
          Purchase
        </div>
      </div>
    </div>
  );
};

export default Receive;
