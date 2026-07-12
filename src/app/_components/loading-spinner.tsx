import Image from "next/image";
export default function LoadingSpinner() {
  return (
    <div className="relative size-16">
      <Image src={"/logo.svg"} alt="logo" fill className="animate-spin" />
    </div>
  );
}
