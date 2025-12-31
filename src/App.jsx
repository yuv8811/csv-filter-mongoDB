import { Routes, Route } from "react-router-dom";
import AdminPanel from "./AdminPanel.jsx";
import "./App.css";

import Registration from "./components/registration";

function App() {
  return (
    <Routes>
      <Route path="/*" element={<AdminPanel />} />
      <Route path="/registration" element={<Registration />} />
    </Routes>
  );
}

export default App;

