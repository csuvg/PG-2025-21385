import React, { useState, useEffect, useCallback } from "react" 
import Sidebar from "../../components/Sidebar" 
import PageHeader from "../../components/PageHeader" 
import { MdAddShoppingCart } from "react-icons/md" 
import supabase from "../../../supabaseClient" 
import Modal from "../../components/Modal" 


const Sales = () => {
  const [activeTab, setActiveTab] = useState("venta") 
  const [selectedClient, setSelectedClient] = useState("") 
  const [selectedClientId, setSelectedClientId] = useState(null) 
  const [showClientList, setShowClientList] = useState(false) 
  const [selectedDate, setSelectedDate] = useState("") 
  const [showProductList, setShowProductList] = useState(null) 
  const [products, setProducts] = useState([
    { key: 1, id_producto: null, nombre: "", cantidad: 0, total: 0, unitPrice: 0, totalEditedManually: false },
  ]) 

  const [catalog, setCatalog] = useState([]) 
  const [ventasRealizadas, setVentasRealizadas] = useState([]) 
  const [loading, setLoading] = useState(true) 
  const [error, setError] = useState("") 

  const [clientes, setClientes] = useState([]) 
  const productosDisponibles = catalog.map(p => ({ id: p.id_producto, nombre: p.nombre })) 

  const [openModal, setOpenModal] = useState(false) 
  const [selectedVenta, setSelectedVenta] = useState(null) 

  const handleAddProduct = () => {
    setProducts([
      ...products,
      { key: Date.now(), id_producto: null, nombre: "", cantidad: 0, total: 0, unitPrice: 0, totalEditedManually: false }
    ]) 
  } 

  const handleProductChange = (key, field, value) => {
    setProducts(products.map((p) => {
      if (p.key !== key) return p 
      if (field === "cantidad") {
        const cantidad = Number(value || 0) 
        if (p.totalEditedManually) {
          return { ...p, cantidad } 
        }
        const total = Number((Number(p.unitPrice || 0) * cantidad).toFixed(2)) 
        return { ...p, cantidad, total } 
      }
      if (field === "total") {
        const total = Number(value || 0) 
        return { ...p, total, totalEditedManually: true } 
      }
      return { ...p, [field]: value } 
    })) 
  } 

  const handleSelectProducto = (key, id_producto) => {
    const prod = catalog.find(c => c.id_producto === id_producto) 
    const unitPrice = Number(prod?.precio_capital || 0) 
    setProducts(products.map(p => {
      if (p.key !== key) return p 
      const next = { ...p, id_producto, nombre: prod?.nombre || "", unitPrice } 
      if (!p.totalEditedManually) {
        const total = Number(((unitPrice || 0) * Number(p.cantidad || 0)).toFixed(2)) 
        next.total = total 
      }
      return next 
    })) 
  } 

  const load = useCallback(async () => {
    try {
      setLoading(true) 
      setError("") 
      const { data: prods, error: prodErr } = await supabase
        .from("Productos")
        .select("id_producto, nombre, precio_capital")
        .order("nombre", { ascending: true }) 
      if (prodErr) throw prodErr 
      setCatalog(prods || []) 

      const { data: cls, error: cliErr } = await supabase
        .from("Clientes")
        .select("id_cliente, nombre")
        .order("nombre", { ascending: true }) 
      if (cliErr) throw cliErr 
      setClientes(cls || []) 

      const { data: ventas, error: ventErr } = await supabase
        .from("Ventas")
        .select("id_venta, id_producto, cantidad_vendida, total, fecha, id_cliente, Productos(nombre)")
        .order("fecha", { ascending: false })
        .limit(500) 
      if (ventErr) throw ventErr 

      const grouped = {};
      (ventas || []).forEach(row => {
        const key = `${row.fecha || 'Sin fecha'}__${row.id_cliente || 'null'}` 
        if (!grouped[key]) {
          const cliName = (cls || []).find(c => c.id_cliente === row.id_cliente)?.nombre || "-" 
          grouped[key] = { id: key, fecha: row.fecha || "", cliente: cliName, id_cliente: row.id_cliente || null, total: 0, productos: [] } 
        }
        grouped[key].productos.push({ nombre: row?.Productos?.nombre || "", cantidad: row.cantidad_vendida || 0, total: row.total || 0 }) 
        grouped[key].total += row.total || 0 
      }) 
      setVentasRealizadas(Object.values(grouped)) 
    } catch (err) {
      console.error(err) 
      setError("No se pudo cargar ventas.") 
    } finally {
      setLoading(false) 
    }
  }, []) 

  useEffect(() => { load()  }, [load]) 

  const handleSubmit = async (e) => {
    e.preventDefault() 
    const fecha = selectedDate || new Date().toISOString().slice(0,10) 
    const invalid = products.some(p => p.id_producto && (Number(p.cantidad) <= 0 || Number(p.total) <= 0)) 
    if (invalid) {
      alert("Revise cantidades y totales: no pueden ser 0 o negativos.") 
      return 
    }
    const filas = products.filter(p => p.id_producto && Number(p.cantidad) > 0).map(p => ({
      id_producto: p.id_producto,
      cantidad_vendida: Number(p.cantidad),
      total: Number(p.total) || 0,
      id_cliente: selectedClientId || null,
      fecha
    })) 
    if (!filas.length) return 
    try {
      const { error: insErr } = await supabase.from("Ventas").insert(filas) 
      if (insErr) throw insErr 
      setProducts([{ key: Date.now(), id_producto: null, nombre: "", cantidad: 0, total: 0 }]) 
      setSelectedClient("") 
      setSelectedClientId(null) 
      setSelectedDate("") 
      await load() 
      setActiveTab("realizadas") 
    } catch (err) {
      console.error(err) 
      alert("No se pudo registrar la venta") 
    }
  } 

  const openVentaDetail = (venta) => {
    setSelectedVenta(venta) 
    setOpenModal(true) 
  } 

  return (
    <section className="bg-white">
      <div className="flex flex-col lg:flex-row min-h-screen font-sans text-black">
        <Sidebar activeSection="Ventas" />
        <main className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto">
          <PageHeader />

          {/* Tabs */}
          <div className="text-center mt-6">
            <div className="inline-flex gap-x-6">
              {["venta", "realizadas"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 lg:px-8 py-2 lg:py-2.5 text-lg lg:text-2xl font-outfit rounded-full shadow-sm transition-colors ${
                    activeTab === tab
                      ? "bg-brand-dark text-white shadow-md"
                      : "bg-brand-beige text-brand-dark"
                  }`}
                >
                  {tab === "venta" ? "Nueva venta" : "Ventas realizadas"}
                </button>
              ))}
            </div>
            <p className="mt-3 text-gray-700 text-sm font-light">
              {activeTab === "venta"
                ? "Registra una nueva venta con los productos correspondientes"
                : "Consulta las ventas registradas anteriormente"}
            </p>
          </div>

          {/* Contenido */}
          {activeTab === "venta" ? (
            <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
              {/* Cliente y Fecha */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <div className="relative w-full max-w-lg">
                  <button
                    type="button"
                    onClick={() => setShowClientList(!showClientList)}
                    className="w-full h-[55px] flex justify-between items-center border-2 border-brand-dark rounded-full px-6 text-left bg-brand-beige/30 hover:bg-brand-beige/60"
                  >
                    <span className="font-inter text-lg">
                      {selectedClient || "Seleccionar cliente"}
                    </span>
                    <span>▼</span>
                  </button>
                  {showClientList && (
                    <ul className="absolute z-10 mt-2 w-full bg-white border-2 border-brand-dark rounded-2xl shadow-md max-h-60 overflow-y-auto">
                      {clientes.map((c) => (
                        <li
                          key={c.id_cliente}
                          onClick={() => {
                            setSelectedClient(c.nombre) 
                            setSelectedClientId(c.id_cliente) 
                            setShowClientList(false) 
                          }}
                          className="px-4 py-2 hover:bg-brand-beige cursor-pointer"
                        >
                          {c.nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                Fecha: 
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-2 border-brand-dark rounded-full px-4 py-2 text-lg font-inter"
                />
              </div>

              {/* Productos */}
              <div className="space-y-5">
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-x-4 font-semibold text-brand-dark text-lg text-center font-outfit">
                  <h3>Producto</h3>
                  <h3>Cantidad</h3>
                  <h3>Total</h3>
                </div>
                {products.map((p) => (
                  <div
                    key={p.key}
                    className="grid grid-cols-[2fr_1fr_1fr] gap-x-4 items-center"
                  >
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowProductList(showProductList === p.key ? null : p.key)
                        }
                        className="w-full h-[50px] flex justify-between items-center border-2 border-brand-dark rounded-full px-4 bg-brand-beige/30 hover:bg-brand-beige/60"
                      >
                        <span className="font-inter text-base lg:text-lg">
                          {p.nombre || "Seleccionar producto"}
                        </span>
                        <span>▼</span>
                      </button>
                      {showProductList === p.key && (
                        <ul className="absolute z-10 mt-2 w-full bg-white border-2 border-brand-dark rounded-2xl shadow-md">
                          {productosDisponibles.map((prod) => (
                            <li
                              key={prod.id}
                              onClick={() => {
                                handleSelectProducto(p.key, prod.id) 
                                setShowProductList(null) 
                              }}
                              className="px-4 py-2 hover:bg-brand-beige cursor-pointer"
                            >
                              {prod.nombre}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <input
                      type="number"
                      value={p.cantidad}
                      onChange={(e) => handleProductChange(p.key, "cantidad", e.target.value)}
                      className="w-full h-[50px] border-2 border-brand-dark rounded-full px-4 text-lg text-center font-inter"
                    />
                    <div className="flex items-center justify-center h-[50px] border-2 border-brand-dark rounded-full text-lg font-outfit">
                      <span className="text-brand-dark">Q{(Number(p.total) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="w-full h-[45px] bg-brand-beige border-2 border-brand-dark rounded-full text-lg font-inter"
                >
                  + Agregar producto
                </button>
              </div>

              {/* Footer */}
              <div className="flex flex-wrap justify-between items-center gap-6 pt-4">
                <button
                  type="submit"
                  className="bg-brand-dark text-white text-lg rounded-full px-10 py-2 flex items-center gap-x-2 hover:bg-black transition"
                >
                  <MdAddShoppingCart size={22} />
                  Registrar
                </button>
                <p className="text-xl font-outfit text-brand-dark">
                  Total final:{" "}
                  <span className="font-semibold text-brand-gold">
                    Q{products.reduce((acc, p) => acc + Number(p.total || 0), 0).toFixed(2)}
                  </span>
                </p>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
              {loading && <p className="col-span-full text-center text-gray-500">Cargando ventas…</p>}
              {error && <p className="col-span-full text-center text-red-600">{error}</p>}
              {!loading && !error && ventasRealizadas.length === 0 && (
                <p className="col-span-full text-center text-gray-600">No hay ventas registradas.</p>
              )}

              {!loading && !error && ventasRealizadas.map((venta) => (
                <div
                  key={venta.id}
                  onClick={() => openVentaDetail(venta)}
                  className="bg-brand-beige border border-brand-dark rounded-2xl p-5 hover:shadow-md hover:scale-[1.01] transition cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold font-outfit text-brand-dark">
                      {venta.cliente}
                    </h4>
                    <span className="text-sm text-gray-600">{venta.fecha}</span>
                  </div>
                  <p className="mt-3 text-right font-bold text-brand-gold">
                    Total: Q{venta.total.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Modal detalle venta */}
          <Modal
            isOpen={openModal}
            onClose={() => setOpenModal(false)}
            title={"Detalle de venta"}
          >
            <div className="bg-brand-beige rounded-2xl p-8 text-brand-dark font-outfit">
              {/* Fecha y cliente */}
              <div className="flex justify-between text-lg font-medium mb-6">
                <p>
                  <span className="font-semibold">Fecha:</span>{" "}
                  {selectedVenta ? selectedVenta.fecha : "00/00/0000"}
                </p>

                <p>
                  <span className="font-semibold">Cliente:</span>{" "}
                  {selectedVenta ? selectedVenta.cliente : "Sin especificar"}
                </p>
              </div>

              {/* Título de la tabla */}
              <p className="font-semibold text-lg mb-2">Venta:</p>

              {/* Tabla */}
              <table className="w-full text-center">
                <thead>
                  <tr className="font-semibold border-b border-gray-300">
                    <th className="py-2 text-left">Producto</th>
                    <th className="py-2">Cantidad</th>
                    <th className="py-2 text-right">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVenta ? selectedVenta.productos.map((prod, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-2 text-left">{prod.nombre}</td>
                      <td className="py-2">{prod.cantidad}</td>
                      <td className="py-2 text-right">
                        Q {prod.total.toLocaleString("es-GT")}
                      </td>
                    </tr>
                  )) : null}
                </tbody>
              </table>

              {/* Total */}
              <div className="mt-6 text-right">
                <p className="font-semibold text-xl">
                  Total:{" "}
                  <span className="text-black">
                    Q {selectedVenta ?selectedVenta.total.toLocaleString("es-GT") : "0"}
                  </span>
                </p>
              </div>
            </div>
          </Modal>

        </main>
      </div>
    </section>
  ) 
} 

export default Sales 