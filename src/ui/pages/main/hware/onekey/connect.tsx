import WalletPanel from "../../wallet/wallet-panel";
import BottomPanel from "../../wallet/bottom-panel";
import { useCallback, useEffect, useState } from "react";
import { SearchDevice } from "@onekeyfe/hd-core";
import { useCreateNewWallet } from "@/ui/hooks/wallet";
import { HDOneKeyOptions } from "@/background/services/keyring/ckbhdw/hd/types";
import { useNavigate } from "react-router-dom";
import { useWalletState } from "@/ui/states/walletState";
import toast from "react-hot-toast";
import Loading from "react-loading";
import { useOneKey } from "@/ui/components/onekey/hook";

export default function OneKeyConnect() {
  const onekeySdk = useOneKey();
  const [devices, setDevices] = useState<SearchDevice[]>([]);
  const createNewWallet = useCreateNewWallet();
  const navigate = useNavigate();
  const { updateWalletState } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
  }));
  const [loading, setLoading] = useState<boolean>(false);

  const connectOnekey = async (connectId: string, deviceId: string) => {
    setLoading(true);
    try {
      const payload: HDOneKeyOptions = { connectId, deviceId };
      await createNewWallet({
        payload: JSON.stringify(payload),
        walletType: "onekey",
      });
      await updateWalletState({ vaultIsEmpty: false });

      navigate("/home");
    } catch (e) {
      if (e.message === "Already existed") {
        toast.error(e.message);
      } else {
        toast.error("failed to connect device");
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchDevices();
  }, []);

  const searchDevices = useCallback(async () => {
    setLoading(true);
    const searchDeviceResponse = await onekeySdk.searchDevices();
    if (
      searchDeviceResponse.success &&
      searchDeviceResponse.payload.length > 0
    ) {
      // Use the first device in the search results
      const devices: SearchDevice[] = searchDeviceResponse.payload;

      setDevices(devices);
    }
    setLoading(false);
  }, [setLoading]);

  return (
    <div className="w-full h-full top-0 relative">
      <div className="!h-100vh-72px standard:!h-100vh-100px overflow-auto">
        <WalletPanel />
        <div className="text-center mt-10 flex flex-col gap-3">
          <button className="btn primary" onClick={searchDevices}>
            Search Devices
          </button>

          {loading ? (
            <Loading className="mx-auto" color="#ODODOD" />
          ) : (
            <div>
              {devices.length === 0 ? (
                <p>
                  <i>No devices found</i>
                </p>
              ) : (
                <>
                  <b>Devices</b>
                  <div className="mt-10 overflow-hidden shadow-sm">
                    <table className="border-collapse table-auto w-full text-sm">
                      <thead>
                        <tr>
                          <th className="border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 text-left">
                            Name
                          </th>
                          <th className="border-b font-medium p-4 pr-8 pt-0 pb-3 text-slate-400 text-left"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {devices.map((device) => (
                          <tr key={device.uuid}>
                            <td className="text-left border-b border-slate-100 p-4 pl-8 text-slate-500 ">
                              {device.name}
                            </td>
                            <td className="text-left border-b border-slate-100 p-4 pr-8 text-slate-500 ">
                              <button
                                className="btn primary"
                                onClick={() =>
                                  connectOnekey(
                                    device.connectId,
                                    device.deviceId
                                  )
                                }
                              >
                                Connect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="absolute w-full bottom-0">
        <BottomPanel />
      </div>
    </div>
  );
}
