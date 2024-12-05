import {
  notificationService,
  permissionService,
  storageService,
} from "@/background/services";
import PromiseFlow, { underline2Camelcase } from "@/background/utils";
import { EVENTS } from "@/shared/constant";
import eventBus from "@/shared/eventBus";
import { ethErrors } from "eth-rpc-errors";
import providerController, {
  btcProviderController,
  ckbProviderController,
} from "./controller";

const isSignApproval = (type: string) => {
  const SIGN_APPROVALS = [
    "switchChain",
    "switchNetwork",
    "signMessage",
    "signPsbt",
    "signAllPsbtInputs",
  ];
  return SIGN_APPROVALS.includes(type);
};

const windowHeight = 600;
const flow = new PromiseFlow();
const flowContext = flow
  .use(async (ctx, next) => {
    const {
      data: { provider },
    } = ctx.request;
    switch (provider) {
      case "btc":
        ctx.providerController = btcProviderController;
        ctx.providerController._switchChain("btc");
        break;
      case "ckb":
        ctx.providerController = ckbProviderController;
        ctx.providerController._switchChain("nervos");
        break;
      default:
        ctx.providerController = providerController;
    }

    return next();
  })
  .use(async (ctx, next) => {
    const {
      data: { method },
    } = ctx.request;
    ctx.mapMethod = underline2Camelcase(method);
    if (!ctx.providerController[ctx.mapMethod]) {
      throw ethErrors.rpc.methodNotFound({
        message: `method [${method}] doesn't has corresponding handler`,
        data: ctx.request.data,
      });
    }

    return next();
  })
  .use(async (ctx, next) => {
    const { mapMethod } = ctx;
    if (Reflect.getMetadata("INTERNAL", providerController, mapMethod)) {
      throw ethErrors.rpc.invalidRequest({
        message: `there is a invalid request`,
      });
    }

    return next();
  })
  .use(async (ctx, next) => {
    const { mapMethod } = ctx;
    if (!Reflect.getMetadata("SAFE", ctx.providerController, mapMethod)) {
      if (!storageService.appState.isUnlocked) {
        ctx.request.requestedApproval = true;
        await notificationService.requestApproval({ lock: true });
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    const { mapMethod } = ctx;
    if (Reflect.getMetadata("SAFE", providerController, mapMethod)) {
      if (!(await permissionService.siteIsConnected())) {
        return;
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    // check connect
    const {
      request: {
        session: { origin, name, icon },
      },
      mapMethod,
    } = ctx;
    if (!Reflect.getMetadata("SAFE", ctx.providerController, mapMethod)) {
      if (!(await permissionService.siteIsConnected())) {
        ctx.request.requestedApproval = true;
        await notificationService.requestApproval(
          {
            params: {
              method: "connect",
              data: {},
              session: { origin, name, icon },
            },
          },
          { height: windowHeight, route: "/provider/connect" }
        );
        permissionService.addConnectedSite(origin, name, icon);
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    // check need approval
    const {
      request: {
        data: { params, method },
        session: { origin, name, icon },
      },
      mapMethod,
    } = ctx;
    // ! Disabled eslint and typescript becouse idk what options is, but if u see it please think about this 'options = {}'
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [approvalType, condition, options = {}] =
      Reflect.getMetadata("APPROVAL", ctx.providerController, mapMethod) || [];

    if (approvalType && (!condition || !condition(ctx.request))) {
      ctx.request.requestedApproval = true;
      // eslint-disable-next-line
      ctx.approvalRes = await notificationService.requestApproval(
        {
          approvalComponent: approvalType,
          params: {
            method,
            data: params,
            session: { origin, name, icon },
          },
          origin,
        },
        { height: windowHeight, route: `/provider/${method}` }
      );
    }
    return next();
  })
  .use(async (ctx) => {
    const { approvalRes, mapMethod, request } = ctx;
    // process request
    const [approvalType] =
      Reflect.getMetadata("APPROVAL", ctx.providerController, mapMethod) || [];

    const { uiRequestComponent, ...rest } = approvalRes || {};
    const {
      session: { origin },
    } = request;
    const requestDefer = Promise.resolve(
      ctx.providerController[mapMethod]({
        ...request,
        approvalRes,
      })
    );

    requestDefer
      .then((result) => {
        if (isSignApproval(approvalType)) {
          eventBus.emit(EVENTS.broadcastToUI, {
            method: EVENTS.SIGN_FINISHED,
            params: {
              success: true,
              data: result,
            },
          });
        }
        return result;
      })
      .catch((e: any) => {
        if (isSignApproval(approvalType)) {
          eventBus.emit(EVENTS.broadcastToUI, {
            method: EVENTS.SIGN_FINISHED,
            params: {
              success: false,
              errorMsg: JSON.stringify(e),
            },
          });
        }
      });
    async function requestApprovalLoop({ uiRequestComponent, ...rest }) {
      ctx.request.requestedApproval = true;
      const res = await notificationService.requestApproval({
        approvalComponent: uiRequestComponent,
        params: rest,
        origin,
        approvalType,
      });
      if (res.uiRequestComponent) {
        return await requestApprovalLoop(res);
      } else {
        return res;
      }
    }
    if (uiRequestComponent) {
      ctx.request.requestedApproval = true;
      return await requestApprovalLoop({ uiRequestComponent, ...rest });
    }

    return requestDefer;
  })
  .callback();

export default (request) => {
  const ctx: any = { request: { ...request, requestedApproval: false } };
  return flowContext(ctx).finally(() => {
    if (ctx.request.requestedApproval) {
      flow.requestedApproval = false;
      // only unlock notification if current flow is an approval flow
      notificationService.unLock();
    }
  });
};
