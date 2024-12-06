import s from "../../wallet/styles.module.scss";
import { IcnSend } from "@/ui/components/icons";
import cn from "classnames";
import Loading from "react-loading";
import Modal from "@/ui/components/modal";
import { browserTabsCreate } from "@/shared/utils/browser";
import { useOnekeyNewAccount } from "@/ui/components/onekey/hook";

const NewOneKeyAccount = () => {
  const { importAccount, loading, openUpgradeModal } = useOnekeyNewAccount();
  return (
    <div className={`${s.accPanel} px-4`}>
      <div className={cn(`grid gap-2 !mt-6 pb-2`)}>
        <div
          className={cn(
            `py-3 px-4 flex gap-1 flex-col cursor-pointer justify-center items-center transition-all bg-grey-300 hover:bg-grey-200 rounded-[10px]`
          )}
          onClick={() => importAccount()}
        >
          {loading ? (
            <>
              <Loading color="#ODODOD" />
              <p>Loading account information from OneKey device</p>
            </>
          ) : (
            <>
              <IcnSend />
              <p className="text-base font-medium">Import OneKey account</p>
            </>
          )}
        </div>
      </div>

      <Modal
        onClose={() => {}}
        open={openUpgradeModal}
        title={"Upgrade Firmware Required"}
      >
        <div className="text-base text-primary px-4 flex flex-col items-center">
          <div className="text-sm">
            Device firmware version is too low. Please upgrade the latest
            firmware
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-3">
          <button
            className="btn w-full secondary"
            onClick={() =>
              browserTabsCreate({
                url: "https://firmware.onekey.so/",
              })
            }
          >
            Upgrade Now
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default NewOneKeyAccount;
