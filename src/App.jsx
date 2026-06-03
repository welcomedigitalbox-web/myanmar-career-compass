import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminApp from './admin/AdminApp'
import CareerTest from './test/CareerTest'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CareerTest />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
