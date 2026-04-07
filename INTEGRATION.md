# foreign-trade-shop 前后端联调说明

## 1. 当前对接状态
- 前端已从本地 mock 主流程切换为后端真实接口。
- 技术栈：`Axios + React Query`。
- 后端目标：`voyage`，接口前缀 `/api/v1`。
- 新增后台商品管理页：`/admin/products`（管理员可新增商品/SKU）。

## 2. 关键封装位置
- HTTP 客户端：`src/lib/http/apiClient.ts`
- 错误处理：`src/lib/http/error.ts`
- token 存储：`src/lib/auth/tokenStorage.ts`
- 登录态工具：`src/lib/auth/authStore.ts`
- QueryClient：`src/lib/query/queryClient.ts`
- 业务 API：`src/api/*.ts`
- 业务 hooks：`src/hooks/apiHooks.ts`

## 3. 环境变量
在 `foreign-trade-shop` 根目录创建 `.env.local`：

```bash
VITE_API_BASE_URL=http://localhost:8080
```

说明：
- 不配时默认走 `http://localhost:8080`。
- 如果后端改端口，记得同步这里。

## 4. 已对接接口清单
- 认证
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
- 商品
  - `GET /api/v1/products`
  - `GET /api/v1/products/{id}`
- 购物车
  - `GET /api/v1/cart`
  - `POST /api/v1/cart/items`
  - `PATCH /api/v1/cart/items/{itemId}`
  - `DELETE /api/v1/cart/items/{itemId}`
- 订单
  - `POST /api/v1/orders`
  - `GET /api/v1/orders`
  - `GET /api/v1/orders/{orderNo}`
  - `PATCH /api/v1/orders/{orderNo}/confirm-completed`
- 售后
  - `POST /api/v1/after-sales`
  - `GET /api/v1/after-sales`

## 5. 本地启动顺序
1) 启动后端（在 `voyage`，Docker 方式）

```bash
docker compose up -d --build
```

2) 启动前端（在 `foreign-trade-shop`）

```bash
npm install
npm run dev
```

3) 访问
- 前端：`http://localhost:5173`
- 后端文档：`http://localhost:8080/swagger-ui/index.html`

## 6. 联调测试账号（开发环境）
- 管理员：
  - `admin2@voyage.local / Admin@123456`（当前可登录）
  - `admin@voyage.local / Admin@123456`（初始化账号）
- 普通用户（测试）：
  - `buyer1@test.com / Admin@123456`
  - `buyer2@test.com / Admin@123456`

## 7. 常见问题
- 401 未登录：
  - 先走登录页获取 token；请求层会自动带 `Authorization`。
- 打开接口 URL 显示“拒绝访问”：
  - 很多接口是 `POST/PATCH` 且需 token，不能直接浏览器地址栏访问。
- 前端能开、列表空：
  - 检查后端是否启动、数据库是否有测试数据。
- 端口冲突：
  - 后端改端口时，记得同步 `VITE_API_BASE_URL`。
- CORS 报错：
  - 后端已支持 `APP_CORS_ALLOWED_ORIGINS` 配置，开发环境确保包含前端实际端口（如 `5173/5174`）。
