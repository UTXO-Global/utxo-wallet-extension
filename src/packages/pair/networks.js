"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testnet = exports.bitcoin = void 0;
exports.bitcoin = {
  messagePrefix: "Bells Signed Message:\n",
  bech32: "",
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 25,
  scriptHash: 30,
  wif: 0x99,
};
exports.testnet = {
  messagePrefix: "\x18Bitcoin Signed Message:\n",
  bech32: "tb",
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
};
