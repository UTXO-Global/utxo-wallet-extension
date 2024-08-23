import { createHashRouter, Navigate } from "react-router-dom";

import Wallet from "@/ui/pages/main/wallet";

import PagesLayout from "@/ui/components/layout";
import CreatePassword from "@/ui/pages/main/create-password";
import Login from "@/ui/pages/main/login";
import CreateNewAccount from "@/ui/pages/main/new-account";
import SwitchAccount from "@/ui/pages/main/switch-account";
import ShowPk from "@/ui/pages/main/switch-account/show-pk";
import AccountDetail from "./main/about-account";
import WalletDetail from "./main/about-wallet/component";
import AddressType from "./main/address-type";
import ConnectedSites from "./main/connected-sites";
import Home from "./main/home";
import InscriptionDetails from "./main/inscription-details";
import Inscriptions from "./main/inscriptions";
import Language from "./main/language";
import Network from "./main/network";
import NewWallet from "./main/new-wallet";
import NewMnemonic from "./main/new-wallet/new-mnemonic";
import RestoreMnemonic from "./main/new-wallet/restore-mnemonic";
import RestorePrivKey from "./main/new-wallet/restore-priv-key";
import Receive from "./main/receive";
import Security from "./main/security";
import ChangePassword from "./main/security/change-password";
import ConfirmSend from "./main/send/confirm-send";
import CreateSend from "./main/send/create-send";
import FinalleSend from "./main/send/finalle-send";
import Settings from "./main/settings";
import SwitchWallet from "./main/switch-wallet";
import ShowMnemonic from "./main/switch-wallet/show-mnemonic";
import TransactionInfo from "./main/transaction-info";
import Connect from "./provider/connect";
import CreateTx from "./provider/create-tx/component";
import SignLNInvoice from "./provider/sign-ln-invoice";
import SignMessage from "./provider/sign-message";
import Explore from "./main/explore";
import RestoreType from "./main/new-wallet/restore-type";
import SwitchNetwork from "./provider/switch-network/component";
import SwitchChain from "./provider/switch-chain/component";
import SignTransaction from "./provider/sign-transaction";
import ConfirmMnemonic from "./main/new-wallet/new-mnemonic/confirm-mnemonic";
import ListNFTs from "./main/nfts/component";
import DetailNFT from "./main/detail-nft";

export const guestRouter = createHashRouter([
  {
    path: "account",
    children: [
      { path: "login", element: <Login /> },
      { path: "create-password", element: <CreatePassword /> },
    ],
  },
  { path: "*", element: <Navigate to={"/account/login"} /> },
]);

export const authenticatedRouter = createHashRouter([
  { path: "/", element: <Home /> },
  {
    path: "home",
    element: <Wallet />,
  },
  {
    path: "nfts",
    element: <ListNFTs />
  },
  {
    path: "pages",
    element: <PagesLayout />,
    children: [
      { path: "settings", element: <Settings /> },
      { path: "switch-account", element: <SwitchAccount /> },
      { path: "address-type/:accId", element: <AddressType /> },
      { path: "create-new-account", element: <CreateNewAccount /> },
      { path: "about-account/:accId", element: <AccountDetail /> },
      { path: "change-password", element: <ChangePassword /> },
      { path: "receive/:address", element: <Receive /> },
      { path: "switch-wallet", element: <SwitchWallet /> },
      { path: "about-wallet/:walletId", element: <WalletDetail /> },
      { path: "create-new-wallet", element: <NewWallet /> },
      { path: "restore-type", element: <RestoreType /> },
      { path: "new-mnemonic", element: <NewMnemonic /> },
      { path: "confirm-mnemonic", element: <ConfirmMnemonic /> },
      { path: "restore-mnemonic", element: <RestoreMnemonic /> },
      { path: "restore-priv-key", element: <RestorePrivKey /> },
      { path: "show-pk/:accId", element: <ShowPk /> },
      { path: "show-mnemonic/:walletId", element: <ShowMnemonic /> },
      { path: "transaction-info/:txId", element: <TransactionInfo /> },
      { path: "finalle-send/:txId", element: <FinalleSend /> },
      { path: "create-send", element: <CreateSend /> },
      { path: "confirm-send", element: <ConfirmSend /> },
      { path: "connected-sites", element: <ConnectedSites /> },
      { path: "language", element: <Language /> },
      { path: "network", element: <Network /> },
      { path: "security", element: <Security /> },
      { path: "inscription-details", element: <InscriptionDetails /> },
      { path: "inscriptions", element: <Inscriptions /> },
      { path: "explore", element: <Explore /> },
      { path: "detail-nft/:collection/:nftId", element: <DetailNFT /> },
    ],
  },
  {
    path: "provider",
    children: [
      { path: "connect", element: <Connect /> },
      { path: "signMessage", element: <SignMessage /> },
      { path: "switchNetwork", element: <SwitchNetwork /> },
      { path: "switchChain", element: <SwitchChain /> },
      { path: "createTx", element: <CreateTx /> },
      { path: "signTransaction", element: <SignTransaction /> },
      { path: "signLNInvoice", element: <SignLNInvoice /> },
    ],
  },
  { path: "*", element: <Navigate to={"/"} /> },
]);
