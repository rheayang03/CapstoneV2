// components/HeroImage.jsx
import React from 'react';

const HeroImage = ({ src, alt = 'TechnoMart Canteen' }) => {
  return (
    <div className="w-full md:w-1/2 flex items-center justify-center mt-8 md:mt-0 order-1 md:order-2">
      <div className="relative w-full max-w-xl h-64 md:h-auto md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
      </div>
    </div>
  );
};

export default HeroImage;
