const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/user/all', userController.getAllUsers);
router.get('/user/:id', userController.getMeByID);
router.post('/user/add', userController.addUser);
router.post('/user/update', userController.updateUserRole);
router.post('/user/delete', userController.deleteUser);



module.exports = router;
