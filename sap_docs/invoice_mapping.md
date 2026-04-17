# SAP B1 → Platform Invoice Mapping

## 🧾 Invoice Table Mapping

| Platform Field              | SAP Field                           | Mapping Logic                       |
| --------------------------- | ----------------------------------- | ----------------------------------- |
| docNumber                   | DocNum                              | Invoice number (customer-facing)    |
| referenceInvoiceNumber      | Reference1                          | External reference                  |
| refOrderNumber              | NumAtCard OR BaseEntry (derived)    | Customer PO / Sales Order           |
| PONumber                    | NumAtCard                           | Customer PO number                  |
| distributorCode             | CardCode                            | Customer / distributor code         |
| customerName                | CardName                            | Customer name                       |
| consigneeName               | ShipToCode                          | Ship-to party                       |
| invoiceDate                 | DocDate                             | Invoice date                        |
| dueDate                     | DocDueDate                          | Due date                            |
| orderDate                   | Derived from BaseEntry              | From base document                  |
| invoiceAmount               | DocTotal                            | Amount including tax                |
| roundOff                    | RoundingDiffAmount                  | Rounding difference                 |
| discountRate                | DiscountPercent                     | Header discount %                   |
| discountAmount              | TotalDiscount                       | Total discount                      |
| disc                        | TotalDiscount                       | Same as discountAmount              |
| taxAndCharges               | VatSum + line taxes                 | Store JSON                          |
| invoiceStatus               | DocumentStatus, PaidToDate, DocTotal, Cancelled   
| lrNumber                    | TrackingNumber                      | Logistics reference                 |
| destination                 | AddressExtension.ShipToCity         | Ship destination                    |
| billingDetails              | Address + AddressExtension(BillTo*) | Structured billing address          |
| shippingDetails             | AddressExtension(ShipTo*)           | Structured shipping address         |
| narration                   | Comments                            | Remarks                             |
| dispatchDetails             | BaseType, BaseEntry, AddressExtension, TransportationCode (get transporter name), TrackingNumber
| gstin                       | FederalTaxID                        | Tax ID                              |
| itemList                    | DocumentLines                       | Serialized line items               |
| alterId                     | DocEntry                            | Internal ID                         |
| consigneeName               | ShipToCode                          | Ship-to name                        |
| termsOfDelivery             | ShipFrom / ShippingMethod           | Derived                             |
| dcNumber                    | BaseEntry (if Delivery)             | Delivery reference                  |

---

## 🔹 Derived Fields

| Platform Field              | SAP Field                           | Mapping Logic                       |
| --------------------------- | ----------------------------------- | ----------------------------------- |
| transporterName             | Derived from TransportationCode     | Transporter                         |
| cgst                        | Derived                             | Split from total tax                |
| sgst                        | Derived                             | Split from total tax                |
| igst                        | Derived                             | Based on interstate logic           |
| termsOfPayment              | Derived from PaymentGroupCode       | Payment terms calculation           |

---

## ❌ Not Available in SAP (Requires UDF / External)

| Platform Field              | SAP Field                           | Mapping Logic                       |
| --------------------------- | ----------------------------------- | ----------------------------------- |
| cess                        | Not available                       | Default 0                           |
| irn                         | Not available                       | E-invoice field                     |
| irnStatus                   | Not available                       | E-invoice status                    |
| phoneNumber                 | Not available                       | Not provided in SAP                 |
| numCases                    | Not available                       | No direct mapping                   |
| TDSRate                     | Not available                       | Requires localization               |
| TDSAmount                   | Not available                       | Requires localization               |
| TCSRate                     | Not available                       | Requires localization               |
| TCSAmount                   | Not available                       | Requires localization               |
| ptrDiscAmt                  | Not available                       | No mapping                          |
| spclDiscAmtPts              | Not available                       | No mapping                          |
| educationCess               | Not available                       | No mapping                          |
| debitNoteNumber             | Not available                       | Separate document                   |
| debitNoteAmt                | Not available                       | Separate document                   |
| creditNoteOneNumber         | Not available                       | Separate document                   |
| creditNoteOneAmtPts         | Not available                       | Separate document                   |
| creditNoteTwoNumber         | Not available                       | Separate document                   |
| creditNoteTwoAmtPts         | Not available                       | Separate document                   |
| creditNoteThreeNumber       | Not available                       | Separate document                   |
| creditNoteThreeAmtPts       | Not available                       | Separate document                   |
| fileKey                     | Not available                       | External storage                    |
| lrDate                      | Not available                       | Not in SAP                          |
---

