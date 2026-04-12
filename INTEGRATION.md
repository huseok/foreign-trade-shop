# foreign-trade-shop 前后端联调说明

## 1. 当前对接状态

- 前端主流程已对接 **voyage** 真实接口（非本地 mock 订单流）。
- 技术栈：**Axios + TanStack React Query + Ant Design（管理后台壳）**。
- 后端目标：**`voyage`**，接口前缀 **`/api/v1`**。
- **商城**与**管理后台**路由分离：商城使用 `MainLayout`；后台使用 `/admin/*` 独立布局，顶栏不提供后台入口，避免与用户界面混用。
- **API 契约**：仓库内 `openapi/openapi.json`；类型生成 `src/generated/voyage-paths.ts`（`npm run codegen:openapi`）；运行时请求与解包见 `src/openapi/voyageSdk.ts`。说明另见 `openapi/README.md`、`src/generated/README.md`。

## 2. 关键封装位置

| 职责 | 路径 |
|------|------|
| HTTP 客户端、401、Bearer | `src/lib/http/apiClient.ts` |
| 业务错误文案 | `src/lib/http/error.ts` |
| Token 持久化 | `src/lib/auth/tokenStorage.ts` |
| 内存中的登录态读写 | `src/lib/auth/authStore.ts` |
| React Query 默认配置 | `src/lib/query/queryClient.ts` |
| OpenAPI 生成类型（勿手改） | `src/generated/voyage-paths.ts` |
| 与契约一致的请求封装 | `src/openapi/voyageSdk.ts` |
| 页面用 React Query hooks | `src/hooks/apiHooks.ts` |
| 业务类型别名（映射到 schema） | `src/types/api.ts` |
| 路由（商城 + `/admin`） | `src/router/index.tsx` |
| 商城需登录子路由守卫 | `src/router/RequireAuth.tsx` |
| 后台需 ADMIN 守卫 | `src/admin/RequireAdmin.tsx` |

## 3. OpenAPI 与类型生成（维护流程）

1. **契约源**：优先以本仓库 `openapi/openapi.json` 为准；若后端已改接口，可从运行中的 voyage 拉取 `GET /v3/api-docs` 的 JSON，再**人工合并**进 `openapi/openapi.json`（注意本仓库契约里 200 schema 表示的是解包 `data` 后的形状，与 `voyageSdk` 一致）。
2. **生成类型**：在 `foreign-trade-shop` 根目录执行 `npm run codegen:openapi`，会覆盖 `src/generated/voyage-paths.ts`。
3. **同步 SDK**：若路径、方法或 body 变化，必须同步修改 `src/openapi/voyageSdk.ts`。
4. **构建校验**：执行 `npm run build` 确认 TypeScript 通过。

## 4. 环境变量

在 `foreign-trade-shop` 根目录创建 `.env.local`：

```bash
VITE_API_BASE_URL=http://localhost:8080
```

说明：

- 不配时默认走 `http://localhost:8080`。
- 后端改端口时须同步此处。

## 5. 已对接接口清单

### 5.1 认证

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/change-password`（需登录）
- `GET /api/v1/auth/me`（需登录）

### 5.2 商品

- `GET /api/v1/products`（公开；未登录时价格字段可能为 null）
- `GET /api/v1/products/{id}`
- `POST /api/v1/admin/products`（**ADMIN**）
- `PUT /api/v1/admin/products/{id}`（**ADMIN**）

### 5.3 购物车（需登录）

- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/{itemId}`
- `DELETE /api/v1/cart/items/{itemId}`

### 5.4 订单

- `POST /api/v1/orders`（需登录，从购物车下单）
- `GET /api/v1/orders`（需登录，当前用户订单列表）
- `GET /api/v1/orders/{orderNo}`（需登录，当前用户订单详情）
- `PATCH /api/v1/orders/{orderNo}/confirm-completed`（需登录，确认完成）
- `GET /api/v1/admin/orders`（**ADMIN**，全量订单列表）
- `PATCH /api/v1/admin/orders/{orderNo}/tracking-no`（**ADMIN**，物流）
- `PATCH /api/v1/admin/orders/{orderNo}/status`（**ADMIN**，状态流转）

### 5.5 售后

- `POST /api/v1/after-sales`（需登录）
- `GET /api/v1/after-sales`（需登录，当前用户工单）
- `GET /api/v1/admin/after-sales`（**ADMIN**，全部工单）
- `PATCH /api/v1/admin/after-sales/{id}/status`（**ADMIN**）

## 6. 管理后台路由（前端）

| 路径 | 说明 |
|------|------|
| `/admin/login` | 后台登录（与商城共用账号体系，仅 ADMIN 可进入业务页） |
| `/admin` | 进入布局后默认重定向到 `/admin/orders` |
| `/admin/orders` | 订单列表（调 `GET /api/v1/admin/orders`）及物流/状态操作 |
| `/admin/products` | 商品新建与列表 |
| `/admin/after-sales` | 售后工单列表与状态更新 |

非 ADMIN 登录后访问上述受保护路径会被重定向到商城首页 `/`。

## 7. 本地启动顺序

1. 启动后端（在 `voyage` 根目录：远端库；**Docker** 为主路径，可选 **`gradlew bootRun`**，见 **`voyage/DEPLOY.md`**）。Docker 需 **`SPRING_DATASOURCE_PASSWORD`** 等（例如 **`docker compose --env-file .env.render.local up -d --build`**），否则容器起不来、Swagger 无法访问。

```bash
cd ../voyage
docker compose --env-file .env.render.local up -d --build
```

2. 启动前端（在 `foreign-trade-shop`）

```bash
npm install
npm run dev
```

3. 访问

- 前端商城：`http://localhost:5173`
- 管理后台登录：`http://localhost:5173/admin/login`
- 后端 Swagger UI：`http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON：`http://localhost:8080/v3/api-docs`

## 8. 联调测试账号（开发环境）

- 管理员：
  - `admin2@voyage.local / Admin@123456`（当前可登录）
  - `admin@voyage.local / Admin@123456`（初始化账号）
- 普通用户（测试）：
  - `buyer1@voyage.local / Admin@123456`
  - `buyer2@test.com / Admin@123456`

## 9. 常见问题

- **401 未登录**：先登录获取 token；请求层会自动带 `Authorization`。在 `/admin/*` 下 401 会跳转 **`/admin/login`**；在商城路径下跳转 **`/login`**。
- **打开接口 URL 显示「拒绝访问」**：多数接口为 `POST/PATCH` 且需 token，不能仅靠浏览器地址栏 GET 调试。
- **非管理员进不了后台**：属预期；请使用上表管理员账号从 **`/admin/login`** 登录。
- **前端能开、列表空**：检查后端是否启动、数据库是否有种子数据。
- **端口冲突**：后端改端口时同步 `VITE_API_BASE_URL`。
- **CORS 报错**：后端通过 `APP_CORS_ALLOWED_ORIGINS` 配置，开发环境需包含前端实际端口（如 `5173`）。
