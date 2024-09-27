import { useMemo } from "react";
import cn from "classnames";
export default function TextAvatar({
  text,
  len,
  className,
}: {
  text: string;
  len?: number;
  className?: string;
}) {
  const background = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < text?.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    const color = (hash & 0x00ffffff).toString(16).toUpperCase();

    return "00000".substring(0, 6 - color?.length) + color;
  }, [text]);

  const textColor = useMemo(() => {
    const rgb = parseInt(background, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luma < 186 ? "#FFF" : "#000";
  }, [background]);

  const firstChar = useMemo(() => {
    const charLen = len ? len : 1;
    return !!text ? text.slice(0, charLen).toUpperCase() : "U";
  }, [text, len]);

  return (
    <div
      className={cn(
        `w-10 h-10 rounded-full flex items-center justify-center text-[19px] leading-5 ${
          className ?? ""
        }`
      )}
      style={{ background: `#${background}`, color: textColor }}
    >
      {firstChar}
    </div>
  );
}
