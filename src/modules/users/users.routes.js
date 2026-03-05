const express = require('express');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyAdmin = require('../../middleware/verifyAdmin');
const { createUser, getAllUsers, checkAdmin, makeAdmin, deleteUser } = require('./users.controller');

const router = express.Router();

router.post('/', createUser);
router.get('/', verifyJWT, verifyAdmin, getAllUsers);
router.get('/admin/:email', verifyJWT, checkAdmin);
router.patch('/admin/:id', verifyJWT, verifyAdmin, makeAdmin);
router.delete('/:id', verifyJWT, verifyAdmin, deleteUser);

module.exports = router;
