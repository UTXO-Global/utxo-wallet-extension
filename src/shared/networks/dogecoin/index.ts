import { networks } from "bitcoinjs-lib";
import { AddressType, ChainAddressType, NetworkData } from "../types";

networks.bitcoin;
const dogecoinNetwork = {
  messagePrefix: "\x19Dogecoin Signed Message:\n",
  bech32: "",
  bip32: {
    public: 0x02facafd, // xpub
    private: 0x02fac398, // xprv
  },
  pubKeyHash: 0x1e, // 'D' for Dogecoin mainnet
  scriptHash: 0x16, // P2SH prefix
  wif: 0x9e, // Private key format (WIF)
};

const dogecoinTestnet = {
  messagePrefix: "\x19Dogecoin Signed Message:\n",
  bech32: "",
  bip32: {
    public: 0x043587cf, // tpub for Testnet
    private: 0x04358394, // tprv for Testnet
  },
  pubKeyHash: 0x71, // 'n' for Dogecoin Testnet addresses
  scriptHash: 0xc4, // P2SH prefix for Testnet
  wif: 0xf1, // Private key format (WIF) for Testnet
};

export const DOGECOIN_ADDRESS_TYPES: ChainAddressType[] = [
  {
    value: AddressType.P2PKH,
    label: "P2PKH",
    name: "Legacy (P2PKH)",
    hdPath: `m/44'/3'/0'/0/0`,
  },
];

export const DOGECOIN_LIVENET: NetworkData = {
  slug: "dogecoin",
  name: "Dogecoin Mainnet",
  esploraUrl: "", // TODO
  explorerUrl: "https://blockexplorer.one/dogecoin/mainnet",
  addressTypes: DOGECOIN_ADDRESS_TYPES,
  coinName: "Dogecoin",
  coinSymbol: "DOGE",
  network: dogecoinNetwork,
  decimal: 8,
};

export const DOGECOIN_TESTNET: NetworkData = {
  slug: "dogecoin_testnet",
  name: "Dogecoin Testnet",
  esploraUrl: "https://doge-electrs-testnet-demo.qed.me",
  explorerUrl: "https://blockexplorer.one/dogecoin/testnet",
  addressTypes: DOGECOIN_ADDRESS_TYPES,
  coinName: "Dogecoin Testnet",
  coinSymbol: "tDOGE",
  network: dogecoinTestnet,
  decimal: 8,
};
