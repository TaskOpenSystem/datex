export default function Footer() {
  return (
    <footer className="mt-20 relative bg-background-light dark:bg-background-dark text-black dark:text-white">
      <div className="bg-slush-orange dark:bg-slush-dark border-t-4 border-black dark:border-t dark:border-white py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center mb-20">
          <div>
            <h2 className="font-display text-6xl md:text-8xl uppercase leading-none mb-6 italic text-black dark:text-white">
              Get
              <br />
              Data
              <br />
              Now
            </h2>
            <p className="font-bold text-xl mb-8 max-w-sm text-black dark:text-gray-300">
              Subscribe to our newsletter for VIP access to new datasets and
              insights!
            </p>
            <form className="flex flex-col md:flex-row gap-4">
              <input
                className="bg-white border-2 border-black px-6 py-3 rounded-full font-bold uppercase w-full md:w-auto placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-black/20 text-black"
                placeholder="YOUR@EMAIL.COM"
                type="email"
              />
              <FlipCard
                className="h-12 w-48"
                type="button"
                backChildren={
                  <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-black bg-white font-bold uppercase text-black">
                    Subscribe
                  </div>
                }
              >
                <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-black bg-black font-bold uppercase text-white">
                  Subscribe
                </div>
              </FlipCard>
            </form>
          </div>

          {/* New Support Section */}
          <div className="relative h-[320px] w-full bg-slush-blue rounded-2xl border-4 border-black overflow-hidden flex flex-col justify-center">
            <SupportMarquee />
            <div
              className="absolute inset-0 -z-10 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 2px, transparent 2px)",
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>
        </div>
      </div>
      <div className="bg-slush-green border-t-4 border-black py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-display text-4xl uppercase tracking-tighter text-black">
            DatEx
          </div>
          <div className="flex gap-4">
            <SocialIcon platform="discord" />
            <SocialIcon platform="x" />
            <SocialIcon platform="instagram" />
          </div>
          <div className="text-xs font-bold uppercase text-center md:text-right text-black">
            <p>Terms of Service • Privacy Policy</p>
            <p className="mt-1">© 2026 Data Exchange Inc.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Marquee from "@/components/ui/Marquee";
import FlipCard from "@/components/ui/FlipCard";
import { Mail, Send, Instagram } from "lucide-react";

function SupportMarquee() {
  const socials = [
    { name: "Discord", icon: <DiscordIcon />, href: "#" },
    { name: "Telegram", icon: <Send size={24} />, href: "#" },
    { name: "X", icon: <XIcon />, href: "#" },
    { name: "Instagram", icon: <Instagram size={24} />, href: "#" },
    { name: "Gmail", icon: <Mail size={24} />, href: "#" },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Row 1: Connections */}
      <div className="flex-1 flex bg-white/20 backdrop-blur-sm border-b-2 border-black/10 hover:bg-white/30 transition-colors relative z-10">
        <Marquee className="items-center" duration={25}>
          {socials.map((social, i) => (
            <FlipCard
              key={i}
              href={social.href}
              className="mx-8 h-12 w-auto min-w-[180px]"
              backChildren={
                <div className="flex items-center justify-center gap-2 h-full w-full px-6 bg-white rounded-full text-black border-2 border-black">
                  {social.icon}
                  <span className="font-display uppercase text-lg">{social.name}</span>
                </div>
              }
            >
              {/* Front: Black */}
              <div className="flex items-center justify-center gap-2 h-full w-full px-6 bg-black rounded-full text-white border-2 border-transparent">
                {social.icon}
                <span className="font-display uppercase text-lg">{social.name}</span>
              </div>
            </FlipCard>
          ))}
        </Marquee>
      </div>

      {/* Row 2: Get Support Now */}
      <a href="#" className="flex-1 flex bg-slush-yellow border-y-2 border-black hover:bg-yellow-300 transition-colors relative z-10 group decoration-transparent">
        <Marquee reverse duration={15} className="items-center">
          <span className="text-5xl md:text-6xl font-display uppercase italic text-black mx-12 group-hover:scale-105 transition-transform">
            GET SUPPORT NOW •
          </span>
          <span className="text-5xl md:text-6xl font-display uppercase italic text-white mx-12 group-hover:text-black transition-colors group-hover:scale-105">
            WE ARE ONLINE •
          </span>
        </Marquee>
      </a>

      {/* Row 3: Connections (Reverse) */}
      <div className="flex-1 flex bg-white/20 backdrop-blur-sm border-t-2 border-black/10 hover:bg-white/30 transition-colors relative z-10">
        <Marquee className="items-center" duration={30} reverse>
          {socials.map((social, i) => (
            <FlipCard
              key={i}
              href={social.href}
              className="mx-8 h-12 w-auto min-w-[180px]"
              backChildren={
                <div className="flex items-center justify-center gap-2 h-full w-full px-6 bg-black rounded-full text-white border-2 border-transparent">
                  {social.icon}
                  <span className="font-display uppercase text-lg">{social.name}</span>
                </div>
              }
            >
              {/* Front: White */}
              <div className="flex items-center justify-center gap-2 h-full w-full px-6 bg-white rounded-full text-black border-2 border-black">
                {social.icon}
                <span className="font-display uppercase text-lg">{social.name}</span>
              </div>
            </FlipCard>
          ))}
        </Marquee>
      </div>
    </div>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  // Simplified for bottom bar
  return (
    <a href="#" className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg hover:bg-white hover:text-black transition-colors border-2 border-transparent hover:border-black">
      {platform === 'discord' && <DiscordIcon className="w-5 h-5" />}
      {platform === 'x' && <XIcon className="w-5 h-5" />}
      {platform === 'instagram' && <Instagram size={20} />}
    </a>
  );
}

// Icons
function DiscordIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 26.153 26.153 0 0 0-3.361 1.769 24.269 24.269 0 0 0-3.361-1.769.077.077 0 0 0-.08-.037A19.736 19.736 0 0 0 3.682 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.127 10.2 10.2 0 0 0 .729-.573.075.075 0 0 1 .138 0c3.682 1.7 7.683 1.7 11.291 0a.075.075 0 0 1 .138 0 10.2 10.2 0 0 0 .729.573.077.077 0 0 1-.008.127 13.107 13.107 0 0 1-1.872.892.076.076 0 0 0-.04.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.9 19.9 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.334-.946 2.42-2.157 2.42z" /></svg>
  )
}

function XIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
  )
}

