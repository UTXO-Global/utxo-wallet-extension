import { unpackToRawSporeData } from "@spore-sdk/core";
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
  const msg = unpackToRawSporeData(data);
  return { msg, capacity: cell.output.capacity };
}

export const getExtraDetailSpore = async (
  txHash: string,
  outputIndex: number,
  network: NetworkData
) => {
  const res = await getSporeContent(txHash, outputIndex, network);
  if (!res) return;

  if (IMAGE_CONTENT_TYPE.includes(res.msg.contentType.toLowerCase())) {
    const buffer = hexStringToUint8Array(res.msg.content.toString().slice(2));
    const blob = new Blob([buffer], { type: res.msg.contentType });
    return {
      url: URL.createObjectURL(blob),
      capacity: res.capacity,
      contentType: res.msg.contentType,
    };
  }

  return { capacity: res.capacity };
};

export const getURLFromHex = (dataHex: string) => {
  const msg = unpackToRawSporeData(dataHex);
  if (IMAGE_CONTENT_TYPE.includes(msg.contentType.toLowerCase())) {
    const buffer = hexStringToUint8Array(msg.content.toString().slice(2));
    const blob = new Blob([buffer], { type: msg.contentType });
    return { url: URL.createObjectURL(blob), contentType: msg.contentType };
  }
  return { contentType: msg.contentType };
};
