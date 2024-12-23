import {
  useGetCurrentAccount,
  useGetCurrentNetwork,
} from "@/ui/states/walletState";
import WalletPanel from "../wallet/wallet-panel";
import BottomPanel from "../wallet/bottom-panel";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isCkbNetwork } from "@/shared/networks";
import ReactLoading from "react-loading";
import { ALCHEMY_MERCHANT_API } from "@/shared/constant";

const AlchemyPay = () => {
  const currentAccount = useGetCurrentAccount();
  const currentNetwork = useGetCurrentNetwork();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [paymentLink, setPaymentLink] = useState("");

  const receiveAddress = useMemo(() => {
    return currentAccount.accounts[0].address;
  }, [currentAccount]);

  const loadPaymentLink = useCallback(async () => {
    try {
      const res = await fetch(ALCHEMY_MERCHANT_API, {
        method: "POST",
        body: JSON.stringify({
          // TODO: using user email
          email: "dev@utxo.global",
          cryptoCurrency: isCkbNetwork(currentNetwork.network) ? "CKB" : "BTC",
          address: receiveAddress,
          network: isCkbNetwork(currentNetwork.network) ? "CKB" : "BTC",
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
  }, [currentNetwork, receiveAddress]);

  useEffect(() => {
    loadPaymentLink();
  }, [currentNetwork, receiveAddress]);

  return (
    <div className="w-full h-full top-0 relative">
      <div className="!h-100vh-72px standard:!h-100vh-100px overflow-auto">
        <WalletPanel />
        <div className="flex justify-center">
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
          ) : (
            <div className="pt-10">
              <button className="btn primary !py-3" onClick={loadPaymentLink}>
                Retry
              </button>
            </div>
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
