# ExtendedPOS Keyboard Operations Guide

This guide summarizes the keyboard shortcuts and expected behaviors for the **Extended POS** component.

---

## **Global Function Keys**
These keys work at all times unless the "After Print" modal is open.

| Key | Operation | Action |
| :--- | :--- | :--- |
| **F3** | **Item Search** | Toggles the dedicated Item Search modal (find by name/SKU). |
| **F4** | **Sales Return** | Toggles the Sales Return mode (adds item to return line, gruppi above). |
| **F5** | **Void / Reset** | Clears the cart, resets payment state, and focuses the barcode scanner. |
| **F6** | **Hold POS** | Saves the current transaction as "Hold" and clears the screen; or exits Recall mode. |
| **F7** | **Recall Modal** | Toggles the overlay showing a list of previous or held transactions. |
| **F9** | **Open Drawer** | Reserved for physical cash drawer integration (signals `OpenDrawer`). |
| **F1**, **F3**, **F12** | *Blocked* | Prevented globally to avoid accidental browser navigation during checkout. |

---

## **Workflow Navigation**

### **1. Transaction Completion (After Print)**
Once a bill is printed, a "Transaction Complete" overlay appears.
- **Any Key**: Acts as a "Close & Reset" — closes the overlay, performs a `Void All`, and focuses the scanner for the next customer.

### **2. Scanner Area**
- **Enter**: Submits the barcode for processing.
- **`+` (Numpad Plus)**: Instantly jump focus to **Payment Options**.

### **3. Recall / Autocomplete Selection**
When a list of suggested items or previous transactions is visible:
- **Arrow Up / Down**: Moves the selection highlight within the list.
- **Enter**: Confirms the highlighted choice (Adds the item or recalls the transaction).

### **4. Payment progression**
- **Enter (on Payment Radio)**: Moves focus to the **Received Amount** field.
- **Enter (on Received Amount)**: Triggers **Print Bill**.

---

## **Focus Management**
The POS maintains a "Scanner-First" policy. Focus is automatically returned to the **Barcode Scanner** after:
1.  Voiding/Resetting the page (**F5**).
2.  Holding/Exiting a Recall (**F6**).
3.  Closing any modal/popup.
4.  Adding/Removing a cart item.

---

> [!TIP]
> Use the **`+`** key on your numpad as a quick shortcut to navigate to payment without using the mouse or Tab key.
