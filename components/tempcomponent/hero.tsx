import React from "react";

export default function Header({ 
  title, 
  sub_title, 
  logo 
}: { 
  title?: string;
  sub_title?: string;
  logo?: string;
}){
  

  return ( 
    <div className="flex flex-col items-center text-center py-6 px-4">

    {/* Shadow Wrapper */}
    <div className="rounded-full shadow-xl p-1 mb-4">
      <div className="w-10 h-10 rounded-full overflow-hidden">
        <img
          src={logo?logo:"/blank.png"}
          alt="Brand Logo"
          className="w-full h-full object-cover"
          onError={(e) => (e.currentTarget.src = "/blank.png")}
        />
      </div>
    </div>
  
    {/* Title */}
    <h1 className="text-3xl font-bold text-gray-900 mb-2">
      {title?title:"Your Brand Name"}
    </h1>
  
    {/* Subtitle */}
    <p className="text-gray-600 text-base leading-relaxed max-w-md">
      {sub_title?sub_title:"Your subtitle text goes here. This can be one or two lines long."}
    </p>
  </div>
  

  );
}