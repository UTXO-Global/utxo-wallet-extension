import React from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

const WarningUpgradeAccount = () => {
  const isAccountOldVersion = useMemo(() => {
    return false;
  }, []);

  if (isAccountOldVersion) return <></>;
  return (
    <div className="px-4 py-2 w-[calc(100%-32px)] left-4 fixed bottom-[80px] bg-grey-300 rounded-md">
      <p className="text-sm font-medium">
        Upgrade Your Wallet for Future Compatibility
      </p>
      <p className="text-xs mb-2 text-[#787575]">
        Your current account is using an outdated HD Path format. Upgrade now to
        ensure compatibility with future features and enhanced support
      </p>

      <Link to={`/pages/change-password`} className="">
        <button className="btn primary !py-1 !px-2 !text-xs" type="submit">
          Upgrade Account Now
        </button>
      </Link>
    </div>
  );
};

export default WarningUpgradeAccount;
