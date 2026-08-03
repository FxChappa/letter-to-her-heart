import { ArrowRight, BookHeart, LockKeyhole, Sparkles } from 'lucide-react';
import { Link } from '../../app/router';
import { productName, productSubtitle } from '../../config/branding';
import { useAuth } from './AuthProvider';

export function WelcomePage() {
  const auth = useAuth();
  const destination = auth.profile ? '/our-space' : '/login';

  return (
    <main className="welcome-page" aria-labelledby="welcome-title">
      <div className="welcome-page__scene" aria-hidden="true">
        <span className="welcome-page__window" />
        <span className="welcome-page__lamp" />
        <span className="welcome-page__sofa" />
        <span className="welcome-page__table" />
      </div>
      <section className="welcome-page__content">
        <p className="kicker"><Sparkles size={14} /> {productSubtitle}</p>
        <h1 id="welcome-title">{productName}</h1>
        <p>A private digital home for the moments, words, and life Aldane and Santana are building together.</p>
        <div className="welcome-page__actions">
          <Link className="welcome-page__primary" to={destination}>
            <LockKeyhole size={17} />
            {auth.profile ? 'Return home' : 'Enter our private space'}
            <ArrowRight size={17} />
          </Link>
          <Link className="welcome-page__secondary" to="/letters">
            <BookHeart size={17} />
            Revisit the letters
          </Link>
        </div>
      </section>
      <p className="welcome-page__signature">Aldane &amp; Santana</p>
    </main>
  );
}
