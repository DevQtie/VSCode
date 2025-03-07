import express from 'express';
// import * as fetchController from '../controllers/api.controller.js';
import {
    authenticate,
    fetchData,
    getRandomText,
    addRandomText,
    updateRandomText,
    deleteRandomText,
    uploadMultiImageFilesWithText,
    uploadTestImg,
    retrieveTestImg,
    retrieveLLCTestImage,

    manageUser,
    getPhilippineAddressName,
    uploadFrontID,
    retrieveFrontID,
    retrieveLLCFrontID,
    manageUserCodeRequest,
    manageUserCodeRequest2,
    partialSignUp,
    accessRequest,
    manageDeviceProperties,
    manageAddProduct,
    manageClientProductRetrieval,
} from '../controllers/api.controller.js';
import asyncLogger from '../middleware/logger.js'
import multer from 'multer';
import path from 'path';

// Configure multer disk storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files to the 'uploads' directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Generate a unique filename
        // const uniqueUserFile = file.originalname; // I've decided to use the user specific image
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Use the original file extension
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // Limit to 20 MB
    },
    fileFilter: (req, file, cb) => {
        console.log('File being uploaded:', file); // Log file details to debug
        const allowedTypes = /jpeg|jpg|png/; // Allowed extensions
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        // const mimetype = allowedTypes.test(file.mimetype); // has bug, it doesn't verify mime type, where it causes to have conflicts

        // Accept if the mimetype is image-related or if it's 'application/octet-stream' with a valid image extension
        const isImageMimetype = /image\/jpeg|image\/png/.test(file.mimetype) || file.mimetype === 'application/octet-stream'; //working one

        if (isImageMimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: File type not supported!'));
        }
    }
});

const router = express.Router();

router.use(asyncLogger);//For middleware function

router.post('/postget/random_text', authenticate, fetchData);//retrieve data

router.post('/postget/random_text/:id', authenticate, getRandomText);//retrieve data through id

router.post('/post/:random_text', authenticate, addRandomText);//add data

router.put('/put/:id/:random_text', authenticate, updateRandomText);//update data

router.delete('/delete/:id', authenticate, deleteRandomText);//delete data

router.post('post/upload/:img1_desc/:img2_desc/:img3_desc', upload.fields(['files', 3]), authenticate, uploadMultiImageFilesWithText)

router.post('/postget/test_upload/:img_f_kbsize', upload.single('file'), authenticate, uploadTestImg); // This is the proper sequence when using upload

router.post('/postget/retrieve_test_img', authenticate, retrieveTestImg);

router.post('/postget/retrieve_lss2c_test_img', authenticate, retrieveLLCTestImage);

/* START OF OFFICIAL NODE.JS API CONTROLLER */

router.post('/postget/sign_in/:mobile_no/:password/:function_key', authenticate, manageUser);//sign in and retrieve data  // does not accept null type, it translates into 'null' string instead

router.post('/postget/sign_up/:mobile_no/:password/:function_key', authenticate, manageUser);//sign up and retrieve data  // does not accept null type, it translates into 'null' string instead

router.post('/postget/ph_address/:type/:name', authenticate, getPhilippineAddressName);//province, city/municipality, barangay

router.post('/postget/f_id_upload/:img_f_kbsize', upload.single('file'), authenticate, uploadFrontID); // This is the proper sequence when using upload

router.post('/postget/retrieve_img', authenticate, retrieveFrontID);

router.post('/postget/retrieve_lss2c_img', authenticate, retrieveLLCFrontID);

router.post('/postget/code/process_req_x/:email/:mobile_no/:device_id/:code/:function_key', authenticate, manageUserCodeRequest);  // does not accept null type, it translates into 'null' string instead

router.post('/postget/partial_sign_up/:user_id/:device_id/:front_id_img_data/:front_id_img_f_kbsize/:back_id_img_data/:back_id_img_f_kbsize/:selfie_img_data/:selfie_img_f_kbsize/:given_name/:middle_name/:family_name/:suffix/:gender/:birthday/:nationality/:country/:province/:city_mun/:brgy/:unit_h_bldg_st/:vill_sub/:zip_code/:source_of_fund/:emp_status/:employer/:occupation/:email_add/:mobile_no/:password/:function_key', authenticate, partialSignUp); // does not accept null type, it translates into 'null' string instead

router.post('/postget/sign_in/:user_id/:device_id/:front_id_img_data/:front_id_img_f_kbsize/:back_id_img_data/:back_id_img_f_kbsize/:selfie_img_data/:selfie_img_f_kbsize/:given_name/:middle_name/:family_name/:suffix/:gender/:birthday/:nationality/:country/:province/:city_mun/:brgy/:unit_h_bldg_st/:vill_sub/:zip_code/:source_of_fund/:emp_status/:employer/:occupation/:email_add/:mobile_no/:password/:function_key', authenticate, partialSignUp); // does not accept null type, it translates into 'null' string instead

/* OPTIMIZING API SERVICE STRUCTURE */

router.post('/postget/code/process_req', authenticate, manageUserCodeRequest2);

router.post('/postget/process_access_req', authenticate, accessRequest);

router.post('/postget/process_device_properties_req', authenticate, manageDeviceProperties);

router.post('/postget/add_product_data', upload.fields(['prod_img', 10, 'prod_var_img', 10]), authenticate, manageAddProduct);

router.post('/postget/retrieve_client_product_data', authenticate, manageClientProductRetrieval);

// router.post('/postget/add_product_imgs', authenticate, manageAddProduct); // seems redundant

export default router;