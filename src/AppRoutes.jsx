
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Agendamento from "./containers/home/home"
import LoginFitFIO from "./containers/login/login";
import Perfil from "./containers/profile/profile";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<LoginFitFIO />} />
        <Route path="/agendamento" element={<Agendamento />} />
        <Route path="/perfil" element={<Perfil />}/>
      </Routes>
    </BrowserRouter>
  );
}
