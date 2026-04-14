import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/Auth.jsx';
import { Toaster } from './components/ui/Toast.jsx';
import Shell      from './components/layout/Shell.jsx';
import Auth       from './pages/Auth.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import Tx         from './pages/Tx.jsx';
import Add        from './pages/Add.jsx';
import Charts     from './pages/Charts.jsx';
import Advisor    from './pages/Advisor.jsx';
import Reports    from './pages/Reports.jsx';
import Profile    from './pages/Profile.jsx';
import Budgets    from './pages/Budgets.jsx';
import Investments from './pages/Investments.jsx';
import Goals      from './pages/Goals.jsx';

const Sp = () => <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg)' }}><div className="spin" style={{ width:30, height:30 }}/></div>;
const Private = ({ c }) => { const { user, loading } = useAuth(); if(loading) return <Sp/>; return user ? c : <Navigate to="/login" replace/>; };
const Public  = ({ c }) => { const { user, loading } = useAuth(); if(loading) return <Sp/>; return user ? <Navigate to="/" replace/> : c; };

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"          element={<Public c={<Auth/>}/>}/>
        <Route path="/reset-password" element={<Public c={<Auth/>}/>}/>
        <Route path="/" element={<Private c={<Shell/>}/>}>
          <Route index             element={<Dashboard/>}/>
          <Route path="tx"         element={<Tx/>}/>
          <Route path="add"        element={<Add/>}/>
          <Route path="charts"     element={<Charts/>}/>
          <Route path="budgets"    element={<Budgets/>}/>
          <Route path="investments"element={<Investments/>}/>
          <Route path="goals"      element={<Goals/>}/>
          <Route path="ai"         element={<Advisor/>}/>
          <Route path="rep"        element={<Reports/>}/>
          <Route path="prof"       element={<Profile/>}/>
        </Route>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
      <Toaster/>
    </AuthProvider>
  );
}
