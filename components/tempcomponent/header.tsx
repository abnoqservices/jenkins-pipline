import React from "react";

export default function Header({ 
  heading, 
  subheading 
}: { 
  heading?: string;
  subheading?: string;
}){
  return ( 
    <div className="flex flex-col items-center text-center py-6 px-4">
      {/* Heading */}
      {heading && (
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {heading}
        </h2>
      )}
  
      {/* Subheading */}
      {subheading && (
        <p className="text-gray-600 text-base leading-relaxed max-w-md">
          {subheading}
        </p>
      )}
    </div>
  );
}
