import { AddressType, NetworkData } from "../types";
import offCKBConfig from "./offckb.config";

export const CKB_MAINNET: NetworkData = {
  slug: "nervos",
  name: "Mirana Mainnet",
  esploraUrl: "https://mainnet-api.explorer.nervos.org/api/v1",
  explorerUrl: "https://explorer.nervos.org/en",
  addressTypes: [
    {
      value: AddressType.CKB_ADDRESS,
      label: "Nervos",
      name: "Nervos",
      hdPath: `m/13'/0'/0'/0`,
    },
  ],
  coinName: "CKB",
  coinSymbol: "CKB",
  network: offCKBConfig.network.mainnet,
  decimal: 8,
};

export const CKB_TESTNET: NetworkData = {
  slug: "nervos_testnet",
  name: "Pudge Testnet",
  esploraUrl: "https://testnet-api.explorer.nervos.org/api/v1",
  explorerUrl: "https://pudge.explorer.nervos.org/en",
  addressTypes: [
    {
      value: AddressType.CKB_ADDRESS,
      label: "Nervos",
      name: "Nervos",
      hdPath: `m/13'/1'/0'/0`,
    },
  ],
  coinName: "CKB",
  coinSymbol: "CKB",
  network: offCKBConfig.network.testnet,
  decimal: 8,
};
