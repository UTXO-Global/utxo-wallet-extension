import { useAppState } from "@/ui/states/appState";
import PasswordInput from "@/ui/components/password-input";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { t } from "i18next";
import Analytics from "@/ui/utils/gtm";

interface FormType {
  password: string;
  confirmPassword: string;
}

const CreatePassword = () => {
  const formFields: { name: keyof FormType; label: string }[] = [
    {
      label: t("create_password.password"),
      name: "password",
    },
    {
      label: t("create_password.confirm_password"),
      name: "confirmPassword",
    },
  ];

  const { register, handleSubmit } = useForm<FormType>({
    defaultValues: {
      confirmPassword: "",
      password: "",
    },
  });
  const { updateAppState } = useAppState((v) => ({
    updateAppState: v.updateAppState,
  }));

  const createPassword = async ({ confirmPassword, password }: FormType) => {
    if (password === confirmPassword) {
      await updateAppState({ password, isUnlocked: true });
      // NOTE: [GA] - Create password
      await Analytics.fireEvent("ob_create_password", {
        action: "click",
        label: "create password",
      });
    } else {
      toast.error("Passwords dismatches");
    }
  };

  return (
    <form
      className="w-full px-4 flex flex-col justify-center"
      onSubmit={handleSubmit(createPassword)}
    >
      <img src="/account.png" alt="utxo global" className="w-[80px] mx-auto mb-6" />
      <p className="form-title">{t("create_password.create_password")}</p>
      <p className="text-center text-[#787575] mt-2 mb-10">
        {t("create_password.sub_title")}
      </p>
      <div className="grid gap-4 mb-6">
        {formFields.map((i, f) => (
          <PasswordInput
            tabIndex={f + 1}
            showSeparateLabel={false}
            key={i.name}
            register={register}
            {...i}
          />
        ))}
      </div>

      <button className="btn primary" type="submit">
        {t("create_password.create_password")}
      </button>
    </form>
  );
};

export default CreatePassword;
