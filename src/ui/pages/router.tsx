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
import Home from "./main/home";
import TokenDetail from "./main/token-detail";
import ListNFTs from "./main/nfts/component";
import DetailNFT from "./main/detail-nft";
import Activities from "./main/activities";
import TransferNft from "./main/transfer-nft";
import ConfirmTransferNft from "./main/transfer-nft/confirm-transfer-nft";
import UtxoSwap from "./main/swap/component";
import UTXOSwapSetting from "./main/swap/setting";
import UTXOSwapSearchToken from "./main/swap/search-token/component";
import UTXOReviewOrder from "./main/swap/review-order/component";
import UTXOFinalSwap from "./main/swap/success";
import OneKeyConnect from "./main/hware/onekey";

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
    element: <ListNFTs />,
  },
  {
    path: "activities",
    element: <Activities />,
  },
  {
    path: "swap",
    element: <UtxoSwap />,
  },
  {
    path: "swap/search-token",
    element: <UTXOSwapSearchToken />,
  },
  {
    path: "pages",
    element: <PagesLayout />,
    children: [
      {
        path: "swap/slippage-settings",
        element: <UTXOSwapSetting />,
      },
      {
        path: "swap/review-order",
        element: <UTXOReviewOrder />,
      },
      {
        path: "swap/swap-success/:txId",
        element: <UTXOFinalSwap />,
      },
      {
        path: "tokens/:type/:typeHash",
        element: <TokenDetail />,
      },
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
      { path: "transfer-nft/:collection/:nftId", element: <TransferNft /> },
      { path: "confirm-transfer-nft", element: <ConfirmTransferNft /> },
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
  {
    path: "hware",
    children: [
      {
        path: "onekey",
        children: [{ path: "connect", element: <OneKeyConnect /> }],
      },
    ],
  },
  { path: "*", element: <Navigate to={"/"} /> },
]);
