const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.get('/user/:id', userController.getMeByID);
router.post('/user/add', userController.addUser);


module.exports = router;