import React, { useState, useEffect } from "react" 
import Sidebar from "../../components/Sidebar" 
import PageHeader from "../../components/PageHeader" 
import Modal from "../../components/Modal" 
import supabase from "../../../supabaseClient" 

const Inventory = () => {
    const [date, setDate] = useState("") 
    const [observaciones, setObservaciones] = useState("") 
    const [data, setData] = useState([]) 
    const [loading, setLoading] = useState(true) 
    const [confirmOpen, setConfirmOpen] = useState(false) 

    // obtener el último "Final" de cada producto
    const obtenerUltimoFinal = async (idProducto) => {
        const { data, error } = await supabase
            .from("HistorialInventario")
            .select("Final")
            .eq("id_producto", idProducto)
            .order("fecha", { ascending: false })
            .limit(1) 

        if (error) {
            console.error("Error al obtener el último final:", error) 
            return 0 
        }

        return data.length > 0 ? data[0].Final : 0 
    } 

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data: productos, error } = await supabase
                    .from("Productos")
                    .select("id_producto, nombre")
                if (error) throw error

                const initialized = await Promise.all(
                    (productos || []).map(async (p) => {
                        const ultimoFinal = await obtenerUltimoFinal(p.id_producto)
                        return {
                            id_producto: p.id_producto,
                            producto: p.nombre,
                            inicial: ultimoFinal,
                            ingreso: 0,
                            total: ultimoFinal,
                            vendido: 0,
                            final: ultimoFinal,
                        }
                    })
                )
                setData(initialized)
            } catch (err) {
                console.error("Error al cargar productos:", err)
                alert("No se pudieron cargar los productos ❌")
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [])

    const handleChange = (id_producto, field, value) => {
        setData((prev) =>
            prev.map((row) => {
                if (row.id_producto === id_producto) {
                    const updated = { ...row, [field]: Number(value) || 0 }
                    updated.total = updated.inicial + updated.ingreso
                    updated.final = updated.total - updated.vendido
                    return updated
                }
                return row
            })
        )
    }

    const handleRegister = async () => {
        if (!date) {
            alert("Por favor, selecciona una fecha antes de registrar.")
            return
        }
        try {
            const { count, error: countErr } = await supabase
                .from("HistorialInventario")
                .select("id_producto", { count: "exact", head: true })
                .eq("fecha", date)
            // if (countErr) throw countErr
            // if ((count || 0) > 0) {
            //     alert("Ya existe un inventario registrado para esta fecha. Solo se permite un envío por fecha.")
            //     return
            // }
            setConfirmOpen(true)
        } catch (err) {
            console.error("Error validando fecha de inventario:", err)
            alert("No se pudo validar la fecha. Intenta de nuevo.")
        }
    }

    // Confirmar y guardar inventario
    const handleConfirmRegister = async () => {
        try {
            const registros = data.map((row) => ({
                id_producto: row.id_producto,
                fecha: date,
                Inicial: row.inicial,
                Ingreso: row.ingreso,
                Total: row.total,
                Vendido: row.vendido,
                Final: row.final,
                Observaciones: observaciones || "sin observaciones",
            }))

            const { data: insertedData, error: insertError } = await supabase
                .from("HistorialInventario")
                .insert(registros)
            if (insertError) throw insertError
            console.log("Datos insertados:", insertedData)
            setConfirmOpen(false)
            alert("Inventario registrado correctamente ✅")
        } catch (error) {
            console.error("Error al registrar inventario:", error)
            alert("No se pudo registrar el inventario ❌")
        }
    }

    return (
        <section className="bg-white">
            <div className="flex flex-col lg:flex-row min-h-screen font-sans text-black">
                <Sidebar activeSection="Inventario" />
                <main className="flex-1 p-6 lg:p-10">
                    <PageHeader />
                    <div className="max-w-5xl mx-auto mt-6">
                        {/* Intro + Fecha */}
                        <div className="text-center mb-6">
                            <p className="text-sm lg:text-base text-black/70 mb-2 font-inter">
                                Registra el inventario del día de hoy.
                            </p>
                            <label className="text-lg font-inter mr-2">Fecha:</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="border-b border-gray-500 outline-none text-center text-lg bg-transparent"
                            />
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-2 text-center font-outfit">
                                <thead>
                                    <tr className="text-lg text-brand-dark">
                                        <th>Producto</th>
                                        <th>Inicial</th>
                                        <th>Ingreso</th>
                                        <th>Total</th>
                                        <th>Vendido</th>
                                        <th>Final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-8">
                                                <p className="text-lg font-outfit">Cargando productos...</p>
                                            </td>
                                        </tr>
                                    ) : data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8">
                                                <p className="text-lg font-outfit">No hay productos.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((row) => (
                                            <tr
                                                key={row.id_producto}
                                                className="border border-brand-dark font-inter rounded-xl bg-brand-beige"
                                            >
                                                <td className="py-3 px-2 text-left rounded-l-xl">{row.producto}</td>
                                                <td>
                                                    {/* Campo Inicial: solo lectura */}
                                                    <input
                                                        type="number"
                                                        value={row.inicial}
                                                        readOnly
                                                        className="w-16 bg-transparent font-inter text-center outline-none"
                                                    />
                                                </td>
                                                <td className="text-brand-gold font-inter font-semibold">
                                                    <input
                                                        type="number"
                                                        value={row.ingreso}
                                                        onChange={(e) => handleChange(row.id_producto, "ingreso", e.target.value)}
                                                        className="w-16 bg-transparent text-center outline-none"
                                                    />
                                                </td>
                                                <td>{row.total}</td>
                                                <td className="text-brand-gold font-inter font-semibold">
                                                    <input
                                                        type="number"
                                                        value={row.vendido}
                                                        onChange={(e) => handleChange(row.id_producto, "vendido", e.target.value)}
                                                        className="w-16 bg-transparent text-center outline-none"
                                                    />
                                                </td>
                                                <td className="rounded-r-xl">{row.final}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Observaciones y botón */}
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-y-4">
                            <div className="flex items-center w-full sm:w-auto">
                                <label className="font-outfit text-brand-gold text-lg mr-2">Observaciones:</label>
                                <input
                                    type="text"
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    className="border-b-2 border-brand-gold outline-none flex-grow bg-transparent text-black"
                                />
                            </div>

                            <button
                                onClick={handleRegister}
                                className="bg-brand-dark text-white px-8 py-2 rounded-full text-lg font-outfit hover:bg-black transition-colors"
                            >
                                Registrar
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            {/* Pre-submit Modal */}
            <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar inventario">
                <div className="space-y-3 font-outfit">
                    <p className="text-center text-sm text-black/70">Fecha: {date}</p>
                    {observaciones && <p className="text-center text-sm text-black/70">Observaciones: {observaciones}</p>}
                    <div className="max-h-64 overflow-y-auto border border-brand-dark rounded-lg">
                        <table className="w-full text-xs sm:text-sm">
                            <thead className="bg-brand-beige">
                                <tr>
                                    <th className="px-2 py-1 text-left">Producto</th>
                                    <th className="px-2 py-1">Inicial</th>
                                    <th className="px-2 py-1">Ingreso</th>
                                    <th className="px-2 py-1">Total</th>
                                    <th className="px-2 py-1">Vendido</th>
                                    <th className="px-2 py-1">Final</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((r) => (
                                    <tr key={r.id_producto} className="odd:bg-white even:bg-brand-beige/40">
                                        <td className="px-2 py-1 text-left">{r.producto}</td>
                                        <td className="px-2 py-1 text-center">{r.inicial}</td>
                                        <td className="px-2 py-1 text-center">{r.ingreso}</td>
                                        <td className="px-2 py-1 text-center">{r.total}</td>
                                        <td className="px-2 py-1 text-center">{r.vendido}</td>
                                        <td className="px-2 py-1 text-center">{r.final}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-full border border-brand-dark">Cancelar</button>
                        <button onClick={handleConfirmRegister} className="px-4 py-2 rounded-full bg-brand-dark text-brand-light">Confirmar</button>
                    </div>
                </div>
            </Modal>
        </section>
    )
}

export default Inventory
