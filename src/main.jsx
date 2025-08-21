import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LoginFitFIO from './containers/login/login.jsx'
import Agendamento from './containers/home/home.jsx'
import AppRoutes from './AppRoutes.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>

    {/* <LoginFitFIO/> */}
    <AppRoutes />
  </StrictMode>,
)
