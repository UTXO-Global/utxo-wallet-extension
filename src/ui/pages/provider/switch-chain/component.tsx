import { useGetCurrentNetwork } from "@/ui/states/walletState";
import Layout from "../layout";
import { t } from "i18next";
import { useControllersState } from "@/ui/states/controllerState";
import { useEffect, useMemo, useState } from "react";
import { ArrowLongRightIcon } from "@heroicons/react/24/solid";
import { ChainSlug } from "@/shared/networks/types";

const SwitchChain = () => {
  const [newChain, setNewChain] = useState<string>("");
  const currentNetwork = useGetCurrentNetwork();
  const { notificationController } = useControllersState((v) => ({
    notificationController: v.notificationController,
  }));

  const currentChain = useMemo(() => {
    switch (currentNetwork.slug.split("_", 1)[0] as ChainSlug) {
      case "btc":
        return "Bitcoin";
      case "nervos":
        return "Nervos";
    }
  }, [currentNetwork]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const approval = await notificationController.getApproval();
      const chainSlug = approval.params.data.chain as ChainSlug;
      switch (chainSlug) {
        case "btc":
          setNewChain("Bitcoin");
          break;
        case "nervos":
          setNewChain("Nervos");
      }
    })();
  }, [notificationController]);

  return (
    <Layout
      documentTitle={t("provider.switch_chain")}
      resolveBtnText={t("provider.switch_chain")}
      resolveBtnClassName="text-text bg-primary hover:bg-[#F5F5F5]"
    >
      <h3 className="text-[24px] leading-[28px] font-medium text-primary text-center">
        {t("provider.allow_switch_chain")}
      </h3>

      <div className="rounded-lg bg-[#F5F5F5] p-4 flex items-center gap-2 mt-6">
        <div className="flex justify-between w-full">
          <p className="text-[18px] leading-[140%] font-medium">
            {currentChain}
          </p>
          <ArrowLongRightIcon className="w-7" />
          <p className="text-[18px] leading-[140%] font-medium">{newChain}</p>
        </div>
      </div>
    </Layout>
  );
};
export default SwitchChain;
