import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Create from "@/pages/Create";
import Works from "@/pages/Works";
import WorkDetail from "@/pages/WorkDetail";
import Community from "@/pages/Community";
import Report from "@/pages/Report";
import Admin from "@/pages/Admin";
import ReminderSettings from "@/components/ReminderSettings";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/works" element={<Works />} />
          <Route path="/works/:id" element={<WorkDetail />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:id" element={<WorkDetail />} />
          <Route path="/report" element={<Report />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <ReminderSettings />
      </Layout>
    </Router>
  );
}
