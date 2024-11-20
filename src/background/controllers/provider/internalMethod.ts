import { storageService } from "@/background/services";
import { permissionService } from "@/background/services";

export const getProviderState = async () => {
  
  const isUnlocked = storageService.appState.isUnlocked;
  const isConnected = await permissionService.siteIsConnected()
  const accounts: string[] = [];
  if (isConnected)
    if (isUnlocked) {
      const currentAccount = storageService.currentAccount;
      if (currentAccount) {
        for (const account of currentAccount.accounts) {
          accounts.push(account.address);
        }
      }
    }
  return {
    network: storageService.currentNetwork,
    isUnlocked,
    accounts,
  };
};

export const keepAlive = () => {
  return "ACK_KEEP_ALIVE_MESSAGE";
};
