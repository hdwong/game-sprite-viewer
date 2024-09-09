import { useState } from "react";
import SpriteViewer from "./game/SpriteViewer";
import WorldMap from "./game/WorldMap";
import PathFinding from "./game/PathFinding";

function App() {
  const [ view, setView ] = useState<'sprite-viewer' | 'world-map' | 'path-finding'>();

  return (
    <div id="app">
      {
        ! view && (
          <div id="nav">
            <button onClick={() => setView('sprite-viewer')}>Sprite Viewer</button>
            <button onClick={() => setView('world-map')}>World Map</button>
            <button onClick={() => setView('path-finding')}>Path Finding</button>
          </div>
        )
      }
      { view === 'sprite-viewer' && <SpriteViewer /> }
      { view === 'world-map' && <WorldMap /> }
      { view === 'path-finding' && <PathFinding /> }
    </div>
  );
}

export default App;
