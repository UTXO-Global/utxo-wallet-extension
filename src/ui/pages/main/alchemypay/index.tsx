import { useGetCurrentAccount } from "@/ui/states/walletState";
import WalletPanel from "../wallet/wallet-panel";
import BottomPanel from "../wallet/bottom-panel";

const appId = "0m511Et0hBStrnUB";

const AlchemyPay = () => {
  const currentAccount = useGetCurrentAccount();
  return (
    <div className="w-full h-full top-0 relative">
      <div className="!h-100vh-72px standard:!h-100vh-100px overflow-auto">
        <WalletPanel />
        <div className="flex">
          <iframe
            className="block max-h-[520px] max-w-[500px]"
            height="520"
            title="AlchemyPay On/Off Ramp Widget"
            src={`https://ramp.alchemypay.org/?appId=${appId}&address=${currentAccount.accounts[0].address}&network=CKB&token=CKB#/index`}
            style={{
              margin: "auto",
            }}
          ></iframe>
        </div>
      </div>
      <div className="absolute w-full bottom-0">
        <BottomPanel />
      </div>
    </div>
  );
};

export default AlchemyPay;
