import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { format } from "date-fns";

export const logErrorToFirestore = async (
  message: string,
  filename: string,
  lineno: any
) => {
  const now = new Date();
  const time = now.toISOString();
  const collectionName = `errors-${format(now, "MM-dd-yyyy")}`;

  const errorData = {
    message,
    filename,
    lineno,
    type: "utxo-global-wallet",
  };

  await setDoc(doc(db, collectionName, time), errorData);
};

export const hexStringToUint8Array = (hexString: string): Uint8Array => {
  const len = hexString.length;
  const buffer = new Uint8Array(len / 2);

  for (let i = 0; i < len; i += 2) {
    buffer[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }

  return buffer;
};

export const ckbExplorerApi = (networkSlug: string) => {
  const _network = networkSlug === "nervos" ? "mainnet" : "testnet";
  return `${process.env.API_BASE_URL}/ckb/${_network}`;
};
