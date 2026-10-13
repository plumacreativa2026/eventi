import { Footer, Header } from "./Chrome";

export function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="wrap" style={{ maxWidth: 760, paddingTop: 44, display: "flex", flexDirection: "column", gap: 14 }}>
        <h1 style={{ fontSize: "2.2rem" }}>{title}</h1>
        {children}
      </main>
      <Footer />
    </>
  );
}
