import Marquee from "@/components/ui/Marquee";

export default function CardsSection() {
  return (
    <section className="py-10 px-0 max-w-full overflow-hidden text-center">
      <h2 className="font-display text-5xl md:text-7xl mb-6 uppercase">
        Data for humans.
        <br />
        Not just bots.
      </h2>

      {/* Cards Marquee */}
      <div className="mt-16">
        <Marquee pauseOnHover className="[--duration:40s]">
          {/* Card 1: Monetize Data */}
          <div className="bg-slush-yellow p-6 rounded-large border-4 border-black dark:border-gray-200 text-left relative group hover:-translate-y-2 transition-transform duration-300 w-[300px] md:w-[400px] h-[400px] flex flex-col mx-4 cursor-pointer">
            <h3 className="font-display text-7xl uppercase mb-2 leading-none text-black">
              Monetize
              <br />
              Your Data
            </h3>
            <div className="mt-4 flex-grow">
              <p className="text-black text-lg leading-tight font-medium">
                Marketplace to sell your data securely.
              </p>
            </div>
            <div className="mt-4 mb-4 flex justify-between items-center w-full px-4">
              <button className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold uppercase">
                Start Selling
              </button>
              <div className="transform rotate-12 group-hover:rotate-0 transition-transform">
                <span className="material-icons text-6xl text-black opacity-20 group-hover:opacity-100 transition-opacity">
                  monetization_on
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Fraud Prevention */}
          <div className="bg-slush-purple p-6 rounded-large border-4 border-black dark:border-gray-200 text-left relative group hover:-translate-y-2 transition-transform duration-300 w-[300px] md:w-[400px] h-[400px] flex flex-col mx-4 cursor-pointer">
            <h3 className="font-display text-7xl uppercase mb-2 leading-none text-black">
              Fraud
              <br />
              Prevention
            </h3>
            <div className="mt-4 flex-grow">
              <p className="text-black text-lg leading-tight font-medium">
                Random subset verification for buyers to prevent scams.
              </p>
            </div>
            <div className="mt-4 mb-4 flex justify-between items-center w-full px-4">
              <button className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold uppercase">
                Learn More
              </button>
              <div className="transform -rotate-12 group-hover:rotate-0 transition-transform">
                <span className="material-icons text-6xl text-black opacity-20 group-hover:opacity-100 transition-opacity">
                  security
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: SDK & Agents */}
          <div className="bg-primary p-6 rounded-large border-4 border-black dark:border-gray-200 text-left relative group hover:-translate-y-2 transition-transform duration-300 w-[300px] md:w-[400px] h-[400px] flex flex-col mx-4 cursor-pointer">
            <h3 className="font-display text-7xl uppercase mb-2 leading-none text-black">
              SDK &
              <br />
              Agents
            </h3>
            <div className="mt-4 flex-grow">
              <p className="text-black text-lg leading-tight font-medium">
                Full SDK support and MCP integration for x402.
              </p>
            </div>
            <div className="mt-4 mb-4 flex justify-between items-center w-full px-4">
              <button className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold uppercase">
                Docs
              </button>
              <div className="transform rotate-6 group-hover:rotate-0 transition-transform">
                <span className="material-icons text-6xl text-black opacity-20 group-hover:opacity-100 transition-opacity">
                  code
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Enoki */}
          <div className="bg-slush-red p-6 rounded-large border-4 border-black dark:border-gray-200 text-left relative group hover:-translate-y-2 transition-transform duration-300 w-[300px] md:w-[400px] h-[400px] flex flex-col mx-4 cursor-pointer">
            <h3 className="font-display text-7xl uppercase mb-2 leading-none text-black">
              Frictionless
              <br />
              UX
            </h3>
            <div className="mt-4 flex-grow">
              <p className="text-black text-lg leading-tight font-medium">
                Auto-sign transactions powered by Enoki.
              </p>
            </div>
            <div className="mt-4 mb-4 flex justify-between items-center w-full px-4">
              <button className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold uppercase">
                Try It
              </button>
              <div className="transform -rotate-6 group-hover:rotate-0 transition-transform">
                <span className="material-icons text-6xl text-black opacity-20 group-hover:opacity-100 transition-opacity">
                  bolt
                </span>
              </div>
            </div>
          </div>
        </Marquee>
      </div>

    </section>
  );
}
