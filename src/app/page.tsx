import { HomeHeader } from "@/components/HomeHeader";
import { HomeHero } from "@/components/HomeHero";
import { HomeHowItWorks } from "@/components/HomeHowItWorks";
import { HomeShowcase } from "@/components/HomeShowcase";
import { HomeLinkPreview } from "@/components/HomeLinkPreview";
import { HomeSocialProof } from "@/components/HomeSocialProof";
import { HomeFinalCta } from "@/components/HomeFinalCta";
import { HomeFooter } from "@/components/HomeFooter";

export default function Home() {
  return (
    <div className="flex flex-1 min-h-screen overflow-x-hidden bg-[#2A2A2A]">
      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      <main
        className="flex w-full flex-col overflow-x-hidden md:w-120 md:flex-none border-x border-white/10 bg-[#2A2A2A]"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <HomeHeader />
        <HomeHero />
        <HomeHowItWorks />
        <HomeShowcase />

        <HomeLinkPreview />

        <HomeSocialProof />
        <HomeFinalCta />
        <HomeFooter />
      </main>

      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />
    </div>
  );
}
