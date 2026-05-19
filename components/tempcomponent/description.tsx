import React from 'react';

export default function Description({ 
  heading, 
  description, 
}: { 
  heading?: string;
  description?: string;
}){

  return (
    <div className="card-header">

      {/* Heading */}
      <h2 className="core-header-title">
        {heading?heading:"Why Choose a Single-Focus Landing Page?"}
      </h2>

      <div className="w-12 h-1 bg-gray-100 mx-auto mb-4 rounded-full"></div>

      {/* Description → Supports bold, italic, button, list, colors, etc. */}
      <div
        className="prose prose-sm md:prose-lg text-gray-700 leading-relaxed max-w-2xl mx-auto"
        dangerouslySetInnerHTML={{ __html: description?description:"Single Focus: Dedicated to one objective, such as getting a form submission or a purchase. " }}
      ></div>

    </div>
  );
}
