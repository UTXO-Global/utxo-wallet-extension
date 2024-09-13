import { shortAddress } from "@/shared/utils/transactions";
import cn from "classnames";
import Loading from "react-loading";

const NftCard = ({ nft }: { nft: any }) => {
  return (
    <div className="rounded-lg border border-grey-300 group cursor-pointer relative h-full flex flex-col justify-between">
      <div className="flex justify-center items-center h-full min-h-[154px]">
        {nft.loading ? (
          <Loading type="bubbles" color="#ODODOD" width={50} />
        ) : (
          <img
            src={nft.imageUrl || "/nft-default.png"}
            alt={nft.contentType}
            className={cn("max-w mix-blend-multiply rounded-t-lg", {
              "w-full": !!nft.contentType,
            })}
          />
        )}
      </div>
      <div className="p-2 group-hover:bg-grey-300 transition-colors">
        {!!nft.collection.name && (
          <p className="text-sm leading-5 text-primary font-medium max-w-max overflow-hidden text-ellipsis whitespace-nowrap">
            {nft.collection.name}
          </p>
        )}
        <p className="text-xs leading-[18px] mt-[2px] font-normal tracking-[0.1px]">
          #{shortAddress(nft.type_script.args, 6)}
        </p>
      </div>
    </div>
  );
};

export default NftCard;
