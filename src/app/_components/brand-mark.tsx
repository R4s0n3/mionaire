type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className = "" }: BrandMarkProps) {
  return <span aria-hidden="true" className={`brand-glyph ${className}`} />;
}
