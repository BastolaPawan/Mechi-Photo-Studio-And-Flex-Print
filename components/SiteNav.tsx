import Link from "next/link";

export default function SiteNav() {
  return (
    <nav className="nav wrap" aria-label="Main navigation">
      <Link className="brand" href="/" aria-label="Mechi Photo Studio home">
        <span className="brand-mark">MP</span>
        <span>Mechi <strong>Photo Studio &amp; Flex Print</strong></span>
      </Link>
      <div className="nav-links">
        <Link href="/#services">Services</Link>
        <Link href="/#work">Our Work</Link>
        <Link href="/#about">About</Link>
        <Link href="/tools">Tools</Link>
        <Link className="nav-contact" href="/#contact">Visit Us</Link>
      </div>
    </nav>
  );
}
