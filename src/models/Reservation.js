const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        date: { type: String },
        time: { type: String },
        guests: { type: Number, min: 1 },
        specialRequests: { type: String, trim: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'delivered', 'cancelled'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

reservationSchema.index({ email: 1 });
reservationSchema.index({ status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema, 'reservation');
