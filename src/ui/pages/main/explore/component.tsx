/* eslint-disable @typescript-eslint/no-floating-promises */
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import { useEffect, useRef, useState } from "react";
import { IFeature } from "@/shared/interfaces/explore";
import BottomPanel from "../wallet/bottom-panel";
import { t } from "i18next";
import ReactLoading from "react-loading";

const EXPLORER_LINK = "https://config.utxo.global/explore.json";

const Explorer = () => {
  const swiperRef = useRef(null);
  const [active, setActive] = useState<number>(0);
  const [feature, setFeature] = useState<IFeature[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadFeature = async () => {
    try {
      const res = await fetch(`${EXPLORER_LINK}?t=${Date.now()}`);
      const data = await res.json();
      setFeature(data.feature);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeature();
  }, []);

  return (
    <div className="w-full h-full p-4">
      {isLoading ? (
        <div className="flex justify-center h-full items-center">
          <ReactLoading type="spin" color="#ODODOD" />
        </div>
      ) : (
        <>
          <div>
            <div className="flex justify-between items-start">
              <p className="text-[20px] leading-[28px] text-primary">
                {t("explore.feature")}
              </p>
              <div className="flex gap-4 items-center">
                <ChevronLeftIcon
                  className="w-[16px] text-[#787575] cursor-pointer"
                  style={{
                    ...(active !== 0
                      ? { color: "#0D0D0D" }
                      : { cursor: "not-allowed" }),
                  }}
                  onClick={() => {
                    if (active <= 0) return;
                    setActive(active - 1);
                    swiperRef.current.swiper.slidePrev();
                  }}
                />
                <ChevronRightIcon
                  className="w-[16px] text-[#787575] cursor-pointer"
                  style={{
                    ...(active !== feature.length - 1
                      ? { color: "#0D0D0D" }
                      : { cursor: "not-allowed" }),
                  }}
                  onClick={() => {
                    if (active >= feature.length - 1) return;
                    setActive(active + 1);
                    swiperRef.current.swiper.slideNext();
                  }}
                />
              </div>
            </div>
            <div className="mt-4">
              <Swiper
                ref={swiperRef}
                spaceBetween={16}
                slidesPerView={1.5}
                onSlideChange={() => console.log("slide change")}
                onSwiper={(swiper) => console.log(swiper)}
              >
                {feature.map((z, i) => (
                  <SwiperSlide key={i}>
                    <a href={z.link} target="_blank" rel="noreferrer">
                      <div className="rounded-[8px] overflow-hidden">
                        <img
                          src={z.image}
                          alt={z.title}
                          className="object-cover"
                        />
                        <div className="px-4 py-[14px] bg-[#F5F5F5] text-[12px] leading-[18px] text-primary rounded-b-[8px]">
                          {z.title}
                        </div>
                      </div>
                    </a>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
          {/* <div className="mt-6">
            <p className="text-[20px] leading-[28px] text-primary">
              {t('explore.recommended')}
            </p>
            <div className="mt-4 grid gap-6">
              {recommended.map((z, i) => (
                <a
                  key={i}
                  href={z.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-4 items-start"
                >
                  <img
                    src={z.image}
                    alt={z.title}
                    className="w-[50px] h-[50px] object-cover rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-[16px] leading-[140%] font-bold text-primary">
                      {z.title}
                    </p>
                    <p className="text-base text-primary mt-1 description-2-lines">
                      {z.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div> */}
        </>
      )}
      <BottomPanel />
    </div>
  );
};

export default Explorer;
