import { Routes, Route } from "react-router-dom";
import AppRoutes from "./routes.jsx";
import "../styles/App.css";

function App() {
  return (
    <Routes>
      <Route path="/*" element={<AppRoutes />} />
    </Routes>
  );
}

export default App;

