import PasswordInput from "@/ui/components/password-input";
import { useAppState } from "@/ui/states/appState";
import { useControllersState } from "@/ui/states/controllerState";
import { useWalletState } from "@/ui/states/walletState";
import { isNotification } from "@/ui/utils";
import { useSyncStorages } from "@/ui/utils/setup";
import { t } from "i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import s from "./styles.module.scss";

interface FormType {
  password: string;
}

const Login = () => {
  const { register, handleSubmit } = useForm<FormType>({
    defaultValues: {
      password: "",
    },
  });
  const { updateAppState } = useAppState((v) => ({
    updateAppState: v.updateAppState,
  }));

  const { updateWalletState, vaultIsEmpty } = useWalletState((v) => ({
    updateWalletState: v.updateWalletState,
    vaultIsEmpty: v.vaultIsEmpty,
  }));
  const navigate = useNavigate();
  const { walletController, notificationController } = useControllersState(
    (v) => ({
      walletController: v.walletController,
      notificationController: v.notificationController,
    })
  );
  const syncStorages = useSyncStorages();

  useEffect(() => {
    if (vaultIsEmpty) navigate("/account/create-password");
  }, [vaultIsEmpty, navigate]);

  const login = async ({ password }: FormType) => {
    try {
      await syncStorages();
      const exportedWallets = await walletController.importWallets(password);
      await updateWalletState({
        wallets: exportedWallets,
      });
      await updateAppState({
        isUnlocked: true,
        password: password,
      });

      if (!isNotification()) navigate("/");
      else await notificationController.resolveApproval();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-4 w-full flex flex-col justify-center">
      <img
        src="/account.png"
        alt="utxo global"
        className="w-[80px] mx-auto mb-6"
      />
      <form
        className="w-full flex flex-col gap-6"
        onSubmit={handleSubmit(login)}
      >
        <div className="w-full justify-center flex form-title mb-4 capitalize">
          {t("login.welcome_back")}
        </div>
        <PasswordInput
          showSeparateLabel={false}
          register={register}
          label={t("login.password")}
          name="password"
        />
        <button className="btn primary standard:mx-auto" type="submit">
          {t("login.login")}
        </button>
      </form>
    </div>
  );
};

export default Login;
