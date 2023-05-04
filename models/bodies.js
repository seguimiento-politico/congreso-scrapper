const mongoose = require('mongoose');

const comissionSchema = new mongoose.Schema({
    term: String,
    
});

const bodiesSchema = new mongoose.Schema({ 
    //goverment Bodies
    board: {
        code: '100'
    }
    foremen: {
        code: '300'
    }
    permanentCouncil: {
        code: '500'
    }
    //working Bodies:
    terms: [comissionSchema]   
});