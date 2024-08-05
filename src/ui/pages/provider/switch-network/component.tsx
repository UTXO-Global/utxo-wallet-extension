import { useGetCurrentNetwork } from "@/ui/states/walletState";
import Layout from "../layout";
import { t } from "i18next";
import { useControllersState } from "@/ui/states/controllerState";
import { useEffect, useState } from "react";
import { ArrowLongRightIcon } from "@heroicons/react/24/solid";
import { getNetworkDataBySlug } from "@/shared/networks";
import { NetworkData } from "@/shared/networks/types";

const SwitchNetwork = () => {
  const [newNetwork, setNewNetwork] = useState<NetworkData>();
  const currentNetwork = useGetCurrentNetwork();
  const { notificationController } = useControllersState((v) => ({
    notificationController: v.notificationController,
  }));

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const approval = await notificationController.getApproval();
      const network = getNetworkDataBySlug(approval.params.data.network);
      if (network) {
        setNewNetwork(network);
      }
    })();
  }, [notificationController]);

  return (
    <Layout
      documentTitle={t("provider.switch_network")}
      resolveBtnText={t("provider.switch_network")}
      resolveBtnClassName="text-text bg-primary hover:bg-[#F5F5F5]"
    >
      <h3 className="text-[24px] leading-[28px] font-medium text-primary text-center">
        {t("provider.allow_switch_network")}
      </h3>

      <div className="rounded-lg bg-[#F5F5F5] p-4 flex items-center gap-2 mt-6">
        <div className="flex justify-between w-full">
          <p className="text-[18px] leading-[140%] font-medium">
            {currentNetwork.name}
          </p>
          <ArrowLongRightIcon className="w-7" />
          <p className="text-[18px] leading-[140%] font-medium">
            {newNetwork?.name}
          </p>
        </div>
      </div>
    </Layout>
  );
};
export default SwitchNetwork;
