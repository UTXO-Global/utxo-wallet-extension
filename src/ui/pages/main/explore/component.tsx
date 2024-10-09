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
import { TELEGRAM_PARTNERSHIP } from "@/shared/constant";
import DOMPurify from "dompurify";

const EXPLORER_LINK = "https://config.utxo.global/explore.json";

const Explorer = () => {
  const swiperRef = useRef(null);
  const [active, setActive] = useState<number>(0);
  const [feature, setFeature] = useState<IFeature[]>([]);
  const [partners, setPartners] = useState<IFeature[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadFeature = async () => {
    try {
      const res = await fetch(`${EXPLORER_LINK}?t=${Date.now()}`);
      const data = await res.json();
      setFeature(data.feature);
      setPartners(data.partners);
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
    <div className="w-full h-full p-4 pb-[88px]">
      {isLoading ? (
        <div className="flex justify-center h-full items-center">
          <ReactLoading type="spin" color="#ODODOD" />
        </div>
      ) : (
        <>
          <div>
            <div className="flex justify-between items-start">
              <p className="text-xl leading-7 text-primary font-medium">
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
                onSlideChange={() => console.log("slide change")}
                onSwiper={(swiper) => console.log(swiper)}
              >
                {feature.map((z, i) => (
                  <SwiperSlide key={i}>
                    <a href={DOMPurify.sanitize(z.link)} target="_blank" rel="noreferrer">
                      <div className="rounded-[8px] overflow-hidden">
                        <img
                          src={DOMPurify.sanitize(z.image)}
                          alt={z.title}
                          className="object-cover max-h-[120px] w-full"
                        />
                        <div className="px-4 py-[14px] bg-grey-300 hover:bg-grey-200 text-[14px] leading-[18px] text-primary rounded-b-[8px]">
                          {z.title}
                        </div>
                      </div>
                    </a>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between items-center">
              <p className="text-xl leading-7 text-primary font-medium">
                {t("explore.partners")}
              </p>
              <a
                className="text-white text-xs leading-[18px] font-medium bg-primary hover:bg-[#2C2C2C] p-2 rounded flex justify-center items-center gap-1 cursor-pointer"
                href={TELEGRAM_PARTNERSHIP}
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_5357_123574)">
                    <path
                      d="M11.7815 1.16968C11.6936 1.08105 11.5737 1.03125 11.4488 1.03125C11.324 1.03125 11.2042 1.08118 11.1162 1.1698L9.73143 2.56531C9.63976 2.6576 9.51805 2.7085 9.3889 2.7085C9.29051 2.7085 6.93687 2.7085 6.52439 2.7085C6.39512 2.7085 6.27354 2.6576 6.18101 2.56458L4.82053 1.20032C4.73264 1.11206 4.61314 1.0625 4.48863 1.0625C4.4885 1.0625 4.48826 1.0625 4.48814 1.0625C4.36338 1.06262 4.24387 1.11255 4.15598 1.20105L0.104829 5.28211C-0.0769345 5.46522 -0.0765683 5.76075 0.105683 5.94349L1.26755 7.10755C1.48764 7.32936 1.60886 7.6244 1.60886 7.93849C1.60886 8.34486 1.72287 8.73353 1.93479 9.06837C1.47361 9.62916 1.50339 10.4644 2.02463 10.9894C2.27695 11.2437 2.6074 11.3906 2.96177 11.408C2.978 11.7508 3.1157 12.0886 3.37498 12.3498C3.6273 12.604 3.95774 12.751 4.31223 12.7683C4.32835 13.1111 4.46616 13.449 4.72532 13.7101C5.1334 14.1212 5.71897 14.2249 6.21348 14.0473C6.2816 14.244 6.39341 14.4286 6.54918 14.5855C7.10569 15.1463 8.00816 15.1464 8.5648 14.5855L8.76268 14.3863C8.88634 14.2616 8.98216 14.1194 9.05052 13.9677C9.60411 14.4568 10.4574 14.4459 10.9968 13.9025C11.2561 13.6414 11.3938 13.3035 11.4099 12.9607C11.7643 12.9435 12.0948 12.7964 12.3472 12.5421C12.6064 12.281 12.7441 11.9431 12.7604 11.6004C13.1146 11.5831 13.4452 11.4361 13.6975 11.1819C14.2158 10.6598 14.2484 9.83082 13.7953 9.27003C14.1255 8.80482 14.3043 8.24952 14.3043 7.66639C14.3043 7.5298 14.3591 7.39625 14.4547 7.29994L15.8326 5.91126C16.014 5.72852 16.014 5.4336 15.8326 5.25086L11.7815 1.16968ZM2.69004 9.62904L3.36521 8.94887C3.55479 8.75783 3.86045 8.7577 4.05015 8.94887C4.2418 9.14186 4.2418 9.45582 4.05015 9.6487L3.37498 10.329C3.18528 10.52 2.87974 10.52 2.69004 10.329C2.49851 10.136 2.49851 9.82204 2.69004 9.62904ZM4.04038 10.9894L5.39073 9.62904C5.58042 9.438 5.88609 9.43788 6.07579 9.62904C6.26731 9.82204 6.26731 10.136 6.07579 10.329C5.59446 10.8139 5.56883 10.8396 4.72532 11.6893C4.53562 11.8803 4.23008 11.8804 4.04038 11.6892C3.84885 11.4964 3.84885 11.1824 4.04038 10.9894ZM5.39073 13.0496C5.1992 12.8567 5.1992 12.5427 5.39073 12.3498L6.0659 11.6696C6.2556 11.4785 6.56126 11.4785 6.75096 11.6696C6.92784 11.8478 6.94102 12.1289 6.79112 12.323C6.74986 12.3611 6.81126 12.2998 6.07579 13.0496C5.88609 13.2407 5.58055 13.2409 5.39073 13.0496ZM8.09739 13.7257L7.89952 13.9249C7.70982 14.1161 7.40428 14.1161 7.21458 13.9249C7.04002 13.7492 7.02501 13.4732 7.16856 13.2796C7.42589 13.0194 7.41331 13.0348 7.45811 12.9857C7.64952 12.8352 7.92283 12.8501 8.09739 13.0259C8.28892 13.2189 8.2888 13.5329 8.09739 13.7257ZM13.0322 10.5214C12.8425 10.7124 12.5369 10.7124 12.3472 10.5214L11.4742 9.64198C11.2919 9.45827 10.995 9.45717 10.8113 9.63954C10.6276 9.82191 10.6265 10.1187 10.8088 10.3024L11.6819 11.1818C11.8734 11.3748 11.8734 11.6887 11.6819 11.8816C11.4922 12.0728 11.1865 12.0728 10.9968 11.8816L10.1239 11.0022C9.94139 10.8185 9.64464 10.8174 9.46092 10.9998C9.27721 11.1821 9.27611 11.479 9.45848 11.6627L10.3314 12.5421C10.5231 12.7351 10.5231 13.0491 10.3314 13.242C10.1418 13.4331 9.83617 13.4331 9.64635 13.242C8.7274 12.3237 8.77147 12.3439 8.67894 12.288C8.44017 12.0824 8.14439 11.9633 7.82921 11.9472C7.81224 11.6057 7.67454 11.2693 7.41636 11.009C7.28392 10.8757 7.12986 10.772 6.96226 10.7009C7.28013 10.1537 7.20652 9.43739 6.74107 8.96864C6.26402 8.48805 5.55039 8.42982 5.01829 8.74147C4.94932 8.57679 4.84861 8.42238 4.71555 8.28846C4.15891 7.72767 3.25657 7.72767 2.6998 8.28846L2.6251 8.36378C2.57358 8.22999 2.54636 8.08632 2.54636 7.93849C2.54636 7.37525 2.32846 6.84571 1.93198 6.44618L1.09885 5.61146L4.48936 2.1958L5.51646 3.22571C5.74595 3.45691 6.04026 3.59913 6.35826 3.63599L4.26353 6.14954C4.09788 6.34852 4.12473 6.64405 4.32359 6.8097C4.80442 7.21046 5.41258 7.40003 6.03599 7.34339C6.65928 7.28675 7.22337 6.99073 7.62462 6.50916C7.79246 6.30775 8.07481 6.24708 8.31151 6.36134C8.79454 6.59474 9.32542 6.67994 9.84764 6.61329L13.0322 9.82143C13.2237 10.0144 13.2237 10.3284 13.0322 10.5214ZM13.7894 6.63941C13.5168 6.91395 13.3668 7.2787 13.3668 7.66639C13.3668 7.99354 13.282 8.30726 13.1235 8.58265L10.8436 6.28602C11.3097 6.02674 11.6919 5.63697 11.9454 5.15382C12.0657 4.92457 11.9773 4.64124 11.748 4.521C11.5188 4.40064 11.2355 4.48902 11.1152 4.71827C10.8608 5.20313 10.4242 5.52674 9.93504 5.64661C9.91356 5.64991 9.8922 5.65455 9.87132 5.6609C9.49547 5.73866 9.09251 5.69752 8.71934 5.51722C8.09447 5.21534 7.34825 5.37647 6.90391 5.90968C6.66343 6.19813 6.32505 6.37574 5.95115 6.4098C5.73863 6.42909 5.52915 6.40064 5.33482 6.3285L7.50487 3.72413C7.67491 3.67225 7.85118 3.64197 8.02891 3.64197H9.3889C9.76976 3.64197 10.1277 3.49671 10.3968 3.22571L11.449 2.16541L14.8396 5.58106L13.7894 6.63941Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_5357_123574">
                      <rect width="16" height="16" fill="white" />
                    </clipPath>
                  </defs>
                </svg>

                <span>{t("settings.become_a_partner")}</span>
              </a>
            </div>
            <div className="mt-4 grid border border-grey-300 rounded-lg last:*:border-b-0">
              {!partners || partners.length === 0 ? (
                <a href={TELEGRAM_PARTNERSHIP} target="_blank" rel="noreferrer">
                  <div className="rounded-[8px] overflow-hidden">
                    <img
                      src="/partnership.png"
                      alt="Partnership"
                      className="object-cover max-h-[120px] w-full rounded-t-lg"
                    />
                    <div className="px-4 py-[14px] bg-grey-300 hover:bg-grey-200 text-sm leading-[18px] text-primary rounded-b-[8px]">
                      Partnership Inquiry
                    </div>
                  </div>
                </a>
              ) : (
                partners.map((z, i) => (
                  <a
                    key={i}
                    href={DOMPurify.sanitize(z.link)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex gap-3 items-start py-2 px-3 border-b border-b-grey-300 group hover:bg-grey-300"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-grey-300 group-hover:bg-grey-200 rounded-xl">
                      <img
                        src={DOMPurify.sanitize(z.image)}
                        alt={z.title}
                        className="w-[33px] h-[33px] object-cover rounded-full"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-5 font-medium text-primary">
                        {z.title}
                      </p>
                      <p className="text-sm leading-[18px] text-[#787575] mt-[2px]">
                        {z.description}
                      </p>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </>
      )}
      <BottomPanel />
    </div>
  );
};

export default Explorer;
