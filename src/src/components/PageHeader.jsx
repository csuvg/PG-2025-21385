import { useEffect, useState } from "react"

const PageHeader = () => {
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

  const displayName = sessionUser?.nombre || sessionUser?.usuario || "Invitado"

  return (
    <header className="w-full sticky top-0 z-20 bg-white flex items-center justify-between py-3 border-b border-black/10">
      <h2 className="font-inter font-semibold text-xl md:text-2xl text-black flex items-center gap-2">
        <span className="inline-block w-4 h-4 rounded-full border border-black text-center leading-[14px] text-[10px]">i</span>
        {displayName}
      </h2>
      <div className="font-tilt-warp text-brand-gold text-2xl md:text-3xl">baked-in-gt</div>
    </header>
  )
}

export default PageHeader
