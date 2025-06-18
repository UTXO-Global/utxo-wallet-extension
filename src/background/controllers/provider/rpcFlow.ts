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
  dogecoinProviderController,
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
    console.log('[UTXO Global RPC Flow] Starting provider selection');
    const {
      data: { provider },
    } = ctx.request;
    console.log('[UTXO Global RPC Flow] Provider:', provider);
    
    switch (provider) {
      case "btc":
        ctx.providerController = btcProviderController;
        ctx.providerController._switchChain("btc");
        console.log('[UTXO Global RPC Flow] Selected BTC provider');
        break;
      case "ckb":
        ctx.providerController = ckbProviderController;
        ctx.providerController._switchChain("nervos");
        console.log('[UTXO Global RPC Flow] Selected CKB provider');
        break;
      case "dogecoin":
        ctx.providerController = dogecoinProviderController;
        ctx.providerController._switchChain("dogecoin");
        console.log('[UTXO Global RPC Flow] Selected Dogecoin provider');
        break;
      default:
        ctx.providerController = providerController;
        console.log('[UTXO Global RPC Flow] Selected default provider');
    }

    return next();
  })
  .use(async (ctx, next) => {
    const {
      data: { method },
    } = ctx.request;
    console.log('[UTXO Global RPC Flow] Processing method:', method);
    
    ctx.mapMethod = underline2Camelcase(method);
    if (!ctx.providerController[ctx.mapMethod]) {
      console.error('[UTXO Global RPC Flow] Method not found:', method);
      throw ethErrors.rpc.methodNotFound({
        message: `method [${method}] doesn't has corresponding handler`,
        data: ctx.request.data,
      });
    }
    console.log('[UTXO Global RPC Flow] Mapped method:', ctx.mapMethod);

    return next();
  })
  .use(async (ctx, next) => {
    const { mapMethod } = ctx;
    console.log('[UTXO Global RPC Flow] Checking internal method:', mapMethod);
    
    if (Reflect.getMetadata("INTERNAL", providerController, mapMethod)) {
      console.error('[UTXO Global RPC Flow] Invalid internal method call');
      throw ethErrors.rpc.invalidRequest({
        message: `there is a invalid request`,
      });
    }

    return next();
  })
  .use(async (ctx, next) => {
    const { mapMethod } = ctx;
    console.log('[UTXO Global RPC Flow] Checking wallet lock status');
    
    if (
      !Reflect.getMetadata("SAFE", ctx.providerController, mapMethod) &&
      !Reflect.getMetadata("CONNECTED", providerController, mapMethod)
    ) {
      if (!storageService.appState.isUnlocked) {
        console.log('[UTXO Global RPC Flow] Wallet is locked, requesting unlock');
        ctx.request.requestedApproval = true;
        await notificationService.requestApproval({ lock: true });
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    const { mapMethod } = ctx;
    console.log('[UTXO Global RPC Flow] Checking site connection status');
    
    if (Reflect.getMetadata("SAFE", providerController, mapMethod)) {
      const isConnected = await permissionService.siteIsConnected(ctx.request.session.origin);
      console.log('[UTXO Global RPC Flow] Site connection status:', isConnected);
      
      if (!isConnected) {
        return;
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    console.log('[UTXO Global RPC Flow] Checking connection requirements');
    const {
      request: {
        session: { origin, name, icon },
      },
      mapMethod,
    } = ctx;
    if (
      !Reflect.getMetadata("SAFE", ctx.providerController, mapMethod) &&
      !Reflect.getMetadata("CONNECTED", providerController, mapMethod)
    ) {
      const isConnected = await permissionService.siteIsConnected(ctx.request.session.origin);
      console.log('[UTXO Global RPC Flow] Site connection check:', isConnected);
      
      if (!isConnected) {
        console.log('[UTXO Global RPC Flow] Requesting connection approval');
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
    console.log('[UTXO Global RPC Flow] Checking method approval requirements');
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
    
    console.log('[UTXO Global RPC Flow] Approval type:', approvalType);
    console.log('[UTXO Global RPC Flow] Approval condition:', condition);

    if (approvalType && (!condition || !condition(ctx.request))) {
      console.log('[UTXO Global RPC Flow] Requesting method approval');
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
    console.log('[UTXO Global RPC Flow] Processing final request');
    const { approvalRes, mapMethod, request } = ctx;
    
    const [approvalType] =
      Reflect.getMetadata("APPROVAL", ctx.providerController, mapMethod) || [];

    const { uiRequestComponent, ...rest } = approvalRes || {};
    const {
      session: { origin },
    } = request;
    
    console.log('[UTXO Global RPC Flow] Executing method:', mapMethod);
    const requestDefer = Promise.resolve(
      ctx.providerController[mapMethod]({
        ...request,
        approvalRes,
      })
    );

    requestDefer
      .then((result) => {
        console.log('[UTXO Global RPC Flow] Method execution successful:', result);
        if (isSignApproval(approvalType)) {
          console.log('[UTXO Global RPC Flow] Broadcasting sign finished event');
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
        console.error('[UTXO Global RPC Flow] Method execution failed:', e);
        
        if (e.code === 4001 || e.code === 4900 || e.code === 4901) {
          console.log('[UTXO Global RPC Flow] Broadcasting disconnect event');
          eventBus.emit(EVENTS.broadcastToUI, {
            method: "disconnect",
            params: {
              error: e.message || "Connection error"
            }
          });
        }

        if (isSignApproval(approvalType)) {
          console.log('[UTXO Global RPC Flow] Broadcasting sign failed event');
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
      console.log('[UTXO Global RPC Flow] Starting approval loop');
      ctx.request.requestedApproval = true;
      const res = await notificationService.requestApproval({
        approvalComponent: uiRequestComponent,
        params: rest,
        origin,
        approvalType,
      });
      if (res.uiRequestComponent) {
        console.log('[UTXO Global RPC Flow] Continuing approval loop');
        return await requestApprovalLoop(res);
      } else {
        console.log('[UTXO Global RPC Flow] Approval loop complete');
        return res;
      }
    }
    
    if (uiRequestComponent) {
      console.log('[UTXO Global RPC Flow] Processing UI request component');
      ctx.request.requestedApproval = true;
      return await requestApprovalLoop({ uiRequestComponent, ...rest });
    }

    return requestDefer;
  })
  .callback();

export default (request) => {
  console.log('[UTXO Global RPC Flow] New request received:', request);
  const ctx: any = { request: { ...request, requestedApproval: false } };
  return flowContext(ctx).finally(() => {
    if (ctx.request.requestedApproval) {
      console.log('[UTXO Global RPC Flow] Cleaning up approval state');
      flow.requestedApproval = false;
      notificationService.unLock();
    }
    console.log('[UTXO Global RPC Flow] Request processing complete');
  });
};
