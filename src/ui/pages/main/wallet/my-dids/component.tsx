/* eslint-disable react/jsx-no-target-blank */
const MyDIDs = () => {
  return (
    <div className="px-4 py-11">
      <p className="text-center text-grey-100">
        🚀 Come get your .bit now! <br /> Create & Get a ✨5% discount
      </p>
      <div className="flex justify-center mt-4">
        <a
          href="https://d.id/bit/create?inviter=utxoglobalwallet.bit&channel=utxoglobalwallet.bit"
          target="_blank"
        >
          <button className="text-white text-xs leading-[18px] font-medium bg-primary hover:bg-[#2C2C2C] py-2 px-4 rounded flex justify-center items-center gap-1 cursor-pointer">
            Create
          </button>
        </a>
      </div>
    </div>
  );
};

export default MyDIDs;
