const Reservation = require('../../models/Reservation');

// POST /reservation — create a new reservation
const createReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.create(req.body);
        res.status(201).json(reservation);
    } catch (err) {
        next(err);
    }
};

// GET /bookingsHistory — all reservations (admin)
const getAllReservations = async (req, res, next) => {
    try {
        const reservations = await Reservation.find().sort({ createdAt: -1 });
        res.json(reservations);
    } catch (err) {
        next(err);
    }
};

// PATCH /bookingsHistory/:id — update reservation status (e.g., "delivered")
const updateReservationStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const updated = await Reservation.findByIdAndUpdate(
            req.params.id,
            { $set: { status } },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: true, message: 'Reservation not found' });
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

module.exports = { createReservation, getAllReservations, updateReservationStatus };
