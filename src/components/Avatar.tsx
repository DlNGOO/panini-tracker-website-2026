import React from "react";

interface AvatarProps {
  avatar: string;
  className?: string;
}

export default function Avatar({ avatar, className = "text-xl shrink-0" }: AvatarProps) {
  if (!avatar) {
    return <span className={className}>👤</span>;
  }
  
  const isImage = avatar.startsWith("data:") || avatar.startsWith("http") || avatar.length > 8;
  
  if (isImage) {
    // Extract tailwind sizing to make it fit beautifully as an image
    // Standard sizes are text-xl (approx 24px), text-2xl (approx 32px), etc.
    let imgSizeClass = "w-8 h-8";
    if (className.includes("text-2xl")) {
      imgSizeClass = "w-10 h-10";
    } else if (className.includes("text-3xl")) {
      imgSizeClass = "w-12 h-12";
    } else if (className.includes("text-xl")) {
      imgSizeClass = "w-8 h-8";
    } else if (className.includes("w-")) {
      // If className already specifies width, just use standard rounded image
      return (
        <img
          src={avatar}
          className={`${className} rounded-full object-cover border border-slate-800`}
          alt="User Profile"
          referrerPolicy="no-referrer"
        />
      );
    }
    
    return (
      <img
        src={avatar}
        className={`${imgSizeClass} rounded-full object-cover border border-slate-800 shadow-sm shrink-0`}
        alt="User Profile"
        referrerPolicy="no-referrer"
      />
    );
  }
  
  return <span className={className}>{avatar}</span>;
}
