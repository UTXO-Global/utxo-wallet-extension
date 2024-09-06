import { shortAddress } from "@/shared/utils/transactions";
import cn from "classnames";

const NftCard = ({ nft }: { nft: any }) => {
  return (
    <div
      className="rounded-lg border border-grey-300 group cursor-pointer relative h-full flex flex-col justify-between"
      style={{ boxShadow: "0px 2.52px 12.59px 0px #0000000D" }}
    >
      <div className="flex justify-center items-center h-[128px] p-2">
        <img
          src={nft.imageUrl || "/nft-default.png"}
          alt=""
          className={cn("max-w", {
            "h-full": !!nft.imageUrl,
          })}
        />
      </div>
      <div className="p-2 group-hover:bg-grey-300 transition-colors">
        {!!nft.collection.name ||
          (nft.type_script.args ===
            "0x4fd647b30f7003b417e92cff23da1bd8abdb9d0dcfeb46e3b77dbd88fc0f5026" && (
            <p className="text-sm leading-5 text-primary font-medium max-w-max overflow-hidden text-ellipsis whitespace-nowrap">
              {nft.collection.name || "UTXO Global | NexmLab"}
            </p>
          ))}
        <p className="text-xs leading-[18px] mt-[2px] font-normal tracking-[0.1px]">
          #{shortAddress(nft.type_script.args, 6)}
        </p>
      </div>
    </div>
  );
};

export default NftCard;
