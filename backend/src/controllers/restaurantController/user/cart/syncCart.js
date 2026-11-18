import Cart from "../../../../models/restaurantModels/cart.js";
import formatCart from "../../../../utils/restaurantUtils/formatCart.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";
import {
    buildValidatedCartItems,
    mergeCartItemLists,
    recalculateCartTotals,
} from "../../../../utils/restaurantUtils/cartLineBuilder.js";

/**
 * After login: merge localStorage cart items into server cart.
 * Existing server items stay. Matching lines increase qty. New lines append.
 */
const syncCart = async (req, res) => {
    try {
        const merchant = req.merchant;
        const customer = req.customer;

        const domainCheck = assertOwnerDomain(
            merchant,
            getFrontendDomainFromRequest(req)
        );

        if (domainCheck.error) {
            return res.status(domainCheck.error.status).json({
                success: false,
                message: domainCheck.error.message,
            });
        }

        const {
            branchId,
            branchName,
            items,
            // cart,
            localCart,
        } = req.body || {};

        // Accept: items[] OR cart[] OR localCart[] (frontend localStorage shape)
        const localItems = Array.isArray(items)
            ? items
            : Array.isArray(cart)
              ? cart
              : Array.isArray(localCart)
                ? localCart
                : [];

        let cart = await Cart.findOne({
            merchantId: merchant._id,
            customerId: customer._id,
        });

        if (!cart) {
            cart = new Cart({
                merchantId: merchant._id,
                bussinessId: merchant.bussinessId,
                customerId: customer._id,
                currency: merchant.currency || "PKR",
                items: [],
            });
        }

        if (!localItems.length) {
            await cart.save();
            return res.status(200).json({
                success: true,
                message: "Cart synced successfully",
                mergedFromLocal: false,
                cart: formatCart(cart),
                clearLocalStorage: true,
            });
        }

        const validated = await buildValidatedCartItems({
            merchant,
            branchId: branchId || cart.branchId,
            branchName: branchName || cart.branchName,
            items: localItems,
        });

        if (validated.error) {
            return res.status(validated.error.status).json({
                success: false,
                message: validated.error.message,
            });
        }

        const mergedItems = mergeCartItemLists(
            cart.items || [],
            validated.items
        );
        const totals = recalculateCartTotals(mergedItems);

        cart.branchId = validated.branch._id;
        cart.branchName = validated.branch.name;
        cart.items = mergedItems;
        cart.itemsCount = totals.itemsCount;
        cart.subtotal = totals.subtotal;
        cart.taxTotal = totals.taxTotal;
        cart.grandTotal = totals.grandTotal;
        cart.currency = merchant.currency || "PKR";

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Local cart merged successfully. You can clear localStorage",
            mergedFromLocal: true,
            addedOrMergedCount: validated.items.length,
            cart: formatCart(cart),
            clearLocalStorage: true,
        });
    } catch (error) {
        console.error("Sync cart error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to sync cart",
        });
    }
};

export default syncCart;
