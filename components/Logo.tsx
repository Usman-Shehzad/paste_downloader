export default function Logo() {
  return (
    <a href="#" className="flex items-center gap-2 font-bold tracking-tight">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.png" alt="" width={36} height={34} className="h-9 w-auto" />
      <span className="text-lg">
        Paste<span className="text-gradient">Cap</span>
      </span>
    </a>
  );
}
