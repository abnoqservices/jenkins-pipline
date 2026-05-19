const logos = [
    "https://gcc.eragroup.com/wp-content/uploads/2018/02/logo-placeholder.png",
    "https://gcc.eragroup.com/wp-content/uploads/2018/02/logo-placeholder.png",
    "https://gcc.eragroup.com/wp-content/uploads/2018/02/logo-placeholder.png",
  ];
  
 export default function TrustedByMarquee() {
    return (
      <div className="mt-10">
        <p className="mb-4 text-sm uppercase tracking-wider text-white/80">
          Trusted by
        </p>
  
        <div className="overflow-hidden">
          <div className="flex gap-10 animate-marquee bg-white">
            {[...logos, ...logos].map((logo, i) => (
              <img
                key={i}
                src={logo}
                alt="Company logo"
                className="h-16 opacity-90"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  