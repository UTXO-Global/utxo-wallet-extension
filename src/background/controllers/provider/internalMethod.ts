import { storageService } from "@/background/services";

export const tabCheckin = ({
  data: {
    params: { origin, name, icon },
  },
  session,
}) => {
  session.origin = origin;
  session.icon = icon;
  session.name = name;
};

export const getProviderState = async () => {
  const isUnlocked = storageService.appState.isUnlocked;
  const accounts: string[] = [];
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
