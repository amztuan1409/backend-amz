const mongoose = require("mongoose");
 const recycleSchema = new mongoose.Schema(
    {
        bookingId :{
            type: mongoose.Schema.Types.ObjectId , ref : "Booking"
        },
        userDelete: {
            type: mongoose.Schema.Types.ObjectId , ref : "User"
        }
    }
 )