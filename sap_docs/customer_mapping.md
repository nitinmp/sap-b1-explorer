# SAP B1 → Platform Customer Mapping

## 🧾 Customer Mapping

| Platform Field                                   | SAP Field                   | Mapping Logic                |
| ------------------------------------------------ | --------------------------- | ---------------------------- |
| distributorCode                                  | CardCode                    | Unique customer code         |
| customerDetails_distributorCode                  | CardCode                    | Same as distributorCode      |
| customerDetails_name                             | CardName                    | Customer name                |
| customerDetails_companyName                      | CardName                    | Company name                 |
| phone                                            | Phone1                      | Primary phone                |
| phone2                                           | Phone2                      | Secondary phone              |
| customerDetails_telephone                        | Phone1                      | Telephone                    |
| customerDetails_email                            | EmailAddress                | Email                        |
| customerGroupCodes                               | GroupCode                   | Customer group               |
| priceListCode                                    | PriceListNum                | Price list                   |
| customerDetails_grossCreditLimit                 | CreditLimit                 | Credit limit                 |
| closingBalance                                   | CurrentAccountBalance       | Current AR balance           |
| customerDetails_cityName                         | City                        | City                         |
| customerDetails_countryCode                      | Country                     | Country                      |
| customerDetails_postalCode                       | ZipCode                     | Postal code                  |
| customerDetails_physicalAddress_address1         | Address                     | Billing address line 1       |
| customerDetails_physicalAddress_address2         | MailAddress                 | Billing address line 2       |
| customerDetails_shippingAddress_shippingAddress1 | BPAddresses (ShipTo).Street | Shipping address line 1      |
| customerDetails_shippingAddress_shippingAddress2 | BPAddresses (ShipTo).Block  | Shipping address line 2      |
| contacts                                         | ContactEmployees            | Store full contact list JSON |

---

## 🔹 Derived Fields

| Platform Field                     | SAP Source                                | Mapping Logic                                   |
| ---------------------------------- | ----------------------------------------- | ----------------------------------------------- |
| status                             | Valid + Frozen                            | Active if Valid=tYES & Frozen=tNO else Inactive |
| customerDetails                    | FreeText / Notes                          | Additional info                                 |
| customerDetails_gstin              | FederalTaxID / BPAddresses[].FederalTaxID | Prefer address-level GSTIN, validate format     |
| customerDetails_CSTNumber          | VatIDNum                                  | VAT/CST number                                  |
| customerDetails_creditLimitPeriod  | PayTermsGrpCode                           | Resolve to credit days via payment terms master |
| customerDetails_creditLimitDetails | CreditLimit + PayTermsGrpCode             | Combine into structured text/JSON               |
| customerDetails_stateCode          | BPAddresses.State                         | Prefer address-level state                      |
| customerDetails_distributorChannel | ChannelBP / Territory                     | Sales channel                                   |
| customer_segments                  | Properties1–64 / GroupCode                | Convert flags to segment list                   |
| alterId                            | CardCode                                  | Internal mapping identifier                     |

---

## ❌ Not Available in SAP (Requires UDF / External)

| Platform Field           | Mapping Logic                  |
| ------------------------ | ------------------------------ |
| customerDetails_dlNumber | Requires UDF (e.g. U_DLNumber) |
| customerDetails_dlExpiry | Requires UDF                   |
| openingBalance           | Requires finance extraction    |
| routes                   | External system mapping        |
| lifeCycleGroupNames      | Custom business logic          |

---

## ⚠️ Notes

* Always prefer **BPAddresses** over header fields for accuracy
* Use **ContactEmployees** for structured contacts (multi-contact support)
* GSTIN must be validated (15-char format in India)
* `Properties1–64` are boolean flags → convert to meaningful segments
* Payment terms (`PayTermsGrpCode`) require lookup for actual credit days
* SAP Business Partner is **master data**, not transactional

---

**End of Document**
