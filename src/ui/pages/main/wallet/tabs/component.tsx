import cn from "classnames";
import { useMemo, useState } from "react";
import Tokens from "./tokens";
export default function Tabs({ active }: { active?: string }) {
  const TABs = [
    { name: "xudt", title: "xUDT", ele: <Tokens type="xudt" /> },
    { name: "sudt", title: "sUDT", ele: <Tokens type="sudt" /> },
  ];

  const [tabActive, setTabActive] = useState(active || "tokens");

  const currentTab = useMemo(() => {
    return TABs.find((t) => t.name === tabActive);
  }, [tabActive]);

  const Children = useMemo(() => {
    if (!currentTab) return <></>;

    return currentTab.ele;
  }, [currentTab]);

  return (
    <div className="px-4">
      {TABs && (
        <div className="mt-4 inline-block">
          <div className="bg-grey-400 rounded-full flex gap-0">
            {TABs.map((t, index) => (
              <div
                key={`wallet-${t.name}-${index}`}
                className={cn(
                  "font-medium text-sm leading-5 tracking-[0.2px] rounded-full px-4 py-[6px] text-[#787575] cursor-pointer",
                  {
                    "bg-grey-200": t.name === tabActive,
                  }
                )}
                onClick={() => {
                  if (tabActive !== t.name) {
                    setTabActive(t.name);
                  }
                }}
              >
                {t.title}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-6">{Children}</div>
    </div>
  );
}
