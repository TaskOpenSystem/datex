export default function CardsSection() {
  return (
    <section className="py-10 px-4 max-w-7xl mx-auto text-center">
      <h2 className="font-display text-5xl md:text-7xl mb-6 uppercase">
        Data for humans.
        <br />
        Not just bots.
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <div className="bg-slush-yellow p-6 rounded-large border-4 border-black dark:border-gray-200 text-left relative group hover:-translate-y-2 transition-transform duration-300">
          <h3 className="font-display text-4xl uppercase mb-2 leading-none text-black">
            Frictionless
            <br />
            Onboarding
          </h3>
          <div className="mt-4 mb-16">
            <button className="bg-black text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
              Learn More
            </button>
          </div>
          <div className="absolute bottom-4 right-4 transform rotate-12 group-hover:rotate-0 transition-transform">
            <span className="material-icons text-6xl text-black opacity-20 group-hover:opacity-100 transition-opacity">
              swipe
            </span>
          </div>
        </div>
        <div className="bg-slush-purple p-6 rounded-large border-4 border-black dark:border-gray-200 text-left relative group hover:-translate-y-2 transition-transform duration-300">
          <h3 className="font-display text-4xl uppercase mb-2 leading-none text-white">
            For Data
            <br />
            Power Users
          </h3>
          <div className="mt-4 mb-16">
            <button className="bg-black text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
              Earn +
            </button>
          </div>
          <div className="absolute bottom-4 right-4 transform -rotate-12 group-hover:rotate-0 transition-transform">
            <span className="material-icons text-6xl text-white opacity-20 group-hover:opacity-100 transition-opacity">
              analytics
            </span>
          </div>
        </div>
        <div className="bg-primary p-6 rounded-large border-4 border-black dark:border-gray-200 text-left relative group hover:-translate-y-2 transition-transform duration-300">
          <h3 className="font-display text-4xl uppercase mb-2 leading-none text-white">
            For
            <br />
            Developers
          </h3>
          <div className="mt-4 mb-16">
            <button className="bg-black text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
              Our Discord
            </button>
          </div>
          <div className="absolute bottom-4 right-4 transform rotate-6 group-hover:rotate-0 transition-transform">
            <span className="material-icons text-6xl text-white opacity-20 group-hover:opacity-100 transition-opacity">
              code
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
