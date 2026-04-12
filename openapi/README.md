# OpenAPI 契约（voyage 对齐）

`openapi.json` 描述与 **voyage** 后端一致的 HTTP 契约（路径、方法、请求/响应体形状）。

## 与运行时响应的关系

- voyage 实际 HTTP 体为：`{ "code", "message", "data" }`，业务数据在 **`data`** 字段。
- 本 JSON 中各 `200` 响应的 schema 表示的是 **`data` 解包后的类型**（与前端 `voyageSdk` 返回值一致），便于生成 TypeScript 类型与手写 SDK 对齐；**不是**裸 HTTP 根对象的完整结构。

## 维护建议

1. **以本文件或后端 `/v3/api-docs` 为单一事实来源**，避免前端散落魔法字符串。
2. 后端发布前：导出最新 JSON 更新本文件，并执行前端 `npm run codegen:openapi`，跑通构建与关键用例。
3. 可在 CI 中增加：对 `openapi.json` 做 Spectral/Redocly 规范校验（可选）。

## 相关代码

| 路径 | 说明 |
|------|------|
| `../src/generated/voyage-paths.ts` | 生成类型（勿手改） |
| `../src/openapi/voyageSdk.ts` | Axios 调用 + 解包 `data` |
| `../src/types/api.ts` | 从生成类型导出的业务别名 |
| `../INTEGRATION.md` | 联调与环境变量说明 |
