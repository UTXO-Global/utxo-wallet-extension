import { excludeKeysFromObj } from "@/shared/utils";
import { authenticatedRouter, guestRouter } from "@/ui/pages/router";
import { auth } from "@/ui/utils/firebase";
import {
  setupKeyringProxy,
  setupNotificationProxy,
  setupOpenAPIProxy,
  setupPm,
  setupStateProxy,
  setupWalletProxy,
} from "@/ui/utils/setup";
import { Router } from "@remix-run/router";
import { signInAnonymously } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import ReactLoading from "react-loading";
import { RouterProvider } from "react-router-dom";
import i18n from "../shared/locales/i18n";
import { useAppState } from "./states/appState";
import { useControllersState } from "./states/controllerState";
import { useWalletState } from "./states/walletState";
import { logErrorToFirestore } from "./utils/helpers";
import OneKeyModal from "./components/onekey";
import OneKeyProvider from "./components/onekey";

export default function App() {
  const [router, setRouter] = useState<Router>(authenticatedRouter);
  const { isReady, isUnlocked, updateAppState } = useAppState((v) => ({
    isReady: v.isReady,
    isUnlocked: v.isUnlocked,
    updateAppState: v.updateAppState,
  }));

  const { updateControllers } = useControllersState((v) => ({
    updateControllers: v.updateControllers,
  }));

  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));

  const { stateController } = useControllersState((v) => ({
    stateController: v.stateController,
  }));
  const setupApp = useCallback(async () => {
    const walletController = setupWalletProxy();
    const apiController = setupOpenAPIProxy();
    const stateController = setupStateProxy();
    const keyringController = setupKeyringProxy();
    const notificationController = setupNotificationProxy();

    updateControllers({
      walletController,
      apiController,
      stateController,
      keyringController,
      notificationController,
    });

    await stateController.init();
    const appState = await stateController.getAppState();
    const walletState = await stateController.getWalletState();
    await i18n.changeLanguage(appState.language ?? "en");
    if (
      appState.isReady &&
      appState.isUnlocked &&
      walletState.selectedWallet !== undefined &&
      walletState.selectedNetwork !== undefined
    ) {
      await updateWalletState(walletState, false);
      await updateAppState(appState, false);
    } else {
      await updateWalletState({
        vaultIsEmpty: await walletController.isVaultEmpty(),
        selectedNetwork: await walletController.getCurrentNetwork(),
        ...excludeKeysFromObj(walletState, ["vaultIsEmpty", "wallets"]),
      });
      await updateAppState({
        isReady: true,
        ...excludeKeysFromObj(appState, [
          "isReady",
          "isUnlocked",
          "password",
          "vault",
        ]),
      });
    }
  }, [updateWalletState, updateAppState, updateControllers]);

  const updateFromStore = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    if (isReady && isUnlocked) {
      const appState = await stateController.getAppState();
      const walletState = await stateController.getWalletState();
      await updateWalletState(walletState, false);
      await updateAppState(appState, false);
    }
  }, [isReady, isUnlocked, stateController, updateAppState, updateWalletState]);

  useEffect(() => {
    const pm = setupPm();
    //eslint-disable-next-line @typescript-eslint/no-floating-promises
    pm.listen((data: { method: string; params: any[]; type: string }) => {
      if (data.type === "broadcast") {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        if (data.method === "updateFromStore") updateFromStore();
      }
    });
    return () => {
      pm.removeAllListeners();
    };
  }, [updateFromStore]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    if (!isReady) setupApp();
    else if (isReady && isUnlocked) setRouter(authenticatedRouter);
    else setRouter(guestRouter);
  }, [
    isReady,
    isUnlocked,
    updateWalletState,
    updateAppState,
    router,
    setRouter,
    setupApp,
  ]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    signInAnonymously(auth);
  }, []);

  useEffect(() => {
    const handleError = (event) =>
      logErrorToFirestore(event.message, event.filename, event.lineno);

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <div>
      <div className="uppercase text-center hidden standard:block font-medium text-xl mb-6 select-none">
        UTXO Global
      </div>
      <div className="app !pb-0">
        {isReady ? (
          <OneKeyProvider>
            <RouterProvider router={router} />
          </OneKeyProvider>
        ) : (
          <div className="flex justify-center items-center w-full">
            <ReactLoading type="spin" color="#ODODOD" />
          </div>
        )}

        <Toaster
          position="top-center"
          toastOptions={{
            className: "toast",
            success: {
              duration: 900,
              className: "toast success",
            },
            error: {
              duration: 4000,
              className: "toast error",
            },
          }}
        />
      </div>
    </div>
  );
}
