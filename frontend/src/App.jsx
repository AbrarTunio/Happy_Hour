import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { StaffAuthProvider } from './context/StaffAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import IngredientManagement from './pages/IngredientManagement';
import IngredientDetail from './pages/IngredientDetail';
import RecipeManagement from './pages/RecipeManagement';
import RecipeDetail from './pages/RecipeDetail';
import InvoiceManagement from './pages/InvoiceManagement';
import InvoiceDetail from './pages/InvoiceDetail';
import SupplierManagement from './pages/SupplierManagement';
import SupplierDetail from './pages/SupplierDetail';
import StaffDirectory from './pages/StaffManagement/StaffDirectory';
import Timesheets from './pages/StaffManagement/Timesheets';
import StaffDetail from './pages/StaffManagement/StaffDetail';
import AiInsights from './pages/AiInsight';
import InsightDetail from './pages/InsightDetail';
import StaffTimeClockLogin from './pages/StaffManagement/StaffTimeClockLogin';
import StaffTimeClockDetail from './pages/StaffManagement/StaffTimeClockDetail';
import RegisterStaff from './pages/StaffManagement/RegisterStaff';
import SalesProfitManager from './pages/SalesProfitManager';
import StaffRoster from './pages/StaffManagement/StaffRoster';

const StaffLayout = () => (
    <div>
        <div className="page-tabs">
            <NavLink to="/staff" end className="tab-link">Staff Directory</NavLink>
            <NavLink to="/staff/timesheets" className="tab-link">Timesheets</NavLink>
            <NavLink to="/staff/roster" className="tab-link">Staff Roster</NavLink>
        </div>
        <Outlet />
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <StaffAuthProvider>
                <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

                <Routes>
                    {/* Main Application Routes (Now Unprotected) */}
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
                        <Route path="ai-insights" element={<AiInsights />} />
                        <Route path="ai-insights/:id" element={<InsightDetail />} />
                        <Route path="sales-reconciliation" element={<SalesProfitManager />} />

                        <Route path="staff" element={<StaffLayout />}>
                            <Route index element={<StaffDirectory />} />
                            <Route path="timesheets" element={<Timesheets />} />
                            <Route path="roster" element={<StaffRoster />} />
                        </Route>
                        <Route path="staff/:id" element={<StaffDetail />} />
                    </Route>

                    {/* Staff-specific routes */}
                    <Route path="/staff/register" element={<RegisterStaff />} />
                    <Route path="/staff/time-clock" element={<StaffTimeClockLogin />} />
                    <Route path="/staff/time-clock/:staffId" element={<ProtectedRoute><StaffTimeClockDetail /></ProtectedRoute>} />
                </Routes>
            </StaffAuthProvider>
        </BrowserRouter>
    );
}

export default App;
