import {
  bufferToRawString,
  bytifyRawString,
  unpackToRawSporeData,
} from "@spore-sdk/core";
import { NetworkConfig } from "@/shared/networks/ckb/offckb.config";
import { hexStringToUint8Array } from "./helpers";
import { NetworkData } from "@/shared/networks/types";
import LS from "./ls";

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

  return { capacity: res.capacity, ...getURLFromHex(res.content) };
};

export const getURLFromHex = (dataHex: string) => {
  const msg = unpackToRawSporeData(dataHex);
  const contentType = msg.contentType.toLowerCase();
  if (IMAGE_CONTENT_TYPE.includes(contentType)) {
    const buffer = hexStringToUint8Array(msg.content.toString().slice(2));
    const blob = new Blob([buffer], { type: contentType });
    return { url: URL.createObjectURL(blob), contentType: contentType };
  }
  return { contentType: msg.contentType };
};

export const getDob0Imgs = async (ids: string[]) => {
  if (ids.length === 0) return {};
  const keyCache = "__NFTS__";
  const nftsCache = (JSON.parse((await LS.getItem(keyCache)) || "{}") ||
    {}) as {
    [key: string]: { url: string; contentType: string };
  };

  const nftIds = ids.filter((id) => !Object.keys(nftsCache).includes(id));
  if (nftIds.length === 0) return nftsCache;

  const apiURL = "https://dobs-api.magickbase.com/api/dobs/0";
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  const { dobs } = await (
    await fetch(apiURL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ ids: nftIds.join(",") }),
    })
  ).json();

  const res: { [key: string]: { url: string; contentType: string } } = {
    ...nftsCache,
  };
  await Promise.all(
    nftIds.map(async (id, index) => {
      if (!dobs[index] || ["undefined", "null"].includes(dobs[index])) {
        res[id] = { contentType: undefined, url: undefined };
        await Promise.resolve(id);
      } else {
        const joyIdAPI = `https://api.joy.id/api/v1/wallet/dob_imgs?uri=${dobs[index]["prev.bg"]}`;
        const dobImg = await (await fetch(joyIdAPI)).json();
        const buffer = hexStringToUint8Array(dobImg.content.toString());
        const blob = new Blob([buffer], { type: dobImg.content_type });
        const base64data = await new Promise((resolve, reject) => {
          var reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });

        res[id] = {
          url: base64data.toString(),
          contentType: dobImg.content_type,
        };
      }
    })
  );

  await LS.setItem(keyCache, JSON.stringify(res));
  return res;
};
