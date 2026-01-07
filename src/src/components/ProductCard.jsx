const ProductCard = ({ name, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-brand-beige text-black border-2 border-brand-dark rounded-xl w-full max-w-[240px] px-4 py-3 font-outfit text-base md:text-lg leading-tight hover:bg-brand-gold/10 transition-colors"
    >
      <span className="block text-center break-words">{name}</span>
    </button>
  )
}

export default ProductCard
