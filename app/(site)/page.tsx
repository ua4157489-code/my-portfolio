import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import SectionCards from "@/components/SectionCards";
import {
  Intro,
  Focus,
  FeaturedProjects,
  ExperienceSnapshot,
  EducationSnapshot,
  FinalCta,
} from "@/components/HomeSections";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Intro />
      <Focus />
      <FeaturedProjects />
      <ExperienceSnapshot />
      <EducationSnapshot />
      <SectionCards />
      <FinalCta />
    </>
  );
}
