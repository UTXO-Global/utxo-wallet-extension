import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import WalletPanel from "../wallet/wallet-panel";
import BottomPanel from "../wallet/bottom-panel";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactLoading from "react-loading";
import { ALCHEMY_MERCHANT_API } from "@/shared/constant";
import { useNavigate } from "react-router-dom";
import { NetworkSlug } from "@/shared/networks/types";

const AlchemyPay = () => {
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paymentLink, setPaymentLink] = useState("");
  const navigate = useNavigate();

  const receiveAddress = useMemo(() => {
    return currentAccount.accounts[0].address;
  }, [currentAccount]);

  const crypto = useMemo(() => {
    switch (currentNetwork.slug) {
      case "btc":
        return "BTC";
      case "nervos":
        return "CKB";
      case "dogecoin":
        return "DOGE";
      default:
        return null;
    }
  }, [currentNetwork]);

  const loadPaymentLink = useCallback(async () => {
    if (crypto !== null) {
      try {
        setIsLoading(true);
        const res = await fetch(ALCHEMY_MERCHANT_API, {
          method: "POST",
          body: JSON.stringify({
            // TODO: using user email
            email: "dev@utxo.global",
            cryptoCurrency: crypto,
            address: receiveAddress,
            network: crypto,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setPaymentLink(data.paymentUrl);
      } catch (e) {
        console.error(e);
        setPaymentLink("");
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentNetwork, receiveAddress]);

  useEffect(() => {
    loadPaymentLink();
  }, [currentNetwork, receiveAddress]);

  return (
    <div className="w-full h-full top-0 relative">
      <div className="!h-100vh-72px standard:!h-100vh-100px overflow-auto">
        <WalletPanel />
        <div className="flex justify-center">
          {[
            "btc_testnet",
            "btc_testnet_4",
            "btc_signet",
            "nervos_testnet",
            "dogecoin_testnet",
          ].includes(currentNetwork.slug) ? (
            <div className="text-center">
              <p className="text-[#FF4545] text-center mt-2 !mb-3 text-lg font-normal">
                {currentNetwork.name} activated.{" "}
              </p>
              <button
                className="btn primary !py-3"
                onClick={() => {
                  navigate("/home");
                }}
              >
                Back to Home
              </button>
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex justify-center h-full items-center pt-10">
              <ReactLoading type="spin" color="#ODODOD" />
            </div>
          ) : paymentLink !== "" ? (
            <iframe
              className="block max-h-[520px] max-w-[500px]"
              height="520"
              title="AlchemyPay On/Off Ramp Widget"
              allow="bluetooth; payment"
              src={paymentLink}
              style={{
                margin: "auto",
              }}
            ></iframe>
          ) : crypto !== null ? (
            <div className="pt-10">
              <button className="btn primary !py-3" onClick={loadPaymentLink}>
                Retry
              </button>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
      <div className="absolute w-full bottom-0">
        <BottomPanel />
      </div>
    </div>
  );
};

export default AlchemyPay;
