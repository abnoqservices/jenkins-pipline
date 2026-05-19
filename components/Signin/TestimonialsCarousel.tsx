import React from "react";
const testimonials = [
    {
      name: "Taylor Nguyen",
      role: "Engineering Lead",
      company: "Acme Corp",
      image: "https://cultivatedculture.com/wp-content/uploads/2019/12/LinkedIn-Profile-Picture-Example-Madeline-Mann.jpeg",
      quote:
        "Pexifly instantly showed us where users were dropping off."
    },
    {
      name: "Nikita Sharma",
      role: "Product Manager",
      company: "Flowly",
      image: "https://media.licdn.com/dms/image/v2/C4D03AQH4TSr93P-WgQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1642861207020?e=1779321600&v=beta&t=_Nvb86pJ-1pSjvdSCM3_edbf4MroUx8LZij_F62Ph28",
      quote:
        "Setup was effortless and insights were actionable from day one."
    }
  ];
  
 export default function TestimonialsCarousel() {
    const [index, setIndex] = React.useState(0);
  
    React.useEffect(() => {
      const id = setInterval(
        () => setIndex((i) => (i + 1) % testimonials.length),
        4000
      );
      return () => clearInterval(id);
    }, []);
  
    const t = testimonials[index];
  
    return (
      <div className="mb-10">
        <div className="rounded-2xl bg-white  p-6  backdrop-blur transition-all">
          <p className="text-md mb-4"><span className="font-bold text-gray-500 text-2xl">“</span>{t.quote}<span className="font-bold text-gray-500 text-2xl">”</span></p>
  
          <div className="flex items-center gap-4">
            <img
              src={t.image}
              alt={t.name}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-gray-500 font-medium">
                {t.role}, {t.company}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  