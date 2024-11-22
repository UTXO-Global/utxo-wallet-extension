import { payments, networks } from "bitcoinjs-lib";

// const bitcoin = {
//   messagePrefix: "\x18Bitcoin Signed Message:\n",
//   bech32: "bc",
//   bip32: {
//     public: 0x0488b21e,
//     private: 0x0488ade4,
//   },
//   pubKeyHash: 0x00,
//   scriptHash: 0x05,
//   wif: 0x80,
// };

const dogecoinNetwork = {
  messagePrefix: "\x19Dogecoin Signed Message:\n",
  // bech32: "bc", // rarely use segwit
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
  bip32: {
    public: 0x043587cf, // tpub for Testnet
    private: 0x04358394, // tprv for Testnet
  },
  pubKeyHash: 0x71, // 'n' for Dogecoin Testnet addresses
  scriptHash: 0xc4, // P2SH prefix for Testnet
  wif: 0xf1, // Private key format (WIF) for Testnet
};

// const publicKeyHash = "87ef42b31950001353dca4023452b3438a523de0"; // dogecoin: 	DHXrPGbShXCeSihFbs4BkoUE1exSz2E8ng
// const publicKeyHash = "9107f8190879f4b11f238a1a8c3501fe53fa4042"; // bitcoin: 1EDrXXBemAMey3LaKtGnKXhvs41H41mRUi
const publicKeyHash = "ce9ce654d90a769813d3aa9eb9ecbd2ed9390023"; // dogecoin testnet: no2dRNaFqxNjWZLeTRu4XyCuzeGdE3VY2S

const address = payments.p2pkh({
  hash: Buffer.from(publicKeyHash, "hex"),
  //   network: networks.bitcoin,
  //   network: dogecoinNetwork,
  network: dogecoinTestnet,
}).address;

console.log({ address });
