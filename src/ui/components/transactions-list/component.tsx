import s from "./styles.module.scss";
import {
  shortAddress,
  isIncomeTx,
  getTransactionValue,
  getTransactionTokenValue,
  isTxToken,
} from "@/shared/utils/transactions";
import { t } from "i18next";
import { Link } from "react-router-dom";
import { useGetCurrentNetwork } from "@/ui/states/walletState";
import cn from "classnames";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo, useState } from "react";
import { useControllersState } from "@/ui/states/controllerState";
import { ITransaction } from "@/shared/interfaces/api";
import { isBitcoinNetwork, isCkbNetwork } from "@/shared/networks";

const TransactionList = ({
  className,
  type,
  typeHash,
}: {
  className?: string;
  type?: string;
  typeHash?: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [lastBlock, setLastBlock] = useState(0);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const { ref, inView } = useInView();
  const currentNetwork = useGetCurrentNetwork();
  const { apiController } = useControllersState((v) => ({
    apiController: v.apiController,
  }));

  const isCKB = useMemo(() => {
    return type === typeHash && type === undefined;
  }, [type, typeHash]);

  useEffect(() => {
    const f = async () => {
      const block = await apiController.getLastBlock();
      setLastBlock(block);
    };

    f().catch((e) => {
      console.log(e);
    });
  }, [apiController]);

  useEffect(() => {
    const f = async () => {
      setLoading(true);
      if (isBitcoinNetwork(currentNetwork.network)) {
        setTransactions(await apiController.getTransactions());
      } else if (isCkbNetwork(currentNetwork.network)) {
        setTransactions(
          await apiController.getCKBTransactions({ type, typeHash })
        );
      }
      setLoading(false);
    };

    f().catch((e) => {
      console.log(e);
    });
  }, [currentNetwork, type, typeHash]);

  if (!Array.isArray(transactions)) {
    return (
      <p className={s.noTransactions}>{t("wallet_page.no_transactions")}</p>
    );
  }

  const txes: { key: string; title: string; data: any[] }[] = useMemo(() => {
    const txesMap = transactions.reduce((acc, item) => {
      let date = "unconfirmation";
      if (item.status.confirmed) {
        let blockTime = item.status.block_time;
        if (blockTime.toString().length <= 10) {
          blockTime = blockTime * 1000;
        }
        const d = new Date(blockTime);
        date = d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }

      if (!acc[date]) {
        acc[date] = {
          key: date,
          title: date === "unconfirmation" ? "Waiting for Confirmation" : date,
          data: [],
        };
      }

      acc[date].data.push(item);
      return acc;
    }, {} as any);

    const unconfirmation = txesMap["unconfirmation"];
    delete txesMap["unconfirmation"];

    const results = Object.keys(txesMap)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .reduce((acc, key) => {
        acc.push({ ...txesMap[key] });
        return acc;
      }, []);

    if (unconfirmation) {
      results.unshift({ ...unconfirmation });
    }
    return results;
  }, [transactions]);

  const NoTransaction = () => {
    return (
      <div className={s.noTransactions}>
        {t("wallet_page.no_transactions")}
        <svg
          width="209"
          height="30"
          viewBox="0 0 209 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_3351_10107)">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M150.941 3.90527H177.865C178.843 3.90527 179.646 4.83792 179.646 5.98429V9.88325C179.646 11.0296 178.843 11.9623 177.865 11.9623H150.941C149.963 11.9623 149.16 11.0296 149.16 9.88325V5.98429C149.16 4.83792 149.963 3.90527 150.941 3.90527Z"
              fill="#EBECEC"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M173.629 3.90527H177.865C178.843 3.90527 179.646 4.83792 179.646 5.98429V9.88325C179.646 11.0296 178.843 11.9623 177.865 11.9623H173.629C174.607 11.9623 175.41 11.0296 175.41 9.88325V5.98429C175.41 4.83792 174.607 3.90527 173.629 3.90527Z"
              fill="#F5F5F5"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M155.177 3.90527H150.941C149.963 3.90527 149.16 4.83792 149.16 5.98429V9.88325C149.16 11.0296 149.963 11.9623 150.941 11.9623H155.177C154.199 11.9623 153.396 11.0296 153.396 9.88325V5.98429C153.396 4.83792 154.199 3.90527 155.177 3.90527Z"
              fill="white"
            />
            <path
              d="M152.293 3.90527H151.458V11.9623H152.293V3.90527Z"
              fill="#F5F5F5"
            />
            <path
              d="M155.468 3.90527H154.633V11.9623H155.468V3.90527Z"
              fill="#F5F5F5"
            />
            <path
              d="M158.648 3.90527H157.812V11.9623H158.648V3.90527Z"
              fill="#F5F5F5"
            />
            <path
              d="M161.821 3.90527H160.985V11.9623H161.821V3.90527Z"
              fill="#F5F5F5"
            />
            <path
              d="M164.996 3.90527H164.16V11.9623H164.996V3.90527Z"
              fill="#F5F5F5"
            />
            <path
              d="M168.169 3.90527H167.333V11.9623H168.169V3.90527Z"
              fill="#F5F5F5"
            />
            <path
              d="M171.348 3.90527H170.513V11.9623H171.348V3.90527Z"
              fill="#F5F5F5"
            />
            <path
              d="M174.523 3.90527H173.688V11.9623H174.523V3.90527Z"
              fill="#F5F5F5"
            />
            <path
              d="M181.083 6.69627C180.992 4.09912 179.833 2.603 177.223 2.46699C174.723 2.33746 172.178 2.46699 169.678 2.46699H150.941C150.772 2.46699 150.623 2.49938 150.487 2.53824C147.268 3.36078 147.501 7.18202 147.715 9.8828C147.942 12.7325 149.982 13.3996 152.385 13.3996H171.705C173.7 13.3996 175.811 13.6004 177.793 13.3996C181.355 13.0434 181.167 9.43591 181.077 6.69627H181.083ZM178.207 9.35819C177.961 11.068 176.614 10.524 175.137 10.524H158.868C156.621 10.524 154.121 10.8349 151.893 10.524C150.966 10.3945 150.882 10.7442 150.604 9.54601C150.422 8.78824 150.273 5.80896 151.213 5.34912H170.72C172.696 5.34912 177.663 5.22606 177.851 5.34912C178.564 5.82839 178.311 8.66518 178.207 9.36466V9.35819Z"
              fill="#EBECEC"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M142.518 12.156H169.442C170.42 12.156 171.223 13.0886 171.223 14.235V18.134C171.223 19.2804 170.42 20.213 169.442 20.213H142.518C141.54 20.213 140.737 19.2804 140.737 18.134V14.235C140.737 13.0886 141.54 12.156 142.518 12.156Z"
              fill="#EBECEC"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M165.207 12.156H169.443C170.421 12.156 171.224 13.0886 171.224 14.235V18.134C171.224 19.2804 170.421 20.213 169.443 20.213H165.207C166.185 20.213 166.988 19.2804 166.988 18.134V14.235C166.988 13.0886 166.185 12.156 165.207 12.156Z"
              fill="#F5F5F5"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M146.754 12.156H142.518C141.54 12.156 140.737 13.0886 140.737 14.235V18.134C140.737 19.2804 141.54 20.213 142.518 20.213H146.754C145.776 20.213 144.973 19.2804 144.973 18.134V14.235C144.973 13.0886 145.776 12.156 146.754 12.156Z"
              fill="white"
            />
            <path
              d="M143.872 12.1562H143.036V20.2132H143.872V12.1562Z"
              fill="#F5F5F5"
            />
            <path
              d="M147.045 12.156H146.21V20.213H147.045V12.156Z"
              fill="#F5F5F5"
            />
            <path
              d="M150.226 12.156H149.391V20.213H150.226V12.156Z"
              fill="#F5F5F5"
            />
            <path
              d="M153.399 12.1562H152.563V20.2132H153.399V12.1562Z"
              fill="#F5F5F5"
            />
            <path
              d="M156.573 12.156H155.737V20.213H156.573V12.156Z"
              fill="#F5F5F5"
            />
            <path
              d="M159.747 12.156H158.911V20.213H159.747V12.156Z"
              fill="#F5F5F5"
            />
            <path
              d="M162.92 12.156H162.085V20.213H162.92V12.156Z"
              fill="#F5F5F5"
            />
            <path
              d="M166.1 12.156H165.265V20.213H166.1V12.156Z"
              fill="#F5F5F5"
            />
            <path
              d="M172.661 14.9475C172.571 12.3503 171.411 10.8542 168.801 10.7182C166.301 10.5887 163.756 10.7182 161.256 10.7182H142.519C142.35 10.7182 142.201 10.7506 142.065 10.7895C138.846 11.612 139.08 15.4332 139.293 18.134C139.52 20.9838 141.56 21.6509 143.963 21.6509H163.283C165.278 21.6509 167.389 21.8516 169.371 21.6509C172.933 21.2946 172.745 17.6871 172.655 14.9475H172.661ZM169.786 17.6094C169.539 19.3193 168.192 18.7752 166.716 18.7752H150.446C148.199 18.7752 145.699 19.0861 143.471 18.7752C142.545 18.6457 142.46 18.9954 142.182 17.7972C142.001 17.0395 141.852 14.0602 142.791 13.6003H162.299C164.274 13.6003 169.242 13.4773 169.429 13.6003C170.142 14.0796 169.889 16.9164 169.786 17.6159V17.6094Z"
              fill="#EBECEC"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M145.693 20.4141H172.617C173.595 20.4141 174.398 21.3467 174.398 22.4931V26.392C174.398 27.5384 173.595 28.4711 172.617 28.4711H145.693C144.715 28.4711 143.912 27.5384 143.912 26.392V22.4931C143.912 21.3467 144.715 20.4141 145.693 20.4141Z"
              fill="#EBECEC"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M168.382 20.4141H172.618C173.596 20.4141 174.399 21.3467 174.399 22.4931V26.392C174.399 27.5384 173.596 28.4711 172.618 28.4711H168.382C169.36 28.4711 170.163 27.5384 170.163 26.392V22.4931C170.163 21.3467 169.36 20.4141 168.382 20.4141Z"
              fill="#F5F5F5"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M149.929 20.4141H145.693C144.715 20.4141 143.912 21.3467 143.912 22.4931V26.392C143.912 27.5384 144.715 28.4711 145.693 28.4711H149.929C148.951 28.4711 148.148 27.5384 148.148 26.392V22.4931C148.148 21.3467 148.951 20.4141 149.929 20.4141Z"
              fill="white"
            />
            <path
              d="M147.046 20.4141H146.211V28.4711H147.046V20.4141Z"
              fill="#F5F5F5"
            />
            <path
              d="M150.226 20.4141H149.391V28.4711H150.226V20.4141Z"
              fill="#F5F5F5"
            />
            <path
              d="M153.401 20.4141H152.565V28.4711H153.401V20.4141Z"
              fill="#F5F5F5"
            />
            <path
              d="M156.574 20.4141H155.738V28.4711H156.574V20.4141Z"
              fill="#F5F5F5"
            />
            <path
              d="M159.748 20.4141H158.912V28.4711H159.748V20.4141Z"
              fill="#F5F5F5"
            />
            <path
              d="M162.928 20.4141H162.093V28.4711H162.928V20.4141Z"
              fill="#F5F5F5"
            />
            <path
              d="M166.101 20.4141H165.266V28.4711H166.101V20.4141Z"
              fill="#F5F5F5"
            />
            <path
              d="M169.276 20.4141H168.44V28.4711H169.276V20.4141Z"
              fill="#F5F5F5"
            />
            <path
              d="M175.836 23.2053C175.745 20.6082 174.586 19.112 171.976 18.976C169.476 18.8465 166.931 18.976 164.431 18.976H145.694C145.525 18.976 145.376 19.0084 145.24 19.0473C142.021 19.8698 142.254 23.6911 142.468 26.3918C142.695 29.2416 144.735 29.9087 147.138 29.9087H166.458C168.453 29.9087 170.564 30.1094 172.546 29.9087C176.108 29.5525 175.92 25.9449 175.83 23.2053H175.836ZM172.96 25.8672C172.714 27.5771 171.367 27.033 169.89 27.033H153.621C151.374 27.033 148.874 27.3439 146.646 27.033C145.719 26.9035 145.635 27.2532 145.357 26.055C145.175 25.2973 145.026 22.318 145.966 21.8582H165.473C167.449 21.8582 172.416 21.7351 172.604 21.8582C173.317 22.3374 173.064 25.1742 172.96 25.8737V25.8672Z"
              fill="#EBECEC"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M75.8033 18.6523H45.4859C44.9937 18.6523 44.7929 19.0992 44.5856 19.5526L41.1012 27.1562C40.8939 27.6031 41.5027 28.0565 42.0014 28.0565H79.2942C79.7864 28.0565 80.3952 27.6096 80.1945 27.1562L76.71 19.5526C76.5027 19.1057 76.302 18.6523 75.8097 18.6523"
              fill="#EBECEC"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M75.8027 19.8054H45.4854C44.9932 19.8054 44.7924 20.2523 44.5851 20.7057L44.4297 21.0425H76.8584L76.703 20.7057C76.4958 20.2588 76.295 19.8054 75.8027 19.8054Z"
              fill="white"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M41.483 25.155L41.0943 26.0035C40.8871 26.4504 41.4959 26.9037 41.9946 26.9037H79.2874C79.7796 26.9037 80.3884 26.4568 80.1876 26.0035L79.799 25.155H41.4894H41.483Z"
              fill="#F5F5F5"
            />
            <path
              d="M79.4431 22.1112C78.7436 20.5891 78.1737 18.3547 76.6517 17.4868C76.4314 17.3184 76.153 17.2148 75.8032 17.2148H47.5778C45.719 17.2148 44.4042 17.0529 43.3421 18.8275C42.4483 20.3171 41.8524 22.0788 41.127 23.6591C40.6219 24.7537 39.5208 26.321 39.6892 27.5969C39.9224 29.3586 41.6452 29.4752 43.0636 29.5011C46.548 29.5594 50.039 29.5011 53.5299 29.5011H71.4574C73.4392 29.5011 81.8654 30.8676 81.6257 27.163C81.5156 25.5244 80.1167 23.5684 79.4496 22.1176L79.4431 22.1112ZM76.0623 26.6189H46.684C46.1076 26.6189 44.2877 26.3599 43.1219 26.4052C43.4522 25.7446 43.6918 24.935 43.9638 24.3391C44.482 23.2057 44.9418 21.2498 45.8032 20.3236C45.9716 20.1423 46.412 20.1034 46.5351 20.0904C47.5778 19.9674 48.6983 20.0904 49.7475 20.0904H75.3045C76.1465 21.036 77.2864 24.6371 78.1089 26.5801C77.4483 26.5153 76.6905 26.6189 76.0558 26.6189H76.0623Z"
              fill="#EBECEC"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16.082 27.1494H192.338C193.064 27.1494 193.66 27.7453 193.66 28.4707C193.66 29.196 193.064 29.7919 192.338 29.7919H16.082C15.3566 29.7919 14.7607 29.196 14.7607 28.4707C14.7607 27.7453 15.3566 27.1494 16.082 27.1494Z"
              fill="#EBECEC"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.32222 27.1494H9.78725C10.5126 27.1494 11.1085 27.7453 11.1085 28.4707C11.1085 29.196 10.5126 29.7919 9.78725 29.7919H1.32222C0.596831 29.7919 0.000976562 29.196 0.000976562 28.4707C0.000976562 27.7453 0.596831 27.1494 1.32222 27.1494Z"
              fill="#EBECEC"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M198.485 27.1494H206.95C207.676 27.1494 208.272 27.7453 208.272 28.4707C208.272 29.196 207.676 29.7919 206.95 29.7919H198.485C197.76 29.7919 197.164 29.196 197.164 28.4707C197.164 27.7453 197.76 27.1494 198.485 27.1494Z"
              fill="#EBECEC"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M90.1119 5.1558H123.001L120.721 7.43559C120.384 7.77238 120.384 8.19984 120.721 8.53663C121.058 8.87342 121.485 8.87342 121.822 8.53663L125.293 5.06513C125.468 4.97445 125.598 4.81901 125.662 4.63119C125.688 4.55347 125.708 4.46927 125.708 4.39803C125.708 4.1001 125.539 3.85399 125.293 3.73093L121.822 0.259427C121.485 -0.0773609 121.058 -0.0773609 120.721 0.259427C120.552 0.343623 120.468 0.596214 120.468 0.764608C120.468 0.933002 120.552 1.1014 120.721 1.18559L123.169 3.63378H90.1119C89.6909 3.63378 89.3477 3.97057 89.3477 4.39155C89.3477 4.81254 89.6844 5.14932 90.1119 5.14932V5.1558Z"
              fill="#F5F5F5"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M124.944 14.6269H91.8865L94.3347 12.1788C94.5031 12.0946 94.5873 11.9262 94.5873 11.7578C94.5873 11.5894 94.5031 11.3368 94.3347 11.2526C93.9979 10.9158 93.5705 10.9158 93.2337 11.2526L89.7622 14.7241C89.516 14.8471 89.3477 15.0997 89.3477 15.3912C89.3477 15.4624 89.3671 15.5466 89.393 15.6244C89.4578 15.8122 89.5873 15.9676 89.7622 16.0583L93.2337 19.5298C93.5705 19.8666 93.9979 19.8666 94.3347 19.5298C94.6715 19.193 94.6715 18.772 94.3347 18.4288L92.0549 16.149H124.944C125.365 16.149 125.708 15.8122 125.708 15.3912C125.708 14.9702 125.371 14.6269 124.944 14.6269Z"
              fill="#F5F5F5"
            />
          </g>
          <defs>
            <clipPath id="clip0_3351_10107">
              <rect width="208.271" height="30" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>
    );
  };

  const ICon = ({ isReceived = false }: { isReceived?: boolean }) => {
    return (
      <IcnTxReceive
        className={cn(`w-6 h-6 rounded-full`, {
          "rotate-180": !isReceived,
        })}
      />
    );
  };

  return (
    <div
      className={cn(
        `flex flex-col gap-2 px-4 bg-white ${className ? className : ""}`
      )}
    >
      <div className="text-base font-medium sticky top-[73px] standard:top-0 z-10 bg-light-100">
        Activities
      </div>

      {!txes.length ? (
        <NoTransaction />
      ) : (
        <div className="border border-grey-300 rounded-lg px-3 standard:pb-[50px] mt-2">
          <div className={s.transactionsDiv}>
            {txes.map((item) => {
              const currentDate = new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  className="flex flex-col gap-2 w-full pt-3 pb-2"
                  key={`tx-date-${item.key}`}
                >
                  <div
                    className={cn("text-sm font-normal w-full text-left", {
                      "text-[#FF4545]": item.key === "unconfirmation",
                    })}
                  >
                    {item.key === currentDate ? "Today" : item.title}
                  </div>
                  <div className="">
                    {item.data.map((t, index) => {
                      const isReceived = isIncomeTx(t, t.address);
                      let amount = "",
                        symbol = currentNetwork.coinSymbol;
                      if (isTxToken(t)) {
                        const v = getTransactionTokenValue(t, t.address, 5);
                        amount = v.amount;
                        symbol = v.symbol;
                      } else {
                        amount = getTransactionValue(t, t.address, 5);
                      }

                      return (
                        <Link
                          className={s.transaction}
                          key={index}
                          to={`/pages/transaction-info/${t.txid}`}
                          state={{
                            transaction: t,
                            lastBlock,
                          }}
                        >
                          <div className="flex gap-2 items-center justify-between">
                            <ICon isReceived={isReceived} />
                            <div>
                              <div className="text-base">
                                {isReceived ? "Received" : "Sent"}
                              </div>
                              <div className="text-[#787575] text-sm font-normal">
                                {isReceived ? "From" : "To"}{" "}
                                {isReceived
                                  ? shortAddress(
                                      t.vin[0].prevout.scriptpubkey_address
                                    )
                                  : shortAddress(
                                      t.vout[0].scriptpubkey_address
                                    )}
                              </div>
                            </div>
                          </div>
                          <div
                            className="font-normal text-sm flex items-center gap-1"
                            style={{
                              color: isReceived ? "#09C148" : "#FF4545",
                            }}
                          >
                            <span className="w-[80px] truncate block text-right">
                              {isReceived ? "+" : "-"}
                              {amount.toString().replace(/\.?0+$/, "")}
                            </span>
                            <span className="text-primary flex-1">
                              {`${symbol || currentNetwork.coinSymbol}`}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div ref={ref}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;

const IcnTxReceive = ({ className }: { className?: string }) => {
  return (
    <svg
      className={`${className}`}
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="29.5"
        y="29.5"
        width="29"
        height="29"
        rx="14.5"
        transform="rotate(180 29.5 29.5)"
        fill="#0D0D0D"
      />
      <rect
        x="29.5"
        y="29.5"
        width="29"
        height="29"
        rx="14.5"
        transform="rotate(180 29.5 29.5)"
        stroke="white"
      />
      <path
        d="M15 20L15 10M15 20L10 15M15 20L20 15"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
