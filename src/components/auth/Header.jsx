// components/Header.jsx
import React from 'react';

const Header = ({
  title = 'Welcome to TechnoMart',
  subtitle = 'Canteen Management System for CTU-MC Multipurpose Cooperative',
}) => {
  return (
    <header className="w-full py-6 px-6 bg-gradient-to-r from-blue-50 to-white">
      <h1 className="text-3xl md:text-4xl font-bold text-primary drop-shadow text-center">
        {title}
      </h1>
      <p className="mt-2 text-base md:text-lg text-gray-700 text-center">
        {subtitle}
      </p>
    </header>
  );
};

export default Header;
