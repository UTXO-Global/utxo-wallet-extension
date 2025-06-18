import { ethErrors } from "eth-rpc-errors";
import { EthereumProviderError } from "eth-rpc-errors/dist/classes";
import Events from "events";
import { event, remove, openNotification } from "../webapi";
import type {
  Approval,
  ApprovalData,
  OpenNotificationProps,
} from "@/shared/interfaces/notification";
import eventBus from "@/shared/eventBus";
import { EVENTS } from "@/shared/constant";

// something need user approval in window
// should only open one window, unfocus will close the current notification
class NotificationService extends Events {
  approval: Approval | null = null;
  notifiWindowId = 0;
  isLocked = false;

  constructor() {
    super();
    console.log('[UTXO Global Notification Service] Initializing notification service');

    event.on("windowRemoved", (winId: number) => {
      console.log('[UTXO Global Notification Service] Window removed:', winId);
      if (winId === this.notifiWindowId) {
        console.log('[UTXO Global Notification Service] Current notification window was removed');
        this.notifiWindowId = 0;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.rejectApproval();
      }
    });
  }

  getApproval = (): ApprovalData => {
    console.log('[UTXO Global Notification Service] Getting approval data:', this.approval?.data);
    return { ...this.approval.data };
  };

  resolveApproval = async (data?: any, forceReject = false) => {
    console.log('[UTXO Global Notification Service] Resolving approval:', { data, forceReject });
    let connectedSite = false;
    if (forceReject) {
      console.log('[UTXO Global Notification Service] Force rejecting approval');
      this.approval?.reject(new EthereumProviderError(4001, "User Cancel"));
    } else {
      console.log('[UTXO Global Notification Service] Resolving approval with data');
      this.approval?.resolve(data);
      if (this.approval?.data?.params?.method === "connect") {
        console.log('[UTXO Global Notification Service] Connect method detected');
        connectedSite = true;
      }
    }
    await this.clear();
    this.emit("resolve", data);
    return connectedSite;
  };

  rejectApproval = async (err?: string, stay = false, isInternal = false) => {
    console.log('[UTXO Global Notification Service] Rejecting approval:', { err, stay, isInternal });
    if (!this.approval) {
      console.log('[UTXO Global Notification Service] No approval to reject');
      return;
    }
    
    if (isInternal) {
      console.log('[UTXO Global Notification Service] Internal rejection');
      this.approval?.reject(ethErrors.rpc.internal(err));
    } else {
      console.log('[UTXO Global Notification] User rejection');
      this.approval?.reject(ethErrors.provider.userRejectedRequest<any>(err));
    }

    if (!isInternal && this.approval?.data?.params?.method === "connect") {
      console.log('[UTXO Global Notification Service] Broadcasting disconnect event');
      eventBus.emit(EVENTS.broadcastToUI, {
        method: "disconnect",
        params: {
          error: err || "User rejected the request"
        }
      });
    }

    await this.clear(stay);
    this.emit("reject", err);
  };

  // currently it only support one approval at the same time
  requestApproval = async (
    data?: any,
    winProps?: OpenNotificationProps
  ): Promise<any> => {
    console.log('[UTXO Global Notification Service] Requesting approval:', { data, winProps });
    // We will just override the existing open approval with the new one coming in
    return new Promise((resolve, reject) => {
      this.approval = {
        data,
        resolve,
        reject,
      };

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      if (!this.isLocked && Object.keys(data).length > 0) {
        console.log('[UTXO Global Notification Service] Opening notification window');
        this.openNotification(winProps);
      } else {
        console.log('[UTXO Global Notification Service] Notification window locked or no data');
      }
    });
  };

  clear = async (stay = false) => {
    console.log('[UTXO Global Notification Service] Clearing approval:', { stay });
    this.unLock();
    this.approval = null;
    if (this.notifiWindowId && !stay) {
      console.log('[UTXO Global Notification Service] Removing notification window:', this.notifiWindowId);
      await remove(this.notifiWindowId);
      this.notifiWindowId = 0;
    }
  };

  unLock = () => {
    console.log('[UTXO Global Notification Service] Unlocking notification service');
    this.isLocked = false;
  };

  lock = () => {
    console.log('[UTXO Global Notification] Locking notification service');
    this.isLocked = true;
  };

  openNotification = async (winProps: OpenNotificationProps) => {
    console.log('[UTXO Global Notification Service] Opening notification:', winProps);
    if (this.isLocked) {
      console.log('[UTXO Global Notification Service] Service is locked, cannot open notification');
      return;
    }

    this.lock();

    if (this.notifiWindowId) {
      console.log('[UTXO Global Notification Service] Removing existing notification window:', this.notifiWindowId);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      remove(this.notifiWindowId);
      this.notifiWindowId = 0;
    }
    
    openNotification(winProps)
      .then((winId) => {
        console.log('[UTXO Global Notification Service] Notification window opened:', winId);
        this.notifiWindowId = winId;
      })
      .catch((e) => {
        console.error('[UTXO Global Notification Service] Failed to open notification:', e);
      });
  };
}

export default new NotificationService();
