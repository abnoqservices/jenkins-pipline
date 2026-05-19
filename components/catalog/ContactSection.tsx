// components/catalog/ContactSection.tsx
import { Mail, Phone, MapPin, Globe, Instagram, Facebook, Twitter, Send } from 'lucide-react';

interface SocialLink {
  platform: string;
  url: string;
}

interface ContactSectionProps {
  address: string;
  phone: string;
  email: string;
  website: string;
  socialLinks: SocialLink[];
}

export default function ContactSection({
  address,
  phone,
  email,
  website,
  socialLinks,
}: ContactSectionProps) {
  // Map platform names to lucide-react icons
  const getIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Get in Touch
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            We’d love to hear from you. Reach out with any questions, custom requests, or just to say hello.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left: Contact Information Cards */}
          <div className="space-y-8">
            {/* Address Card */}
            <div className="group relative bg-white rounded-2xl border-slate-100 p-8 transition-all duration-300 hover:hover:-translate-y-1">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Visit Us</h3>
                  <p className="text-slate-700 leading-relaxed">{address}</p>
                </div>
              </div>
            </div>

            {/* Phone Card */}
            <div className="group relative bg-white rounded-2xl border-slate-100 p-8 transition-all duration-300 hover:hover:-translate-y-1">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Call Us</h3>
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="text-lg text-amber-700 hover:text-amber-800 transition-colors"
                  >
                    {phone}
                  </a>
                  <p className="text-sm text-slate-500 mt-1">Mon–Sat: 10:00 AM – 7:00 PM</p>
                </div>
              </div>
            </div>

            {/* Email & Website Card */}
            <div className="group relative bg-white rounded-2xl  border-slate-100 p-8 transition-all duration-300 hover:hover:-translate-y-1">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative space-y-6">
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Email Us</h3>
                    <a
                      href={`mailto:${email}`}
                      className="text-lg text-amber-700 hover:text-amber-800 transition-colors"
                    >
                      {email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Website</h3>
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-amber-700 hover:text-amber-800 transition-colors"
                    >
                      {website.replace('https://', '')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Social Links + Quick Message CTA */}
          <div className="bg-white rounded-2xl border-slate-100 p-8 lg:p-10">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6">Connect With Us</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Follow our journey, get inspired by new arrivals, and join our community of mindful luxury lovers.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-all duration-300 hover:bg-gradient-to-br hover:from-amber-500 hover:to-orange-600 hover:text-white hover:shadow-lg hover:scale-110"
                  aria-label={link.platform}
                >
                  {getIcon(link.platform)}
                </a>
              ))}
            </div>

            {/* Quick CTA / Newsletter teaser */}
            <div className="border-t border-slate-100 pt-8">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Stay Updated</h4>
              <p className="text-slate-600 mb-5">
                Subscribe for exclusive previews, artisan stories, and special offers.
              </p>
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 rounded-lg border border-slate-200 px-5 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                  required
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 font-semibold text-white shadow-md hover:from-amber-700 hover:to-orange-700 transition-all duration-300"
                >
                  <Send className="h-4 w-4" />
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Elegance & Co. — Crafted with care in India. All rights reserved.</p>
        </div>
      </div>
    </section>
  );
}