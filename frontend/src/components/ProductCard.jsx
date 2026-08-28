import { ShoppingCart, Package, Sparkles } from "lucide-react";

function ProductCard({
  product,
  onAddToCart,
  recommendation = false,
}) {
  if (!product) return null;

  const isOutOfStock = product.stock <= 0;

  return (
    <article className="product-card">
      <div className="product-image-wrapper">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="product-image"
          />
        ) : (
          <div className="product-image-placeholder">
            <Package size={30} />
          </div>
        )}

        {recommendation && (
          <div className="recommendation-badge">
            <Sparkles size={12} />
            Recommended
          </div>
        )}

        {isOutOfStock && (
          <div className="out-of-stock-badge">
            Out of stock
          </div>
        )}
      </div>

      <div className="product-card-content">
        <div className="product-category">
          {product.category}
        </div>

        <h3>{product.name}</h3>

        <p className="product-description">
          {product.description}
        </p>

        {product.tags?.length > 0 && (
          <div className="product-tags">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}

        <div className="product-card-bottom">
          <div>
            <div className="product-price">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </div>

            <div
              className={`stock-status ${isOutOfStock ? "stock-out" : ""
                }`}
            >
              {isOutOfStock
                ? "Currently unavailable"
                : `${product.stock} available`}
            </div>
          </div>

          <button
            className="add-cart-button"
            disabled={isOutOfStock}
            onClick={() => onAddToCart?.(product)}
          >
            <ShoppingCart size={16} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
