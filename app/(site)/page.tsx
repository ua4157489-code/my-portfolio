import HomeDots from "@/components/HomeDots";
import HomeHero from "@/components/HomeHero";
import WordRibbon from "@/components/WordRibbon";
import HomeTerminal from "@/components/HomeTerminal";
import SkillSphere from "@/components/SkillSphere";
import ProjectShowcase from "@/components/ProjectShowcase";
import GithubLive from "@/components/GithubLive";
import Journey from "@/components/Journey";
import SectionCards from "@/components/SectionCards";
import HomeContact from "@/components/HomeContact";

export default function Home() {
  return (
    <>
      <HomeDots />
      <HomeHero />
      <WordRibbon />
      <HomeTerminal />
      <SkillSphere />
      <ProjectShowcase />
      <GithubLive />
      <Journey />
      <div id="home-explore">
        <SectionCards />
      </div>
      <HomeContact />
    </>
  );
}
