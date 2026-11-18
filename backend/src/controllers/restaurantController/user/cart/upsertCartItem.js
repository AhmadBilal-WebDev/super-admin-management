import Cart from "../../../../models/restaurantModels/cart.js";
import formatCart from "../../../../utils/restaurantUtils/formatCart.js";
import {
    assertOwnerDomain,
    getFrontendDomainFromRequest,
} from "../../../../utils/restaurantUtils/findManageableStaff.js";
import {
    buildValidatedCartItems,
    cartItemKey,
    mergeCartItemLists,
    recalculateCartTotals,
} from "../../../../utils/restaurantUtils/cartLineBuilder.js";

/** Add item to logged-in cart (or increase qty if same line exists). */
const upsertCartItem = async (req, res) => {
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
            productId,
            quantity,
            variantId,
            addons,
            notes,
        } = req.body || {};

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "productId is required",
            });
        }

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

        const validated = await buildValidatedCartItems({
            merchant,
            branchId: branchId || cart.branchId,
            branchName: branchName || cart.branchName,
            items: [
                {
                    productId,
                    quantity: quantity || 1,
                    variantId,
                    addons,
                    notes,
                },
            ],
        });

        if (validated.error) {
            return res.status(validated.error.status).json({
                success: false,
                message: validated.error.message,
            });
        }

        const mergedItems = mergeCartItemLists(cart.items || [], validated.items);
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

        const key = cartItemKey(validated.items[0]);
        const savedItem = (cart.items || []).find(
            (item) => cartItemKey(item) === key
        );

        return res.status(200).json({
            success: true,
            message: "Item added to cart",
            item: savedItem || validated.items[0],
            cart: formatCart(cart),
        });
    } catch (error) {
        console.error("Upsert cart item error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to add cart item",
        });
    }
};

export default upsertCartItem;
