/**
 * 生成演示用订单号（前端随机串）。
 * 生产环境请改为服务端返回的唯一 ID，避免重复与伪造。
 */
export function createDemoOrderId(): string {
  return 'ORD-' + Math.random().toString(36).slice(2, 10).toUpperCase()
}
