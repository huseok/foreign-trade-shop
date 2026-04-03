/**
 * 购物车页：展示 CartContext 行项目，改数量/删除后小计即时更新。
 */
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getProductById } from '../data/mockProducts'
import './Cart.css'

export function Cart() {
  const { lines, removeItem, setQty, itemCount } = useCart()

  // 将 cart 行与 mock 商品合并，便于展示名称、单价
  const rows = lines.map((line) => {
    const p = getProductById(line.productId)
    return p ? { line, product: p } : null
  }).filter(Boolean) as {
    line: { productId: string; qty: number }
    product: NonNullable<ReturnType<typeof getProductById>>
  }[]

  const subtotal = rows.reduce(
    (sum, { line, product }) => sum + product.price * line.qty,
    0,
  )
  const currency = rows[0]?.product.currency ?? 'USD'

  return (
    <div className="cart page-pad">
      <div className="container">
        <header className="page-header">
          <h1 className="page-header__title">Cart</h1>
          <p className="page-header__desc">
            Review line items before proceeding to checkout.
          </p>
        </header>

        {itemCount === 0 ? (
          <div className="cart__empty">
            <p>Your cart is empty.</p>
            <Link to="/catalog" className="btn btn--primary">
              Browse catalog
            </Link>
          </div>
        ) : (
          <div className="cart__layout">
            <div className="cart__table-wrap">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Price</th>
                    <th scope="col">Qty</th>
                    <th scope="col">Subtotal</th>
                    <th scope="col">
                      <span className="visually-hidden">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ line, product }) => (
                    <tr key={product.id}>
                      <td>
                        <div className="cart-table__product">
                          <div
                            className="cart-table__thumb"
                            style={{ background: product.imageGradient }}
                            role="img"
                            aria-hidden
                          />
                          <div>
                            <Link
                              to={`/products/${product.id}`}
                              className="cart-table__name"
                            >
                              {product.name}
                            </Link>
                            <div className="cart-table__sku">{product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Price">
                        {product.currency} {product.price.toFixed(2)}
                      </td>
                      <td data-label="Qty">
                        <input
                          type="number"
                          min={1}
                          className="input input--qty"
                          value={line.qty}
                          onChange={(e) =>
                            setQty(
                              product.id,
                              Math.max(1, parseInt(e.target.value, 10) || 1),
                            )
                          }
                          aria-label={`Quantity for ${product.name}`}
                        />
                      </td>
                      <td data-label="Subtotal">
                        {product.currency}{' '}
                        {(product.price * line.qty).toFixed(2)}
                      </td>
                      <td data-label="Remove">
                        <button
                          type="button"
                          className="cart-table__remove"
                          onClick={() => removeItem(product.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <aside className="cart__summary">
              <h2 className="cart__summary-title">Order summary</h2>
              <div className="cart__summary-row">
                <span>Subtotal</span>
                <span>
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="cart__summary-row cart__summary-row--muted">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="cart__summary-total">
                <span>Estimated</span>
                <span>
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <Link to="/checkout" className="btn btn--primary btn--block">
                Proceed to checkout
              </Link>
              <Link to="/catalog" className="cart__continue">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
