import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A framed product screenshot.
 *
 * The design shows four screenshots of the app itself — the admin dashboard,
 * resident management, payments and settings. Those should be captured from
 * the running product rather than mocked up, so they are genuine.
 *
 * Until they exist, `src` is left unset and this renders a clean framed panel
 * instead. That is deliberate: a broken image icon on a marketing page looks
 * like a fault, whereas an empty frame reads as a placeholder. Dropping the
 * file into /public and setting `src` is the whole change.
 */
export function Shot({
  src,
  alt,
  width,
  height,
  className,
  priority,
}: {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-hairline bg-white shadow-sm",
        className,
      )}
    >
      {/* The window bar. Present either way, so a real screenshot and a
          placeholder sit in the same frame. */}
      <div className="flex items-center gap-1.5 border-b border-hairline bg-canvas px-3 py-2.5">
        <span className="size-2 rounded-full bg-hairline-strong" aria-hidden="true" />
        <span className="size-2 rounded-full bg-hairline-strong" aria-hidden="true" />
        <span className="size-2 rounded-full bg-hairline-strong" aria-hidden="true" />
      </div>

      {src ? (
        <Image
          src={src}
          alt={alt}
          width={width ?? 1200}
          height={height ?? 800}
          className="h-auto w-full"
          priority={priority}
        />
      ) : (
        <div
          role="img"
          aria-label={`${alt} — screenshot to be added`}
          className="surface-grid aspect-[3/2] w-full"
        />
      )}
    </div>
  );
}
