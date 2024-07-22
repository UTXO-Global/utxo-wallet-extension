import { useControllersState } from "@/ui/states/controllerState";
import { t } from "i18next";
import { FC, useEffect, useState } from "react";
import ReactLoading from "react-loading";

interface Props {
  documentTitle: string;
  children: React.ReactNode;
  resolveBtnText?: string;
  resolveBtnClassName: string;
}

const Layout: FC<Props> = ({
  children,
  documentTitle,
  resolveBtnClassName,
  resolveBtnText,
}) => {
  const [origin, setOrigin] = useState<string>("");
  const [iconUrl, setIconUrl] = useState<string>("");

  const { notificationController } = useControllersState((v) => ({
    notificationController: v.notificationController,
  }));

  useEffect(() => {
    document.title = documentTitle;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const approval = await notificationController.getApproval();
      setOrigin(approval.params.session.origin);
      setIconUrl(approval.params.session.icon);
    })();
  }, [documentTitle, notificationController]);

  if (!origin) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <ReactLoading type="cylon" color="#ODODOD" />
      </div>
    );
  }

  const onResolve = async () => {
    await notificationController.resolveApproval();
  };

  const onReject = async () => {
    await notificationController.rejectApproval();
  };

  return (
    <div className="flex flex-col justify-between px-4 w-full min-h-screen pt-10 pb-6">
      <div>
        <div className="flex justify-center">
          <div className="rounded-[100px] px-4 py-2 flex gap-2 justify-center text-base border border-primary">
            <img src={iconUrl} className="w-6 h-6 rounded-xl" alt="icon" />
            <span>{origin}</span>
          </div>
        </div>

        <div className="mt-[48px]">
          {children}
        </div>
      </div>

      <div className="grid gap-2 grid-cols-2 pt-4">
        <button className="btn secondary" onClick={onReject}>
          {t("provider.reject")}
        </button>
        <button className="btn primary" onClick={onResolve}>
          {resolveBtnText ?? t("provider.resolve")}
        </button>
      </div>
    </div>
  );
};

export default Layout;
