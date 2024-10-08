import cn from "classnames";
import { FC, useState } from "react";
import Loading from "react-loading";

export type IframeProps = {
  preview: string;
  size: keyof typeof SIZES;
};

const SIZES = {
  default: "w-36 h-36",
  big: "w-[318px] h-[318px]",
};

const Iframe: FC<IframeProps> = ({ preview, size }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl bg-black">
      <div
        className={cn(
          SIZES[size],
          "bg-input-bg flex justify-center items-center",
          {
            ["absolute"]: !loaded,
            ["hidden"]: loaded,
          }
        )}
      >
        <Loading color="#ODODOD" />
      </div>
      <iframe
        id="frame"
        onClick={(e) => e.preventDefault()}
        className={cn("pointer-events-none", SIZES[size])}
        src={preview}
        sandbox="allow-scripts"
        scrolling="no"
        onLoad={() => {
          setLoaded(true);
        }}
      />
    </div>
  );
};

export default Iframe;
