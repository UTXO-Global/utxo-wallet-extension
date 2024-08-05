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
