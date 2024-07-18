import { FC, useEffect, useId } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import Modal from "../modal";
import { t } from "i18next";
import cn from "classnames";

interface Props {
  handler: (name: string) => void;
  active: boolean;
  onClose: () => void;
  currentName?: string;
}

const Rename: FC<Props> = ({ handler, active, onClose, currentName }) => {
  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ name: string }>({
    defaultValues: {
      name: "",
    },
  });
  const renameId = useId();

  const onRename = ({ name }: { name: string }) => {
    handler(name.trim());
  };

  const onSubmit = () => {
    if (errors.name) {
      toast.error(errors.name.message);
    }
  };

  useEffect(() => {
    setValue("name", currentName);
  }, [currentName, setValue]);

  return (
    <Modal
      open={active}
      onClose={onClose}
      title={t("components.rename.rename")}
    >
      <form
        className="flex flex-col gap-3 w-full"
        onSubmit={handleSubmit(onRename)}
      >
        <div>
          <input
            id={renameId}
            className="input w-full"
            {...register("name", {
              minLength: {
                value: 1,
                message: t("components.rename.enter_new_name"),
              },
              maxLength: {
                value: 16,
                message: t("components.rename.maximum_length"),
              },
              required: t("components.rename.name_is_required"),
            })}
          />
          <p className="text-xs text-[#A69C8C] text-right mt-1">
            <span
              className={cn({
                "text-[#FF4545]": watch("name").length > 16,
              })}
            >
              {watch("name").length}
            </span>
            /16
          </p>
        </div>
        <button className="btn primary !py-3" onClick={onSubmit}>
          {t("components.rename.save")}
        </button>
      </form>
    </Modal>
  );
};

export default Rename;
