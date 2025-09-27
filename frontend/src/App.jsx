// --- START OF FILE App.jsx ---

import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import IngredientManagement from './pages/IngredientManagement';
import InvoiceManagement from './pages/InvoiceManagement';
import SupplierManagement from './pages/SupplierManagement';
import RecipeManagement from './pages/RecipeManagement';
import StaffDirectory from './pages/StaffManagement/StaffDirectory';
import Timesheets from './pages/StaffManagement/Timesheets';

// Import the new detail pages
import IngredientDetail from './pages/IngredientDetail';
import SupplierDetail from './pages/SupplierDetail';
import RecipeDetail from './pages/RecipeDetail';
import InvoiceDetail from './pages/InvoiceDetail';
import StaffTimeClockDetail from './pages/StaffManagement/StaffTimeClockDetail';


// Staff Management layout with tabs
const StaffLayout = () => (
  <div>
    <div className="page-tabs">
      <NavLink to="/staff" end className="tab-link">Staff Directory</NavLink>
      <NavLink to="/staff/timesheets" className="tab-link">Timesheets</NavLink>
    </div>
    <Outlet />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main routes with sidebar */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />

          <Route path="recipes" element={<RecipeManagement />} />
          <Route path="recipes/:id" element={<RecipeDetail />} />

          <Route path="ingredients" element={<IngredientManagement />} />
          <Route path="ingredients/:id" element={<IngredientDetail />} />

          <Route path="invoices" element={<InvoiceManagement />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />

          <Route path="suppliers" element={<SupplierManagement />} />
          <Route path="suppliers/:id" element={<SupplierDetail />} />

          <Route path="staff" element={<StaffLayout />}>
            <Route index element={<StaffDirectory />} />
            <Route path="timesheets" element={<Timesheets />} />
            {/* Route for a specific employee's timesheet details/clock */}
            <Route path="timesheets/:staffId" element={<StaffTimeClockDetail />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;