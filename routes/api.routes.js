import express from 'express';
// import * as fetchController from '../controllers/api.controller.js';
import {
    fetchData,
    getRandomText,
    addRandomText,
    updateRandomText,
    deleteRandomText
} from '../controllers/api.controller.js';
import asyncLogger from '../middleware/logger.js'

const router = express.Router();

router.use(asyncLogger);//For middleware function

router.get('/get/random_text', fetchData);//retrieve data

router.get('/get/random_text/:id', getRandomText);//retrieve data through id

router.post('/post/:random_text', addRandomText);//add data

router.put('/put/:id/:random_text', updateRandomText);//update data

router.delete('/delete/:id', deleteRandomText);//delete data

export default router;