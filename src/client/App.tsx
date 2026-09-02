import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell.js';
import { AnnotationPage } from './pages/AnnotationPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ImagesPage } from './pages/ImagesPage.js';
import { UploadPage } from './pages/UploadPage.js';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate replace to="/images" />} />
        <Route path="images" element={<ImagesPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="annotate/:imageId" element={<AnnotationPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate replace to="/images" />} />
      </Route>
    </Routes>
  );
}
