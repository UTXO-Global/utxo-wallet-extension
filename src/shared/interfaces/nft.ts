export interface ITypeScript {
  args: string | null;
  code_hash: string | null;
  hash_type: string | null;
  script_hash: string | null;
}

export interface ICell {
  cell_index: number;
  data: string;
  status: string;
  tx_hash: string;
}

export interface INFTCollection {
  creator: string;
  sn: string;
  tags: string[];
  type_script: ITypeScript;
  name: string;
}

export interface INFT {
  cell: ICell;
  collection: INFTCollection;
  owner: string;
  standard: string;
  token_id: string;
  type_script: ITypeScript;
  imageUrl: string;
  capacity: number;
  name: string;
  contentType?: string;
  loading: boolean;
}
