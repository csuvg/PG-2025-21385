import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../../../supabaseClient"


const Login = () => {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // guarda el usuario cuando se da "Recordar usuario"
  useEffect(() => {
    const remembered = localStorage.getItem("rememberedUser")
    if (remembered) {
      setUsuario(remembered)
      setRemember(true)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError("")

    const u = usuario.trim()
    const p = contrasena
    if (!u || !p) {
      setError("Ingresa usuario y contraseña.")
      return
    }

    try {
      setLoading(true)
      // Query para buscar el usuario
      const { data, error: dbError } = await supabase
        .from("Usuarios")
        .select("id, nombre, rol, usuario")
        .eq("usuario", u)
        .eq("contraseña", p)
        .maybeSingle()

      if (dbError) throw dbError
      if (!data) {
        setError("Usuario o contraseña incorrectos.")
        return
      }

      localStorage.setItem("sessionUser", JSON.stringify(data))
      if (remember) {
        localStorage.setItem("rememberedUser", u)
      } else {
        localStorage.removeItem("rememberedUser")
      }
      navigate("/productos")
    } catch (err) {
      console.error(err)
      setError("No se pudo iniciar sesión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }
  return (
    <main
      id="section-login"
      className="bg-white font-inter text-black min-h-screen flex items-center justify-center p-4"
    >
      {/* Contenedor centrado */}
      <div className="w-full max-w-2xl flex flex-col items-center justify-center gap-8 md:gap-12">
        {/* Logo / Título */}
        <h1 className="font-tilt-warp text-4xl md:text-5xl text-brand-gold text-center">
          baked-in-gt
        </h1>

        {/* Formulario de inicio de sesión */}
        <form className="w-full max-w-xl flex flex-col items-center gap-6 md:gap-8" onSubmit={handleSubmit}>
          {/* Campo de usuario */}
          <div className="w-full">
            <label htmlFor="usuario" className="block text-sm md:text-[1.5rem] font-light mb-2">
              Usuario
            </label>
            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              className="w-full h-14 md:h-16 rounded-full border-2 border-brand-dark bg-white px-6 md:px-8 text-lg md:text-xl font-outfit focus:outline-none focus:ring-2 focus:ring-brand-gold/75"
            />
          </div>

          {/* Campo de contraseña */}
          <div className="w-full">
            <label htmlFor="password" className="block text-sm md:text-[1.5rem] font-light mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
              className="w-full h-14 md:h-16 rounded-full border-2 border-brand-dark bg-white px-6 md:px-8 text-lg md:text-xl font-outfit focus:outline-none focus:ring-2 focus:ring-brand-gold/75"
            />
          </div>

          {/* Botón de inicio de sesión */}
          <button
            type="submit"
            disabled={loading}
            className="w-full max-w-xs md:max-w-sm h-12 md:h-14 bg-brand-dark text-brand-light rounded-full text-base md:text-lg font-outfit flex items-center justify-center hover:opacity-90 transition-opacity mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </button>
          {error && (
            <p className="w-full text-center text-red-600 text-sm md:text-base mt-1">{error}</p>
          )}
        </form>

        {/* Opciones adicionales */}
        <div className="w-full max-w-xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-4 mt-2">
          {/* Recordar usuario */}
          <div className="flex items-center gap-3 md:gap-4">
            <input
              type="checkbox"
              id="remember-user"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="appearance-none w-5 h-5 md:w-6 md:h-6 border-2 border-brand-gold rounded-md cursor-pointer checked:bg-brand-gold checked:bg-clip-content checked:p-0.5 transition-all"
            />
            <label
              htmlFor="remember-user"
              className="text-base md:text-lg font-light cursor-pointer"
            >
              Recordar usuario
            </label>
          </div>

          {/* Olvidé mi contraseña */}
          <a
            href="#"
            className="text-base md:text-lg font-light hover:text-brand-gold transition-colors"
          >
            Olvidé mi contraseña
          </a>
        </div>
      </div>
    </main>
  )
}

export default Login
