import { unpackToRawSporeData } from "@spore-sdk/core";
import { NetworkConfig } from "@/shared/networks/ckb/offckb.config";
import { hexStringToUint8Array } from "./helpers";
import { NetworkData } from "@/shared/networks/types";
import LS from "./ls";
import {
  renderByDobDecodeResponse,
  renderImageSvg,
  svgToBase64,
  config as dobRenderConfig,
  renderByTokenKey,
} from "@nervina-labs/dob-render";

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

  return { capacity: res.capacity, ...getURLFromHex(res.content, network) };
};

export const getURLFromHex = (dataHex: string, network: NetworkData) => {
  const msg = unpackToRawSporeData(dataHex);
  const contentType = msg.contentType.toLowerCase();
  if (IMAGE_CONTENT_TYPE.includes(contentType)) {
    const buffer = hexStringToUint8Array(msg.content.toString().slice(2));
    const blob = new Blob([buffer], { type: contentType });
    return { url: URL.createObjectURL(blob), contentType: contentType };
  }
  return { contentType: msg.contentType };
};

export const getDob0Imgs = async (ids: string[], network: NetworkData) => {
  if (ids.length === 0) return {};
  const keyCache = "__NFTS__";
  const nftsCache = (JSON.parse((await LS.getItem(keyCache)) || "{}") ||
    {}) as {
    [key: string]: { url: string; contentType: string };
  };

  const nftIds = ids.filter((id) => !Object.keys(nftsCache).includes(id));
  if (nftIds.length === 0) return nftsCache;

  const isTestnet = network.slug === "nervos_testnet";

  if (isTestnet) {
    dobRenderConfig.setDobDecodeServerURL(
      "https://dob-decoder-testnet.onrender.com"
    );
  } else {
    dobRenderConfig.setDobDecodeServerURL("https://dob-decoder.rgbpp.io");
  }

  const res: { [key: string]: { url: string; contentType: string } } = {
    ...nftsCache,
  };

  await Promise.all(
    nftIds.map(async (id) => {
      try {
        const tokenKey = id.startsWith("0x") ? id.slice(2) : id;
        const data = await renderByTokenKey(tokenKey);
        res[id] = {
          url: await svgToBase64(data),
          contentType: "image/svg+xml",
        };
      } catch (e) {
        res[id] = {
          url: undefined,
          contentType: undefined,
        };
        await Promise.resolve(id);
      }
    })
  );

  await LS.setItem(keyCache, JSON.stringify(res));
  return res;
};
