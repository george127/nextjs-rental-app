"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Bed, Bath, Ruler, DollarSign, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* =========================
   MOTION VARIANTS
========================= */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     FETCH PROPERTY
  ========================= */
  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:5000/api/properties/${id}`
        );

        if (!res.ok) {
          throw new Error("Property not found");
        }

        const data = await res.json();
        setProperty(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  /* =========================
     MEMOS (Always before returns)
  ========================= */
  const fullAddress = useMemo(() => {
    if (!property) return "";
    return `${property.address}, ${property.city}, ${property.state}`;
  }, [property]);

  const mapSrc = useMemo(() => {
    if (!fullAddress) return "";
    return `https://www.google.com/maps?q=${encodeURIComponent(
      fullAddress
    )}&output=embed`;
  }, [fullAddress]);

  const imageSrc = useMemo(() => {
    if (!property?.imageData) return "/placeholder.jpg";

    if (property.imageData.startsWith("data:image")) {
      return property.imageData;
    }

    return `data:image/jpeg;base64,${property.imageData}`;
  }, [property]);

  /* =========================
     EARLY RETURNS
  ========================= */
  if (loading)
    return <p className="p-10 text-center">Loading property...</p>;

  if (error)
    return <p className="p-10 text-center text-red-500">{error}</p>;

  if (!property)
    return <p className="p-10 text-center">Property not found.</p>;

  /* =========================
     UI
  ========================= */
  return (
    <>
      <Navbar />

      {/* HERO */}
      <motion.div
        className="relative h-[420px] w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <img
          src={imageSrc}
          alt={property.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl">
          <h1 className="text-4xl font-bold text-white">
            {property.name}
          </h1>
          <p className="flex items-center gap-2 text-white/80 mt-2">
            <MapPin className="w-4 h-4" />
            {fullAddress}
          </p>
        </div>
      </motion.div>

      {/* MAIN */}
      <motion.div
        className="px-40 py-24 grid lg:grid-cols-3 gap-10"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* LEFT */}
        <motion.div className="lg:col-span-2 space-y-10" variants={fadeUp}>
          {/* STATS */}
          <div className="grid grid-cols-3 gap-4">
            <Stat icon={<Bed />} label="Bedrooms" value={property.bedrooms} />
            <Stat icon={<Bath />} label="Bathrooms" value={property.bathrooms} />
            <Stat
              icon={<Ruler />}
              label="Size"
              value={`${property.squareFeet || "-"} sqft`}
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <h2 className="text-xl font-semibold mb-2">
              About this property
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {property.description || "No description provided."}
            </p>
          </div>

          {/* MAP */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Location</h2>
            <div className="rounded-2xl overflow-hidden border h-[320px]">
              <iframe
                src={mapSrc}
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          </div>

          {/* MANAGER */}
          <div className="flex items-center gap-3 rounded-xl border p-5 bg-muted/40">
            <User className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">
                Managed by
              </p>
              <p className="font-semibold">
                {property.manager?.name || "Verified Manager"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* RIGHT CARD */}
        <div className="sticky top-24 h-fit rounded-2xl border shadow-lg p-6 space-y-6 bg-white">
          <div>
            <p className="text-sm text-muted-foreground">
              Monthly Rent
            </p>
            <p className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-500" />
              {property.rentAmount}
            </p>
          </div>

          <Button
            size="lg"
            className="w-full rounded-xl text-lg"
            onClick={() => router.push(`/properties/${id}/apply`)}
          >
            Apply for this Property
          </Button>
        </div>
      </motion.div>

      <Footer />
    </>
  );
}

/* =========================
   STAT COMPONENT
========================= */
function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border p-4 flex flex-col items-center gap-2 bg-white shadow-sm">
      <div className="text-primary">{icon}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}