const stripe = require('stripe')(process.env.PAYMENT_SECRETE_KEY);
const GiftCard = require('../../models/GiftCard');

// POST /gift-cards/purchase — buy a gift card (requires auth + Stripe)
const purchaseGiftCard = async (req, res, next) => {
    try {
        const { amount, tier } = req.body;
        const purchasedBy = req.decoded.email;

        if (!amount || !tier) {
            return res.status(400).json({ error: true, message: 'amount and tier are required' });
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.ceil(amount * 100),
            currency: 'usd',
            payment_method_types: ['card'],
            metadata: { purchasedBy, tier },
        });

        // Create gift card record
        const giftCard = await GiftCard.create({
            amount,
            tier,
            purchasedBy,
            paymentIntentId: paymentIntent.id,
        });

        res.status(201).json({
            giftCard,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (err) {
        next(err);
    }
};

// GET /gift-cards/my-cards — authenticated user's gift cards
const getMyCards = async (req, res, next) => {
    try {
        const cards = await GiftCard.find({ purchasedBy: req.decoded.email }).sort({ purchasedAt: -1 });
        res.json(cards);
    } catch (err) {
        next(err);
    }
};

// POST /gift-cards/redeem — validate and redeem a gift card
const redeemGiftCard = async (req, res, next) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: true, message: 'Gift card code is required' });

        const card = await GiftCard.findOne({ code: code.toUpperCase() });
        if (!card) return res.status(404).json({ error: true, message: 'Invalid gift card code' });
        if (card.isRedeemed) return res.status(409).json({ error: true, message: 'This gift card has already been redeemed' });

        card.isRedeemed = true;
        card.redeemedBy = req.decoded.email;
        card.redeemedAt = new Date();
        await card.save();

        res.json({ success: true, amount: card.amount, card });
    } catch (err) {
        next(err);
    }
};

// GET /gift-cards — admin: all gift cards
const getAllGiftCards = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const [cards, total] = await Promise.all([
            GiftCard.find().sort({ purchasedAt: -1 }).skip(skip).limit(limit),
            GiftCard.countDocuments(),
        ]);
        res.json({ cards, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        next(err);
    }
};

module.exports = { purchaseGiftCard, getMyCards, redeemGiftCard, getAllGiftCards };
