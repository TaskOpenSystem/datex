export default function DataShortcutSection() {
    return (
        <section className="py-6 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="mb-6 text-center">
                <h2 className="font-display text-5xl md:text-6xl mb-4 uppercase">
                    Your Shortcut to get <br className="md:hidden" />
                    Data
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 bg-slush-yellow rounded-large border-4 border-black p-8 relative overflow-hidden group min-h-[400px]">
                    <div className="relative z-10">
                        <h3 className="font-display text-5xl md:text-6xl text-black uppercase leading-none mb-4">
                            Explore
                            <br />
                            Data
                            <br />
                            Opportunities
                        </h3>
                        <p className="text-black font-semibold text-lg max-w-xs mb-8">
                            Discover vetted datasets to put your algorithms to work through
                            your next AI models.
                        </p>
                        <button className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm uppercase group-hover:bg-white group-hover:text-black transition-colors">
                            Start Now{" "}
                            <span className="material-icons text-sm align-middle ml-1">
                                arrow_forward
                            </span>
                        </button>
                    </div>
                    <div className="absolute -right-10 bottom-0 w-64 h-64 md:w-80 md:h-80">
                        <img
                            alt="Coins"
                            className="w-full h-full object-cover rounded-full border-4 border-black transform rotate-12 group-hover:rotate-0 transition-transform duration-500"
                            src="/walrus.svg"
                        />
                    </div>
                </div>
                <div className="md:col-span-5 bg-slush-purple rounded-large border-4 border-black p-8 flex flex-col justify-between relative overflow-hidden group">
                    <div className="z-10">
                        <h3 className="font-display text-4xl md:text-5xl text-white uppercase leading-none mb-4 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                            Simple, Direct
                            <br />
                            Execution
                        </h3>
                        <p className="text-white font-medium">
                            Buy and sell datasets in a few taps. Verify dataset with simple
                            click.
                        </p>
                    </div>
                    <div className="mt-8 relative h-48 bg-white rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {/* Animation Container */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            {/* Buy Button */}
                            <button
                                className="buy-button bg-black text-white px-8 py-3 rounded-full font-bold text-sm uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                            >
                                Buy Now
                                <span className="material-icons text-sm align-middle ml-2">shopping_cart</span>
                            </button>

                            {/* Animated Cursor */}
                            <div className="cursor-animation absolute">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M4 2L4 18L8 14L12 22L14 21L10 13L16 13L4 2Z"
                                        fill="black"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
