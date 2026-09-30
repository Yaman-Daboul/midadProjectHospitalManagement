export function Avatar({
  name,
  color = "bg-primary/10 text-primary",
  size = "w-8 h-8",
}: {
  name: string;
  color?: string;
  size?: string;
}) {
  return (
    <div
      className={`${size} rounded-full ${color} flex items-center justify-center text-sm font-bold flex-shrink-0`}
    >
      {name[0]}
    </div>
  );
}
