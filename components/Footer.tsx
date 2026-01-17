export default function Footer() {
  return (
    <footer className="mt-20 relative">
      <div className="bg-slush-orange dark:bg-slush-dark border-t-4 border-black dark:border-t dark:border-white py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
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
              <button className="bg-black text-white border-2 border-black px-8 py-3 rounded-full font-bold uppercase hover:bg-white hover:text-black transition-colors">
                Subscribe
              </button>
            </form>
          </div>
          <div className="relative h-64 md:h-80 bg-blue-400 rounded-2xl border-4 border-black overflow-hidden flex items-center justify-center">
            <div className="text-center p-8 bg-white/20 backdrop-blur-md rounded-xl border border-white/50">
              <h3 className="font-display text-3xl uppercase text-white mb-2">
                Always Here
              </h3>
              <p className="font-bold text-white mb-4">To Help</p>
              <button className="bg-white text-black text-xs font-bold uppercase px-4 py-2 rounded-full">
                Get Support
              </button>
            </div>
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
          <div className="font-display text-4xl uppercase tracking-tighter">
            DatEx
          </div>
          <div className="flex gap-4">
            <a
              className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg hover:bg-white hover:text-black transition-colors border-2 border-transparent hover:border-black"
              href="#"
            >
              <i className="material-icons">discord</i>
            </a>
            <a
              className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg hover:bg-white hover:text-black transition-colors border-2 border-transparent hover:border-black"
              href="#"
            >
              <span className="font-bold">X</span>
            </a>
            <a
              className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-lg hover:bg-white hover:text-black transition-colors border-2 border-transparent hover:border-black"
              href="#"
            >
              <span className="material-icons">camera_alt</span>
            </a>
          </div>
          <div className="text-xs font-bold uppercase text-center md:text-right">
            <p>Terms of Service • Privacy Policy</p>
            <p className="mt-1">© 2026 Data Exchange Inc.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
