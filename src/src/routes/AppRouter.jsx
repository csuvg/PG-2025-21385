import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Login from "../pages/Login/Login"
import Products from "../pages/Products/Products"
import Material from "../pages/Material/Material"
import Production from "../pages/Production/Production"
import Sales from "../pages/Sales/Sales"
import Inventory from "../pages/Inventory/Inventory"

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/productos" element={<Products />} />
        <Route path="/materiales" element={<Material />} />
        <Route path="/produccion" element={<Production />} />
        <Route path="/ventas" element={<Sales />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/clientes" element={<div>Clientes</div>} />
      </Routes>
    </Router>
  )
}

export default AppRouter
