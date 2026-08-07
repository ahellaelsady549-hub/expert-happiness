import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Compass, ExternalLink, MapPin, Navigation } from "lucide-react";
import { useCoords } from "@/lib/use-prayer";

export const Route = createFileRoute("/mosques")({
  head: () => ({
    meta: [
      { title: "أقرب المساجد إليك — أمتي" },
      {
        name: "description",
        content: "ابحث عن أقرب المساجد إلى موقعك الحالي مع المسافة والاتجاه وفتح الطريق على الخريطة.",
      },
      { property: "og:title", content: "أقرب المساجد إليك — أمتي" },
      { property: "og:description", content: "دليل أقرب المساجد حسب موقعك الجغرافي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://spiritual-compass-36.lovable.app/mosques" }],
  }),
  component: MosquesPage,
});

type Mosque = { id: number; name: string; lat: number; lon: number; distance: number };

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}

async function fetchMosques(lat: number, lon: number): Promise<Mosque[]> {
  const query = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lon});way["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lon}););out center 60;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error("تعذّر البحث عن المساجد");
  const json = (await res.json()) as {
    elements: { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[];
  };
  return json.elements
    .map((e) => {
      const la = e.lat ?? e.center?.lat;
      const lo = e.lon ?? e.center?.lon;
      if (la === undefined || lo === undefined) return null;
      return {
        id: e.id,
        name: e.tags?.["name:ar"] ?? e.tags?.["name"] ?? "مسجد",
        lat: la,
        lon: lo,
        distance: distanceKm(lat, lon, la, lo),
      };
    })
    .filter((m): m is Mosque => Boolean(m))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 30);
}

function MosquesPage() {
  const { coords, error } = useCoords();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["mosques", coords?.lat, coords?.lon],
    queryFn: () => fetchMosques(coords!.lat, coords!.lon),
    enabled: Boolean(coords),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-3xl font-bold gold-gradient-text">
        <Compass className="h-7 w-7 text-gold" /> أقرب المساجد
      </h1>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        {error ?? (coords ? "المساجد ضمن ٥ كيلومترات من موقعك" : "جارٍ تحديد موقعك...")}
      </p>

      {isLoading && coords && <p className="mt-6 text-sm text-muted-foreground">جارٍ البحث عن المساجد القريبة...</p>}
      {isError && <p className="mt-6 text-sm text-destructive">تعذّر جلب المساجد الآن، حاول لاحقًا.</p>}
      {data?.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">لم نعثر على مساجد مسجّلة قريبة منك.</p>
      )}

      <div className="mt-6 grid gap-3">
        {data?.map((m, i) => (
          <div
            key={m.id}
            className="surface flex animate-fade-up items-center justify-between gap-3 p-4"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div>
              <p className="font-display text-lg">{m.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                يبعد {m.distance < 1 ? `${Math.round(m.distance * 1000)} متر` : `${m.distance.toFixed(1)} كم`}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl hero-gradient px-3 py-2 text-xs font-semibold text-gold"
            >
              <Navigation className="h-3.5 w-3.5" /> الطريق
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
