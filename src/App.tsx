import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Locations from "@/pages/Locations";
import Devices from "@/pages/Devices";
import Rentals from "@/pages/Rentals";
import Maintenance from "@/pages/Maintenance";
import Tickets from "@/pages/Tickets";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
