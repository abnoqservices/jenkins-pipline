export interface CardData {
    company_name: string | null;
    person_name: string | null;
    designation: string | null;
    phone_numbers: string[];
    email: string | null;
    website: string | null;
    full_address: string | null;
    city: string | null;
    pincode: string | null;
    social_handles: {
      linkedin: string | null;
      instagram: string | null;
      facebook: string | null;
      x: string | null;
      youtube: string | null;
      other: string | null;
    };
    industry_field?: string | null;
    remarks?: string | null;
  }
  
  export interface ExtractedDataCardProps {
    data: CardData;
    previewImage: string | null;
  }