import Skeleton from "../../../../components/Skeleton.jsx";
import formatPrice from "../../../../utils/formatPrice.js";

const Stat = ({ icon, title, value, subtitle, loading,  bgColor = "bg-[#1B1B14]" }) => {
  return (
    <div className={`${bgColor} w-[320px] px-6 py-4 rounded-lg`}>
      <div className="flex items-center gap-2">
        <p className="text-md text-white opacity-80">{title}</p>
      </div>
      <Skeleton
        visible={loading}
        width={"25%"}
        height={"20px"}
        color={"white"}
        opacity={"10%"}
      >
        <p className="font-bold text-[27px] text-white mt-2 leading-8 ">
          {formatPrice(value)}
        </p>
      </Skeleton>
      <Skeleton
        visible={loading}
        width={"50%"}
        height={"20px"}
        color={"white"}
        opacity={"10%"}
      >
        <p className="text-sm opacity-70 font-light text-white">{subtitle}</p>
      </Skeleton>
    </div>
  );
};

export default Stat;
