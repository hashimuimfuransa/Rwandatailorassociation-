import News from "@/components/News";
import Events from "@/components/Events";
import ImpactStats from "@/components/ImpactStats";

export default function NewsEvents() {
  return (
    <section id="news" className="section-pad bg-white">
      <div className="container-page grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <News />
        </div>
        <div className="lg:col-span-3">
          <Events />
        </div>
        <div className="lg:col-span-3">
          <ImpactStats />
        </div>
      </div>
    </section>
  );
}
