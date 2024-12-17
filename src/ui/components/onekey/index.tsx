import Modal from "../modal";
import { BackspaceIcon } from "@heroicons/react/16/solid";
import React, { useContext, useRef } from "react";
import { useEffect, useState } from "react";
import {
  UI_EVENT,
  UI_RESPONSE,
  CoreMessage,
  UI_REQUEST,
} from "@onekeyfe/hd-core";
import HdWebSdk from "@onekeyfe/hd-web-sdk";

const keyboardMap = ["7", "8", "9", /**/ "4", "5", "6", /**/ "1", "2", "3"];

const OneKeyContext = React.createContext(null);

export function useOneKey() {
  const context = useContext(OneKeyContext);
  if (context === null) {
    throw new Error("useOneKey must be used within a OneKeyProvider");
  }

  return context;
}

export default function OneKeyProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const sdkRef = useRef(null);

  // Lazily initialize the instance
  if (!sdkRef.current) {
    const { HardwareWebSdk: HardwareSDK } = HdWebSdk;
    sdkRef.current = HardwareSDK;
  }

  const [openPinModal, setOpenPinModal] = useState(false);
  const [openPassphrase, setOpenPassphrase] = useState(false);
  const [openActionRequired, setOpenActionRequired] = useState(false);
  const [pin, setPin] = useState("");

  useEffect(() => {
    sdkRef.current
      .init({
        debug: true,
        fetchConfig: false,
        connectSrc: "https://jssdk.onekey.so/1.0.16-alpha.0/",
      })
      .then((success) => {
        if (success) {
          sdkRef.current.on(UI_EVENT, (message: CoreMessage) => {
            // Handle the PIN code input event
            if (message.type === UI_REQUEST.REQUEST_PIN) {
              setOpenPinModal(true);
              setPin("");
            }

            // Handle the passphrase event
            if (message.type === UI_REQUEST.REQUEST_PASSPHRASE) {
              setOpenPassphrase(true);
              // Enter the passphrase on the device
              sdkRef.current.uiResponse({
                type: UI_RESPONSE.RECEIVE_PASSPHRASE,
                payload: {
                  value: "",
                  passphraseOnDevice: true,
                  save: false,
                },
              });
            }

            if (message.type === UI_REQUEST.REQUEST_BUTTON) {
              // Confirmation is required on the device, a UI prompt can be displayed
              setOpenActionRequired(true);
            }

            if (message.type === UI_REQUEST.CLOSE_UI_WINDOW) {
              setOpenActionRequired(false);
            }
          });
        }
      });
  }, []);

  return (
    <OneKeyContext.Provider value={sdkRef.current}>
      {children}
      <Modal
        open={openPinModal}
        onClose={() => {
          setOpenPinModal(false);
        }}
        title={"Input Pin"}
      >
        <div className="grid gap-4">
          <div className="flex flex-col items-center justify-center">
            <p className="font-bold">
              {pin.replaceAll(/\d/g, "*")}
              <span className="animate-blink">|</span>
            </p>
            <div className="grid grid-cols-3 grid-rows-3 gap-4 py-4">
              {keyboardMap.map((number) => (
                <div
                  key={number}
                  className="border-solid border-2 w-8 h-8 flex items-center justify-center font-bold cursor-pointer"
                  onClick={() => {
                    setPin((value) => value + number.toString());
                  }}
                >
                  •
                </div>
              ))}
            </div>
            <div className="flex gap-5">
              <button
                className="btn primary h-[50px]"
                onClick={() => {
                  setPin((value) => value.slice(0, -1));
                }}
              >
                <BackspaceIcon title="backspace" className="w-8 h-8" />
              </button>
              <button
                className="btn primary h-[50px]"
                onClick={() => {
                  sdkRef.current.uiResponse({
                    type: UI_RESPONSE.RECEIVE_PIN,
                    payload: pin,
                  });
                  setOpenPinModal(false);
                }}
              >
                Submit
              </button>
              <button
                className="btn primary h-[50px]"
                onClick={() => {
                  sdkRef.current.uiResponse({
                    type: UI_RESPONSE.RECEIVE_PIN,
                    payload: "@@ONEKEY_INPUT_PIN_IN_DEVICE",
                  });
                  setOpenPinModal(false);
                }}
              >
                Input In Device
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={openPassphrase}
        onClose={() => {
          setOpenPassphrase(false);
        }}
        title={"Request Passphrase"}
      >
        <div className="grid gap-4"></div>
      </Modal>

      <Modal
        open={openActionRequired}
        onClose={() => {
          setOpenActionRequired(false);
        }}
        title={"Confirmation is required"}
      >
        <div className="grid gap-4">
          <p>Confirmation is required on the device</p>
        </div>
      </Modal>
    </OneKeyContext.Provider>
  );
}
