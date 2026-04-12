# 生成代码说明

本目录下的 **`voyage-paths.ts`** 由工具链根据 OpenAPI 契约自动生成，**请勿手改**。

| 文件 | 来源 | 用途 |
|------|------|------|
| `voyage-paths.ts` | `npm run codegen:openapi`（底层为 `openapi-typescript`） | 导出 `paths`、`components`、`operations` 等类型，供 `voyageSdk.ts` 与页面引用 |

## 如何重新生成

1. 若后端接口有变更，先更新契约文件 `openapi/openapi.json`（可从运行中的 voyage 导出：`GET /v3/api-docs`，再按需合并进本仓库的 JSON）。
2. 在前端项目根目录执行：

```bash
npm run codegen:openapi
```

3. 若路径或请求体类型变化，需同步检查并修改 **`src/openapi/voyageSdk.ts`** 中的 URL 与调用（SDK 为手写薄封装，与契约一一对应）。
