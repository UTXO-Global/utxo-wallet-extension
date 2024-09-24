import { useCreateNewGroupAccount } from "@/ui/hooks/wallet";
import {
  useGetCurrentNetwork,
  useGetCurrentWallet,
} from "@/ui/states/walletState";
import { t } from "i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Loading from "react-loading";
import { useNavigate } from "react-router-dom";

interface FormType {
  name: string;
}

const NewAccount = () => {
  const navigate = useNavigate();

  const createNewAccount = useCreateNewGroupAccount();
  const currentWallet = useGetCurrentWallet();
  const currentNetwork = useGetCurrentNetwork();
  const { register, handleSubmit, reset } = useForm<FormType>({
    defaultValues: {
      name: "",
    },
  });

  const [loading, setLoading] = useState<boolean>(false);

  const nameAlreadyExists = (name: string) => {
    return (
      currentWallet?.accounts
        .filter((z) => z.network === currentNetwork.slug)
        .find((f) => f.name?.trim() === name.trim()) !== undefined
    );
  };

  const setDefaultAccountName = () => {
    const index = currentWallet.accounts.filter(
      (z) => z.network === currentNetwork.slug
    ).length;
    reset({
      name: `Account ${index}`,
    });
  };
  
  const createNewAcc = async ({ name }: FormType) => {
    if (name.length > 16) return toast.error(t("new_account.max_length_error"));
    if (name.length == 0) return toast.error(t("new_account.empty_name"));
    if (nameAlreadyExists(name))
      return toast.error(t("new_account.name_taken_error"));
    setLoading(true);
    await createNewAccount(name);
    toast.success(t("new_account.account_created_message"));
    navigate("/home");
  };

  useEffect(() => {
    setDefaultAccountName();
  }, [currentWallet, currentNetwork]);

  if (loading) {
    return <Loading color="#ODODOD" />;
  }

  return (
    <form
      className="form"
      onSubmit={handleSubmit(createNewAcc)}
      style={{
        paddingBottom: "24px",
      }}
    >
      <p
        style={{
          fontSize: "16px",
          textAlign: "center",
        }}
      >
        {t("new_account.enter_name_label")}
      </p>
      <input
        type="text"
        className="input"
        {...register("name", {
          maxLength: 14,
        })}
      />

      <button className="btn primary capitalize" type="submit">
        {t("new_account.create_new_account")}
      </button>
    </form>
  );
};

export default NewAccount;
