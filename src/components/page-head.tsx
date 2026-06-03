import type { ReactNode } from "react";

interface PageHeadProps {
  crumb?: ReactNode;
  title: string;
  sub?: string;
  children?: ReactNode;
}

export function PageHead({ crumb, title, sub, children }: PageHeadProps) {
  return (
    <div className="page-head">
      <div className="wrap-wide">
        {crumb && <div className="crumb">{crumb}</div>}
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}
