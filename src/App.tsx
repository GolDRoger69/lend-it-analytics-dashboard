
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { ProductsPage } from "./pages/ProductsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NotFound } from "./pages/NotFound";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { RentersPage } from "./pages/RentersPage";
import { RevenueReportsPage } from "./pages/RevenueReportsPage";
import { ProductAnalyticsPage } from "./pages/ProductAnalyticsPage";
import { RentalPairsPage } from "./pages/RentalPairsPage";
import { ProductOwnersPage } from "./pages/ProductOwnersPage";
import { UnrentedProductsPage } from "./pages/UnrentedProductsPage";
import { DataQueriesPage } from "./pages/DataQueriesPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="renters" element={<RentersPage />} />
        <Route path="revenue-reports" element={<RevenueReportsPage />} />
        <Route path="product-analytics" element={<ProductAnalyticsPage />} />
        <Route path="rental-pairs" element={<RentalPairsPage />} />
        <Route path="product-owners" element={<ProductOwnersPage />} />
        <Route path="unrented-products" element={<UnrentedProductsPage />} />
        <Route path="data-queries" element={<DataQueriesPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
