import "./App.css";
import { ActionTester } from "./components/ActionTester";

function App() {
  return (
    <div className="container">
      <h1>Nice Action Demo</h1>
      <p className="subtitle">
        Test action transport — actions are serialized in the browser, sent to the backend, resolved
        there, and the response is returned over the wire.
      </p>
      <ActionTester />
    </div>
  );
}

export default App;
