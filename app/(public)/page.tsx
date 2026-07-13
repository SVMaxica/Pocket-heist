// denna sida ska endast användas som en splash-sida för att avgöra vart användaren ska navigeras
// vid inloggning --> till /heists
// utan inloggning --> till /login

import { Clock8 } from 'lucide-react';

export default function Home() {
  return (
    <div className="center-content">
      <div className="page-content">
        <h1>
          P<Clock8 className="logo" strokeWidth={2.75} />
          cket Heist
        </h1>
        <div>Tiny missions. Big office mischief.</div>
        <p>
          Assign your coworkers secret little &quot;heists&quot; — swap someone&apos;s mouse
          settings, leave a sticky note trail, or sneak a plant onto their desk.
          Complete your missions before the clock runs out.
        </p>
      </div>
    </div>
  );
}
