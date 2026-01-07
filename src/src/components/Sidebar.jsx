import React, { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { LuLogOut } from "react-icons/lu"

const Sidebar = () => {
    const [sessionUser, setSessionUser] = useState(null)

    useEffect(() => {
        const readUser = () => {
            try {
                const raw = localStorage.getItem("sessionUser")
                setSessionUser(raw ? JSON.parse(raw) : null)
            } catch {
                setSessionUser(null)
            }
        }
        readUser()
        const onStorage = (e) => {
            if (e.key === "sessionUser") readUser()
        }
        window.addEventListener("storage", onStorage)
        return () => window.removeEventListener("storage", onStorage)
    }, [])

    const navItems = [
        { name: "Productos", path: "/productos" },
        { name: "Materiales", path: "/materiales" },
        { name: "Producción", path: "/produccion" },
        { name: "Ventas", path: "/ventas" },
        { name: "Inventario", path: "/inventario" },
    ]

    const navigate = useNavigate()

    const handleLogout = () => {
        localStorage.removeItem("sessionUser")
        navigate("/")
    }

    return (
        <aside className="bg-brand-beige w-full lg:w-[300px] flex flex-col justify-center p-6 lg:p-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto flex-shrink-0">
        {/* Navegación */}
        <div>
            <nav>
            <ul className="flex flex-col items-start gap-2 md:gap-3 lg:gap-4">
                {navItems.map((item) => (
                <li key={item.name} className="w-full">
                    <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                        `block w-full font-outfit text-lg md:text-xl px-4 py-2 rounded-xl ${
                        isActive
                            ? "bg-brand-dark text-brand-beige"
                            : "text-black hover:text-brand-gold"
                        }`
                    }
                    >
                    {item.name}
                    </NavLink>
                </li>
                ))}
            </ul>
            </nav>
        </div>

        <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-brand-gold hover:opacity-80 transition-opacity mt-6 md:mt-8 lg:mt-20"
            aria-label="Cerrar sesión"
        >
            <LuLogOut className="w-6 h-6" />
            <span className="font-outfit text-lg">Cerrar sesión</span>
        </button>
        </aside>
    )
}

export default Sidebar
