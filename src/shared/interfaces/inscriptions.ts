export interface ApiOrdUTXO {
  address?: string;
  indexed: boolean;
  inscriptions: string[];
  runes: any; // TODO
  transaction: string;
  value: number;
  outpoint: string;
  rawHex?: string;
}

export interface Inscription extends ApiOrdUTXO {
  preview: string;
  content: string;
  offset: 0;
}

export interface CompletedInscription extends Inscription {
  genesis: string;
  outpoint: string;
}
