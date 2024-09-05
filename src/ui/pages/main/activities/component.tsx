import TransactionList from "@/ui/components/transactions-list";
import BottomPanel from "../wallet/bottom-panel";
import WalletPanel from "../wallet/wallet-panel";

export default function Activities() {
  return (
    <div className="w-full h-full top-0 relative">
      <div className="!h-100vh-72px standard:!h-100vh-100px overflow-auto">
        <WalletPanel />
        <TransactionList className="mb-4 px-4 !z-5 !pt-4 bg-white" />
      </div>
      <div className="absolute w-full bottom-0">
        <BottomPanel />
      </div>
    </div>
  );
}
