import { Heart } from 'lucide-react';
import { productName, productSubtitle } from '../config/branding';

export function LoadingScreen({ message = 'Preparing our private space...' }: { message?: string }) {
  return (
    <main className="loading-screen" aria-label={`${productName} loading screen`}>
      <div className="loading-screen__mark" aria-hidden="true">
        <Heart fill="currentColor" />
      </div>
      <p>{productName}</p>
      <span>{productSubtitle}</span>
      <small>{message}</small>
    </main>
  );
}