## 📦 Invoice Line Item Mapping

| Platform Field     | SAP Field                 | Mapping Logic         |
| ------------------ | ------------------------- | --------------------- |
| sku                | ItemCode                  | Product SKU           |
| productTitle       | ItemDescription           | Product name          |
| productDescription | ItemDescription           | Same as title         |
| erpOrderNumber     | BaseEntry                 | Source document       |
| refOrderNumber     | BaseEntry                 | Sales order reference |
| Qty                | Quantity                  | Quantity              |
| unit               | UoMCode                   | Unit of measure       |
| UnitPrice          | UnitPrice                 | Price per unit        |
| lineTotal          | LineTotal                 | Amount before tax     |
| lineTotalWithTax   | GrossTotal                | Amount after tax      |
| discountPercent    | DiscountPercent           | Line discount %       |
| discount           | Derived                   | From discount %       |
| assAmt             | LineTotal                 | Assessable value      |
| gstRt              | TaxPercentagePerRow       | GST %                 |
| mrp                | GrossPrice                | Price incl tax        |
| ptr                | UnitPrice                 | Price to retailer     |
| listPriceWithTax   | PriceAfterVAT             | Price incl VAT        |
| batchNo            | BatchNumbers[]            | Batch info            |
| expiryDate         | BatchNumbers[].ExpiryDate | Expiry                |
| divisionCode       | WarehouseCode             | Warehouse             |
| hsnCode            | HSNEntry                  | HSN code              |
| notes              | FreeText                  | Notes                 |
| packsizes          | PackageQuantity           | Package size          |
| productTitle       | ItemDescription           | Product name          |
| productDescription | ItemDescription           | Description           |
| invoiceInBoundId   | DocEntry                  | Parent link           |

## 🔹 Derived Fields

| Platform Field              | SAP Field        | Mapping Logic         |
| --------------------------- | -----------------| ----------------------|
| CgstAmt            | Derived                   | Split tax             |
| SgstAmt            | Derived                   | Split tax             |
| IgstAmt            | Derived                   | Based on interstate   |
| cgstRate           | Derived                   | Split                 |
| sgstRate           | Derived                   | Split                 |
| igstRate           | Derived                   | Based on interstate   |

## ❌ Not Available in SAP (Requires UDF / External)

| Platform Field              | SAP Field        | Mapping Logic         |
| --------------------------- | -----------------| ----------------------|
| tdsRate            | Not available             | Requires localization |
| tcsRate            | Not available             | Requires localization |
| tdsAmount          | Not available             | Requires localization |
| tcsAmount          | Not available             | Requires localization |

---

## ⚠️ Important Transformation Logic

### Tax Splitting

```
If intra-state:
  CGST = TaxTotal / 2
  SGST = TaxTotal / 2
Else:
  IGST = TaxTotal
```

---

### Status Derivation

```
IF Cancelled == "tYES":
    status = "C"   # CANCELLED

ELSE IF PaidToDate >= DocTotal AND DocTotal > 0:
    status = "PD"  # PAID

ELSE IF PaidToDate > 0 AND PaidToDate < DocTotal:
    status = "PP"  # PARTIALLY_PAID

ELSE:
    status = "P"   # PENDING
```

---

### Dispatch Details
Get Delivery Document (/b1s/v1/DeliveryNotes)
Best source for:=
* Dispatch date
* Transport details
* Vehicle
* Logistics flow

| BaseType | Meaning            |
| -------- | ------------------ |
| `17`     | Sales Order        |
| `15`     | Delivery           |
| `13`     | Invoice            |
| `-1`     | ❌ No base document |


### Address Priority

1. AddressExtension (preferred)
2. Address (fallback)

---

## ✅ Notes

* SAP does NOT provide GST split → must derive
* SAP uses generic tax → platform requires India GST structure
* Credit/Debit notes are separate documents in SAP
* Many financial fields require transformation, not direct mapping

---

**End of Document**
