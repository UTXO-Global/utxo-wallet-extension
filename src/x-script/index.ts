import { Message } from "@/shared/utils/message";

function injectScript() {
  try {
    if (window.location.hostname.includes("x.com")) {
      const gifElement = document.createElement("img");
      gifElement.src =
        "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdWNxOXNncGYxaWxta2h4aWx2ZzJkOWFudmppbjlrZ3dtejNybjUzbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/n2pEms37feoXhzB6pC/giphy.webp";
      gifElement.style.position = "fixed";
      gifElement.style.bottom = "20px";
      gifElement.style.left = "20px";
      gifElement.style.width = "100px";
      gifElement.style.zIndex = "10000";
      gifElement.style.cursor = "pointer";

      document.body.appendChild(gifElement);

      const { PortMessage } = Message;
      const pm = new PortMessage().connect(); // TODO:

      gifElement.addEventListener("click", () => {
        const data = {
          provider: "ckb",
          method: "signMessage",
          params: {
            text: "claim reward on twitter: id = 100",
            address:
              "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqg8qhcdzatwkn9u7lrmkzvqkawq2xpc0esc207hu",
          },
        };
        pm.request(data).then((result) => {
          if (result && (result as string).startsWith("0x")) {
            gifElement.src =
              "https://media1.giphy.com/media/KkZPnRUQ7o8u5WWfQc/giphy.webp?cid=ecf05e47d1zfkfbpf6h6x5twcrutuvue438dqbkjkz596g2k&ep=v1_gifs_search&rid=giphy.webp&ct=g";
            alert("claim success");
          }
        });
      });

      pm.on("message", (data) => {
        console.log("message", { data });
      });

      document.addEventListener("beforeunload", () => {
        pm.dispose();
      });
    }
  } catch (error) {
    console.error("UTXO Global: Provider injection failed.", error);
  }
}

/**
 * Checks the doctype of the current document if it exists
 *
 * @returns {boolean} {@code true} if the doctype is html or if none exists
 */
function doctypeCheck() {
  const { doctype } = window.document;
  if (doctype) {
    return doctype.name === "html";
  }
  return true;
}

/**
 * Returns whether the extension (suffix) of the current document is prohibited
 *
 * This checks {@code window.location.pathname} against a set of file extensions
 * that we should not inject the provider into. This check is indifferent of
 * query parameters in the location.
 *
 * @returns {boolean} whether or not the extension of the current document is prohibited
 */
function suffixCheck() {
  const prohibitedTypes = [/\.xml$/u, /\.pdf$/u];
  const currentUrl = window.location.pathname;
  for (let i = 0; i < prohibitedTypes.length; i++) {
    if (prohibitedTypes[i].test(currentUrl)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks the documentElement of the current document
 *
 * @returns {boolean} {@code true} if the documentElement is an html node or if none exists
 */
function documentElementCheck() {
  const documentElement = document.documentElement.nodeName;
  if (documentElement) {
    return documentElement.toLowerCase() === "html";
  }
  return true;
}

/**
 * Checks if the current domain is blocked
 *
 * @returns {boolean} {@code true} if the current domain is blocked
 */
function blockedDomainCheck() {
  const blockedDomains: string[] = [];
  const currentUrl = window.location.href;
  let currentRegex;
  for (let i = 0; i < blockedDomains.length; i++) {
    const blockedDomain = blockedDomains[i].replace(".", "\\.");
    currentRegex = new RegExp(
      `(?:https?:\\/\\/)(?:(?!${blockedDomain}).)*$`,
      "u"
    );
    if (!currentRegex.test(currentUrl)) {
      return true;
    }
  }
  return false;
}

function iframeCheck() {
  return window.self != window.top;
}

/**
 * Determines if the provider should be injected
 *
 * @returns {boolean} {@code true} Whether the provider should be injected
 */
function shouldInjectProvider() {
  return (
    doctypeCheck() &&
    suffixCheck() &&
    documentElementCheck() &&
    !blockedDomainCheck() &&
    !iframeCheck()
  );
}

if (shouldInjectProvider()) {
  try {
    injectScript();
  } catch (e) {
    console.log(e);
  }
}
