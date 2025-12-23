import Image from "next/image";
import logo from "@/assets/logo.png"; // ✅ Make sure logo.png is inside src/assets OR adjust the path

const DummyLogo = () => {
  return (
    <div className="flex items-center">
      <div className="h-10 w-10 rounded-md flex items-center justify-center overflow-hidden bg-black">
        <Image
          src={logo}
          alt="Brickz Logo"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="ml-2 text-xl font-bold text-gray-900">Brickz</div>
    </div>
  );
};

export default DummyLogo;
