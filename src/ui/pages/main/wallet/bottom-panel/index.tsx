import { GlobeAltIcon, WalletIcon } from "@heroicons/react/24/outline";
import { useLocation, useNavigate } from "react-router-dom";
import cn from "classnames";
import { IcnImage, IcnSwap, IcnThunder } from "@/ui/components/icons";

const BottomPanel = () => {
  const navigate = useNavigate();
  const currentRoute = useLocation();
  const BottomNavs = [
    {
      path: "/home",
      icon: <WalletIcon
        className={cn(`w-6 h-6 transition-all text-[#ABA8A1] group-hover:text-primary`, {
          "!text-primary": currentRoute.pathname === "/home",
        })}
      />
    },
    /*{
      path: "/pages/todo-1",
      icon: <IcnImage
        className={cn(`w-6 h-6 transition-all fill-[#ABA8A1] group-hover:fill-primary`, {
          "!fill-primary": currentRoute.pathname === "/pages/todo-1",
        })}
      />
    },
    {
      path: "/pages/swap",
      icon: <IcnSwap
        className={cn(`w-6 h-6 transition-all stroke-[#ABA8A1] group-hover:stroke-primary`, {
          "!stroke-primary": currentRoute.pathname === "/pages/swap",
        })}
      />
    },
    {
      path: "/pages/todo-2",
      icon: <IcnThunder
        className={cn(`w-6 h-6 transition-all fill-[#ABA8A1] group-hover:fill-primary`, {
          "!fill-primary": currentRoute.pathname === "/pages/todo-2",
        })}
      />
    },*/
    {
      path: "/pages/explorer",
      icon: <GlobeAltIcon
        className={cn(`w-6 h-6 transition-all text-[#ABA8A1] group-hover:text-primary`, {
          "!text-primary": currentRoute.pathname === "/pages/explorer",
        })}
      />
    }
  ]

  return (
    <div
      className={cn(`py-4 px-4 flex justify-between bg-light-100 fixed w-full bottom-0 left-0`)}
      style={{ boxShadow: "2px 4px 10px 0px #00000040" }}
    >
      {
        BottomNavs.map((nav, i) => <div
          key={`bottom-nav-${i}`}
          className={cn("cursor-pointer py-2 px-4 rounded-lg hover:bg-grey-300 group", {
            "bg-grey-300": currentRoute.pathname === nav.path
          })}
          onClick={() => navigate(nav.path)}
        >
          {nav.icon}
        </div>)
      }
    </div>
  );
};

export default BottomPanel;
