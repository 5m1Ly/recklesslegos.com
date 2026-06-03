import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const Icons = {
  search: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m20 20-3.2-3.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  play: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" {...p}>
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  ),
  yt: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M10 9.2v5.6l5-2.8z" fill="currentColor" />
    </svg>
  ),
  heart: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.6 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  doc: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14 3v4h4M9 13h6M9 16h6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  arrow: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  menu: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  close: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  ext: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  map: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  clock: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 8v4l3 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  shield: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  ),
  download: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  check: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  filter: (p: IconProps) => (
    <svg aria-hidden={true} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
};
