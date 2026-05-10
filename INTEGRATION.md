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
| 变更请求的防连点合并（同 variables 并发 → 单 Promise） | `src/lib/mutation/useGuardedMutation.ts` |
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
# 可选：图片静态资源与 API 不同域时，单独指定媒体基地址（否则用 API origin 拼接相对路径）
# VITE_MEDIA_BASE_URL=https://cdn.example.com
```

说明：

- 不配时默认走 `http://localhost:8080`。
- 后端改端口时须同步此处。
- 媒体文件：后端将上传文件映射为 `/media/...`；前端通过 `src/lib/media/resolveMediaUrl.ts` 解析（可读 `VITE_MEDIA_BASE_URL`）。

### 4.1 国际化文案

- 默认语言：**中文（zh-CN）**；可选 **en-US**。
- 文案文件：`src/i18n/locales/zh-CN.json`、`en-US.json`；运行时上下文见 `src/i18n/I18nProvider.tsx`（`t()` / `useDictLabel()`）。
- 订单等待支付等状态：优先匹配 `dict.ORDER_STATUS.{CODE}`，缺省回退运营字典接口返回的 `itemLabel`。

## 5. 已对接接口清单

### 5.1 认证

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/change-password`（需登录）
- `GET /api/v1/auth/me`（需登录）

### 5.2 商品

- `GET /api/v1/products`（公开；未登录时价格字段可能为 null；支持查询参数 `page`、`size`、`country`、`q`、**`categoryId`**（按后台分类 ID 筛选，与 Header 类目条、`/catalog/:categoryId` 联动））
- `GET /api/v1/products/{id}`
- `POST /api/v1/admin/products`（**ADMIN**）
- `PUT /api/v1/admin/products/{id}`（**ADMIN**）
- 商品主档请求体可含 **`tagIds`**（`null` 不改关联，`[]` 清空，非空则覆盖）；响应 **`ProductView.tags`** 为标签列表（仅 **`is_active=true`** 的标签会在前台展示）。

### 5.2.1 商品标签（ADMIN）

- `GET /api/v1/admin/tags`：标签主数据列表（含排序、启用状态）
- `POST /api/v1/admin/tags`：新建标签（`code` 存库大写）
- `PUT /api/v1/admin/tags/{id}`：更新
- `DELETE /api/v1/admin/tags/{id}`：删除（会先删除 **`t_product_tags`** 中引用再删标签行）

### 5.3 购物车（需登录）

- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/{itemId}`
- `DELETE /api/v1/cart/items/{itemId}`

### 5.4 订单

- `POST /api/v1/orders`（需登录，从购物车下单；订单号格式 **`GB-{yyMMdd}-{HHmmss}-{6位随机}`**，含下单日期与时分秒，冲突时自动重试生成）
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

1. 启动后端（在 `voyage` 根目录：远端库；**Docker** 为主路径，可选 **`gradlew bootRun`**，见 **`voyage/DEPLOY.md`**）。Docker 需 **`SPRING_DATASOURCE_PASSWORD`** 等（例如 **`docker compose --env-file .env.render.local up -d --build`**），否则容器起不来、Swagger 无法访问。登录接口返回 **accessToken + refreshToken**；前端会静默 refresh，**refresh 过期（默认约 14 天）后需重新登录**。

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

## 10. 防重复提交（前端）与后端是否要改

### 10.1 前端：`useGuardedMutation`

- **位置**：`src/lib/mutation/useGuardedMutation.ts`。
- **用法**：`src/hooks/apiHooks.ts` 中所有 `useMutation` 已统一改为 `useGuardedMutation`；新增变更类 hook 时请同样使用它，避免各页面手写 `if (isPending) return` 漏改。
- **行为**：对**相同请求参数**（`variables` 经稳定序列化，当前为 `JSON.stringify`）的**并发**调用会**复用同一条 Promise**，底层 `mutationFn` 只执行一次，减轻连点导致的双发。
- **局限**：
  - 只合并「参数完全一致且几乎同时触发」的重复；**参数不同**（例如购物车先改数量为 2 再改为 3）会各发一次，这是预期。
  - **不能**替代输入防抖（如数量框连续输入）、也**不能**防止两个浏览器标签各提交一次。
  - 与 TanStack Query v5 一致，`mutationFn` 签名为 `(variables, context)`，包装层会把 `context` 原样传给真实接口函数。
- **UI**：页面仍建议保留提交按钮的 `disabled` / `loading`（体验与无障碍）；购物车等对「单行进行中」另有判断的代码见 `src/pages/Cart/index.tsx`。

### 10.2 后端（voyage）：是否必须加处理？

**不是必须**，前端合并已覆盖最常见的误触双发。但从**安全与正确性**看，后端仍建议按接口重要性逐步加强：

| 场景 | 说明 |
|------|------|
| **一般读改写** | 登录、改购物车、改后台状态等多为「最后一次为准」或可接受重试；依赖 DB 约束即可的部分（如邮箱唯一）已有防护。 |
| **下单 `POST /api/v1/orders`** | 当前实现会读购物车、建单后**清空购物车**。若两个请求**极短窗口内并发**且都读到非空购物车，理论上存在**双订单**风险（不依赖前端合并即可完全消除）。若要硬保证：**幂等键**（请求头 `Idempotency-Key` + 服务端短期去重或落库）、或对用户购物车/下单路径加**串行化**（例如用户级锁、或「下单中」状态）。 |
| **滥用 / 刷接口** | 与「防连点」不同，需 **限流**（网关或 Spring）、验证码等，属运维与安全范畴。 |

**结论**：MVP 可维持现状；若生产上最怕「同一用户双击出两单」，优先为 **创建订单** 增加幂等或并发控制，其余接口按需迭代即可。
