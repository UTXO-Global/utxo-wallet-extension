import { ChainAddressType, NetworkSlug } from "../networks/types";

export interface IGroupAccount {
  id: number;
  accounts: IAccount[];
  name?: string;
  network: NetworkSlug;
  balance?: number;
  ordinalBalance?: number;
}

export interface IAccount {
  addressType: ChainAddressType;
  network: NetworkSlug;
  hdPath: string;
  address?: string;
}
