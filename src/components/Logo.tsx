import Link from "next/link";
import { Search } from "lucide-react";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 group" aria-label="LicitaScanner">
      <span
        className="rounded-lg bg-[#0F4C81] text-white inline-flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <Search className="h-4 w-4" />
      </span>
      <span className="font-semibold text-[15px] tracking-tight">
        <span className="text-[#0F4C81]">Licita</span>
        <span className="text-[#10B981]">Scanner</span>
      </span>
    </Link>
  );
}
