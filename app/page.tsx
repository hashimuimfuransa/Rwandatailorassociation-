import Hero from "@/components/Hero";
import Partners from "@/components/Partners";
import Services from "@/components/Services";
import About from "@/components/About";
import Membership from "@/components/Membership";
import NewsEvents from "@/components/NewsEvents";
import Gallery from "@/components/Gallery";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Partners />
      <Services />
      <About />
      <Membership />
      <NewsEvents />
      <Gallery />
      <Testimonials />
      <CTA />
    </>
  );
}
