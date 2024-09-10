import {
  bufferToRawString,
  bytifyRawString,
  unpackToRawSporeData,
} from "@spore-sdk/core";
import { NetworkConfig } from "@/shared/networks/ckb/offckb.config";
import { hexStringToUint8Array } from "./helpers";
import { NetworkData } from "@/shared/networks/types";

const IMAGE_CONTENT_TYPE = [
  "image/apng",
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
];
export async function getSporeContent(
  txHash: string,
  index = 0,
  network: NetworkData
) {
  const indexHex = "0x" + index.toString(16);
  const { cell } = await (network.network as NetworkConfig).rpc.getLiveCell(
    { txHash, index: indexHex },
    true
  );
  if (cell == null) {
    return alert("cell not found, please retry later");
  }
  const data = cell.data.content;
  return { content: data, capacity: cell.output.capacity };
}

export const getExtraDetailSpore = async (
  txHash: string,
  outputIndex: number,
  network: NetworkData
) => {
  const res = await getSporeContent(txHash, outputIndex, network);
  if (!res) return;

  console.log(getURLFromHex(res.content));
  return { capacity: res.capacity, ...getURLFromHex(res.content) };
};

export const getURLFromHex = (dataHex: string) => {
  const msg = unpackToRawSporeData(dataHex);
  console.log(msg);
  const contentType = msg.contentType.toLowerCase();
  if (IMAGE_CONTENT_TYPE.includes(contentType)) {
    const buffer = hexStringToUint8Array(msg.content.toString().slice(2));
    const blob = new Blob([buffer], { type: contentType });
    return { url: URL.createObjectURL(blob), contentType: contentType };
  }
  return { contentType: msg.contentType };
};
