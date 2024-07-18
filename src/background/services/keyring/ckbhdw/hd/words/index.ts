import cs from "./chinese-simplified";
import ct from "./chinese-traditional";
import fr from "./french";
import en from "./english";
import it from "./italian";
import jp from "./japanese";
import sp from "./spanish";

export type Language =
  | "simplified chinese"
  | "traditional chinese"
  | "english"
  | "french"
  | "italian"
  | "japanese"
  | "spanish";

export default function (name: Language): string[] {
  switch (name) {
    case "simplified chinese":
      return cs;
    case "traditional chinese":
      return ct;
    case "english":
      return en;
    case "french":
      return fr;
    case "italian":
      return it;
    case "japanese":
      return jp;
    case "spanish":
      return sp;
    default:
      throw new Error(`Unknown language: ${name}.`);
  }
}
