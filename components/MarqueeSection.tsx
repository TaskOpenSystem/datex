interface MarqueeSectionProps {
  variant?: "default" | "reverse";
  text: string;
  bgColor?: string;
}

export default function MarqueeSection({
  variant = "default",
  text,
  bgColor = "bg-black",
}: MarqueeSectionProps) {
  const animationClass =
    variant === "reverse" ? "animate-marquee-reverse" : "animate-marquee";

  return (
    <div
      className={`${bgColor} py-6 overflow-hidden border-y-4 border-black dark:border-white ${
        variant === "default" ? "rotate-1 md:rotate-2" : "-rotate-1"
      } my-10 relative z-20`}
    >
      <div className={`whitespace-nowrap ${animationClass} flex gap-8`}>
        <span className="text-4xl font-display uppercase text-white tracking-wider">
          {text}
        </span>
        <span className="text-4xl font-display uppercase text-slush-yellow tracking-wider">
          {text}
        </span>
        <span className="text-4xl font-display uppercase text-slush-green tracking-wider">
          {text}
        </span>
        <span className="text-4xl font-display uppercase text-slush-purple tracking-wider">
          {text}
        </span>
        <span className="text-4xl font-display uppercase text-white tracking-wider">
          {text}
        </span>
        <span className="text-4xl font-display uppercase text-slush-yellow tracking-wider">
          {text}
        </span>
        <span className="text-4xl font-display uppercase text-slush-green tracking-wider">
          {text}
        </span>
        <span className="text-4xl font-display uppercase text-slush-purple tracking-wider">
          {text}
        </span>
      </div>
    </div>
  );
}
