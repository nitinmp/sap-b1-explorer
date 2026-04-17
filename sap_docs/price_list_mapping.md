# SAP B1 → Platform Price List Mapping

## 🧾 Price List Mapping

| Platform Field | SAP Field     | Mapping Logic                |
| -------------- | ------------- | ---------------------------- |
| name           | PriceListName | Price list name              |
| code           | PriceListNo   | Unique price list identifier |
| isActive       | Active        | 1 if tYES else 0             |
| startDate      | ValidFrom     | Start date                   |
| endDate        | ValidTo       | End date                     |

---

## 🔹 Derived Fields

| Platform Field  | SAP Source                        | Mapping Logic                               |
| --------------- | --------------------------------- | ------------------------------------------- |
| priceListItems  | Items API (`/Items` + price list) | Fetch item-level prices separately          |
| skuCode         | ItemCode                          | From item master                            |
| productName     | ItemName                          | From item master                            |
| pts             | ItemPrices.Price                  | From item master                            |
| customers       | BusinessPartners.PriceListNum     | Map customers linked to this price list     |

---

## ❌ Not Available in SAP (Requires External / Logic)

| Platform Field  | Mapping Logic                                       |
| --------------- | --------------------------------------------------- |
| ptr             | ItemPrices.Price                  | Base selling price                          |
| ptrValue        | Factor                            | Multiplier on base price                    |
| ptsValue        | Requires calculation                                |
| adjustmentType  | No direct enum → derive from BasePriceList / Factor |
| priceConditions | Requires transformation into structured JSON        |

---

## 🧾 Price List Mapping

| Platform Field | SAP Field                         | Mapping Logic                |
| -------------- | --------------------------------- | ---------------------------- |
| productName    | ItemName                          | Product name              |
| pts            | ItemPrices.Price                  | Product price             |
| sku            | ItemCode                          | Product identifier        |

## ⚠️ Important Transformation Logic

### Item Price Fetching (Critical)

```plaintext
GET /b1s/v1/Items?$expand=ItemPrices
Filter ItemPrices where PriceList = PriceListNo
```

---

### Price Derivation

```plaintext
IF BasePriceList exists:
    ptr = BasePriceList price * Factor
ELSE:
    ptr = ItemPrices.Price
```

---

### Active Status

```plaintext
IF Active == "tYES":
    isActive = 1
ELSE:
    isActive = 0
```

---

### Customer Mapping

```plaintext
Map BusinessPartner.PriceListNum == PriceListNo
```

---

## 🧠 Key SAP Insight (Very Important)

* SAP Price List object = **Header only**
* Actual prices exist in:

  * `ItemPrices` (inside Items API)

👉 So:

```plaintext
PriceList = Pricing Rule
ItemPrices = Actual Prices
```

---

## ✅ Notes

* Always fetch item prices separately (critical)
* Factor + BasePriceList enables derived pricing chains
* SAP does NOT support PTS directly → must derive
* Price lists can be layered (base → derived)
* Currency fields should be handled if multi-currency needed

---

**End of Document**
