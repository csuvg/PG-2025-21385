const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay con blur */}
        <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        />

        {/* Contenedor del modal */}
        <div className="relative bg-brand-beige rounded-2xl p-6 sm:p-8 w-full max-w-2xl mx-auto z-10 shadow-xl">
            {/* Botón de cerrar */}
            <button
            className="absolute top-4 right-4 text-black text-xl sm:text-2xl"
            onClick={onClose}
            >
            ✕
            </button>

            {/* Título */}
            <h1 className="font-tilt-warp text-brand-gold text-3xl sm:text-4xl lg:text-5xl font-normal text-center mb-6 sm:mb-8">
            {title}
            </h1>

            {/* Contenido */}
            {children}
        </div>
        </div>
    )
}

export default Modal;
