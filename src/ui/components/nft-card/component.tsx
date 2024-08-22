import { shortAddress } from "@/shared/utils/transactions";

const NftCard = ({ nft }: { nft: any }) => {
  return (
    <div className="rounded-lg border border-[#F5F5F5] group cursor-pointer relative">
      <div className="px-[10px] py-[2px] rounded-[100px] bg-[#F5F5F5] text-[10px] leading-[18px] text-[#787575] absolute top-[10px] right-2 font-medium">DOBs</div>
      <div className="flex justify-center items-center h-[128px]">
        <img src={nft.imageUrl} alt="" className="h-full" />
      </div>
      <div className="p-2 group-hover:bg-[#F5F5F5] transition-colors">
        <p className="text-[14px] leading-[20px] text-primary font-medium">{nft.collection.name || "<No Cluster>"}</p>
        <p className="text-[12px] leading-[18px] mt-[2px]">
          #{shortAddress(nft.type_script.args, 8)}
        </p>
      </div>
    </div>
  );
};

export default NftCard;
