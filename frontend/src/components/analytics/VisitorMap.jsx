"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), { 
  ssr: false,
  loading: () => <div className="h-96 w-full animate-pulse rounded-2xl bg-slate-100"></div>
});

export default function VisitorMap({ visitors }) {
  return <Map visitors={visitors} />;
}
