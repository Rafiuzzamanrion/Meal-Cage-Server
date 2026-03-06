const express = require('express');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyAdmin = require('../../middleware/verifyAdmin');
const {
    createReservation,
    getAllReservations,
    updateReservationStatus,
} = require('./reservations.controller');

const router = express.Router();

// POST /reservation — create reservation
router.post('/reservation', verifyJWT, createReservation);

// GET /bookingsHistory — all reservations (admin)
router.get('/bookingsHistory', verifyJWT, verifyAdmin, getAllReservations);

// PATCH /bookingsHistory/:id — update status (deliver, etc.)
router.patch('/bookingsHistory/:id', verifyJWT, verifyAdmin, updateReservationStatus);

module.exports = router;
