const mongoose = require('mongoose');

const userschems=new mongoose.Schema(
    {
        firstName:{
            type:String,
            required:true,
        },
        email:{
            type:String,
            required:true,
        },
        password:{
            type:String,
            required:true,
        },
        todolist:
            {
                type:String,
            }
        
        
    }
);

var usermodel=new mongoose.model('todos',userschems);
module.exports=usermodel;
