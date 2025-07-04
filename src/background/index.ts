import { EVENTS } from "@/shared/constant";
import eventBus from "@/shared/eventBus";
import { Message } from "@/shared/utils/message";
import { sessionService } from "@/background/services";
import {
  browserRuntimeOnConnect,
  browserRuntimeOnInstalled,
} from "@/shared/utils/browser";
import walletController from "./controllers/walletController";
import apiController from "./controllers/apiController";
import stateController from "./controllers/stateController";
import { keyringController } from "./controllers";
import { providerController } from "./controllers";
import notificationController from "./controllers/notificationController";

const { PortMessage } = Message;
let panelToggle = false;

// for page provider
browserRuntimeOnConnect((port: any) => {
  if (
    port.name === "popup" ||
    port.name === "notification" ||
    port.name === "tab"
  ) {
    const pm = new PortMessage(port);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    pm.listen((data: any) => {
      if (!data.method) return;

      if (data?.type) {
        switch (data.type) {
          case "broadcast":
            eventBus.emit(data.method, data.params);
            break;
          case "openapi":
            return apiController[data.method].apply(null, data.params);
          case "keyring":
            return keyringController[data.method].apply(null, data.params);
          case "state":
            return stateController[data.method].apply(null, data.params);
          case "notification":
            return notificationController[data.method].apply(null, data.params);
          default:
            if (!walletController[data.method])
              throw new Error(
                `Method ${data.method} is not founded in the walletController`
              );
            return walletController[data.method].apply(null, data.params);
        }
      }
    });

    const broadcastCallback = async (data: any) => {
      await pm.request({
        type: "broadcast",
        method: data.method,
        params: data.params,
      });
    };

    eventBus.addEventListener(EVENTS.broadcastToUI, broadcastCallback);
    port.onDisconnect.addListener(() => {
      eventBus.removeEventListener(EVENTS.broadcastToUI, broadcastCallback);
    });

    return;
  }

  const pm = new PortMessage(port);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  pm.listen(async (data) => {
    const sessionId = port.sender?.tab?.id;
    if (data.method === "tabCheckin") {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab) return false;
      sessionService.createSession(sessionId, data.params);
      return;
    }

    const session = sessionService.getOrCreateSession(sessionId);

    const req = { data, session };
    // for background push to respective page
    req.session.pushMessage = (event, data) => {
      pm.send("message", { event, data });
    };

    return providerController(req);
  });

  port.onDisconnect.addListener(() => {
    // todo
  });
});

const addAppInstalledEvent = () => {
  // openExtensionInTab();
  return;
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "toggle-utxo-wallet-panel",
    title: `Enable UTXO Global Wallet Sidebar`,
    contexts: ["all"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "toggle-utxo-wallet-panel") {
    panelToggle = !panelToggle;
    chrome.contextMenus.update("toggle-utxo-wallet-panel", {
      title: `${panelToggle ? "Disable" : "Enable"} UTXO Global Wallet Sidebar`,
    });

    await chrome.sidePanel.setOptions({
      enabled: panelToggle,
      path: "index.html",
      tabId: tab.id,
    });
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: panelToggle,
    });
  }
});

browserRuntimeOnInstalled((details) => {
  if (details.reason === "install") {
    addAppInstalledEvent();
  }
});

const INTERNAL_STAYALIVE_PORT = "CT_Internal_port_alive";
let alivePort: any = null;

setInterval(() => {
  if (alivePort == null) {
    alivePort = chrome.runtime.connect({ name: INTERNAL_STAYALIVE_PORT });

    alivePort.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        //
      } else {
        //
      }

      alivePort = null;
    });
  }

  if (alivePort) {
    alivePort.postMessage({ content: "keep alive~" });

    if (chrome.runtime.lastError) {
      //
    } else {
      //
    }
  }
}, 5000);

let tabActiveInfo;
chrome.tabs.onActivated.addListener(function (activeInfo) {
  tabActiveInfo = activeInfo;
});

chrome.runtime.onMessage.addListener((message) => {
  (async () => {
    if (message.type === "sidePanel" && tabActiveInfo) {
      if (message.action === "open") {
        chrome.sidePanel.setOptions({
          tabId: tabActiveInfo.tabId,
          path: "index.html",
          enabled: true,
        });
        await chrome.sidePanel.open(tabActiveInfo);
      } else {
        chrome.sidePanel.setOptions({
          tabId: tabActiveInfo.tabId,
          enabled: false,
        });
      }
    }
  })();
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    enabled: false,
  });
});
