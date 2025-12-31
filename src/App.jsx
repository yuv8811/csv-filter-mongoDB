import { Routes, Route } from "react-router-dom";
import AdminPanel from "./AdminPanel.jsx";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/*" element={<AdminPanel />} />
    </Routes>
  );
}

export default App;

