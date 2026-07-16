import WhyJoin from "@/components/WhyJoin";
import FeaturedTailors from "@/components/FeaturedTailors";

export default function Membership() {
  return (
    <section id="why-join" className="section-pad bg-background">
      <div className="container-page grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <WhyJoin />
        </div>
        <div className="lg:col-span-7">
          <FeaturedTailors />
        </div>
      </div>
    </section>
  );
}
