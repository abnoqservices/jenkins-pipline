import Image from "next/image";

interface CompanyHeaderProps {
  logo: string;
  name: string;
  tagline: string;
  description: string;
}

export default function HeroSection({
  logo,
  name,
  tagline,
  description,
}: CompanyHeaderProps) {
  return (
    <section className="mx-auto px-6 pt-10 pb-20 text-center bg-white">
      
      {/* Logo */}
      {logo && (
        <div className="flex justify-center ">
          <Image
            src={logo}
            alt={name}
            width={350}
            height={350}
            className="object-contain"
          />
        </div>
      )}

      {/* Company Name */}
      <h1 className="text-4xl sm:text-6xl font-bold text-slate-900">
        {name}
      </h1>

      {/* Tagline */}
      <p className="mt-4 text-xl text-slate-600 italic">
        {tagline}
      </p>

      {/* Divider */}
      <div className="w-24 h-1 bg-slate-800 mx-auto my-6 rounded"></div>

      {/* Description */}
      <p className="max-w-3xl mx-auto text-lg text-slate-700 leading-relaxed">
        {description}
      </p>

      {/* Catalog Label */}
      <div className="mt-8">
        <span className="inline-block px-6 py-2 text-sm font-semibold text-white bg-slate-800 rounded-full">
          Product Catalog
        </span>
      </div>
    </section>
  );
}