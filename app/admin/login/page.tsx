import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main className="admin-login">
      <form action="/api/admin/login" method="post" id="admin-login-form" className="admin-login-card">
        <p className="eyebrow"><span /> Admin</p>
        <h1>Sign in</h1>
        {!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET ?
          <p className="admin-error">Admin is not configured. Set ADMIN_PASSWORD and SESSION_SECRET.</p> :
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>}
        {process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET && <button type="submit">Sign in</button>}
        <p id="admin-login-error" className="admin-error" aria-live="polite" />
      </form>
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('admin-login-form')?.addEventListener('submit', async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const password = new FormData(form).get('password');
          const response = await fetch('/api/admin/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password})});
          if (response.ok) location.href='/admin';
          else document.getElementById('admin-login-error').textContent = (await response.json()).error || 'Invalid login';
        });
      ` }} />
    </main>
  );
}
