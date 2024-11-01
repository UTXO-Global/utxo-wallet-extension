import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ICampaign } from "@/shared/interfaces";
import { browserTabsCreate } from "@/shared/utils/browser";

const CAMPAIGN_LINK = "https://config.utxo.global/campaign.json";

const Campaign = () => {
  const [campaign, setCampaign] = useState<ICampaign[]>([]);
  const close = async (campaignId) => {
    const _campaign = await chrome.storage.local.get("campaignHidden");
    await chrome.storage.local.set({
      campaignHidden:
        _campaign.campaignHidden === undefined
          ? [campaignId]
          : [..._campaign.campaignHidden, campaignId],
    });
    setCampaign(campaign.filter((z) => z.id !== campaignId));
  };

  const loadCampaign = async () => {
    const res = await fetch(`${CAMPAIGN_LINK}?t=${Date.now()}`);
    const data = await res.json();
    const _campaignHidden = await chrome.storage.local.get("campaignHidden");
    setCampaign(
      _campaignHidden.campaignHidden === undefined
        ? data
        : data.filter((z) => !_campaignHidden.campaignHidden.includes(z.id))
    );
  };

  useEffect(() => {
    loadCampaign();
  }, []);
  return (
    <div className="max-w-[350px] mx-auto px-4">
      <Swiper
        loop={true}
        slidesPerView={1}
        spaceBetween={0}
        autoplay={{ delay: 2000 }}
        modules={[Autoplay]}
      >
        {campaign.map((z, i) => (
          <SwiperSlide key={i}>
            <div
              onClick={async () => {
                await browserTabsCreate({
                  url: z.link,
                  active: true,
                });
              }}
              className="rounded-lg overflow-hidden relative cursor-pointer"
            >
              <div
                className="size-5 bg-white/40 rounded-full flex justify-center items-center absolute top-1 right-1 cursor-pointer z-[4]"
                onClick={(e) => {
                  e.stopPropagation();
                  close(z.id);
                }}
              >
                <XMarkIcon className="size-4" />
              </div>

              <img
                src={z.banner}
                alt={z.title}
                className="rounded-lg overflow-hidden max-w-full"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Campaign;
