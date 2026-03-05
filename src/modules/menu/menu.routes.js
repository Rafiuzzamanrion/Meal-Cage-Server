const express = require('express');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyAdmin = require('../../middleware/verifyAdmin');
const {
    getAllMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
} = require('./menu.controller');

const router = express.Router();

router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);
router.post('/', verifyJWT, verifyAdmin, createMenuItem);
router.patch('/:id', verifyJWT, verifyAdmin, updateMenuItem);
router.delete('/:id', verifyJWT, verifyAdmin, deleteMenuItem);

module.exports = router;
