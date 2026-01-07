import Sidebar from "../../components/Sidebar"
import PageHeader from "../../components/PageHeader"
import ProductCard from "../../components/ProductCard"
import supabase from "../../../supabaseClient"
import Modal from "../../components/Modal"
import { useEffect, useState } from "react"

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const { data, error: dbError } = await supabase
          .from("Productos")
          .select("id_producto, nombre")
          .order("nombre", { ascending: true })

        if (dbError) throw dbError
        setProducts(data || [])
      } catch (err) {
        console.error(err)
        setError("No se pudieron cargar los productos.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const openProduct = async (id) => {
    try {
      setDetailError("")
      setDetailLoading(true)
      setOpen(true)
      const { data, error: dbError } = await supabase
        .from("Productos")
        .select("id_producto, nombre, receta, precio_capital, precio_oriente, precio_occidente")
        .eq("id_producto", id)
        .maybeSingle()
      if (dbError) throw dbError
      setDetail(data)
    } catch (err) {
      console.error(err)
      setDetailError("No se pudo cargar el producto.")
    } finally {
      setDetailLoading(false)
    }
  }

  const formatQ = (n) => {
    const val = typeof n === "number" ? n : 0
    return `Q${val.toFixed(2)}`
  }

  return (
    <section
      id="product-dashboard"
      className="flex flex-col lg:flex-row min-h-screen bg-white"
    >
      {/* Sidebar */}
      <Sidebar activeSection="Productos" />

      {/* Contenido principal */}
      <main className="flex-1 p-6 lg:p-10 relative overflow-y-auto">
        <PageHeader />

        {/* Cuadrícula de categorías */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 place-items-center">
          {loading && (
            <p className="col-span-full text-center text-sm text-gray-500">Cargando productos…</p>
          )}
          {error && !loading && (
            <p className="col-span-full text-center text-red-600 text-sm">{error}</p>
          )}
          {!loading && !error && products.length === 0 && (
            <p className="col-span-full text-center text-gray-600 text-sm">No hay productos.</p>
          )}
          {!loading && !error && products.map((p) => (
            <ProductCard key={p.id_producto} name={p.nombre} onClick={() => openProduct(p.id_producto)} />
          ))}
        </div>

        {/* Modal de detalle de producto */}
        <Modal isOpen={open} onClose={() => setOpen(false)} title={detail?.nombre || "Producto"}>
          <div className="relative">
            {detailLoading && (
              <p className="text-center text-sm text-gray-600">Cargando…</p>
            )}
            {detailError && !detailLoading && (
              <p className="text-center text-red-600 text-sm">{detailError}</p>
            )}
            {!detailLoading && !detailError && detail && (
              <div className="mt-4">
                {/* Descripción/receta corta */}
                {detail.receta && (
                  <p className="text-center text-sm md:text-base text-black mb-4">
                    {detail.receta}
                  </p>
                )}

                <h3 className="text-center font-outfit text-sm md:text-base mb-2">Precios:</h3>
                <div className="grid grid-cols-2 gap-y-4 text-center">
                  <div>
                    <p className="text-xs md:text-sm text-black/80">Ciudad Capital</p>
                    <p className="text-sm md:text-base">{formatQ(detail.precio_capital)}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-black/80">Quetzaltenango</p>
                    <p className="text-sm md:text-base">{formatQ(detail.precio_occidente)}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-black/80">Puerto</p>
                    <p className="text-sm md:text-base">{formatQ(detail.precio_puerto)}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-black/80">Oriente</p>
                    <p className="text-sm md:text-base">{formatQ(detail.precio_oriente)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
        
      </main>
    </section>
  )
}

export default Products
