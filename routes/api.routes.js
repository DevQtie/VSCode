import express from 'express';
// import * as fetchController from '../controllers/api.controller.js';
import {
    authenticate,
    fetchData,
    getRandomText,
    addRandomText,
    updateRandomText,
    deleteRandomText
} from '../controllers/api.controller.js';
import asyncLogger from '../middleware/logger.js'

const router = express.Router();

router.use(asyncLogger);//For middleware function

router.post('/postget/random_text', authenticate, fetchData);//retrieve data

router.post('/postget/random_text/:id', authenticate, getRandomText);//retrieve data through id

router.post('/post/:random_text', authenticate, addRandomText);//add data

router.put('/put/:id/:random_text', authenticate, updateRandomText);//update data

router.delete('/delete/:id', authenticate, deleteRandomText);//delete data

export default router;