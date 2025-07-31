import { Link } from "react-router-dom";

export default function App() {
  return (
    <div>
      <Link to="/singleplayer">
        <button
          style={{
            cursor: "pointer",
          }}
        >
          Play SinglePlayer
        </button>
      </Link>
    </div>
  );
}
