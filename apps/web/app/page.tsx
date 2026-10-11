export default function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 24px' }}>
      <div style={{ color: '#6c3ce9', fontWeight: 800, letterSpacing: '.08em', fontSize: 13 }}>
        BHARAT PRO EXPERT HOME SERVICES
      </div>
      <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.08, margin: '18px 0 12px' }}>
        Welcome, Anil Chauhan
      </h1>
      <p style={{ color: '#777386', fontSize: 18, maxWidth: 640, lineHeight: 1.7 }}>
        Your administration workspace foundation is running. Customer, partner, booking, payment,
        service and reporting modules will be connected to the live API as the build progresses.
      </p>
      <section style={{ background: '#fff', border: '1px solid #e9e5f4', borderRadius: 18, padding: 24, marginTop: 32 }}>
        <h2 style={{ marginTop: 0 }}>System status</h2>
        <p>API endpoint: <code>{apiUrl}/health</code></p>
        <p style={{ color: '#777386' }}>Business: Bharat Pro Expert Home Services</p>
        <p style={{ color: '#777386' }}>Owner: Anil Chauhan · Support: 8920252626</p>
      </section>
    </main>
  );
}
