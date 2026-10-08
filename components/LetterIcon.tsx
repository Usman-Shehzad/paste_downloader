import type { IconBaseProps, IconType } from "react-icons";

/** A rounded-square badge with a short label, for brands react-icons lacks. */
export function letterIcon(label: string): IconType {
  function LetterIcon({ size = "1em", className, style, title }: IconBaseProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={className}
        style={style}
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
      >
        {title && <title>{title}</title>}
        <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="currentColor" />
        <text
          x="12"
          y="16.2"
          textAnchor="middle"
          fontSize={label.length > 1 ? 9.5 : 13}
          fontWeight={800}
          fontFamily="system-ui, sans-serif"
          fill="var(--background)"
        >
          {label}
        </text>
      </svg>
    );
  }
  return LetterIcon;
}
