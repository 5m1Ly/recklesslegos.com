import { CATS, type CatKey } from "@/lib/types";

export function CatTag({ cat }: { cat: string }) {
  const c = CATS[cat as CatKey];
  if (!c) return null;
  return (
    <span className={`tag ${c.cls}`}>
      <span className="dot" />
      {c.label}
    </span>
  );
}
