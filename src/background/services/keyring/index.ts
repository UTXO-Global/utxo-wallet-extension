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
  isDogecoinNetwork,
  SCRIPTS_SPORE_TESTNET,
  SCRIPTS_SPORE_MAINNET,
} from "@/shared/networks";
import { NetworkConfig } from "@/shared/networks/ckb/offckb.config";
import { NetworkSlug } from "@/shared/networks/types";
import { getScriptForAddress } from "@/shared/utils/transactions";
import { Script } from "@ckb-lumos/base";
import { BI, Cell, commons, helpers } from "@ckb-lumos/lumos";
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
import { addCellDep } from "@ckb-lumos/lumos/helpers";
import {
  callCKBRPC,
  convertCKBTransactionToSkeleton,
  MIN_CAPACITY,
  prepareWitnesses,
} from "@/shared/networks/ckb/helpers";
import * as ecc from "@bitcoinerlab/secp256k1";
import * as bitcoinjs from "bitcoinjs-lib";
import { spore as cccSpore } from "@ckb-ccc/spore";
import { sporeA as cccSporeA } from "@ckb-ccc/spore/advanced";

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

  hasMultiOwner(tx: any): boolean {
    const transaction = ccc.Transaction.from(tx);
    const owners = new Set<string>();

    for (const input of transaction.inputs) {
      const lock = input.cellOutput.lock;
      const owner = lock.args;

      owners.add(owner);
    }

    return owners.size > 1;
  }

  async convertAnyToSkeleton(tx: any, networkConfig: NetworkConfig) {
    let txSkeleton = helpers.TransactionSkeleton();
    if (tx.cellDeps && tx.cellDeps.length > 0) {
      tx.cellDeps?.forEach((cellDep: any) => {
        txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
          cellDeps.push({
            ...cellDep,
            outPoint: {
              txHash: cellDep.outPoint.txHash,
              index: ccc.numToHex(cellDep.outPoint.index),
            },
          })
        );
      });
    }

    if (!tx.inputs) {
      throw new Error("Error when trying to get inputs");
    }

    for (let i = 0; i < tx.inputs.length; i++) {
      const input = tx.inputs[i];
      if (!input.previousOutput) {
        throw new Error("Error when trying to get the previous output");
      }

      const txInput = await callCKBRPC(
        networkConfig.rpc_url,
        "get_transaction",
        [input.previousOutput.txHash]
      );

      const cellOutput =
        txInput?.transaction?.outputs[Number(input.previousOutput.index)];

      if (!cellOutput) {
        throw new Error(
          `Error when trying to get the cell output ${input.previousOutput.txHash}`
        );
      }

      if (!!input.since) {
        txSkeleton = txSkeleton.update("inputSinces", (inputSinces) =>
          inputSinces.set(i, ccc.numToHex(input.since))
        );
      }

      txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push({
          outPoint: {
            txHash: input.previousOutput.txHash,
            index: ccc.numToHex(input.previousOutput.index),
          },
          data: input.outputData ? input.outputData : "0x",
          cellOutput: {
            capacity: ccc.numToHex(cellOutput.capacity),
            lock: {
              codeHash: cellOutput.lock?.code_hash,
              hashType: cellOutput.lock?.hash_type,
              args: cellOutput.lock?.args,
            },
            type: cellOutput.type,
          },
        })
      );
    }

    const outputsData = tx.outputsData || [];
    tx.outputs?.forEach((output: any, index: number) => {
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push({
          cellOutput: {
            capacity: ccc.numToHex(output.capacity),
            lock: output.lock,
            type: output.type || null,
          },
          data: outputsData[index] || "0x",
        })
      );
    });

    tx.headerDeps?.forEach((headerDep: any) => {
      txSkeleton = txSkeleton.update("headerDeps", (headerDeps) =>
        headerDeps.push(headerDep)
      );
    });

    tx.witnesses?.forEach((witness: any) => {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push(witness)
      );
    });

    return txSkeleton;
  }

  async ckbSignSwapTransaction(params: {
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

  async signCkbTransactionWithLumos(params: { tx: any; hdPath: string }) {
    const networkSlug = storageService.currentNetwork;
    const network = getNetworkDataBySlug(networkSlug);
    const isTestnet = nervosTestnetSlug.includes(network.slug);
    const account = storageService.currentAccount;
    if (!account || !account.accounts[0].address)
      throw new Error("Error when trying to get the current account");

    const tx = await this.convertAnyToSkeleton(
      params.tx,
      network.network as NetworkConfig
    );

    const txSkeleton = commons.common.prepareSigningEntries(tx, {
      config: isTestnet ? AGGRON4 : LINA,
    });

    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    const message = txSkeleton.get("signingEntries").get(0)!.message;
    const Sig = keyring.signRecoverable(params.hdPath, message);
    const txSigned = helpers.sealTransaction(txSkeleton, [Sig]);
    return txSigned;
  }

  async signCkbTransaction(params: { tx: any; hdPath: string }) {
    try {
      if (this.hasMultiOwner(params.tx)) {
        const signer = this.getSigner();
        const tx = ccc.Transaction.from(params.tx);
        const txSigned = await signer.signTransaction(tx);
        return JSON.parse(txSigned.stringify());
      }
    } catch (e) {}

    return this.signCkbTransactionWithLumos(params);
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

    if (
      isBitcoinNetwork(network.network) ||
      isDogecoinNetwork(network.network)
    ) {
      const utxos = (data as SendBtcCoin).utxos.map((v) => {
        const _account = account.accounts.find(
          (acc) => acc.address === v.address
        );
        return {
          txId: v.txid,
          outputIndex: v.vout,
          satoshis: v.value,
          scriptPk: getScriptForAddress(
            Uint8Array.from(
              Buffer.from(this.exportPublicKey(_account.hdPath), "hex")
            ),
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

      const minCapacity = MIN_CAPACITY(toScript);
      let capacityChangeOutput = BI.from(0);

      // TODO: add smart selector
      const collected: Cell[] = [];
      let collectedSum = BI.from(0);
      for (const cell of (data as SendCkbCoin).cells) {
        if (!cell.cellOutput.type) {
          collectedSum = collectedSum.add(cell.cellOutput.capacity);
          collected.push(cell);
        }

        capacityChangeOutput = collectedSum.sub(neededCapacity);
        if (
          collectedSum.gte(neededCapacity) &&
          (capacityChangeOutput.eq(0) || capacityChangeOutput.gt(minCapacity))
        )
          break;
      }

      if (capacityChangeOutput.gt(0) && capacityChangeOutput.lt(minCapacity)) {
        throw new Error(
          `The remaining balance in your wallet must be greater than ${(
            minCapacity.toNumber() /
            10 ** 8
          ).toString()} CKB. Please adjust your transaction amount or add more CKB to proceed (${capacityChangeOutput})`
        );
      }

      const changeOutput: Cell = {
        cellOutput: {
          capacity: capacityChangeOutput.toHexString(),
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

      txSkeleton = prepareWitnesses(txSkeleton, fromScript);
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

    const networkConfig = network.network as NetworkConfig;

    const isTestnet = nervosTestnetSlug.includes(network.slug);
    const lumosConfig = isTestnet ? AGGRON4 : LINA;

    const indexer = network.network.indexer;
    const fromScript = helpers.parseAddress(ckbAccount.address, {
      config: lumosConfig,
    });

    const toScript = helpers.parseAddress(data.to, {
      config: lumosConfig,
    });

    const minCapacity = MIN_CAPACITY(toScript);

    const isRUSD =
      networkConfig.RUSD.script.args === data.token.attributes.type_script.args;

    const isUSDI =
      networkConfig.USDI.script.args === data.token.attributes.type_script.args;

    let xUdtType = {
      codeHash: lumosConfig.SCRIPTS.XUDT.CODE_HASH,
      hashType: lumosConfig.SCRIPTS.XUDT.HASH_TYPE,
      args: data.token.attributes.type_script.args,
    } as Script;

    let xUDTCellDeps = {
      outPoint: {
        txHash: lumosConfig.SCRIPTS.XUDT.TX_HASH,
        index: lumosConfig.SCRIPTS.XUDT.INDEX,
      },
      depType: lumosConfig.SCRIPTS.XUDT.DEP_TYPE,
    };

    if (isRUSD) {
      xUdtType = {
        codeHash: networkConfig.RUSD.script.codeHash,
        hashType: networkConfig.RUSD.script.hashType,
        args: data.token.attributes.type_script.args,
      } as Script;

      xUDTCellDeps = networkConfig.RUSD.cellDep;
    } else if (isUSDI) {
      xUdtType = {
        codeHash: networkConfig.USDI.script.codeHash,
        hashType: networkConfig.USDI.script.hashType,
        args: data.token.attributes.type_script.args,
      } as Script;

      xUDTCellDeps = networkConfig.USDI.cellDep;
    }

    const xudtCollector = indexer.collector({
      type: xUdtType,
      lock: fromScript,
    });

    const cellCollector = indexer.collector({
      lock: fromScript,
      data: "0x",
      type: "empty",
    });

    const tokensCell: Cell[] = [];
    const totalTokenBalanceNeeed = BI.from(data.amount);
    let totalTokenBalance = BI.from(0);
    let totalXUDTCapacity = BI.from(0);
    for await (const cell of xudtCollector.collect()) {
      totalXUDTCapacity = totalXUDTCapacity.add(
        BI.from(cell.cellOutput.capacity)
      );

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

    const isAddressTypeJoy = ccc.bytesFrom(toScript.args).length > 20;
    const joyCapacityAddMore = 2_0000_0000; // 2 ckb

    const xUDTCapacity = BI.from(tokensCell[0].cellOutput.capacity);

    const collectedCells: Cell[] = [];
    let neededCapacity = BI.from(0);
    let capacityChangeOutput = BI.from(0);
    const xUDTCapacityChangeOutput = totalXUDTCapacity.sub(xUDTCapacity);
    let totalCapacity = BI.from(0);
    if (isAddressTypeJoy) {
      neededCapacity = neededCapacity.add(joyCapacityAddMore);
    }

    if (totalTokenBalance.lt(totalTokenBalanceNeeed)) {
      throw new Error(`${data.token.attributes.symbol} insufficient balance`);
    }

    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

    txSkeleton = addCellDep(txSkeleton, xUDTCellDeps);
    txSkeleton = addCellDep(txSkeleton, {
      outPoint: {
        txHash: lumosConfig.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
        index: lumosConfig.SCRIPTS.SECP256K1_BLAKE160.INDEX,
      },
      depType: lumosConfig.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
    });

    txSkeleton = txSkeleton.update("inputs", (inputs) =>
      inputs.push(...tokensCell)
    );

    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      let recap = BI.from(tokensCell[0].cellOutput.capacity);
      if (isAddressTypeJoy) {
        recap = recap.add(joyCapacityAddMore);
      }
      return outputs.push({
        cellOutput: {
          capacity: recap.toHexString(),
          lock: toScript,
          type: xUdtType,
        },
        data: ccc.hexFrom(
          ccc.numLeToBytes(totalTokenBalanceNeeed.toBigInt(), 16)
        ),
      });
    });

    const diff = totalTokenBalance.sub(totalTokenBalanceNeeed);
    if (diff.gt(BI.from(0))) {
      neededCapacity = neededCapacity.add(xUDTCapacity);
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

    const cccTransaction = ccc.Transaction.fromLumosSkeleton(txSkeleton);
    const fee = cccTransaction.estimateFee(data.feeRate);
    neededCapacity = neededCapacity.add(BI.from(fee));

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
      capacityChangeOutput = xUDTCapacityChangeOutput.add(
        totalCapacity.sub(neededCapacity)
      );

      if (
        totalCapacity.gte(neededCapacity) &&
        (capacityChangeOutput.eq(0) || capacityChangeOutput.gt(minCapacity))
      )
        break;
    }

    if (totalCapacity.lt(neededCapacity)) {
      throw new Error(
        `The balance in your wallet must be greater than ${(neededCapacity.lt(
          minCapacity
        )
          ? neededCapacity.add(minCapacity).toNumber() / 10 ** 8
          : neededCapacity.toNumber() / 10 ** 8
        ).toString()} CKB. Please adjust your transaction amount or add more CKB to proceed`
      );
    }

    if (capacityChangeOutput.gt(0) && capacityChangeOutput.lt(minCapacity)) {
      throw new Error(
        `The remaining balance in your wallet must be greater than ${(
          minCapacity.toNumber() /
          10 ** 8
        ).toString()} CKB. Please adjust your transaction amount or add more CKB to proceed`
      );
    }

    txSkeleton = txSkeleton.update("inputs", (inputs) =>
      inputs.push(...collectedCells)
    );

    if (capacityChangeOutput.gt(0)) {
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push({
          cellOutput: {
            capacity: capacityChangeOutput.toHexString(),
            lock: fromScript,
          },
          data: "0x",
        })
      );
    }

    txSkeleton = prepareWitnesses(txSkeleton, fromScript);
    txSkeleton = commons.common.prepareSigningEntries(txSkeleton, {
      config: lumosConfig,
    });

    const message = txSkeleton.get("signingEntries").get(0)!.message;
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    const Sig = keyring.signRecoverable(ckbAccount.hdPath, message);
    const tx = helpers.sealTransaction(txSkeleton, [Sig]);

    return { tx: JSON.stringify(tx), fee: fee.toString() };
  }

  transferSpore = async (params: {
    signer: ccc.Signer;
    id: ccc.HexLike;
    to: ccc.ScriptLike;
    tx?: ccc.TransactionLike;
    scriptInfoHash?: ccc.HexLike;
    scripts?: cccSpore.SporeScriptInfoLike[];
  }): Promise<{
    tx: ccc.Transaction;
  }> => {
    const { signer, id, to, scriptInfoHash, scripts } = params;

    // prepare transaction
    const tx = ccc.Transaction.from(params.tx ?? {});
    const { cell: sporeCell, scriptInfo } = await cccSpore.assertSpore(
      signer.client,
      id,
      scripts
    );

    await tx.addCellDepInfos(signer.client, scriptInfo.cellDeps);
    tx.inputs.push(
      ccc.CellInput.from({
        previousOutput: sporeCell.outPoint,
        ...sporeCell,
      })
    );
    tx.addOutput(
      {
        lock: to,
        type: sporeCell.cellOutput.type,
      },
      sporeCell.outputData
    );

    const actions = scriptInfo.cobuild
      ? [
          cccSporeA.assembleTransferSporeAction(
            sporeCell.cellOutput,
            tx.outputs[tx.outputs.length - 1],
            scriptInfoHash
          ),
        ]
      : [];

    return {
      tx: await cccSporeA.prepareSporeTransaction(signer, tx, actions),
    };
  };

  getSigner = () => {
    const account = storageService.currentAccount;
    if (!account || !account.accounts[0].address) {
      throw new Error("Error when trying to get the current account");
    }

    const ckbAccount = account.accounts[0];
    const networkSlug = storageService.currentNetwork;
    const network = getNetworkDataBySlug(networkSlug);
    if (!isCkbNetwork(network.network)) {
      return undefined;
    }

    const isTestnet = nervosTestnetSlug.includes(network.slug);
    const client = isTestnet
      ? new ccc.ClientPublicTestnet()
      : new ccc.ClientPublicMainnet();

    const sporeScripts = isTestnet
      ? SCRIPTS_SPORE_TESTNET
      : SCRIPTS_SPORE_MAINNET;

    const pk = this.exportAccount(ckbAccount.hdPath, network.slug);
    return new ccc.SignerCkbPrivateKey(client, pk);
  };

  createTransferNFT = async (
    data: TransferNFT
  ): Promise<{ tx: string; fee: string }> => {
    const networkSlug = storageService.currentNetwork;
    const network = getNetworkDataBySlug(networkSlug);
    if (!isCkbNetwork(network.network)) {
      return { tx: null, fee: "0" };
    }

    const isTestnet = nervosTestnetSlug.includes(network.slug);
    const sporeScripts = isTestnet
      ? SCRIPTS_SPORE_TESTNET
      : SCRIPTS_SPORE_MAINNET;

    const signer = this.getSigner();
    const toAddress = await ccc.Address.fromString(
      data.toAddress,
      signer.client
    );

    let { tx } = await this.transferSpore({
      signer,
      id: data.nft.type_script.args,
      to: toAddress.script,
      scripts: sporeScripts,
    });

    const [fee, feeOk] = await tx.completeFeeBy(signer, data.feeRate);
    tx = await signer.signTransaction(tx);
    return {
      tx: tx.stringify(),
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

  async sendRgbppAsset(
    btcPsbtHex: string,
    toSignInputs?: UserToSignInput[]
  ): Promise<string> {
    const account = storageService.currentAccount;
    if (!account || !account.accounts[0].address)
      throw new Error("Error when trying to get the current account");

    bitcoinjs.initEccLib(ecc);

    // build psbt
    const psbt = Psbt.fromHex(btcPsbtHex);

    // sign psbt
    this.signPsbt(psbt, toSignInputs);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore We are really dont know what is it but we still copy working code
    psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
    return psbt.toHex();
  }
}

export default new KeyringService();
