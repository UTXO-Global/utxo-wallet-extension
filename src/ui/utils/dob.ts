import { unpackToRawSporeData } from "@spore-sdk/core";
import offCKBConfig from "@/shared/networks/ckb/offckb.config";
import { hexStringToUint8Array } from "./helpers";

const { rpc } = offCKBConfig;
offCKBConfig.initializeLumosConfig();

export async function showSporeContent(txHash: string, index = 0) {
  const indexHex = "0x" + index.toString(16);
  const { cell } = await rpc.getLiveCell({ txHash, index: indexHex }, true);
  if (cell == null) {
    return alert("cell not found, please retry later");
  }
  const data = cell.data.content;
  const msg = unpackToRawSporeData(data);
  return msg;
}

export const renderSpore = async (txHash: string, outputIndex: number) => {
  const res = await showSporeContent(txHash, outputIndex);
  if (!res) return;

  // Create Blob from binary data
  const buffer = hexStringToUint8Array(res.content.toString().slice(2));
  const blob = new Blob([buffer], { type: res.contentType });
  const url = URL.createObjectURL(blob);
  return url
};