import { useState } from "react";
import SpriteViewer from "./game/SpriteViewer";
import WorldMap from "./game/WorldMap";

function App() {
  const [ view, setView ] = useState<'sprite-viewer' | 'world-map'>();

  return (
    <div id="app">
      {
        ! view && (
          <div id="nav">
            <button onClick={() => setView('sprite-viewer')}>Sprite Viewer</button>
            <button onClick={() => setView('world-map')}>World Map</button>
          </div>
        )
      }
      { view === 'sprite-viewer' && <SpriteViewer /> }
      { view === 'world-map' && <WorldMap /> }
    </div>
  );
}

export default App;
