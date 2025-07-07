import { unpackToRawSporeData } from "@spore-sdk/core";
import { NetworkConfig } from "@/shared/networks/ckb/offckb.config";
import { hexStringToUint8Array } from "./helpers";
import { NetworkData } from "@/shared/networks/types";
import LS from "./ls";
import {
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

// Track the current network to avoid unnecessary URL updates
let currentNetworkSlug: string | null = null;

/**
 * Configure the DOB decoder server URL based on network
 * @param network The current network data
 * @returns boolean indicating if the configuration was updated
 */
const configureDobDecodeServer = (network: NetworkData): boolean => {
  const isTestnet = network.slug === "nervos_testnet";

  // Only update if the network has changed
  if (currentNetworkSlug !== network.slug) {
    if (isTestnet) {
      dobRenderConfig.setDobDecodeServerURL(
        "https://dob-decoder-testnet.onrender.com"
      );
    } else {
      dobRenderConfig.setDobDecodeServerURL("https://dob-decoder.rgbpp.io");
    }

    // Update the current network slug
    currentNetworkSlug = network.slug;
    return true;
  }

  return false;
};

const IMAGE_EXT = [
  "avif",
  "apng",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "svg+xml",
  "webp",
  "tiff",
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
  if (!dataHex) return {};
  const msg = unpackToRawSporeData(dataHex);
  const contentType = msg.contentType.toLowerCase();
  if (IMAGE_CONTENT_TYPE.includes(contentType)) {
    const buffer = hexStringToUint8Array(msg.content.toString().slice(2));
    const blob = new Blob([buffer], { type: contentType });
    return { url: URL.createObjectURL(blob), contentType: contentType };
  } else if (contentType === "application/json") {
    const hexContent = msg.content.toString().slice(2);
    const utf8Content = Buffer.from(hexContent, "hex").toString("utf8");
    const payload = JSON.parse(utf8Content);
    if (!!payload.resource?.url && !!payload.resource?.type) {
      return { url: payload.resource.url, contentType: payload.resource.type };
    }
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

  // Configure the DOB decoder server URL if needed
  configureDobDecodeServer(network);

  const res: { [key: string]: { url: string; contentType: string } } = {
    ...nftsCache,
  };

  await Promise.all(
    nftIds.map(async (id) => {
      try {
        const tokenKey = id.startsWith("0x") ? id.slice(2) : id;
        const data = await renderByTokenKey(tokenKey);
        if (isImageURL(data)) {
          res[id] = {
            url: data,
            contentType: `image/${data.split(".").at(-1)}`,
          };
        } else {
          res[id] = {
            url: await svgToBase64(data),
            contentType: "image/svg+xml",
          };
        }
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

function isImageURL(url: string) {
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    return false;
  }
  const domainPart = url.split(".");
  const ext = domainPart[domainPart.length - 1];
  if (!IMAGE_EXT.includes(ext.toLowerCase())) {
    return false;
  }
  return true;
}
