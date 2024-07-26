import { storageService } from "@/background/services";
import { INewWalletProps } from "@/shared/interfaces";
import { ApiOrdUTXO } from "@/shared/interfaces/inscriptions";
import {
  getNetworkDataBySlug,
  isBitcoinNetwork,
  isCkbNetwork,
} from "@/shared/networks";
import { NetworkConfig } from "@/shared/networks/ckb/offckb.config";
import { NetworkSlug } from "@/shared/networks/types";
import { getScriptForAddress } from "@/shared/utils/transactions";
import { blockchain } from "@ckb-lumos/base";
import { ScriptValue } from "@ckb-lumos/base/lib/values";
import { bytes } from "@ckb-lumos/codec";
import { BI, Cell, commons, helpers, WitnessArgs } from "@ckb-lumos/lumos";
import { Psbt } from "bitcoinjs-lib";
import { HDPrivateKey, HDSeedKey, Keyring } from "./ckbhdw";
import { KeyringServiceError } from "./consts";
import { createSendBtc } from "./ord-utils";
import type {
  AddressUserToSignInput,
  HdPathUserToSignInput,
  Json,
  PublicKeyUserToSignInput,
  SendBtcCoin,
  SendCkbCoin,
  SendCoin,
  SendOrd,
  UserToSignInput,
} from "./types";
import { ApiUTXO } from "@/shared/interfaces/api";
import { TransactionSkeletonType } from "@ckb-lumos/lumos/helpers";

export const KEYRING_SDK_TYPES = {
  HDPrivateKey,
  HDSeedKey,
};

class KeyringService {
  // each keyring -> wallet
  keyrings: Keyring<Json>[];

  constructor() {
    this.keyrings = [];
  }

  async init(password: string) {
    const wallets = await storageService.importWallets(password);
    for (const i of wallets) {
      let wallet: HDSeedKey | HDPrivateKey;
      if (i.data.seed) {
        wallet = HDSeedKey.deserialize({
          ...i.data,
        });
      } else {
        wallet = HDPrivateKey.deserialize(i.data) as any as HDPrivateKey;
      }
      this.keyrings[i.id] = wallet;
    }

    return wallets;
  }

  async newKeyring({
    walletType,
    payload,
    restoreFrom,
    passphrase = undefined,
    walletName = undefined,
  }: INewWalletProps) {
    let keyring: HDSeedKey | HDPrivateKey;
    if (walletType === "root") {
      keyring = await HDSeedKey.fromMnemonic({
        mnemonic: payload,
        passphrase,
        walletName,
      });
    } else {
      keyring = HDPrivateKey.deserialize({
        privateKey: payload,
        isHex: restoreFrom === "hex",
      });
    }
    // Check duplicated with existing keyring by simply check fixed hd path public key is equal
    const toCheckHdPath = "m/44'/0'/0'/0";
    const toCheckPubkey = keyring.exportPublicKey(toCheckHdPath);
    for (const key of this.keyrings) {
      if (key.exportPublicKey(toCheckHdPath) === toCheckPubkey) {
        throw new Error("Already existed");
      }
    }

    this.keyrings.push(keyring);
    return keyring;
  }

  exportAccount(hdPath: string, networkSlug: NetworkSlug) {
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    if (!keyring.exportAccount) {
      throw new Error(KeyringServiceError.UnsupportedExportAccount);
    }

    return keyring.exportAccount(hdPath, networkSlug);
  }

  getKeyringByIndex(index: number) {
    if (index + 1 > this.keyrings.length) {
      throw new Error("Invalid keyring index");
    }
    return this.keyrings[index];
  }

  serializeById(index: number): any {
    return this.keyrings[index].serialize();
  }

  signPsbt(psbt: Psbt, inputs?: UserToSignInput[]) {
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    keyring.signPsbt(
      psbt,
      psbt.data.inputs.map((v, index) => ({
        index,
        hdPath: this.getHdPathFromUserInput(inputs[index]),
        sighashTypes: v.sighashType ? [v.sighashType] : undefined,
      }))
    );
  }

