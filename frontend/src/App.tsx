import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, useAuth } from './auth'
import { Layout } from './components/Layout'
import Chat from './pages/Chat'
import { CreateHome, DraftView, TemplateWizard } from './pages/Create'
import { DocumentDetail, DocumentsList } from './pages/Documents'
import { LawDetail, LawsHome } from './pages/Laws'
import { GuideDetail, GuidesHub } from './pages/Guides'
import Landing from './pages/Landing'
import Login from './pages/Login'
import { OrderPage, OrdersList } from './pages/Orders'
import { Checkout, MockProviderPage, PaymentReturn, PaymentsHistory } from './pages/Payments'
import Home from './pages/client/Home'
import { CaseDetail, CasesList, NewCase } from './pages/client/Cases'
import { JobDetail, MyJobs, NewJob } from './pages/client/Jobs'
import LawyerProfile from './pages/client/LawyerProfile'
import Lawyers from './pages/client/Lawyers'
import Profile from './pages/client/Profile'
import { ProProfile, WalletPage } from './pages/pro/Account'
import { JobBoard, ProDashboard, ProJobView } from './pages/pro/Dashboard'
import { SchedulePage, ServicesPage } from './pages/pro/Manage'
import { AiProPage, GovPage, RequestsPage } from './pages/pro/Pro'

function Index() {
  const { me, ready } = useAuth()
  if (!ready) return null
  if (!me) return <Landing />
  return me.role === 'lawyer' ? <Navigate to="/pro" replace /> : <Layout><Home /></Layout>
}

const auth = (el: React.ReactNode, role?: 'lawyer' | 'client') => <RequireAuth role={role}>{el}</RequireAuth>

export default function App() {
  return (
    <>
      <div className="ambient"><i /><i /><i /></div>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/welcome" element={<Landing />} />
        <Route path="/bolimlar" element={<GuidesHub />} />
        <Route path="/bolimlar/:id" element={<GuideDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pay/mock" element={<MockProviderPage />} />
        <Route element={<Layout />}>
          {/* Public (guest can browse) */}
          <Route path="/lawyers" element={<Lawyers />} />
          <Route path="/lawyers/:id" element={<LawyerProfile />} />
          <Route path="/laws" element={<LawsHome />} />
          <Route path="/laws/:id" element={<LawDetail />} />

          {/* Client */}
          <Route path="/cases" element={auth(<CasesList />, 'client')} />
          <Route path="/cases/new" element={auth(<NewCase />, 'client')} />
          <Route path="/cases/:id" element={auth(<CaseDetail />, 'client')} />
          <Route path="/jobs" element={auth(<MyJobs />, 'client')} />
          <Route path="/jobs/new" element={auth(<NewJob />, 'client')} />
          <Route path="/jobs/:id" element={auth(<JobDetail />, 'client')} />
          <Route path="/checkout/:orderId" element={auth(<Checkout />)} />
          <Route path="/payments" element={auth(<PaymentsHistory />)} />
          <Route path="/payments/return" element={auth(<PaymentReturn />)} />
          <Route path="/profile" element={auth(<Profile />, 'client')} />

          {/* Shared */}
          <Route path="/chat" element={auth(<Chat />)} />
          <Route path="/chat/:id" element={auth(<Chat />)} />
          <Route path="/orders" element={auth(<OrdersList />)} />
          <Route path="/orders/:id" element={auth(<OrderPage />)} />
          <Route path="/documents" element={auth(<DocumentsList />)} />
          <Route path="/documents/:id" element={auth(<DocumentDetail />)} />
          <Route path="/create" element={auth(<CreateHome />)} />
          <Route path="/create/:templateId" element={auth(<TemplateWizard />)} />
          <Route path="/drafts/:id" element={auth(<DraftView />)} />
          <Route path="/gov" element={auth(<GovPage />)} />

          {/* Lawyer */}
          <Route path="/pro" element={auth(<ProDashboard />, 'lawyer')} />
          <Route path="/pro/jobs" element={auth(<JobBoard />, 'lawyer')} />
          <Route path="/pro/jobs/:id" element={auth(<ProJobView />, 'lawyer')} />
          <Route path="/pro/schedule" element={auth(<SchedulePage />, 'lawyer')} />
          <Route path="/pro/services" element={auth(<ServicesPage />, 'lawyer')} />
          <Route path="/pro/ai" element={auth(<AiProPage />, 'lawyer')} />
          <Route path="/pro/gov" element={auth(<GovPage />, 'lawyer')} />
          <Route path="/pro/requests" element={auth(<RequestsPage />, 'lawyer')} />
          <Route path="/pro/wallet" element={auth(<WalletPage />, 'lawyer')} />
          <Route path="/pro/profile" element={auth(<ProProfile />, 'lawyer')} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}
