# SAP B1 → Platform Product Mapping

## 🧾 Direct Mapping Fields

| Platform Field                  | SAP Field               | Mapping Logic                              |
| ------------------------------- | ----------------------- | ------------------------------------------ |
| name                            | ItemName                | Product name                               |
| description                     | User_Text / ForeignName | Use User_Text else fallback to ForeignName |
| productVariants_name            | ItemName                | Variant name same as item                  |
| productVariants_sku             | ItemCode                | Primary SKU                                |
| productVariants_enabled         | Valid                   | true if tYES else false                    |
| productVariants_taxCategoryCode | SalesVATGroup           | Tax code                                   |
| productVariants_erpUOM          | SalesUnit               | Sales UOM                                  |
| productVariants_baseUom         | InventoryUOM            | Inventory UOM                              |
| productVariants_packSize        | SalesItemsPerUnit       | Units per pack                             |
| productVariants_caseSize        | SalesQtyPerPackUnit     | Cases per pack                             |
| productVariants_minOrderQty     | MinOrderQuantity        | Minimum order quantity                     |
| productVariants_qtyMultiplier   | OrderMultiple           | Order multiple                             |
| productVariants_grossWeight     | SalesUnitWeight         | Gross weight                               |
| productVariants_weightUOM       | SalesWeightUnit         | Weight unit                                |
| productVariants_volume          | SalesUnitVolume         | Volume                                     |
| productVariants_volumeUOM       | SalesVolumeUnit         | Volume unit                                |
| productVariants_ean             | BarCode                 | EAN/Barcode                                |
| productVariants_mfgCode         | Manufacturer            | Manufacturer code                          |
| productVariants_stockOnHand     | QuantityOnStock         | Total stock                                |
| productVariants_erpPriceUOM     | PricingUnit             | Pricing UOM                                |
| productVariants_assets          | Picture                 | Map to asset URL/path                      |
| productVariants_netWeight       | SalesUnitWeight         | Actual product weight                      |

---

## 🔹 Derived Fields

| Platform Field                   | SAP Source                           | Mapping Logic                          |
| -------------------------------- | ------------------------------------ | -------------------------------------- |
| parentSku                        | TreeType                             | If BOM → parent-child relation         |
| productVariants_listPrice        | ItemPrices.Price                     | Check price list with Factor 1.0       |
| productVariants_additionalUom    | ItemUnitOfMeasurementCollection      | Extract additional UOMs                |
| productVariants_category         | ItemsGroupCode                       | Map to category master                 |
| divisionCFACodes                 | DefaultWarehouse / Warehouse mapping | Map warehouse/division                 |
| productVariants_shortDescription | User_Text                            | Short description                      |
| productVariants_stockOnHand      | ItemWarehouseInfoCollection.InStock  | Sum across warehouses                  |
| productVariants_mfgName          | Manufacturer (lookup)                | Resolve from manufacturer master       |

---

## ❌ Not Available in SAP (Requires External / Custom Logic)

| Platform Field                       | Mapping Logic                                  |
| ------------------------------------ | ---------------------------------------------- |
| productVariants_PTR                  | Not available                                  |
| productVariants_MRP                  | Not available                                  |
| productVariants_upcCode              | Not standard in SAP B1                         |
| productVariants_hsnCode              | Requires GST localization fields               |
| productVariants_warrentyInformation  | WarrantyTemplate not directly usable           |
| productVariants_bestBeforeOrAfter    | Not available                                  |
| productVariants_bestAfter            | Not available                                  |
| productVariants_manufacturingDate    | Batch-level data (not item master)             |
| productVariants_expiryDate           | Batch-level data                               |
| productVariants_maxOrderQty          | Not available                                  |
| productVariants_pricingStrategy      | No direct SAP concept                          |
| productVariants_PTR / MRP separation | SAP only stores price, not PTR/MRP distinction |
| productVariants_facets               | Not available                                  |
| customFields                         | Not available                                  |
| productVariants_sortOrder            | Not available                                  |
| productVariants_condition            | Not available                                  |
| productVariants_isSpecial            | Not available                                  |
| productVariants_packingInfo          | Not available                                  |
| productVariants_salesOrg             | Not available                                  |
| productVariants_minRemShelfLife      | Not available                                  |
| productVariants_totShelfLife         | Not available                                  |

---

## ⚠️ Important Transformation Logic

### Price Extraction (Critical)

```plaintext
Use ItemPrices array:
SELECT Price WHERE PriceList = required price list
```

---

### Stock Calculation

```plaintext
SUM(ItemWarehouseInfoCollection[].InStock)
```

---

### Variant Handling (Important Insight)

```plaintext
SAP B1 does NOT support variants natively

Each ItemCode = 1 Variant
```

---

### Category Mapping

```plaintext
ItemsGroupCode → map to product category
```

---

### Active Status

```plaintext
IF Valid == "tYES" AND Frozen == "tNO":
    enabled = true
ELSE:
    enabled = false
```

---

### UOM Handling

```plaintext
InventoryUOM = baseUom
SalesUnit = selling UOM
PurchaseUnit = procurement UOM
```

---

## 🧠 Key SAP Insights (Very Important)

* SAP Item = **Product + Variant combined**
* No native variant model (unlike modern commerce systems)
* Pricing is NOT part of item → comes from `ItemPrices`
* Inventory is warehouse-specific → must aggregate
* Batch/expiry data exists separately (not in item master)

---

## ✅ Notes

* Always combine:

  * Item master
  * ItemPrices
  * Warehouse data
* Avoid assuming MRP/PTR directly → must derive
* Use UDFs heavily for pharma/FMCG use cases (HSN, expiry, etc.)
* Manufacturer, category, warehouse → require master lookups

---

**End of Document**
