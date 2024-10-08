/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  CompletedInscription,
  Inscription,
} from "@/shared/interfaces/inscriptions";
import { useCallback, useEffect, useState } from "react";
import { t } from "i18next";
import { browserTabsCreate } from "@/shared/utils/browser";
import { useLocation, useNavigate } from "react-router-dom";
import Loading from "react-loading";
import s from "./styles.module.scss";
import Iframe from "@/ui/components/iframe";
import { useGetCurrentNetwork } from "@/ui/states/walletState";

type PathOf<T> = T extends object
  ? {
      [K in keyof T & (string | number)]: K extends string | number
        ? `${K}` | (T[K] extends object ? `${K}.${PathOf<T[K]>}` : never)
        : never;
    }[keyof T & (string | number)]
  : "";

interface InscField<T, K extends PathOf<T> = PathOf<T>> {
  key?: K;
  link?: boolean;
  defaultValue?: any;
}

const fields: InscField<CompletedInscription>[] = [
  {
    key: "content_length",
  },
  {
    key: "inscription_number",
  },
  {
    key: "status.block_height",
  },
  {
    key: "content_type",
  },
  {
    key: "genesis",
  },
  {
    key: "preview",
    link: true,
  },
  {
    key: "content",
    link: true,
  },
  {
    key: "offset",
    defaultValue: 0,
  },
  {
    key: "value",
    defaultValue: "-",
  },
  {
    key: "outpoint",
  },
  {
    key: "inscription_id",
  },
  {
    key: "status.block_time",
  },
];

const InscriptionDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inscription, setInscription] = useState<
    CompletedInscription | undefined
  >(undefined);
  const currentNetwork = useGetCurrentNetwork();

  const convertToCompletedInscription = useCallback(
    (inscription: Inscription): CompletedInscription => {
      return {
        ...inscription,
        outpoint: `${inscription.txid}i${inscription.vout}`,
        genesis: inscription.inscription_id,
      };
    },
    []
  );

  useEffect(() => {
    if (!location.state) return navigate(-1);
    setInscription(convertToCompletedInscription(location.state));
  }, [location, navigate, convertToCompletedInscription]);

  const openContent = async (link: string) => {
    await browserTabsCreate({
      url: link,
      active: true,
    });
  };

  const send = () => {
    navigate("/pages/create-send", { state: inscription });
  };

  const getValue = <T,>(key: string) => {
    let current = inscription;
    for (const i of key.split(".")) {
      current = current[i];
    }
    if (key === "status.block_time")
      return new Date((current as unknown as number) * 1000).toLocaleString();
    return current as T;
  };

  if (inscription === undefined) return <Loading color="#ODODOD" />;

  return (
    <div className="flex flex-col justify-center items-center break-all gap-5 px-4 pb-3 rounded-xl">
      <div className="flex justify-center w-[318px] h-[318px] rounded-xl overflow-hidden">
        <Iframe
          preview={`${currentNetwork.htlmPreviewUrl}/${inscription.inscription_id}`}
          size="big"
        />
      </div>
      <div className="flex justify-center w-full">
        <button onClick={send} className="btn bg-white text-black w-2/3">
          {t("components.layout.send")}
        </button>
      </div>
      <div className={s.fields}>
        {fields.map((f, i) => (
          <div className={s.item} key={i}>
            <label className="uppercase text-slate-400">
              {t(`inscription_details.${f.key}`)}
            </label>
            {f.link ? (
              <div
                onClick={async () => {
                  await openContent(
                    `${
                      f.key === "content"
                        ? currentNetwork.contentUrl
                        : currentNetwork.previewUrl
                    }/${inscription.inscription_id}`
                  );
                }}
                className="text-orange-400 cursor-pointer pl-1 text-sm font-medium"
              >
                link
              </div>
            ) : (
              <div className="pl-1 text-sm font-medium">
                {getValue<string>(f.key) ?? f.defaultValue}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InscriptionDetails;
