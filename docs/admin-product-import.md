# 管理后台 · 商品 CSV 导入 / 导出

## 列定义（表头顺序）

与「导出当前页」「下载导入模板」一致，列为：

`id`, `title`, `price`, `listPrice`, `currency`, `moq`, `isActive`, `description`, `skuCode`, `hsCode`, `unit`, `incoterm`, `originCountry`, `leadTimeDays`, `weightKg`, `categoryId`, `shippingTemplateId`

含逗号、换行或双引号的字段需用英文双引号包裹，引号本身写作 `""`（标准 CSV）。

## 新建 vs 更新

- **`id` 留空或非数字**：按 **新建** 处理（调用创建接口）。
- **`id` 为正整数且数据库中已存在该商品**：按 **更新** 处理。导入前会读取当前商品，再与 CSV 行合并后整单提交（与编辑页相同语义）。
- **`id` 已填写但不存在**：该行失败，报告中标明「id 对应商品不存在」。

## 更新时的「空单元格」与「清空占位符」

- **空单元格**：表示 **不修改** 该字段，沿用数据库中的现有值。
- **需要把可空字段真正清空时**：在单元格中填入以下任一占位符（大小写不敏感）：
  - `-`
  - `__CLEAR__`
  - `(clear)`

适用于：`listPrice`、`description`、`skuCode`、`hsCode`、`unit`、`incoterm`、`originCountry`、`leadTimeDays`、`weightKg`、`categoryId`、`shippingTemplateId` 等可按后端语义置空的字段。

**不可清空**的字段：`title`、`price`、`currency`、`moq`（占位符或非法值会报错）。

## 业务校验

- `price` 必须大于 0；`moq` 为整数且 ≥ 1。
- 若填写 `listPrice`，须 **大于 0**，且 **≥ `price`**（与后台划线价规则一致）。
- `isActive`：`true` / `false` / `1` / `0`（及常见 yes/no，见前端解析）。
- **导入不会修改商品图片与标签关联**（请求体不传 `images`、`tagIds`，后端视为「不改」）。

## 编码

导出与模板带 **UTF-8 BOM**，便于 Excel 正确识别中文。

详细解析与合并实现见：`src/admin/lib/productCsv.ts`。
