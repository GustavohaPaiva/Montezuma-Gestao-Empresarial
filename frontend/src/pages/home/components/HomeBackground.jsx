import { homeGridTextureStyle } from "../homeUi";

export default function HomeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-white via-bg-primary to-accent-primary/[0.04]" />

      <div
        className="absolute inset-0 opacity-40"
        style={homeGridTextureStyle}
      />

      <div className="absolute -top-28 left-1/2 h-[min(400px,52vh)] w-[min(760px,92vw)] -translate-x-1/2 rounded-full bg-accent-primary opacity-[0.08] blur-[120px]" />
      <div className="absolute -bottom-20 right-[5%] h-[min(280px,38vh)] w-[min(320px,50vw)] rounded-full bg-accent-primary opacity-[0.06] blur-[100px]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-8%,rgba(220,59,11,0.07),transparent_58%)]" />

      <div className="absolute -right-12 top-36 h-48 w-48 rounded-full border border-accent-primary/10 opacity-50" />
      <div className="absolute -left-8 bottom-28 h-32 w-32 rounded-full border border-dashed border-accent-primary/12 opacity-40" />
    </div>
  );
}
