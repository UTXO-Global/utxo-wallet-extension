import { FC, useId } from "react";
import { useAppState } from "@/ui/states/appState";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { t } from "i18next";
import PasswordInput from "../password-input/component";

interface Props {
  handler: (password?: string) => void;
}

interface FormType {
  password: string;
}

const CheckPassword: FC<Props> = ({ handler }) => {
  const { appPassword } = useAppState((v) => ({ appPassword: v.password }));

  const pwdId = useId();

  const { register, handleSubmit } = useForm<FormType>();

  const checkPassword = ({ password }: FormType) => {
    if (password !== appPassword)
      return toast.error(
        t("components.check_password.incorrect_password_error")
      );
    handler(password);
  };

  return (
    <form
      className="flex flex-col justify-between gap-4 h-full"
      onSubmit={handleSubmit(checkPassword)}
    >
      <div className="flex flex-col gap-4 justify-start">
        <label
          htmlFor={pwdId}
          className="text-[20px] leading-[28px] text-primary font-medium"
        >
          {t("components.check_password.enter_password")}
        </label>
        <PasswordInput
          showSeparateLabel={false}
          register={register}
          label={t("login.password")}
          name="password"
        />
      </div>

      <button className="btn primary" type="submit">
        {t("components.check_password.continue")}
      </button>
    </form>
  );
};

export default CheckPassword;
