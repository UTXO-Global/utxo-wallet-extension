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

    event.on("windowRemoved", (winId: number) => {
      if (winId === this.notifiWindowId) {
        this.notifiWindowId = 0;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.rejectApproval();
      }
    });
  }

  getApproval = (): ApprovalData => {
    return { ...this.approval.data };
  };

  resolveApproval = async (data?: any, forceReject = false) => {
    let connectedSite = false;
    if (forceReject) {
      this.approval?.reject(new EthereumProviderError(4001, "User Cancel"));
    } else {
      this.approval?.resolve(data);
      if (this.approval?.data?.params?.method === "connect") {
        connectedSite = true;
      }
    }

    this.emit("resolve", data);
    await this.clear();
    return connectedSite;
  };

  rejectApproval = async (err?: string, stay = false, isInternal = false) => {
    if (!this.approval) {
      return;
    }

    if (isInternal) {
      this.approval?.reject(ethErrors.rpc.internal(err));
    } else {
      this.approval?.reject(ethErrors.provider.userRejectedRequest<any>(err));
    }

    if (!isInternal && this.approval?.data?.params?.method === "connect") {
      eventBus.emit(EVENTS.broadcastToUI, {
        method: "disconnect",
        params: {
          error: err || "User rejected the request",
        },
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
    // We will just override the existing open approval with the new one coming in
    return new Promise((resolve, reject) => {
      this.approval = {
        data,
        resolve,
        reject,
      };

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      if (!this.isLocked && Object.keys(data).length > 0) {
        this.openNotification(winProps);
      }
    });
  };

  clear = async (stay = false) => {
    this.unLock();
    this.approval = null;
    if (this.notifiWindowId && !stay) {
      await remove(this.notifiWindowId);
      this.notifiWindowId = 0;
    }
  };

  unLock = () => {
    this.isLocked = false;
  };

  lock = () => {
    this.isLocked = true;
  };

  openNotification = async (winProps: OpenNotificationProps) => {
    if (this.isLocked) {
      return;
    }

    this.lock();

    if (this.notifiWindowId) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      remove(this.notifiWindowId);
      this.notifiWindowId = 0;
    }

    openNotification(winProps)
      .then((winId) => {
        this.notifiWindowId = winId;
      })
      .catch(async (e) => {
        console.log(e)
        await this.clear();
      });
  };
}

export default new NotificationService();
