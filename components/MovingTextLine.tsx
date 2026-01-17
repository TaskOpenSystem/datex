import Marquee from "@/components/ui/Marquee";

export default function MovingTextLine() {
    return (
        <div className="mt-16 bg-white text-black py-4 border-y-4 border-black">
            <Marquee reverse className="[--duration:20s]">
                <span className="text-4xl md:text-5xl font-display uppercase mx-8">
                    Monetize Data • Prevent Fraud • Developer SDK • MCP Agents • Powered by Enoki •
                </span>
                <span className="text-4xl md:text-5xl font-display uppercase mx-8">
                    Monetize Data • Prevent Fraud • Developer SDK • MCP Agents • Powered by Enoki •
                </span>
            </Marquee>
        </div>
    );
}