  signCkbTransaction(params: { tx: any, hdPath: string}) {
    const tx = params.tx;
    let txSkeleton = helpers.TransactionSkeleton({});
    if (tx.cellDeps) {
      txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>cellDeps.push(tx.cellDeps))
    }

    if (tx.fixedEntries) {
      txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) =>
        fixedEntries.push(tx.fixedEntries)
      )
    }

    if (tx.headerDeps) {
      txSkeleton = txSkeleton.update("headerDeps", (headerDeps) =>
        headerDeps.push(tx.headerDeps)
      )
    }

    if (tx.inputSinces) {
      txSkeleton = txSkeleton.update("inputSinces", (inputSinces) =>
        inputSinces = {...inputSinces, ...tx.inputSinces}
      )
    }

    if (tx.inputs) {
      txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push(tx.inputs)
      )
    }

    if (tx.outputs) {
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push(tx.outputs)
      )
    }

    if (tx.signingEntries) {
      txSkeleton = txSkeleton.update("signingEntries", (signingEntries) =>
        signingEntries.push(tx.signingEntries)
      )
    }

    if (tx.witnesses) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push(tx.witnesses)
      )
    }
    
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)!.message;

    const Sig = keyring.signRecoverable(params.hdPath, message);
    const txSigned = helpers.sealTransaction(txSkeleton, [Sig]);
    return JSON.stringify(txSigned);
  }

  signAllPsbtInputs(psbt: Psbt) {
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    return keyring.signAllInputsInPsbt(
      psbt,
      storageService.currentAccount.accounts[0].hdPath
    ).signatures;
  }

  signMessage(msgParams: { hdPath: string; data: string }) {
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    return keyring.signMessage(
      msgParams.hdPath,
      msgParams.data,
      storageService.currentNetwork
    );
  }

  signPersonalMessage(msgParams: { hdPath: string; data: string }) {
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    if (!keyring.signPersonalMessage) {
      throw new Error(KeyringServiceError.UnsupportedSignPersonalMessage);
    }

    return keyring.signPersonalMessage(
      msgParams.hdPath,
      msgParams.data,
      storageService.currentNetwork
    );
  }

  exportPublicKey(hdPath: string) {
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    return keyring.exportPublicKey(hdPath);
  }

  async sendCoin(data: SendCoin): Promise<string> {
    const account = storageService.currentAccount;
    if (!account || !account.accounts[0].address)
      throw new Error("Error when trying to get the current account");

    const networkSlug = storageService.currentNetwork;
    const network = getNetworkDataBySlug(networkSlug);

    if (isBitcoinNetwork(network.network)) {
      const utxos = (data as SendBtcCoin).utxos.map((v) => {
        const _account = account.accounts.find(
          (acc) => acc.address === v.address
        );
        return {
          txId: v.txid,
          outputIndex: v.vout,
          satoshis: v.value,
          scriptPk: getScriptForAddress(
            Buffer.from(this.exportPublicKey(_account.hdPath), "hex"),
            _account.addressType.value,
            networkSlug
          ).toString("hex"),
          addressType: _account.addressType.value,
          address: v.address,
          ords: [],
        };
      });

      const psbt = await createSendBtc({
        utxos,
        toAddress: data.to,
        toAmount: data.amount,
        signTransaction: this.signPsbt.bind(this),
        network: network.network,
        // default change address is first account in group account (usually legacy)
        changeAddress: account.accounts[0].address,
        receiverToPayFee: data.receiverToPayFee,
        pubkey: this.exportPublicKey(account.accounts[0].hdPath),
        feeRate: data.feeRate,
        enableRBF: false,
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore We are really dont know what is it but we still copy working code
      psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
      return psbt.toHex();
    } else if (isCkbNetwork(network.network)) {
      const ckbAccount = account.accounts[0];
      // additional 0.001 ckb for tx fee
      // the tx fee could calculated by tx size
      // TODO: this is just a simple example
      const neededCapacity = BI.from(data.amount).add(100000);

      let txSkeleton = helpers.TransactionSkeleton({});
      const fromScript = helpers.parseAddress(ckbAccount.address, {
        config: network.network.lumosConfig,
      });
      const toScript = helpers.parseAddress(data.to, {
        config: network.network.lumosConfig,
      });

      // TODO: add smart selector
      const collected: Cell[] = [];
      let collectedSum = BI.from(0);
      for (const cell of (data as SendCkbCoin).cells) {
        collectedSum = collectedSum.add(cell.cellOutput.capacity);
        collected.push(cell);
        if (collectedSum.gte(neededCapacity)) break;
      }

      const changeOutput: Cell = {
        cellOutput: {
          capacity: collectedSum.sub(neededCapacity).toHexString(),
          lock: fromScript,
        },
        data: "0x",
      };

      const transferOutput: Cell = {
        cellOutput: {
          capacity: BI.from(data.amount).toHexString(),
          lock: toScript,
        },
        data: "0x",
      };

      txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push(...collected)
      );
      if (collectedSum.sub(neededCapacity).eq(BI.from(0))) {
        txSkeleton = txSkeleton.update("outputs", (outputs) =>
          outputs.push(transferOutput)
        );
      } else {
        txSkeleton = txSkeleton.update("outputs", (outputs) =>
          outputs.push(transferOutput, changeOutput)
        );
      }
    
      txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
        cellDeps.push({
          outPoint: {
            txHash: (
              (network.network as NetworkConfig).lumosConfig.SCRIPTS as any
            ).SECP256K1_BLAKE160.TX_HASH,
            index: (
              (network.network as NetworkConfig).lumosConfig.SCRIPTS as any
            ).SECP256K1_BLAKE160.INDEX,
          },
          depType: (
            (network.network as NetworkConfig).lumosConfig.SCRIPTS as any
          ).SECP256K1_BLAKE160.DEP_TYPE,
        })
      );

      const firstIndex = txSkeleton
        .get("inputs")
        .findIndex((input) =>
          new ScriptValue(input.cellOutput.lock, { validate: false }).equals(
            new ScriptValue(fromScript, { validate: false })
          )
        );
      if (firstIndex !== -1) {
        while (firstIndex >= txSkeleton.get("witnesses").size) {
          txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
            witnesses.push("0x")
          );
        }
        let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
        const newWitnessArgs: WitnessArgs = {
          /* 65-byte zeros in hex */
          lock: "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        };
        if (witness !== "0x") {
          const witnessArgs = blockchain.WitnessArgs.unpack(
            bytes.bytify(witness)
          );
          const lock = witnessArgs.lock;
          if (
            !!lock &&
            !!newWitnessArgs.lock &&
            !bytes.equal(lock, newWitnessArgs.lock)
          ) {
            throw new Error(
              "Lock field in first witness is set aside for signature!"
            );
          }
          const inputType = witnessArgs.inputType;
          if (inputType) {
            newWitnessArgs.inputType = inputType;
          }
          const outputType = witnessArgs.outputType;
          if (outputType) {
            newWitnessArgs.outputType = outputType;
          }
        }
        witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
        txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
          witnesses.set(firstIndex, witness)
        );
      }

      txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
      const message = txSkeleton.get("signingEntries").get(0)!.message;
      const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
      const Sig = keyring.signRecoverable(ckbAccount.hdPath, message);
      const tx = helpers.sealTransaction(txSkeleton, [Sig]);

      return JSON.stringify(tx);
    } else {
      throw Error("Invalid network");
    }
  }

  async sendOrd(data: Omit<SendOrd, "amount">): Promise<string> {
    throw new Error("Not supported");
    // const account = storageService.currentAccount;
    // if (!account || !account.address)
    //   throw new Error("Error when trying to get the current account");

    // const publicKey = this.exportPublicKey("account.address");

    // const networkSlug = storageService.currentNetwork;
    // const network = getNetworkDataBySlug(networkSlug);

    // if (isBitcoinNetwork(network.network)) {
    //   const psbt = await createSendOrd({
    //     utxos: data.utxos.map((v) => {
    //       return {
    //         txId: v.txid,
    //         outputIndex: v.vout,
    //         satoshis: v.value,
    //         scriptPk: getScriptForAddress(
    //           Buffer.from(publicKey, "hex"),
    //           account.addressType.value,
    //           networkSlug
    //         ).toString("hex"),
    //         addressType: account.addressType.value,
    //         address: account.address,
    //         ords: (v as ApiOrdUTXO & { isOrd: boolean }).isOrd
    //           ? [
    //               {
    //                 id: `${(v as ApiOrdUTXO).inscription_id}`,
    //                 offset: (v as ApiOrdUTXO).offset,
    //               },
    //             ]
    //           : [],
    //       };
    //     }),
    //     toAddress: data.to,
    //     outputValue: data.utxos.find(
    //       (i) => (i as ApiOrdUTXO & { isOrd: boolean }).isOrd
    //     )?.value,
    //     signTransaction: this.signPsbt.bind(this),
    //     network: network.network,
    //     changeAddress: account.address,
    //     pubkey: this.exportPublicKey(account.address),
    //     feeRate: data.feeRate,
    //     enableRBF: false,
    //   });

    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore We are really dont know what is it but we still copy working code
    //   psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
    //   return psbt.toHex();
    // } else {
    //   throw new Error("Invalid network");
    // }
  }

  async sendMultiOrd(
    toAddress: string,
    feeRate: number,
    ordUtxos: ApiOrdUTXO[],
    utxos: ApiUTXO[]
  ): Promise<string> {
    throw new Error("Not supported");
    // return await createMultisendOrd({
    //   changeAddress: storageService.currentAccount.address,
    //   feeRate,
    //   signPsbtHex: async (psbtHex: string) => {
    //     const psbt = Psbt.fromHex(psbtHex);
    //     this.signAllPsbtInputs(psbt);
    //     return psbt.toHex();
    //   },
    //   toAddress,
    //   utxos: [
    //     ...utxos.map((f) => ({
    //       txId: f.txid,
    //       satoshis: f.value,
    //       rawHex: f.hex,
    //       outputIndex: f.vout,
    //       ords: [],
    //     })),
    //     ...ordUtxos.map((f) => ({
    //       txId: f.txid,
    //       satoshis: f.value,
    //       rawHex: f.rawHex,
    //       outputIndex: f.vout,
    //       ords: [
    //         {
    //           id: f.inscription_id,
    //           offset: f.offset,
    //         },
    //       ],
    //     })),
    //   ],
    // });
  }

  async deleteWallet(id: number) {
    let wallets = storageService.walletState.wallets.filter((i) => i.id !== id);
    await storageService.saveWallets({
      password: storageService.appState.password,
      wallets,
    });
    this.keyrings.splice(id, 1);
    wallets = wallets.map((f, i) => ({ ...f, id: i }));
    return wallets;
  }

  async signPsbtWithoutFinalizing(psbt: Psbt, inputs?: UserToSignInput[]) {
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    if (inputs === undefined)
      inputs = psbt.txInputs.map((f, i) => ({
        hdpath: this.exportPublicKey(
          // use first account in group account (usually legacy address type)
          storageService.currentAccount.accounts[0].hdPath
        ),
        index: i,
        sighashTypes: undefined,
      }));
    try {
      keyring.signInputsWithoutFinalizing(
        psbt,
        inputs.map((f) => ({
          index: f.index,
          hdPath: this.exportPublicKey(this.getHdPathFromUserInput(f)),
          sighashTypes: f.sighashTypes,
        }))
      );
    } catch (e) {
      console.error(e);
    }
  }

  getHdPathFromUserInput(input: UserToSignInput) {
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    if (keyring.isSimpleKey()) {
      return "";
    } else {
      if ((input as HdPathUserToSignInput).hdpath) {
        return (input as HdPathUserToSignInput).hdpath;
      } else if ((input as AddressUserToSignInput).address) {
        for (const account of storageService.currentAccount.accounts) {
          if (account.address === (input as AddressUserToSignInput).address) {
            return account.hdPath;
          }
        }
        throw new Error("Account not found");
      } else if ((input as PublicKeyUserToSignInput).publicKey) {
        for (const account of storageService.currentAccount.accounts) {
          const pubKey = keyring.exportPublicKey(account.hdPath);
          if (pubKey === (input as PublicKeyUserToSignInput).publicKey) {
            return account.hdPath;
          }
        }
      }
    }
  }
}

export default new KeyringService();
