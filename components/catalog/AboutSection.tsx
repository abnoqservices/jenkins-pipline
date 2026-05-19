'use client';

import { useState } from 'react';
import { ChevronDown,Award } from 'lucide-react';

interface AboutSectionProps {
  about: string;
  mission: string;
  vision: string;
}

export default function AboutSection({ about, mission, vision }: AboutSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Open "About Us" by default

  const items = [
    { label: "About Us", title: "Our Story", text: about },
    { label: "Mission",   title: "What We Do",   text: mission },
    { label: "Vision",    title: "Our Future",   text: vision },
  ];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Heading */}
    

        {/* Accordion */}
        <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl p-8   border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="h-6 w-6 text-amber-600" />
                  <h3 className="font-serif text-xl font-bold text-gray-900">Quality Guarantee</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Authentic Materials</h5>
                      <p className="text-gray-600 text-xs mt-1">100% genuine craftsmanship</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Sustainable Sourcing</h5>
                      <p className="text-gray-600 text-xs mt-1">Ethically made products</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Artisan Partnership</h5>
                      <p className="text-gray-600 text-xs mt-1">Direct collaboration</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Quality Assured</h5>
                      <p className="text-gray-600 text-xs mt-1">100% satisfaction</p>
                    </div>
                  </div>
                </div>
            </div>
          {items.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={`
                  group rounded-2xl  border-slate-200 
                  bg-white overflow-hidden shadow-sm
                  transition-all duration-300
                  ${isOpen ? ' border-amber-200/70' : ' hover:border-amber-100'}
                `}
              >
                {/* Header / Trigger */}
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="inline-block rounded-full bg-amber-100 px-3.5 py-1 text-xs font-semibold text-amber-800">
                      {item.label}
                    </span>
                    <h3 className={`
                      text-xl sm:text-2xl font-semibold transition-colors
                      ${isOpen ? 'text-amber-800' : 'text-slate-900 group-hover:text-amber-700'}
                    `}>
                      {item.title}
                    </h3>
                  </div>

                  <ChevronDown
                    className={`
                      h-6 w-6 text-slate-500 transition-transform duration-300
                      ${isOpen ? 'rotate-180 text-amber-600' : 'group-hover:text-amber-600'}
                    `}
                  />
                </button>

                {/* Content */}
                <div
                  className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
                  `}
                >
                  <div className="px-6 sm:px-8 pb-7 sm:pb-9 pt-1">
                    {/* Subtle top accent line when open */}
                    {isOpen && (
                      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mb-6" />
                    )}

                    <p className="text-slate-700 leading-relaxed text-[15.5px] whitespace-pre-line">
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
              
        </div>
      </div>
      
    </section>
  );
}