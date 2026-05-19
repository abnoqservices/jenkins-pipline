// lib/mockCatalogData.ts  (or wherever you store your mock data)

export interface SocialLink {
  platform: string;
  url: string;
  icon?: string; // optional - for lucide-react icons if you want to map them
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
  images?:string[];
  description: string;
  shortDescription?: string;   // for card previews if you want shorter text
  features: string[];
  dimensions: string;
  weight: string;
  inStock: boolean;
  sku?: string;
  material?: string;
  colorOptions?: string[];
  rating?: number;             // optional - stars out of 5
  reviewCount?: number;
  cta?: string;              // optional - e.g. "Buy Now", "Learn More"
}

export interface CatalogData {
  logo: string;
  name: string;
  tagline: string;
  description: string;
  about: string;
  mission: string;
  vision: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  socialLinks: SocialLink[];
  products: Product[];
  cta?: string; 
}

export const mockData: CatalogData = {
  logo: "https://static.stacker.com/s3fs-public/styles/1280x720/s3/asics.png",
  name: "Elegance & Co.",
  tagline: "Crafting Excellence Since 2010",
  description: "Curating timeless, handcrafted pieces that blend artistry with modern functionality for discerning individuals.",
  about: "Founded in 2010, Elegance & Co. began as a small atelier dedicated to reviving traditional craftsmanship in a fast-fashion world. Today we partner with master artisans across India and Europe to bring sustainable, high-quality home goods, accessories and lifestyle products to conscious consumers.",
  mission: "To deliver exceptional quality, ethically made products that bring beauty, durability and joy into everyday life while supporting artisan communities and sustainable practices.",
  vision: "To become the most trusted global name in thoughtful luxury — where every purchase is an investment in craftsmanship, people, and the planet.",
  
  address: "Plot No. 14, Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010, India",
  phone: "+91 522 406 7890",
  email: "hello@eleganceandco.in",
  website: "https://eleganceandco.in",
  socialLinks: [
    { platform: "Instagram", url: "https://instagram.com/eleganceandco" },
    { platform: "Facebook",  url: "https://facebook.com/eleganceandco.in" },
    { platform: "Twitter",    url: "https://twitter.com/elegance_co" },
    { platform: "Pinterest",  url: "https://pinterest.com/eleganceandco" },
  ],

  products: [
    /* =========================
       CATEGORY: BAGS (6 ITEMS)
    ==========================*/
    {
      id: 1,
      name: "Italian Leather Tote Bag",
      category: "Bags",
      price: "₹24,999",
      image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop"
      ],
      description: "Premium full-grain leather tote bag with spacious compartments.",
      features: ["Italian leather", "Zipper closure", "Inner pockets"],
      dimensions: "42 × 32 × 15 cm",
      weight: "1.2 kg",
      inStock: true,
      rating: 4.8,
      reviewCount: 142,
      cta: "Enquire Now"
    },
    {
      id: 2,
      name: "Minimalist Office Backpack",
      category: "Bags",
      price: "₹7,999",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=800&auto=format&fit=crop"
      ],
      description: "Modern backpack designed for professionals and travelers.",
      features: ["Laptop sleeve", "Water resistant", "USB port"],
      dimensions: "45 × 30 × 12 cm",
      weight: "0.9 kg",
      inStock: true,
      rating: 4.6,
      reviewCount: 89,
      cta: "Enquire Now"
    },
    {
      id: 3,
      name: "Vintage Leather Messenger Bag",
      category: "Bags",
      price: "₹12,999",
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&auto=format&fit=crop"
      ],
      description: "Classic messenger bag crafted from distressed leather.",
      features: ["Adjustable strap", "Multiple compartments"],
      dimensions: "38 × 28 × 10 cm",
      weight: "1.1 kg",
      inStock: true,
      rating: 4.7,
      reviewCount: 61,
      cta: "Enquire Now"
    },
    {
      id: 4,
      name: "Canvas Travel Duffel",
      category: "Bags",
      price: "₹6,499",
      image: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&auto=format&fit=crop",
      images: [
        
        "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=800&auto=format&fit=crop"
      ],
      description: "Durable canvas duffel bag for travel and gym use.",
      features: ["Canvas body", "Leather straps", "Large storage"],
      dimensions: "50 × 25 × 25 cm",
      weight: "1.3 kg",
      inStock: true,
      rating: 4.5,
      reviewCount: 47,
      cta: "Enquire Now"
    },
    {
      id: 5,
      name: "Compact Sling Bag",
      category: "Bags",
      price: "₹3,999",
      image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop",
       
      ],
      description: "Lightweight sling bag ideal for daily essentials.",
      features: ["Compact design", "Secure zipper", "Lightweight"],
      dimensions: "22 × 16 × 6 cm",
      weight: "0.4 kg",
      inStock: true,
      rating: 4.4,
      reviewCount: 30,
      cta: "Enquire Now"
    },
    {
      id: 6,
      name: "Luxury Travel Suitcase",
      category: "Bags",
      price: "₹18,999",
      image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&auto=format&fit=crop",
       
      ],
      description: "Premium hard-shell suitcase with 360° wheels.",
      features: ["TSA lock", "360 wheels", "Scratch resistant"],
      dimensions: "70 × 45 × 28 cm",
      weight: "3.8 kg",
      inStock: true,
      rating: 4.9,
      reviewCount: 203,
      cta: "Enquire Now"
    },
  
    /* =========================
       CATEGORY: HOME DECOR (6 ITEMS)
    ==========================*/
    {
      id: 7,
      name: "Hand-Blown Glass Table Lamp",
      category: "Home Decor",
      price: "₹18,499",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&auto=format&fit=crop"
      ],
      description: "Elegant hand-blown glass lamp with wooden base.",
      features: ["Hand-blown glass", "Wood base", "LED compatible"],
      dimensions: "Height 58 cm",
      weight: "2.8 kg",
      inStock: true,
      rating: 4.7,
      reviewCount: 89,
      cta: "Enquire Now"
    },
    {
      id: 8,
      name: "Decorative Ceramic Vase",
      category: "Home Decor",
      price: "₹4,299",
      image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&auto=format&fit=crop"
      ],
      description: "Minimal handcrafted ceramic vase.",
      features: ["Handmade", "Matte finish"],
      dimensions: "30 cm height",
      weight: "1 kg",
      inStock: true,
      rating: 4.5,
      reviewCount: 51,
      cta: "Enquire Now"
    },
    {
      id: 9,
      name: "Wall Art Canvas Set",
      category: "Home Decor",
      price: "₹9,999",
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&auto=format&fit=crop"
      ],
      description: "Modern abstract wall art set for living rooms.",
      features: ["Canvas print", "Ready to hang"],
      dimensions: "3 Panels 60×40 cm",
      weight: "2 kg",
      inStock: true,
      rating: 4.6,
      reviewCount: 76,
      cta: "Enquire Now"
    },
    {
      id: 10,
      name: "Luxury Scented Candle",
      category: "Home Decor",
      price: "₹2,499",
      image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&auto=format&fit=crop"
      ],
      description: "Soy wax candle with long-lasting fragrance.",
      features: ["Soy wax", "60h burn time"],
      dimensions: "10 cm",
      weight: "0.5 kg",
      inStock: true,
      rating: 4.8,
      reviewCount: 120,
      cta: "Enquire Now"
    },
    {
      id: 11,
      name: "Wooden Coffee Table Decor",
      category: "Home Decor",
      price: "₹6,999",
      image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop"
      ],
      description: "Elegant decorative table accessory.",
      features: ["Solid wood", "Hand polished"],
      dimensions: "40 × 40 cm",
      weight: "3 kg",
      inStock: true,
      rating: 4.4,
      reviewCount: 34,
      cta: "Enquire Now"
    },
    {
      id: 12,
      name: "Modern Wall Clock",
      category: "Home Decor",
      price: "₹3,499",
      image: "https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?w=800&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop"
      ],
      description: "Minimal silent wall clock.",
      features: ["Silent mechanism", "Modern design"],
      dimensions: "35 cm diameter",
      weight: "0.9 kg",
      inStock: true,
      rating: 4.6,
      reviewCount: 59,
      cta: "Enquire Now"
    }
  ]
};

// Optional: helper function if you use dynamic slugs later
export function getMockCatalog(slug: string = "elegance-co"): CatalogData {
  return mockData;
}