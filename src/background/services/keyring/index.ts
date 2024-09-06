import { storageService } from "@/background/services";
import { INewWalletProps } from "@/shared/interfaces";
import { ApiOrdUTXO } from "@/shared/interfaces/inscriptions";
import {
  getNetworkDataBySlug,
  isBitcoinNetwork,
  isCkbNetwork,
  AGGRON4,
  LINA,
  nervosTestnetSlug,
  DOBS_TESTNET_CONFIG,
  DOBS_MAINNET_CONFIG,
} from "@/shared/networks";
import { NetworkConfig } from "@/shared/networks/ckb/offckb.config";
import { NetworkSlug } from "@/shared/networks/types";
import { getScriptForAddress } from "@/shared/utils/transactions";
import { Script, blockchain } from "@ckb-lumos/base";
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
  SendCkbToken,
  SendCoin,
  SendOrd,
  TransferNFT,
  UserToSignInput,
} from "./types";
import { ApiUTXO } from "@/shared/interfaces/api";
import { ccc } from "@ckb-ccc/core";
import { TransactionSkeletonType, addCellDep } from "@ckb-lumos/lumos/helpers";
import {
  calculateFeeByTransactionSkeleton,
  generateTransferSporeAction,
  getSporeScript,
  injectCommonCobuildProof,
  injectLiveSporeCell,
  payFeeByOutput,
} from "@spore-sdk/core";

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

  async signCkbTransaction(params: {
    tx: helpers.TransactionSkeletonType;
    hdPath: string;
  }) {
    const networkSlug = storageService.currentNetwork;
    const network = getNetworkDataBySlug(networkSlug);
    const isTestnet = nervosTestnetSlug.includes(network.slug);
    const txSkeleton = commons.common.prepareSigningEntries(params.tx, {
      config: isTestnet ? AGGRON4 : LINA,
    });

    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    const message = txSkeleton.get("signingEntries").get(0)!.message;
    const Sig = keyring.signRecoverable(params.hdPath, message);
    const txSigned = helpers.sealTransaction(txSkeleton, [Sig]);
    return txSigned;
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
        if (!cell.cellOutput.type) {
          collectedSum = collectedSum.add(cell.cellOutput.capacity);
          collected.push(cell);
        }
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

  async sendToken(data: SendCkbToken): Promise<{ tx: string; fee: string }> {
    const account = storageService.currentAccount;
    if (!account || !account.accounts[0].address)
      throw new Error("Error when trying to get the current account");

    const ckbAccount = account.accounts[0];
    const networkSlug = storageService.currentNetwork;
    const network = getNetworkDataBySlug(networkSlug);
    if (!isCkbNetwork(network.network)) {
      throw new Error("Network invalid");
    }

    const isTestnet = nervosTestnetSlug.includes(network.slug);
    const lumosConfig = isTestnet ? AGGRON4 : LINA;

    const indexer = network.network.indexer;
    const cellProvider: TransactionSkeletonType["cellProvider"] = {
      collector: (query) =>
        indexer.collector({ type: "empty", data: "0x", ...query }),
    };

    const fromScript = helpers.parseAddress(ckbAccount.address, {
      config: lumosConfig,
    });

    const toScript = helpers.parseAddress(data.to, {
      config: lumosConfig,
    });

    const xUdtType = {
      codeHash: lumosConfig.SCRIPTS.XUDT.CODE_HASH,
      hashType: "type",
      args: data.token.attributes.type_script.args,
    } as Script;

    const xudtCollector = indexer.collector({
      type: xUdtType,
      lock: fromScript,
    });

    const cellCollector = indexer.collector({
      lock: fromScript,
      data: "0x",
    });

    let xUDTCapacity = helpers.minimalScriptCapacityCompatible(xUdtType);

    const isAddressTypeJoy = ccc.bytesFrom(toScript.args).length > 20;
    const joyCapacityAddMore = "200000000"; // 2 ckb

    if (isAddressTypeJoy) {
      xUDTCapacity = xUDTCapacity.add(joyCapacityAddMore);
    }

    let collectedCells: Cell[] = [];
    let neededCapacity = xUDTCapacity;
    let totalCapacity = BI.from(0);

    let tokensCell: Cell[] = [];
    const totalTokenBalanceNeeed = BI.from(data.amount);
    let totalTokenBalance = BI.from(0);

    for await (const cell of xudtCollector.collect()) {
      const balNum = ccc.numFromBytes(cell.data);
      totalTokenBalance = totalTokenBalance.add(BI.from(balNum));
      tokensCell.push(cell);

      if (totalTokenBalance.gte(totalTokenBalanceNeeed)) {
        break;
      }
    }

    if (tokensCell.length === 0) {
      throw new Error(
        "Owner do not have an xUDT cell yet, please call mint first"
      );
    }

    if (totalTokenBalance.lt(totalTokenBalanceNeeed)) {
      throw new Error(`${data.token.attributes.symbol} insufficient balance`);
    }

    let txSkeleton = helpers.TransactionSkeleton({ cellProvider });

    txSkeleton = addCellDep(txSkeleton, {
      outPoint: {
        txHash: lumosConfig.SCRIPTS.XUDT.TX_HASH,
        index: lumosConfig.SCRIPTS.XUDT.INDEX,
      },
      depType: lumosConfig.SCRIPTS.XUDT.DEP_TYPE,
    });

    for (const cell of tokensCell) {
      txSkeleton = await commons.common.setupInputCell(txSkeleton, cell, null, {
        config: lumosConfig,
      });
    }

    txSkeleton = txSkeleton.update("outputs", (outputs) =>
      outputs.update(0, (cell) => {
        let recap = BI.from(cell!.cellOutput.capacity);
        if (isAddressTypeJoy) {
          recap = recap.add(joyCapacityAddMore);
        }
        return {
          ...cell!,
          cellOutput: {
            ...cell!.cellOutput,
            capacity: recap.toHexString(),
            lock: toScript,
            type: xUdtType,
          },
          data: ccc.hexFrom(
            ccc.numLeToBytes(totalTokenBalanceNeeed.toBigInt(), 16)
          ),
        };
      })
    );

    const diff = totalTokenBalance.sub(totalTokenBalanceNeeed);
    if (diff.gt(BI.from(0))) {
      neededCapacity = neededCapacity.add(xUDTCapacity);
      if (isAddressTypeJoy) {
        neededCapacity = neededCapacity.add(joyCapacityAddMore);
      }
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push({
          cellOutput: {
            capacity: xUDTCapacity.toHexString(),
            lock: fromScript,
            type: xUdtType,
          },
          data: ccc.hexFrom(ccc.numLeToBytes(diff.toBigInt(), 16)),
        })
      );
    }

    for await (const cell of cellCollector.collect()) {
      if (cell.data !== "0x") {
        continue;
      }

      if (
        txSkeleton.inputs.some(
          (input) =>
            input.outPoint.txHash === cell.outPoint.txHash &&
            input.outPoint.index === cell.outPoint.index
        )
      ) {
        continue;
      }
      collectedCells.push(cell);
      totalCapacity = totalCapacity.add(BI.from(cell.cellOutput.capacity));
      if (isAddressTypeJoy) {
        totalCapacity = totalCapacity.add(joyCapacityAddMore);
      }
      if (totalCapacity.gte(neededCapacity)) {
        break;
      }
    }

    if (totalCapacity.lt(neededCapacity)) {
      throw new Error(`CKB: insufficient balance`);
    }

    txSkeleton = txSkeleton.update("inputs", (inputs) =>
      inputs.push(...collectedCells)
    );

    if (totalCapacity.gte(neededCapacity)) {
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push({
          cellOutput: {
            capacity: totalCapacity.sub(neededCapacity).toHexString(),
            lock: fromScript,
          },
          data: "0x",
        })
      );
    }

    const cccTransaction = ccc.Transaction.fromLumosSkeleton(txSkeleton);
    const fee = cccTransaction.estimateFee(data.feeRate);

    txSkeleton = await commons.common.payFee(
      txSkeleton,
      [ckbAccount.address],
      fee,
      undefined,
      {
        config: lumosConfig,
      }
    );

    txSkeleton = commons.common.prepareSigningEntries(txSkeleton, {
      config: lumosConfig,
    });

    const message = txSkeleton.get("signingEntries").get(0)!.message;
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    const Sig = keyring.signRecoverable(ckbAccount.hdPath, message);
    const tx = helpers.sealTransaction(txSkeleton, [Sig]);

    return { tx: JSON.stringify(tx), fee: fee.toString() };
  }

  transferNFT = async (
    data: TransferNFT
  ): Promise<{ tx: string; fee: string }> => {
    const account = storageService.currentAccount;
    if (!account || !account.accounts[0].address) {
      throw new Error("Error when trying to get the current account");
    }

    const ckbAccount = account.accounts[0];

    const networkSlug = storageService.currentNetwork;
    const network = getNetworkDataBySlug(networkSlug);
    if (!isCkbNetwork(network.network)) {
      return { tx: "", fee: "0" };
    }

    const isTestnet = nervosTestnetSlug.includes(network.slug);
    const lumosConfig = isTestnet ? AGGRON4 : LINA;
    const sporeConfig = isTestnet ? DOBS_TESTNET_CONFIG : DOBS_MAINNET_CONFIG;

    const fromScript = helpers.parseAddress(ckbAccount.address, {
      config: lumosConfig,
    });

    const toScript = helpers.parseAddress(data.toAddress, {
      config: lumosConfig,
    });

    const indexer = network.network.indexer;

    // TransactionSkeleton
    let txSkeleton = helpers.TransactionSkeleton({
      cellProvider: indexer,
    });

    const nftType = {
      codeHash: data.nft.type_script.code_hash,
      hashType: data.nft.type_script.hash_type,
      args: data.nft.type_script.args,
    } as Script;

    const nftCollector = indexer.collector({
      type: nftType,
      lock: fromScript,
    });

    let nftCell: Cell | undefined;
    for await (const cell of nftCollector.collect()) {
      nftCell = cell;
      break;
    }

    if (!nftCell) {
      throw new Error(
        "Owner do not have an NFT cell yet, please call mint first"
      );
    }

    const sporeScript = getSporeScript(
      sporeConfig,
      "Spore",
      nftCell.cellOutput.type!
    );

    const injectLiveSporeCellResult = await injectLiveSporeCell({
      txSkeleton,
      cell: nftCell,
      addOutput: true,
      updateOutput(cell) {
        cell.cellOutput.lock = toScript;
        return cell;
      },
      config: sporeConfig,
    });

    txSkeleton = injectLiveSporeCellResult.txSkeleton;

    // Generate TransferSpore actions
    const actionResult = generateTransferSporeAction({
      txSkeleton,
      inputIndex: injectLiveSporeCellResult.inputIndex,
      outputIndex: injectLiveSporeCellResult.outputIndex,
    });

    // Inject CobuildProof
    if (sporeScript.behaviors?.cobuild) {
      const injectCobuildProofResult = injectCommonCobuildProof({
        txSkeleton: txSkeleton,
        actions: actionResult.actions,
      });
      txSkeleton = injectCobuildProofResult.txSkeleton;
    }

    // Pay fee by the spore cell's capacity margin
    txSkeleton = await payFeeByOutput({
      outputIndex: injectLiveSporeCellResult.outputIndex,
      feeRate: data.feeRate,
      txSkeleton,
      config: sporeConfig,
    });

    const fee = calculateFeeByTransactionSkeleton(txSkeleton, data.feeRate);

    txSkeleton = commons.common.prepareSigningEntries(txSkeleton, {
      config: lumosConfig,
    });

    const message = txSkeleton.get("signingEntries").get(0)!.message;
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    const Sig = keyring.signRecoverable(ckbAccount.hdPath, message);
    const tx = helpers.sealTransaction(txSkeleton, [Sig]);

    return {
      tx: JSON.stringify(tx),
      fee: fee.toString(),
    };
  };

  async sendOrd(data: Omit<SendOrd, "amount">): Promise<string> {
    throw new Error("Not supported");
  }

  async sendMultiOrd(
    toAddress: string,
    feeRate: number,
    ordUtxos: ApiOrdUTXO[],
    utxos: ApiUTXO[]
  ): Promise<string> {
    throw new Error("Not supported");
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
