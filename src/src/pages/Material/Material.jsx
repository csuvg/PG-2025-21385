import React, { useCallback, useEffect, useMemo, useState } from "react" 
import Sidebar from "../../components/Sidebar" 
import PageHeader from "../../components/PageHeader" 
import { LuSearch, LuFilter } from "react-icons/lu" 
import Modal from "../../components/Modal" 
import supabase from "../../../supabaseClient" 

const Material = () => {
    const [isIngresoOpen, setIsIngresoOpen] = useState(false) 
    const [isSalidaOpen, setIsSalidaOpen] = useState(false) 
    const [loading, setLoading] = useState(true) 
    const [error, setError] = useState("") 
    const [items, setItems] = useState([]) 
    const [proveedores, setProveedores] = useState([]) 
    const [query, setQuery] = useState("") 
    const [sortOrder, setSortOrder] = useState("desc") 

    const [ingresoForm, setIngresoForm] = useState({
        materialId: "",
        cantidad: "",
        fecha: new Date().toISOString().slice(0, 10),
    })
    const [salidaForm, setSalidaForm] = useState({
        materialId: "",
        cantidad: "",
        fecha: new Date().toISOString().slice(0, 10),
    })
    const [submitting, setSubmitting] = useState(false)
    const [isNuevoMaterialOpen, setIsNuevoMaterialOpen] = useState(false)
    const [nuevoMaterial, setNuevoMaterial] = useState({
        nombre: "",
        unidad_medida: "",
        proveedorId: "",
        proveedorNombre: "",
        proveedorTelefono: "",
    })

    const getSessionUserId = () => {
        try {
            const raw = localStorage.getItem("sessionUser")
            const parsed = raw ? JSON.parse(raw) : null
            return parsed?.id ?? null
        } catch {
            return null
        }
    }

    const makeRef = (prefix) => {
        const code = Math.random().toString(36).slice(2, 8).toUpperCase()
        return `${prefix}-${code}`
    }

    const load = useCallback(async () => {
            try {
                setLoading(true) 
                setError("") 
                // Select de la materia prima con el proveedor
                const { data, error: dbError } = await supabase
                    .from("MateriaPrima")
                    .select("id_material, nombre, cantidad, unidad_medida, Proveedor(nombre)")
                    .order("nombre", { ascending: true }) 
                if (dbError) throw dbError 
                setItems(data || []) 

                // Cargar proveedores
                const { data: provs, error: provErr } = await supabase
                    .from("Proveedor")
                    .select("id_proveedor, nombre, telefono")
                    .order("nombre", { ascending: true })
                if (provErr) throw provErr
                setProveedores(provs || [])
            } catch (err) {
                console.error(err) 
                setError("No se pudo cargar la materia prima.") 
            } finally {
                setLoading(false) 
            }
        }, []) 

    useEffect(() => {
        load() 
    }, [load]) 

    // Filtro
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase() 
        if (!q) return items 
        return items.filter((it) => {
            const proveedor = it?.Proveedor?.nombre || "" 
            return (
                it.nombre.toLowerCase().includes(q) ||
                proveedor.toLowerCase().includes(q)
            ) 
        }) 
    }, [items, query]) 

    // Ordenamiento por cantidad (se aplica después del filtro)
    const sorted = useMemo(() => {
        const arr = Array.isArray(filtered) ? [...filtered] : [] 
        const cmp = (a, b) => {
            const na = Number(a?.cantidad ?? 0) 
            const nb = Number(b?.cantidad ?? 0) 
            if (na < nb) return -1 
            if (na > nb) return 1 
            return 0 
        } 
        if (sortOrder === "asc") {
            return arr.sort(cmp) 
        }
        // default: desc
        return arr.sort((a, b) => -cmp(a, b)) 
    }, [filtered, sortOrder]) 

    // Manejo del formulario de ingreso
    const handleIngresoSubmit = async (e) => {
        e.preventDefault()
        if (submitting) return
        const id_usuario = getSessionUserId()
        const { materialId, cantidad, fecha } = ingresoForm
        const id_material = Number(materialId)
        const qty = Number(cantidad)
        if (!id_material || !qty || qty <= 0) return
        try {
            setSubmitting(true)
            const referencia = makeRef("IMP")
            const { error: dbError } = await supabase.from("mp_movimientos").insert({
                id_material,
                fecha: new Date(fecha).toISOString(),
                tipo: "entrada",
                cantidad: Number(qty.toFixed(3)),
                referencia,
                motivo: "Ingreso a bodega",
                id_usuario,
            })
            if (dbError) throw dbError
            setIsIngresoOpen(false)
            setIngresoForm({ materialId: "", cantidad: "", fecha: new Date().toISOString().slice(0, 10) })
            await load()
        } catch (err) {
            console.error(err)
            alert("No se pudo registrar el ingreso")
        } finally {
            setSubmitting(false)
        }
    }

    // Manejo del formulario de salida
    const handleSalidaSubmit = async (e) => {
        e.preventDefault()
        if (submitting) return
        const id_usuario = getSessionUserId()
        const { materialId, cantidad, fecha } = salidaForm
        const id_material = Number(materialId)
        const qty = Number(cantidad)
        if (!id_material || !qty || qty <= 0) return
        try {
            setSubmitting(true)
            const referencia = makeRef("SMP")
            const { error: dbError } = await supabase.from("mp_movimientos").insert({
                id_material,
                fecha: new Date(fecha).toISOString(),
                tipo: "salida",
                cantidad: Number(qty.toFixed(3)),
                referencia,
                motivo: "Salida de bodega",
                id_usuario,
            })
            if (dbError) throw dbError
            setIsSalidaOpen(false)
            setSalidaForm({ materialId: "", cantidad: "", fecha: new Date().toISOString().slice(0, 10) })
            await load()
        } catch (err) {
            console.error(err)
            alert("No se pudo registrar la salida")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section id="dashboard" className="bg-white">
        <div className="flex flex-col lg:flex-row min-h-screen font-sans text-black">
            {/* Sidebar Section */}
            <Sidebar />

            {/* Main Content Section */}
            <main className="flex-grow flex flex-col p-6 lg:p-8 overflow-y-auto">
            <PageHeader />

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-3 lg:gap-x-6 mt-2 lg:mt-4">
                <div className="w-full flex-1 flex items-center border-2 border-brand-dark rounded-full px-4 py-2 lg:px-6 lg:py-3 gap-x-3 lg:gap-x-4">
                <LuSearch className="w-5 h-5 lg:w-6 lg:h-6 text-brand-dark shrink-0" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Búsqueda"
                    className="w-full bg-transparent outline-none font-sans text-lg lg:text-2xl font-light placeholder:text-gray-500"
                />
                </div>
                <div className="w-full sm:w-auto flex items-center border-2 border-brand-dark rounded-full px-4 py-2 lg:px-6 lg:py-3 gap-x-3 lg:gap-x-4">
                <LuFilter className="w-5 h-5 lg:w-6 lg:h-6 text-brand-dark shrink-0" />
                <label htmlFor="sortOrder" className="sr-only">Ordenar por cantidad</label>
                <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="font-sans text-base lg:text-lg font-light text-gray-500 bg-transparent outline-none"
                >
                    <option value="desc">Mayor a menor</option>
                    <option value="asc">Menor a mayor</option>
                </select>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="flex-grow mt-6 lg:mt-8">
                <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_1fr] gap-x-4 px-2 text-center">
                <h2 className="font-outfit font-semibold lg:text-xl font-normal">Cantidad</h2>
                <h2 className="font-outfit font-semibold lg:text-xl font-normal">Nombre</h2>
                <h2 className="font-outfit font-semibold lg:text-xl font-normal">U. Medida</h2>
                <h2 className="font-outfit font-semibold lg:text-xl font-normal">Proveedor</h2>
                </div>

                <div className="flex flex-col gap-y-3 lg:gap-y-4 mt-3 lg:mt-4">
                {loading && (
                    <p className="text-center text-sm text-gray-500">Cargando…</p>
                )}
                {error && !loading && (
                    <p className="text-center text-red-600 text-sm">{error}</p>
                )}
                {!loading && !error && filtered.length === 0 && (
                    <p className="text-center text-gray-600 text-sm">Sin resultados.</p>
                )}
                {!loading && !error && sorted.map((item) => (
                    <div
                    key={item.id_material}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1fr] gap-2 md:gap-x-4 items-center text-center border-2 border-brand-dark rounded-3xl p-3 lg:py-4"
                    >
                    <p className="font-inter text-base lg:text-lg font-light">{item.cantidad ?? 0}</p>
                    <p className="font-inter text-base lg:text-lg font-light">{item.nombre}</p>
                    <p className="font-inter text-base lg:text-lg font-light">{item.unidad_medida || ""}</p>
                    <p className="font-inter text-base lg:text-lg font-light">{item?.Proveedor?.nombre || ""}</p>
                    </div>
                ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 lg:gap-x-8 mt-auto pt-6">
                <button
                onClick={() => setIsIngresoOpen(true)}
                className="w-full sm:w-auto bg-brand-dark text-brand-beige font-outfit text-lg lg:text-xl font-normal rounded-full px-6 lg:px-8 py-2 lg:py-3 hover:bg-opacity-90 transition-colors"
                >
                Ingreso
                </button>
                <button
                onClick={() => setIsSalidaOpen(true)}
                className="w-full sm:w-auto bg-brand-dark text-brand-beige font-outfit text-lg lg:text-xl font-normal rounded-full px-8 lg:px-10 py-2 lg:py-3 hover:bg-opacity-90 transition-colors"
                >
                Salida
                </button>
            </div>

            {/* Modales */}
            <Modal
                isOpen={isIngresoOpen}
                onClose={() => setIsIngresoOpen(false)}
                title="Ingreso"
            >
                {/* Formulario de ingreso */}
                <form className="w-full max-w-lg mx-auto space-y-4" onSubmit={handleIngresoSubmit}>
                <div className="flex items-center space-x-4">
                    <select
                        name="producto"
                        id="producto"
                        value={ingresoForm.materialId}
                        onChange={(e) => setIngresoForm((s) => ({ ...s, materialId: e.target.value }))}
                        className="font-outfit text-base flex-grow border-2 border-brand-dark rounded-full px-3 py-2 bg-white"
                    >
                        <option value="">Seleccionar material</option>
                        {items.map((m) => (
                            <option key={m.id_material} value={m.id_material}>{m.nombre}</option>
                        ))}
                    </select>
                    {/* Botón para añadir nuevo material */}
                    <button
                        type="button"
                        onClick={() => setIsNuevoMaterialOpen(true)}
                        className="font-outfit text-xl bg-brand-dark text-brand-beige rounded-full w-10 h-10 flex items-center justify-center"
                        aria-label="Nuevo material"
                    >
                        +
                    </button>
                </div>

                <div className="font-outfit text-base text-center items-baseline space-x-4">
                    <label htmlFor="cantidad">Cantidad:</label>
                    <input
                    id="cantidad"
                    name="cantidad"
                    type="number"
                    inputMode="numeric"
                    min="0.001"
                    step="0.001"
                    aria-label="Cantidad"
                    value={ingresoForm.cantidad}
                    onChange={(e) => setIngresoForm((s) => ({ ...s, cantidad: e.target.value }))}
                    className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-28 mx-auto"
                    />
                </div>

                <div className="font-outfit text-base text-center items-baseline space-x-4">
                    <label>Fecha:</label>
                    <input
                        id="fecha"
                        name="fecha"
                        type="date"
                        aria-label="Fecha"
                        value={ingresoForm.fecha}
                        onChange={(e) => setIngresoForm((s) => ({ ...s, fecha: e.target.value }))}
                        className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-32 mx-auto"
                    />
                </div>

                <div className="text-center mt-4">
                    <button disabled={submitting} className="bg-brand-dark text-brand-beige text-lg rounded-full px-10 py-3 hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    Registrar
                    </button>
                </div>
                </form>
            </Modal>

            {/* Modal: Nuevo material */}
            <Modal
                isOpen={isNuevoMaterialOpen}
                onClose={() => setIsNuevoMaterialOpen(false)}
                title="Nuevo material"
            >
                <form
                    className="w-full max-w-lg mx-auto space-y-5"
                    onSubmit={async (e) => {
                        e.preventDefault()
                        if (submitting) return
                        try {
                            setSubmitting(true)
                            let proveedorId = nuevoMaterial.proveedorId
                            let proveedorIdNumber = null
                            if (proveedorId === "nuevo") {
                                // Calculamos el nuevo id para los proveedores nuevos
                                const nombreProv = nuevoMaterial.proveedorNombre.trim()
                                if (!nombreProv) throw new Error("Proveedor requerido")
                                // Se jala el max id_proveedor
                                const { data: maxProv, error: maxErr } = await supabase
                                    .from("Proveedor")
                                    .select("id_proveedor")
                                    .order("id_proveedor", { ascending: false })
                                    .limit(1)
                                    .maybeSingle()
                                if (maxErr) throw maxErr
                                const nextId = ((maxProv?.id_proveedor ?? 0) + 1)
                                // Se inserta el nuevo proveedor
                                const { error: provErr } = await supabase
                                    .from("Proveedor")
                                    .insert({ id_proveedor: nextId, nombre: nombreProv, telefono: nuevoMaterial.proveedorTelefono || null })
                                if (provErr) throw provErr
                                proveedorIdNumber = nextId
                                await load()
                            } else if (proveedorId) {
                                const n = Number(proveedorId)
                                proveedorIdNumber = Number.isNaN(n) ? null : n
                            } else {
                                proveedorIdNumber = null
                            }
                            const nombreMat = nuevoMaterial.nombre.trim()
                            const unidad = nuevoMaterial.unidad_medida.trim()
                            if (!nombreMat || !unidad) throw new Error("Nombre y unidad requeridos")

                            // Insertamos el nuevo material
                            const { data: mat, error: matErr } = await supabase
                                .from("MateriaPrima")
                                .insert({
                                    nombre: nombreMat,
                                    unidad_medida: unidad,
                                    id_proveedor: proveedorIdNumber,
                                })
                                .select("id_material")
                                .single()
                            if (matErr) throw matErr
                            setIngresoForm((s) => ({ ...s, materialId: String(mat.id_material) }))
                            setNuevoMaterial({ nombre: "", unidad_medida: "", proveedorId: "", proveedorNombre: "", proveedorTelefono: "" })
                            setIsNuevoMaterialOpen(false)
                            await load()
                        } catch (err) {
                            console.error(err)
                            console.log(nuevoMaterial)
                            alert("No se pudo crear el material")
                        } finally {
                            setSubmitting(false)
                        }
                    }}
                >
                    <div>
                        <label className="block text-sm mb-1">Nombre:</label>
                        <input
                            type="text"
                            value={nuevoMaterial.nombre}
                            onChange={(e) => setNuevoMaterial((s) => ({ ...s, nombre: e.target.value }))}
                            required
                            className="w-full border-b-2 border-gray-500 bg-transparent outline-none text-base"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Unidad de medida:</label>
                        <input
                            type="text"
                            value={nuevoMaterial.unidad_medida}
                            onChange={(e) => setNuevoMaterial((s) => ({ ...s, unidad_medida: e.target.value }))}
                            required
                            className="w-full border-b-2 border-gray-500 bg-transparent outline-none text-base"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-2">Proveedor:</label>
                        <select
                            value={nuevoMaterial.proveedorId}
                            onChange={(e) => setNuevoMaterial((s) => ({ ...s, proveedorId: e.target.value }))}
                            className="w-full border-2 border-brand-dark rounded-full px-3 py-2 bg-white"
                        >
                            <option value="">Seleccionar proveedor</option>
                            {proveedores.map((p) => (
                                <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
                            ))}
                            <option value="nuevo">Nuevo proveedor…</option>
                        </select>
                    </div>
                    {nuevoMaterial.proveedorId === "nuevo" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1">Nombre del proveedor:</label>
                                <input
                                    type="text"
                                    value={nuevoMaterial.proveedorNombre}
                                    onChange={(e) => setNuevoMaterial((s) => ({ ...s, proveedorNombre: e.target.value }))}
                                    className="w-full border-b-2 border-gray-500 bg-transparent outline-none text-base"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Teléfono:</label>
                                <input
                                    type="text"
                                    value={nuevoMaterial.proveedorTelefono}
                                    onChange={(e) => setNuevoMaterial((s) => ({ ...s, proveedorTelefono: e.target.value }))}
                                    className="w-full border-b-2 border-gray-500 bg-transparent outline-none text-base"
                                />
                            </div>
                        </div>
                    )}
                    <div className="text-center mt-2">
                        <button disabled={submitting} className="bg-brand-dark text-brand-beige text-lg rounded-full px-10 py-3 hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                            Añadir
                        </button>
                    </div>
                </form>
            </Modal>

            {/** Formulario de salida */}
            <Modal
                isOpen={isSalidaOpen}
                onClose={() => setIsSalidaOpen(false)}
                title="Salida"
            >
                <form className="w-full max-w-lg mx-auto space-y-4" onSubmit={handleSalidaSubmit}>
                <div className="flex items-center space-x-4">
                    <select
                        name="producto"
                        id="producto-salida"
                        value={salidaForm.materialId}
                        onChange={(e) => setSalidaForm((s) => ({ ...s, materialId: e.target.value }))}
                        className="font-outfit text-base flex-grow border-2 border-brand-dark rounded-full px-3 py-2 bg-white"
                    >
                        <option value="">Seleccionar material</option>
                        {items.map((m) => (
                            <option key={m.id_material} value={m.id_material}>{m.nombre}</option>
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
                    inputMode="numeric"
                    min="0.001"
                    step="0.001"
                    aria-label="Cantidad"
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
                        aria-label="Fecha"
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
                    aria-label="Nivel"
                    className="border-b-2 border-gray-500 bg-transparent outline-none text-center w-28 mx-auto"
                    >
                        <option value="1">1</option>
                        <option value="2">2</option>
                    </select>
                </div>

                <div className="font-outfit text-center mt-4">
                    <button disabled={submitting} className="bg-brand-dark text-brand-beige text-lg rounded-full px-10 py-3 hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    Entregar
                    </button>
                </div>
                </form>
            </Modal>
            </main>
        </div>
        </section>
    ) 
} 

export default Material 
