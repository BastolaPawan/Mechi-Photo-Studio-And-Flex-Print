import SiteNav from "@/components/SiteNav";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const services = [
  {
    number: "01",
    title: "Quality Photo Framing",
    text: "Custom frames, premium glass, clean finishing and the right frame for every memory.",
  },
  {
    number: "02",
    title: "Photo Printing",
    text: "Sharp, true-to-life prints in popular sizes, from pocket prints to statement wall displays.",
  },
  {
    number: "03",
    title: "Passport & ID Photos",
    text: "Well-lit, correctly sized and neatly edited photographs for official documents.",
  },
  {
    number: "04",
    title: "Flex & Banner Print",
    text: "Durable indoor and outdoor flex printing for events, businesses and promotional campaigns.",
  },
  {
    number: "05",
    title: "Wedding & Event Coverage",
    text: "Natural storytelling, candid moments and complete coverage for your special occasions.",
  },
  {
    number: "06",
    title: "Editing & Restoration",
    text: "Professional retouching, background removal and careful restoration of old photographs.",
  },
];

const gallery = [
  {
    title: "Wedding Album",
    category: "Photography",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Wall Frame Collection",
    category: "Framing",
    image: "https://images.unsplash.com/photo-1549497538-303791108f95?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Product Display",
    category: "Commercial",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Event Flex",
    category: "Flex Print",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85",
  },
];

export default async function Home() {
  const now = new Date();
  const mangsirOffers = await prisma.offer.findMany({
    where: { status: "live", featured: true, seasonTags: { has: "mangsir" }, AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ] },
    take: 3,
    orderBy: [{ sortOrder: "asc" }, { number: "asc" }],
  }).catch(() => []);
  return (
    <main>
      <SiteNav />

      <header className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Professional photography & print</p>
          <h1>Memories deserve <em>beautiful</em> frames.</h1>
          <p className="hero-lead">
            Photography, premium framing and vibrant flex printing — all thoughtfully done under one roof in Birtamode.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#work">Explore our work <span>↗</span></a>
            <a className="button button-quiet" href="#contact">Get directions</a>
          </div>
        </div>

        <div className="hero-visual" aria-label="Featured studio work">
          <div className="hero-photo-main">
            <img
              src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1100&q=90"
              alt="Photographer holding a professional camera"
            />
          </div>
          <div className="hero-photo-small">
            <img
              src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=90"
              alt="Camera and photography equipment"
            />
          </div>
          <div className="hero-badge">
            <strong>100%</strong>
            <span>Customer<br />satisfaction</span>
          </div>
        </div>
      </header>

      {mangsirOffers.length > 0 && (
        <section className="mangsir-strip" aria-label="This Mangsir offers">
          <div className="wrap mangsir-strip-inner">
            <div className="mangsir-strip-heading"><p>This Mangsir</p><h2>Featured offers</h2></div>
            <div className="mangsir-strip-list">
              {mangsirOffers.map((offer) => (
                <Link href={`/offers/${offer.slug}`} key={offer.slug}>
                  <span aria-hidden="true">{offer.icon}</span>
                  <b>{offer.name}</b>
                  <strong>NPR {offer.price.toLocaleString("en-IN")}</strong>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="trust-strip" aria-label="Studio highlights">
        <div className="wrap trust-grid">
          <div><strong>10+</strong><span>Creative services</span></div>
          <div><strong>Premium</strong><span>Print quality</span></div>
          <div><strong>Fast</strong><span>Reliable delivery</span></div>
          <div><strong>Custom</strong><span>Frame designs</span></div>
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span /> What we do</p>
              <h2>Services made for every occasion.</h2>
            </div>
            <p>From a single passport photo to complete event production, every detail gets the care it deserves.</p>
          </div>
          <div className="services-grid">
            {services.map((service) => (
              <article className="service-card" key={service.title}>
                <span className="service-number">{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="work-section" id="work">
        <div className="wrap">
          <div className="section-heading work-heading">
            <div>
              <p className="eyebrow"><span /> Selected work</p>
              <h2>Our latest creations.</h2>
            </div>
            <a className="text-link" href="#contact">Plan your shoot <span>↗</span></a>
          </div>
          <div className="gallery">
            {gallery.map((item, index) => (
              <article className={`gallery-card gallery-card-${index + 1}`} key={item.title}>
                <img src={item.image} alt={item.title} />
                <div className="gallery-caption">
                  <div>
                    <span>{item.category}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <span className="gallery-arrow">↗</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="wrap about-grid">
          <div className="about-image">
            <img
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85"
              alt="Creative team working together"
            />
          </div>
          <div className="about-copy">
            <p className="eyebrow"><span /> About our studio</p>
            <h2>Local craft, modern quality.</h2>
            <p>
              Mechi Photo Studio &amp; Flex Print brings photography and print services together with a personal, local approach.
              We help individuals, families and businesses create work that looks polished and lasts.
            </p>
            <ul>
              <li>Careful attention to every order</li>
              <li>Quality materials and modern equipment</li>
              <li>Friendly, practical guidance</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="wrap contact-grid">
          <div>
            <p className="eyebrow light"><span /> Start a project</p>
            <h2>Let’s create something worth keeping.</h2>
          </div>
          <div className="contact-details">
            <div>
              <span>Visit</span>
              <p>Birtamode - 5,<br />Krishithok Road</p>
            </div>
            <div>
              <span>Studio hours</span>
              <p>Sun — Sat<br />Open daily</p>
            </div>
            <a className="button button-light" href="https://www.google.com/maps/search/?api=1&query=Mechi+Photo+Studio+%26+Flex+Print" target="_blank" rel="noreferrer">
              Open in Maps <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap footer-row">
          <a className="brand footer-brand" href="#">
            <span className="brand-mark">MP</span>
            <span>Mechi <strong>Photo Studio &amp; Flex Print</strong></span>
          </a>
          <p>© {new Date().getFullYear()} Mechi Photo Studio &amp; Flex Print</p>
        </div>
      </footer>
    </main>
  );
}
