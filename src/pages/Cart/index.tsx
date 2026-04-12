/**
 * 购物车页：
 * 基于后端真实购物车接口，支持改数量、删除和金额汇总。
 */
import { Link } from 'react-router-dom'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../../hooks/apiHooks'
import './Cart.scss'

export function Cart() {
  const { data: cart, isLoading } = useCart()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItem()
  const rows = cart?.items ?? []
  const itemCount = rows.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = Number(cart?.totalAmount ?? 0)
  const currency = cart?.currency ?? 'USD'

  const handleQtyChange = (itemId: number, qty: number) => {
    if (
      updateMutation.isPending &&
      updateMutation.variables?.itemId === itemId
    ) {
      return
    }
    if (removeMutation.isPending && removeMutation.variables === itemId) return
    void updateMutation.mutate({ itemId, payload: { quantity: Math.max(1, qty) } })
  }

  const handleRemove = (itemId: number) => {
    if (removeMutation.isPending && removeMutation.variables === itemId) return
    if (
      updateMutation.isPending &&
      updateMutation.variables?.itemId === itemId
    ) {
      return
    }
    void removeMutation.mutate(itemId)
  }

  return (
    <div className="cart page-pad">
      <div className="container">
        <header className="page-header">
          <h1 className="page-header__title">Cart</h1>
          <p className="page-header__desc">
            Review line items before proceeding to checkout.
          </p>
        </header>

        {isLoading ? (
          <div className="cart__empty"><p>Loading cart...</p></div>
        ) : itemCount === 0 ? (
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
                  {rows.map((item) => {
                    const rowUpdating =
                      updateMutation.isPending &&
                      updateMutation.variables?.itemId === item.itemId
                    const rowRemoving =
                      removeMutation.isPending &&
                      removeMutation.variables === item.itemId
                    const rowBusy = rowUpdating || rowRemoving
                    return (
                    <tr key={item.itemId}>
                      <td>
                        <div className="cart-table__product">
                          <div
                            className="cart-table__thumb"
                            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0d9488 100%)' }}
                            role="img"
                            aria-hidden
                          />
                          <div>
                            <Link
                              to={`/products/${item.productId}`}
                              className="cart-table__name"
                            >
                              {item.title}
                            </Link>
                            <div className="cart-table__sku">ID: {item.productId}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Price">
                        {item.currency} {Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td data-label="Qty">
                        <input
                          type="number"
                          min={1}
                          className="input input--qty"
                          value={item.quantity}
                          disabled={rowBusy}
                          onChange={(e) =>
                            handleQtyChange(item.itemId, parseInt(e.target.value, 10) || 1)
                          }
                          aria-label={`Quantity for ${item.title}`}
                        />
                      </td>
                      <td data-label="Subtotal">
                        {item.currency} {Number(item.lineAmount).toFixed(2)}
                      </td>
                      <td data-label="Remove">
                        <button
                          type="button"
                          className="cart-table__remove"
                          disabled={rowBusy}
                          onClick={() => handleRemove(item.itemId)}
                        >
                          {rowRemoving ? '…' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                    )
                  })}
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
