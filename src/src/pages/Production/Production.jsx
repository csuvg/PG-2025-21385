import { useEffect, useState, useCallback } from "react" 
import Sidebar from "../../components/Sidebar" 
import PageHeader from "../../components/PageHeader" 
import Modal from "../../components/Modal" 
import { MdAssignmentAdd } from "react-icons/md" 
import supabase from "../../../supabaseClient" 

const Production = () => {
    const [open, setOpen] = useState(false) 
    const [modalType, setModalType] = useState(null) 
    const [selected, setSelected] = useState(null) 
    const [activeTab, setActiveTab] = useState("activas") 

    // Asignar producción (crear borrador)
    const [salidaForm, setSalidaForm] = useState({
        productId: "",
        cantidad: "",
        fecha: new Date().toISOString().slice(0, 10),
        nivel: "1",
    }) 

    const [detalleForm, setDetalleForm] = useState({
        cantidadProducida: "",
        malElaborado: "",
        empacado: "",
        diferencia: "",
        observaciones: "",
    }) 

    // Datos desde DB
    const [products, setProducts] = useState([])  // Productos para seleccionar
    const [activeProductions, setActiveProductions] = useState([])  // estado = 'borrador'
    const [pastProductions, setPastProductions] = useState([])  // estado = 'enviada'
    const [loading, setLoading] = useState(true) 
    const [error, setError] = useState("") 

    const getSessionUserId = () => {
        try {
            const raw = localStorage.getItem("sessionUser") 
            const parsed = raw ? JSON.parse(raw) : null 
            return parsed?.id ?? null 
        } catch {
            return null 
        }
    } 

    const load = useCallback(async () => {
        try {
            setLoading(true) 
            setError("") 
            // Productos para el select
            const { data: prods, error: prodErr } = await supabase
                .from("Productos")
                .select("id_producto, nombre")
                .order("nombre", { ascending: true }) 
            if (prodErr) throw prodErr 
            setProducts(prods || []) 

            // Producciones activas (borrador)
            const { data: act, error: actErr } = await supabase
                .from("Produccion")
                .select("id_produccion, id_producto, cantidad_estimada, fecha, estado, lote, Productos(nombre)")
                .eq("estado", "borrador")
                .order("fecha", { ascending: false }) 
            if (actErr) throw actErr 
            setActiveProductions(act || []) 

            // Producciones pasadas (enviada)
            const { data: past, error: pastErr } = await supabase
                .from("Produccion")
                .select("id_produccion, id_producto, cantidad_estimada, cantidad_producida, fecha, estado, lote, mal_elaborado, empacado, observaciones, Productos(nombre)")
                .eq("estado", "enviada")
                .order("fecha", { ascending: false }) 
            if (pastErr) throw pastErr 
            setPastProductions(past || []) 
        } catch (err) {
            console.error(err) 
            setError("No se pudo cargar producción.") 
        } finally {
            setLoading(false) 
        }
    }, []) 

    useEffect(() => {
        load() 
    }, [load]) 

    const openAssignModal = () => {
        setModalType("asignar") 
        setOpen(true) 
    } 

    const openDetail = (prod) => {
        setSelected(prod) 
        setModalType("detalle") 
        setOpen(true) 
    } 

    const openPastDetail = (prod) => {
        setSelected(prod) 
        setModalType("pasado") 
        setOpen(true) 
    } 

    const handleSalidaSubmit = async (e) => {
        e.preventDefault() 
        const id_responsable = getSessionUserId() 
        const id_producto = Number(salidaForm.productId) 
        const cantidad = Number(salidaForm.cantidad) 
        if (!id_producto || !cantidad || cantidad <= 0) return 
        try {
            const { error: insErr } = await supabase
                .from("Produccion")
                .insert({
                    id_producto,
                    cantidad_estimada: cantidad,
                    fecha: salidaForm.fecha || null,
                    lote: salidaForm.nivel ? Number(salidaForm.nivel) : null,
                    id_responsable,
                    // estado queda 'borrador' por default
                }) 
            if (insErr) throw insErr 
            setOpen(false) 
            setSalidaForm({ productId: "", cantidad: "", fecha: new Date().toISOString().slice(0, 10), nivel: "1" }) 
            await load() 
            console.log("Producción asignada", { id_producto, cantidad, id_responsable }) 
        } catch (err) {
            console.error(err) 
            alert("No se pudo asignar la producción") 
        }
    } 

    const handleDetalleSubmit = async (e) => {
        e.preventDefault()
        if (!selected?.id_produccion) return
        const cantidad_producida = detalleForm.cantidadProducida ? Number(detalleForm.cantidadProducida) : null
        const mal_elaborado = detalleForm.malElaborado ? Number(detalleForm.malElaborado) : null
        const empacado = detalleForm.empacado ? Number(detalleForm.empacado) : null
        try {
            const { error: upErr } = await supabase
                .from("Produccion")
                .update({
                    cantidad_producida,
                    mal_elaborado,
                    empacado,
                    observaciones: (detalleForm.observaciones || "").trim() || null,
                    estado: "enviada",
                    enviado_at: new Date().toISOString(),
                })
                .eq("id_produccion", selected.id_produccion)
            if (upErr) throw upErr
            setOpen(false)
            setDetalleForm({ cantidadProducida: "", malElaborado: "", empacado: "", diferencia: "", observaciones: "" })
            await load()
        } catch (err) {
            console.error(err)
            alert("No se pudo enviar la producción")
        }
    }

    // Prefill detalle form when opening detalle modal
    useEffect(() => {
        if (modalType === "detalle" && selected) {
            const baseProd = (selected?.cantidad_producida ?? null)
            const baseEst = (selected?.cantidad_estimada ?? "")
            const baseCantidad = baseProd ?? baseEst
            const num = baseCantidad === "" ? "" : Number(baseCantidad)
            setDetalleForm({
                cantidadProducida: baseCantidad,
                empacado: "",
                malElaborado: "",
                diferencia: num === "" ? "" : (Number(num) - 0),
                observaciones: "",
            })
        }
    }, [modalType, selected])

    return (
        <section className="bg-white">
        <div className="flex flex-col lg:flex-row min-h-screen font-sans text-black">
            {/* Sidebar Section */}
            <Sidebar activeSection="Producción" />

            {/* Main Section */}
            <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto">
            <PageHeader />

            {/* Tabs */}
            <div className="mt-4 lg:mt-6 text-center">
                <div className="inline-flex items-center justify-center gap-x-4 lg:gap-x-8">
                <button
                    onClick={() => setActiveTab("activas")}
                    className={`px-5 lg:px-8 py-2 lg:py-2.5 text-lg lg:text-2xl font-outfit rounded-full shadow-sm transition-colors ${
                    activeTab === "activas"
                        ? "bg-brand-dark text-brand-light"
                        : "bg-brand-beige text-brand-dark"
                    }`}
                >
                    Activas
                </button>

                <button
                    onClick={() => setActiveTab("pasadas")}
                    className={`px-5 lg:px-8 py-2 lg:py-2.5 text-lg lg:text-2xl font-outfit rounded-full transition-colors ${
                    activeTab === "pasadas"
                        ? "bg-brand-dark text-brand-light"
                        : "bg-brand-beige text-brand-dark"
                    }`}
                >
                    Pasadas
                </button>
                </div>

                <p className="mt-3 lg:mt-4 text-black/80 text-sm lg:text-base font-brand-light leading-tight">
                {activeTab === "activas"
                    ? "Presiona la tarjeta para hacer un envío"
                    : "Consulta el detalle de los envíos anteriores"}
                </p>
            </div>

            {/* Grid de Producción */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-6 mt-6 lg:mt-8 flex-grow items-start content-start auto-rows-auto">
                {(activeTab === "activas" ? activeProductions : pastProductions).map((p) => (
                <div
                    key={p.id_produccion}
                    onClick={() =>
                    activeTab === "activas" ? openDetail(p) : openPastDetail(p)
                    }
                    className="bg-brand-beige border border-brand-dark rounded-2xl p-4 lg:p-6 flex gap-x-4 lg:gap-x-6 items-start cursor-pointer hover:shadow-lg transition-shadow"
                >
                    <p className="text-gold font-semibold text-sm lg:text-xl text-right leading-tight whitespace-pre-line w-[120px] lg:w-[160px] flex-shrink-0">
                    Fecha{"\n"}Producto{"\n"}Quintales{"\n"}Nivel
                    </p>
                    <p className="text-black font-light text-sm lg:text-xl text-left leading-tight whitespace-pre-line">
                    {p.fecha || ""}
                    {"\n"}
                    {p?.Productos?.nombre || ""}
                    {"\n"}
                    {p?.cantidad_estimada ?? 0}
                    {"\n"}
                    {p?.lote ?? "-"}
                    </p>
                </div>
                ))}
            </div>

            {activeTab === "activas" && (
                <div className="mt-auto pt-6 flex justify-end">
                <button onClick={openAssignModal} className="flex items-center gap-x-3 lg:gap-x-4">
                    <MdAssignmentAdd className="text-black w-6 lg:w-8 h-6 lg:h-8" />
                    <span className="text-black text-lg lg:text-2xl font-light leading-tight">
                    Asignar producción
                    </span>
                </button>
                </div>
            )}
            </main>
        </div>

        {/* Modal dinámico */}
        <Modal
            isOpen={open}
            onClose={() => setOpen(false)}
            title={
            modalType === "asignar"
                ? "Asignar Producción"
                : modalType === "detalle"
                ? "Envío de producción"
                : "Detalle de envío anterior"
            }
        >
            {/* Modal Asignar Producción */}
            {modalType === "asignar" && (
            <form className="w-full max-w-lg mx-auto space-y-4" onSubmit={handleSalidaSubmit}>
                <div className="flex items-center space-x-4">
                <select
                    name="producto"
                    id="producto-salida"
                    value={salidaForm.productId}
                    onChange={(e) => setSalidaForm((s) => ({ ...s, productId: e.target.value }))}
                    className="font-outfit text-base flex-grow border-2 border-brand-dark rounded-full px-3 py-2 bg-white"
                >
                    <option value="">Seleccionar producto</option>
                    {products.map((m) => (
                        <option key={m.id_producto} value={m.id_producto}>
                            {m.nombre}
                        </option>
                    ))}
                </select>
                <div className="w-10 h-10" />
                </div>

                <div className="font-outfit text-base text-center items-baseline space-x-4">
                <label htmlFor="cantidad">Cantidad:</label>
                <input
                    id="cantidad"
                    name="cantidad"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={salidaForm.cantidad}
                    onChange={(e) => setSalidaForm((s) => ({ ...s, cantidad: e.target.value }))}
                    className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-28 mx-auto"
                />
                </div>

                <div className="font-outfit text-base text-center items-baseline space-x-4">
                <label>Fecha:</label>
                <input
                    id="fecha"
                    name="fecha"
                    type="date"
                    value={salidaForm.fecha}
                    onChange={(e) => setSalidaForm((s) => ({ ...s, fecha: e.target.value }))}
                    className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-32 mx-auto"
                />
                </div>

                <div className="font-outfit text-base text-center items-baseline space-x-4">
                <label htmlFor="nivel">Nivel:</label>
                <select
                    id="nivel"
                    name="nivel"
                    value={salidaForm.nivel}
                    onChange={(e) => setSalidaForm((s) => ({ ...s, nivel: e.target.value }))}
                    className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-28 mx-auto"
                >
                    <option value="1">1</option>
                    <option value="2">2</option>
                </select>
                </div>

                <div className="font-outfit text-center mt-4">
                <button className="bg-brand-dark text-brand-beige text-lg rounded-full px-10 py-3 hover:bg-gray-800 transition-colors">
                    Registrar
                </button>
                </div>
            </form>
            )}

            {/* Modal Detalle Activo */}
            {modalType === "detalle" && selected && (
            <form className="w-full max-w-lg mx-auto space-y-4" onSubmit={handleDetalleSubmit}>
                <div className="font-outfit text-base text-center">
                <p className="mb-3 text-lg lg:text-xl font-semibold">{selected?.Productos?.nombre || ""}</p>
                </div>

                <div className="font-outfit text-base text-center">
                <label htmlFor="cantidadProducida">Cantidad producida:</label>
                <input
                    id="cantidadProducida"
                    type="number"
                    className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-28 mx-2"
                    value={detalleForm.cantidadProducida}
                    onChange={(e) =>
                    setDetalleForm((f) => {
                        const cantidad = Number(e.target.value || 0)
                        const emp = Number(f.empacado || 0)
                        const mal = Number(f.malElaborado || 0)
                        return {
                            ...f,
                            cantidadProducida: e.target.value,
                            diferencia: cantidad - (emp + mal),
                        }
                    })
                    }
                />
                </div>

                <div className="font-outfit text-base text-center">
                <label htmlFor="empacado">Empacado:</label>
                <input
                    id="empacado"
                    type="number"
                    className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-28 mx-2"
                    value={detalleForm.empacado}
                    onChange={(e) =>
                    setDetalleForm((f) => {
                        const emp = Number(e.target.value || 0)
                        const cant = Number(f.cantidadProducida || 0)
                        const mal = Number(f.malElaborado || 0)
                        return {
                            ...f,
                            empacado: e.target.value,
                            diferencia: cant - (emp + mal),
                        }
                    })
                    }
                />
                </div>

                <div className="font-outfit text-base text-center">
                <label htmlFor="malElaborado">Mal elaborado:</label>
                <input
                    id="malElaborado"
                    type="number"
                    className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-28 mx-2"
                    value={detalleForm.malElaborado}
                    onChange={(e) =>
                    setDetalleForm((f) => {
                        const mal = Number(e.target.value || 0)
                        const cant = Number(f.cantidadProducida || 0)
                        const emp = Number(f.empacado || 0)
                        return {
                            ...f,
                            malElaborado: e.target.value,
                            diferencia: cant - (emp + mal),
                        }
                    })
                    }
                />
                </div>

                <div className="font-outfit text-base text-center">
                <label htmlFor="diferencia">Diferencia:</label>
                <input
                    id="diferencia"
                    type="number"
                    className="bg-transparent outline-none text-center w-28 mx-2"
                    value={detalleForm.diferencia}
                    readOnly
                />
                </div>

                <div className="font-outfit text-base text-center">
                <label htmlFor="observaciones">Observaciones:</label>
                <textarea
                    id="observaciones"
                    rows={3}
                    className="border-2 border-gray-500 bg-transparent outline-none w-full rounded-lg px-2 py-1"
                    value={detalleForm.observaciones}
                    onChange={(e) =>
                    setDetalleForm((f) => ({
                        ...f,
                        observaciones: e.target.value,
                    }))
                    }
                />
                </div>

                <div className="font-outfit text-center mt-4">
                <button className="bg-brand-dark text-brand-beige text-lg rounded-full px-10 py-3 hover:bg-gray-800 transition-colors">
                    Enviar
                </button>
                </div>
            </form>
            )}

            {/* Modal Detalle de Producción Pasada */}
            {modalType === "pasado" && selected && (
                <div className="w-full max-w-lg mx-auto space-y-4 font-outfit">
                    <div className="text-center mb-4">
                    <p className="text-xl font-semibold">{selected?.Productos?.nombre || ""}</p>
                    <p>Fecha: {selected.fecha || ""}</p>
                    <p>Quintales: {selected?.cantidad_producida ?? selected?.cantidad_estimada ?? 0}</p>
                    <p>Nivel: {selected?.lote ?? "-"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="text-center">
                        <label>Mal elaborado:</label>
                        <input
                        type="number"
                        value={selected?.mal_elaborado ?? 0}
                        readOnly
                        className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-full"
                        />
                    </div>
                    <div className="text-center">
                        <label>Empacado:</label>
                        <input
                        type="number"
                        value={selected?.empacado ?? 0}
                        readOnly
                        className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-full"
                        />
                    </div>
                    <div className="text-center">
                        <label>Diferencia:</label>
                        <input
                        type="number"
                        value={(selected?.cantidad_producida ?? 0) - ((selected?.empacado ?? 0) + (selected?.mal_elaborado ?? 0))}
                        readOnly
                        className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-full"
                        />
                    </div>
                    <div className="text-center col-span-2">
                        <label>Observaciones:</label>
                        <textarea
                        rows={3}
                        value={selected?.observaciones || ""}
                        readOnly
                        className="border-2 border-gray-500 bg-transparent outline-none w-full rounded-lg px-2 py-1"
                        />
                    </div>
                    </div>
                </div>
                )}
        </Modal>
        </section>
    ) 
} 

export default Production 
