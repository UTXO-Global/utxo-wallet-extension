export interface ConnectedSite {
  origin: string;
  icon: string;
  name: string;
  e?: number;
  order?: number;
  isConnected: boolean;
}

class PermissionService {
  private _sites: ConnectedSite[] = [];

  constructor() {
    this._sites = [];
  }

  get connectedSites() {
    return this._sites.filter((f) => f.isConnected);
  }

  get allSites() {
    return this._sites;
  }

  async siteIsConnected(): Promise<boolean> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) return false;
    const url = new URL(tabs[0].url);
    const site = this._sites.find((f) => f.origin === url.origin);
    return site ? site.isConnected : false;
  }

  addConnectedSite(origin: string, name: string, icon: string) {
    const alreadyConnectedSite = this._sites.find((f) => f.origin === origin);
    if (!alreadyConnectedSite)
      this._sites.push({
        origin,
        name,
        icon,
        isConnected: true,
      });
    else
      this._sites[this._sites.indexOf(alreadyConnectedSite)].isConnected = true;
  }

  disconnectSites() {
    for (const site of this._sites) {
      site.isConnected = false;
    }
  }

  setConnectedSites(sites?: ConnectedSite[]) {
    if (!sites) {
      this._sites = [];
    } else {
      this._sites = sites.map((f) => ({ ...f, isConnected: true }));
    }
  }

  removeSite(origin: string) {
    const site = this._sites.find((f) => f.origin === origin);
    if (site) {
      this._sites.splice(this._sites.indexOf(site), 1);
    }
  }
}

export default new PermissionService();
