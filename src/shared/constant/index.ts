export const KEYRING_TYPE = {
  HdKeyring: "HD Key Tree",
  HDPrivateKeyring: "Simple Key Pair",
  Empty: "Empty",
};

export const IS_CHROME = /Chrome\//i.test(navigator.userAgent);

export const IS_LINUX = /linux/i.test(navigator.userAgent);

export const IS_WINDOWS = /windows/i.test(navigator.userAgent);

export const EVENTS = {
  broadcastToUI: "broadcastToUI",
  broadcastToBackground: "broadcastToBackground",
  SIGN_FINISHED: "SIGN_FINISHED",
  WALLETCONNECT: {
    STATUS_CHANGED: "WALLETCONNECT_STATUS_CHANGED",
    INIT: "WALLETCONNECT_INIT",
    INITED: "WALLETCONNECT_INITED",
  },
};

export const SATS_DOMAIN = ".sats";

export const CHANNEL = "chrome";

export const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
export const FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN;
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
export const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET;
export const FIREBASE_MESSAGING_SENDER_ID =
  process.env.FIREBASE_MESSAGING_SENDER_ID;
export const FIREBASE_MEASUREMENT_ID = process.env.FIREBASE_MEASUREMENT_ID;
export const FIREBASE_APP_ID = process.env.FIREBASE_APP_ID;
export const TOKEN_FILE_ICON_DEFAULT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAMAAAC7IEhfAAAAM1BMVEXY2Njg4ODe3t7f39/f39/e3t7f39/e3t7f39/h4eHZ3do9xopUyJI1xons7OxMx48rxYapbHuqAAAACnRSTlMBWj7/rteB9pQd8yud7QAAAaZJREFUOMuNVYuyqyAMVCNEEcH//9ob8sCgds5NO6MD24TNLuk0DbHENSBFWOMy/Yw9BigFOOgZ4v4N25B2UXCASFjcPqAzUq4EDalgehScn7jtTgb8A8WWbcStBdEQCdwblnXEvZJZDMitICQOgSYX4KrPhfZyzrVmQeaqn8wrRRnt7XSpXud5GZDeJWQl7L0wbZ7HcdJy0neJtkLH3DQhA225ZR+BBG0pY7HSx1W1NAO5tKyUSMAARqAdnUMyMhvOiCWQX6x/HMKW81VrD38Xquy6rHzd6TSo9lrwFsXzrV3KxPIEUzW9+aZb0DCh1/fN1zZxwoHMwNepr0BWIz/55qxaW0ZV48m3q8+2R+n3i29y6isZbc/TCC2j05raExVYn3y7+uyfKBL20p5vN26LpZuiZex8nUGkKcF8OxydFb+81myzdhNSz3g7PDtl2LiPqwCPawH9KvTLdQjfpK12WuNu1xWbw83P4nZ7bwlnPwCgWwDAefsubKPn10z5MXw8qnv7PfZur6u332NPBikOWRN+DVIZzbwLNnm/R/P/D/s//j7+AfccJvKX0crTAAAAAElFTkSuQmCC";
